# SolFoundry AI Code Review GitHub App

A GitHub App that provides automated multi-LLM code reviews using Claude, OpenAI GPT-4, and Google Gemini for pull requests in repositories where it's installed.

## Features

🤖 **Multi-LLM Code Reviews**
- Claude 3 Sonnet for comprehensive code analysis
- OpenAI GPT-4 for technical insights and best practices
- Google Gemini for alternative perspectives and suggestions

🔒 **Security Analysis**
- Automated detection of security vulnerabilities
- Best practice recommendations for secure coding
- Common security issue identification

⚡ **Performance Insights**
- Performance optimization suggestions
- Code complexity analysis
- Memory and execution efficiency recommendations

🎯 **Configurable Review Settings**
- Adjustable review strictness (lenient, medium, strict)
- Enable/disable specific AI models
- File type and pattern filtering
- Custom review focus areas

## Installation

### For Repository Owners

1. **Install from GitHub Marketplace**
   - Visit the [SolFoundry AI Code Review App page](https://github.com/marketplace/solfoundry-ai-code-review)
   - Click "Install" and select the repositories where you want the app installed

2. **Manual Installation**
   - Go to **Settings** > **Apps** > **GitHub Apps**
   - Click "Configure" next to "SolFoundry AI Code Review"
   - Select repositories and click "Install"

### For Developers (Creating the App)

1. **Create GitHub App**
   - Go to GitHub Developer Portal > GitHub Apps
   - Create a new GitHub App with these settings:
     - **Webhook URL**: `https://your-domain.com/api/github/webhooks`
     - **Webhook secret**: Generate a secure secret
     - **Repository permissions**:
       - Pull requests: Read & Write
       - Commit statuses: Read & Write
       - Metadata: Read
     - **Subscribe to events**:
       - Pull requests
       - Installation

2. **Environment Variables**
   Create a `.env` file with:
   ```env
   APP_ID=your-app-id
   PRIVATE_KEY=your-private-key
   WEBHOOK_SECRET=your-webhook-secret
   OPENAI_API_KEY=your-openai-key
   ANTHROPIC_API_KEY=your-anthropic-key
   GEMINI_API_KEY=your-gemini-key
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Build and Run**
   ```bash
   npm run build
   npm start
   ```

## Configuration

### Repository Configuration

Create a `.github/ai-review-config.json` file in your repository:

```json
{
  "strictness": "medium",
  "includeSecurity": true,
  "includePerformance": true,
  "includeBestPractices": true,
  "models": {
    "claude": { "enabled": true, "maxTokens": 4000 },
    "openai": { "enabled": true, "maxTokens": 4000 },
    "gemini": { "enabled": true, "maxTokens": 4000 }
  },
  "excludePatterns": [
    "**/*.md",
    "**/*.txt",
    "**/*.json",
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**"
  ],
  "fileTypes": {
    "include": [
      "**/*.js",
      "**/*.ts",
      "**/*.jsx",
      "**/*.tsx",
      "**/*.py",
      "**/*.java",
      "**/*.cpp",
      "**/*.c",
      "**/*.go",
      "**/*.rs"
    ]
  }
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `strictness` | string | "medium" | Review strictness: "lenient", "medium", "strict" |
| `includeSecurity` | boolean | true | Include security analysis |
| `includePerformance` | boolean | true | Include performance analysis |
| `includeBestPractices` | boolean | true | Include best practices review |
| `models.claude.enabled` | boolean | true | Enable Claude reviews |
| `models.openai.enabled` | boolean | true | Enable OpenAI reviews |
| `models.gemini.enabled` | boolean | true | Enable Gemini reviews |
| `excludePatterns` | array | Default exclusions | File patterns to exclude from review |
| `fileTypes.include` | array | Common code files | File patterns to include in review |

## How It Works

1. **PR Trigger**: When a pull request is opened or synchronized, the app is triggered
2. **File Analysis**: The app analyzes changed files in the PR
3. **AI Processing**: Each file is processed by enabled AI models
4. **Review Generation**: AI models generate code review comments
5. **Comment Posting**: Combined review comments are posted to the PR
6. **Summary**: A summary comment provides an overview of the review

## Example Review Output

### Summary Comment
```
## AI Code Review Summary 🚀

**Review Configuration:**
- Strictness: medium
- Security Checks: ✅ Enabled
- Performance Analysis: ✅ Enabled
- Best Practices: ✅ Enabled

**Active AI Models:** CLAUDE, OPENAI, GEMINI

**Files Reviewed:** 12 total comments across all AI models.
```

### File-Specific Comments
```
## AI Suggestions

### CLAUDE Review:
Consider using async/await for better error handling in this function.

### OPENAI Review:
The variable naming could be more descriptive. Consider using meaningful names.

### GEMINI Review:
Great work on implementing proper error handling here!
```

## API Endpoints

### Health Check
```
GET /health
```
Returns the health status of the application.

### Configuration Management
```
GET /config/:installationId
POST /config/:installationId
```
Get and update configuration for an installation.

## Development

### Testing
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Building
```bash
npm run build
```

## Troubleshooting

### Common Issues

1. **No Comments Posted**
   - Check that the app has proper permissions
   - Verify the webhook URL is accessible
   - Check for rate limits

2. **AI API Errors**
   - Verify API keys are correctly set
   - Check for API quota limits
   - Ensure proper error handling

3. **Configuration Issues**
   - Validate JSON syntax in config files
   - Check that file patterns are correctly formatted
   - Ensure enabled models have valid API keys

### Debug Mode
Set environment variables for debugging:
```env
DEBUG=solfoundry-ai-review:*
LOG_LEVEL=debug
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For questions or support:
- Create an issue in the [SolFoundry repository](https://github.com/SolFoundry/solfoundry)
- Check the [documentation](https://github.com/SolFoundry/solfoundry/docs)
- Contact the SolFoundry team

---

*This AI Code Review GitHub App is part of the SolFoundry bounty ecosystem.*