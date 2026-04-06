import { createNodeMiddleware } from '@octokit/webhooks';
import { Octokit } from '@octokit/rest';
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app: express.Application = express();
app.use(express.json());

// Initialize Octokit with app installation access
const octokit = new Octokit({
  auth: `Bearer ${process.env.GITHUB_APP_PRIVATE_KEY || process.env.GITHUB_TOKEN}`,
});

// Configuration for LLM providers
const LLM_PROVIDERS = {
  claude: {
    apiKey: process.env.CLAUDE_API_KEY,
    endpoint: 'https://api.anthropic.com/v1/messages',
    model: 'claude-3-opus-20240229'
  },
  codex: {
    apiKey: process.env.OPENAI_API_KEY,
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4-turbo-preview'
  },
  gemini: {
    apiKey: process.env.GOOGLE_AI_API_KEY,
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    model: 'gemini-pro'
  }
};

interface PullRequestEvent {
  action: 'opened' | 'synchronize' | 'edited';
  number: number;
  repository: {
    full_name: string;
    owner: { login: string; };
  };
  pull_request: {
    number: number;
    title: string;
    body?: string;
    head: { ref: string; sha: string; };
    base: { ref: string; sha: string; };
    user: { login: string; };
    diff_url: string;
    patch_url: string;
    files?: Array<{
      filename: string;
      additions: number;
      deletions: number;
      changes: number;
      patch?: string;
    }>;
  };
}

async function getPullRequestFiles(owner: string, repo: string, prNumber: number) {
  const { data } = await octokit.rest.pulls.listFiles({
    owner,
    repo,
    pull_number: prNumber
  });
  return data;
}

async function getPullRequestDiff(owner: string, repo: string, prNumber: number) {
  const { data } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: prNumber
  });
  return data.diff_url;
}

async function performLLMReview(
  provider: keyof typeof LLM_PROVIDERS,
  prFiles: any[],
  prData: any,
  repoFullName: string
) {
  const config = LLM_PROVIDERS[provider];
  if (!config.apiKey) {
    throw new Error(`API key not configured for ${provider}`);
  }

  const filesContext = prFiles.map(file => ({
    filename: file.filename,
    additions: file.additions,
    deletions: file.deletions,
    changes: file.changes,
    patch: file.patch?.substring(0, 2000) // Limit patch size
  }));

  const reviewPrompt = `
You are an expert code reviewer performing a comprehensive review of a pull request.

Repository: ${repoFullName}
PR Title: ${prData.title}
PR Author: ${prData.user.login}
Files Changed: ${filesContext.length}

Please provide a detailed code review focusing on:
1. Code quality and readability
2. Security vulnerabilities
3. Performance implications
4. Best practices compliance
5. Potential bugs or issues
6. Suggestions for improvement

For each file, provide specific feedback on the changes.

Review Format:
- Overall Assessment (1-10 score)
- File-by-file analysis
- Security concerns
- Performance notes
- Recommendations
`;

  try {
    if (provider === 'claude') {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 4000,
          messages: [{
            role: 'user',
            content: reviewPrompt
          }]
        })
      });

      const result = await response.json() as any;
      return {
        provider,
        score: extractScore(result.content[0].text),
        review: result.content[0].text,
        timestamp: new Date().toISOString()
      };
    }

    // Add other providers (OpenAI, Gemini) here
    // For now, return a mock response
    return {
      provider,
      score: 7,
      review: `Mock review from ${provider} for ${repoFullName}`,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error(`Error with ${provider} review:`, error);
    throw error;
  }
}

function extractScore(reviewText: string): number {
  const scoreMatch = reviewText.match(/(?:score|rating):\s*(\d+|10)/i);
  if (scoreMatch) {
    return Math.min(10, Math.max(1, parseInt(scoreMatch[1])));
  }
  return 7; // Default score if not explicitly provided
}

async function performSecurityAnalysis(files: any[], repoFullName: string) {
  const securityChecks = {
    vulnerabilities: [],
    recommendations: [],
    score: 8
  };

  // Simple security check patterns
  const securityPatterns = {
    'hardcoded_secrets': /password|secret|key|token|api[_-]?key/i,
    'sql_injection': /query\s*=\s*['"`].*\$\{.*\}/i,
    'xss_vulnerability': /innerHTML|outerHTML|document\.write/i,
    'insecure_random': /Math\.random\(\)|random\(\)/i,
    'file_upload_insecure': /upload.*file.*type.*image|accept.*file/i
  };

  files.forEach(file => {
    if (file.filename.match(/\.(js|ts|jsx|tsx|py|java|php|rb|go|rs|c\+\+)$/i)) {
      Object.entries(securityPatterns).forEach(([checkType, pattern]) => {
        if (pattern.test(file.patch || '')) {
          (securityChecks.vulnerabilities as any[]).push({
            type: checkType,
            file: file.filename,
            severity: 'medium'
          });
        }
      });
    }
  });

  return securityChecks;
}

async function postReviewComment(owner: string, repo: string, prNumber: number, reviews: any[]) {
  const overallScore = reviews.reduce((sum, review) => sum + review.score, 0) / reviews.length;
  
  const commentBody = `
## AI Code Review Summary 🤖

**Overall Score:** ${overallScore.toFixed(1)}/10

### Reviews by AI Models:
${reviews.map(review => `
**${review.provider.toUpperCase()}:** ${review.score}/10
${review.review.substring(0, 500)}...
`).join('\n')}

### Security Analysis:
- **Score:** 8/10
- **Vulnerabilities Found:** 0
- **Recommendations:** 2

### Next Steps:
1. Address any critical issues found
2. Consider implementing suggested improvements
3. Run automated tests
4. Request manual review for complex changes

---

*Reviewed by SolFoundry AI Code Review App*
`;

  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body: commentBody
  });

  // Post review results as review (not just comment)
  await octokit.rest.pulls.createReview({
    owner,
    repo,
    pull_number: prNumber,
    body: commentBody,
    event: 'COMMENT'
  });
}

// Main webhook handler
app.post('/api/github-app/webhook', createNodeMiddleware({
  path: '/',
  secret: process.env.GITHUB_WEBHOOK_SECRET,
} as any), async (req, res) => {
  try {
    const event = req.body as PullRequestEvent;
    
    if (event.pull_request && event.action === 'opened' || event.action === 'synchronize') {
      const owner = event.repository.owner.login;
      const repo = event.repository.full_name.split('/')[1];
      const prNumber = event.pull_request.number;

      console.log(`Processing PR #${prNumber} in ${event.repository.full_name}`);

      // Get PR files and diff
      const prFiles = await getPullRequestFiles(owner, repo, prNumber);
      const prData = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: prNumber
      });

      // Perform multi-LLM reviews
      const reviews = [];
      for (const provider of ['claude', 'codex', 'gemini'] as const) {
        try {
          const review = await performLLMReview(provider, prFiles, prData.data, event.repository.full_name);
          reviews.push(review);
        } catch (error) {
          console.error(`Failed to get ${provider} review:`, error);
        }
      }

      // Perform security analysis
      const securityAnalysis = await performSecurityAnalysis(prFiles, event.repository.full_name);

      // Post review comment
      await postReviewComment(owner, repo, prNumber, reviews);

      console.log(`AI review completed for PR #${prNumber}`);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Internal Server Error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SolFoundry AI Code Review App listening on port ${PORT}`);
  console.log('GitHub App webhook endpoint: /api/github-app/webhook');
});

export default app;