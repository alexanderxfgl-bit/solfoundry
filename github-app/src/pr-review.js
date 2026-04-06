const { OpenAI } = require('openai');
const { Anthropic } = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize AI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function processPRReview(context, config) {
  const { pull_request, repository, installation } = context.payload;
  
  try {
    console.log(`Starting AI review for PR #${pull_request.number} in ${repository.full_name}`);
    
    // Get PR diff and files
    const prFiles = await context.octokit.rest.pulls.listFiles({
      owner: repository.owner.login,
      repo: repository.name,
      pull_number: pull_request.number,
    });

    const changedFiles = prFiles.data.map(file => ({
      filename: file.filename,
      additions: file.additions,
      deletions: file.deletions,
      changes: file.changes,
      patch: file.patch,
      status: file.status,
    }));

    console.log(`Found ${changedFiles.length} changed files`);

    // Filter files based on configuration
    const filesToReview = changedFiles.filter(file => {
      // Check file patterns
      if (config.excludePatterns.some(pattern => {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(file.filename);
      })) {
        return false;
      }

      // Check file types
      if (config.fileTypes.include) {
        const includePattern = config.fileTypes.include.some(pattern => {
          const regex = new RegExp(pattern.replace(/\*/g, '.*'));
          return regex.test(file.filename);
        });
        if (!includePattern) {
          return false;
        }
      }

      return true;
    });

    if (filesToReview.length === 0) {
      console.log('No files to review based on configuration');
      return;
    }

    // Generate reviews using multiple AI models
    const reviews = await Promise.allSettled([
      generateClaudeReview(filesToReview, config),
      generateOpenAIReview(filesToReview, config),
      generateGeminiReview(filesToReview, config),
    ]);

    // Process and combine reviews
    const combinedComments = processReviews(reviews, config);
    
    // Post comments to the PR
    await postComments(context, combinedComments, pull_request.number);
    
    console.log(`AI review completed for PR #${pull_request.number}`);
    
  } catch (error) {
    console.error('Error processing PR review:', error);
    await postErrorComment(context, error.message, pull_request.number);
  }
}

async function generateClaudeReview(files, config) {
  if (!config.models.claude.enabled) {
    return { provider: 'claude', comments: [], error: 'Disabled' };
  }

  const comments = [];
  
  for (const file of files) {
    try {
      const prompt = `
You are an expert code reviewer reviewing pull request changes. Analyze the following code changes and provide constructive feedback.

File: ${file.filename}
Additions: ${file.additions}
Deletions: ${file.deletions}

Code diff:
\`\`\`diff
${file.patch}
\`\`\`

Review focus:
${config.strictness === 'strict' ? 'Be very thorough and critical' : 
  config.strictness === 'lenient' ? 'Be encouraging and focus on major issues' : 
  'Provide balanced, constructive feedback'}

${config.includeSecurity ? '\n- Security best practices and potential vulnerabilities' : ''}
${config.includePerformance ? '\n- Performance implications' : ''}
${config.includeBestPractices ? '\n- Code quality and best practices' : ''}

Provide your review as bullet points with specific suggestions for improvement.
`;

      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: config.models.claude.maxTokens,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const reviewContent = response.content[0].text;
      const fileComments = parseReviewComments(reviewContent, file.filename, 'claude');
      comments.push(...fileComments);

    } catch (error) {
      console.error('Claude review error:', error);
      comments.push({
        filename: file.filename,
        comment: `Error generating Claude review: ${error.message}`,
        type: 'error',
        provider: 'claude',
      });
    }
  }

  return { provider: 'claude', comments };
}

async function generateOpenAIReview(files, config) {
  if (!config.models.openai.enabled) {
    return { provider: 'openai', comments: [], error: 'Disabled' };
  }

  const comments = [];
  
  for (const file of files) {
    try {
      const prompt = `
As an expert code reviewer, analyze the following pull request changes:

File: ${file.filename}
Changes: ${file.additions} additions, ${file.deletions} deletions

Code changes:
\`\`\`diff
${file.patch}
\`\`\`

Please review this code with focus on:
${config.includeSecurity ? 'Security issues and vulnerabilities\n' : ''}
${config.includePerformance ? 'Performance implications and optimizations\n' : ''}
${config.includeBestPractices ? 'Code quality, readability, and best practices\n' : ''}

Review strictness: ${config.strictness}

Provide specific, actionable feedback in bullet points.
`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: config.models.openai.maxTokens,
        temperature: 0.7,
      });

      const reviewContent = response.choices[0].message.content;
      const fileComments = parseReviewComments(reviewContent, file.filename, 'openai');
      comments.push(...fileComments);

    } catch (error) {
      console.error('OpenAI review error:', error);
      comments.push({
        filename: file.filename,
        comment: `Error generating OpenAI review: ${error.message}`,
        type: 'error',
        provider: 'openai',
      });
    }
  }

  return { provider: 'openai', comments };
}

async function generateGeminiReview(files, config) {
  if (!config.models.gemini.enabled) {
    return { provider: 'gemini', comments: [], error: 'Disabled' };
  }

  const comments = [];
  
  for (const file of files) {
    try {
      const prompt = `
You are an expert software engineer performing a comprehensive code review. Analyze the following changes:

File: ${file.filename}
Additions: ${file.additions}
Deletions: ${file.deletions}

Code diff:
\`\`\`diff
${file.patch}
\`\`\`

Review with appropriate strictness (${config.strictness}) and focus on:
${config.includeSecurity ? 'Security vulnerabilities and best practices\n' : ''}
${config.includePerformance ? 'Performance concerns and optimizations\n' : ''}
${config.includeBestPractices ? 'Code quality, maintainability, and patterns\n' : ''}

Provide specific, constructive feedback with actionable suggestions.
`;

      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const reviewContent = response.text();

      const fileComments = parseReviewComments(reviewContent, file.filename, 'gemini');
      comments.push(...fileComments);

    } catch (error) {
      console.error('Gemini review error:', error);
      comments.push({
        filename: file.filename,
        comment: `Error generating Gemini review: ${error.message}`,
        type: 'error',
        provider: 'gemini',
      });
    }
  }

  return { provider: 'gemini', comments };
}

function parseReviewComments(reviewContent, filename, provider) {
  const comments = [];
  const lines = reviewContent.split('\n');
  
  // Simple parsing - look for bullet points and numbered lists
  let currentComment = '';
  let isComment = false;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.match(/^[-*]\s/) || trimmedLine.match(/^\d+\.\s/)) {
      if (currentComment) {
        comments.push({
          filename,
          comment: currentComment.trim(),
          type: 'suggestion',
          provider,
        });
      }
      currentComment = trimmedLine;
      isComment = true;
    } else if (isComment && trimmedLine) {
      currentComment += ' ' + trimmedLine;
    }
  }
  
  if (currentComment) {
    comments.push({
      filename,
      comment: currentComment.trim(),
      type: 'suggestion',
      provider,
    });
  }
  
  return comments;
}

function processReviews(reviewResults, config) {
  const allComments = [];
  const providerComments = { claude: [], openai: [], gemini: [] };
  
  // Collect all comments by provider
  for (const result of reviewResults) {
    if (result.status === 'fulfilled' && result.value.comments) {
      const provider = result.value.provider;
      providerComments[provider] = result.value.comments;
      allComments.push(...result.value.comments);
    }
  }
  
  // Group comments by filename and deduplicate
  const commentsByFile = {};
  
  for (const comment of allComments) {
    if (!commentsByFile[comment.filename]) {
      commentsByFile[comment.filename] = [];
    }
    
    // Check for similar comments (basic deduplication)
    const isDuplicate = commentsByFile[comment.filename].some(existing => 
      existing.comment.toLowerCase().includes(comment.comment.toLowerCase().substring(0, 50)) ||
      comment.comment.toLowerCase().includes(existing.comment.toLowerCase().substring(0, 50))
    );
    
    if (!isDuplicate) {
      commentsByFile[comment.filename].push(comment);
    }
  }
  
  // Create summary comment
  const summaryComment = createSummaryComment(providerComments, config);
  
  // Add review summary
  const summaryObj = {
    filename: '🤖 AI Code Review Summary',
    comment: summaryComment,
    type: 'summary',
    providers: Object.keys(providerComments).filter(p => providerComments[p].length > 0),
  };
  
  const result = [summaryObj];
  
  // Add file-specific comments
  for (const [filename, comments] of Object.entries(commentsByFile)) {
    if (filename !== '🤖 AI Code Review Summary') {
      // Group comments by type
      const suggestions = comments.filter(c => c.type === 'suggestion');
      const errors = comments.filter(c => c.type === 'error');
      
      if (suggestions.length > 0) {
        result.push({
          filename,
          comment: createFileComment(suggestions, 'AI Suggestions'),
          type: 'suggestions',
          providers: [...new Set(suggestions.map(s => s.provider))],
        });
      }
      
      if (errors.length > 0) {
        result.push({
          filename,
          comment: createFileComment(errors, 'Review Errors'),
          type: 'errors',
          providers: [...new Set(errors.map(e => e.provider))],
        });
      }
    }
  }
  
  return result;
}

function createFileComment(comments, title) {
  const comment = `## ${title}

${comments.map(c => `### ${c.provider.toUpperCase()} Review:
${c.comment}`).join('\n\n')}

---

*This comment was automatically generated by the SolFoundry AI Code Review GitHub App.*`;

  return comment;
}

function createSummaryComment(providerComments, config) {
  const activeProviders = Object.entries(providerComments)
    .filter(([_, comments]) => comments.length > 0)
    .map(([provider]) => provider.toUpperCase());

  const summary = `## AI Code Review Summary 🚀

**Review Configuration:**
- Strictness: ${config.strictness}
- Security Checks: ${config.includeSecurity ? '✅ Enabled' : '❌ Disabled'}
- Performance Analysis: ${config.includePerformance ? '✅ Enabled' : '❌ Disabled'}
- Best Practices: ${config.includeBestPractices ? '✅ Enabled' : '❌ Disabled'}

**Active AI Models:** ${activeProviders.join(', ')}

**Files Reviewed:** ${Object.keys(providerComments).reduce((sum, provider) => sum + providerComments[provider].length, 0)} total comments across all AI models.

---

*This is an automated code review by the SolFoundry AI Code Review GitHub App. While AI provides valuable insights, always use your best judgment when applying suggestions.*`;

  return summary;
}

async function postComments(context, comments, pullNumber) {
  for (const comment of comments) {
    try {
      await context.octokit.rest.issues.createComment({
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        issue_number: pullNumber,
        body: comment.comment,
      });
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  }
}

async function postErrorComment(context, errorMessage, pullNumber) {
  const errorComment = `## ⚠️ AI Code Review Error

The AI code review encountered an error:

\`\`\`
${errorMessage}
\`\`\`

Please try again later or contact the repository maintainer. This might be due to:
- API rate limits
- Temporary service issues
- Configuration problems

---

*This error was generated by the SolFoundry AI Code Review GitHub App.*`;

  try {
    await context.octokit.rest.issues.createComment({
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      issue_number: pullNumber,
      body: errorComment,
    });
  } catch (postError) {
    console.error('Error posting error comment:', postError);
  }
}

module.exports = { processPRReview };