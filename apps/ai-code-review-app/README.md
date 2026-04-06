# SolFoundry AI Code Review GitHub App

A powerful GitHub App that provides automated multi-LLM code reviews with security checks, performance analysis, and best practices for any GitHub repository.

## Features

### 🤖 Multi-LLM Code Review
- **Claude 3 Opus**: Advanced reasoning and code understanding
- **GPT-4 Turbo**: High-quality code analysis and suggestions  
- **Gemini Pro**: Balanced technical review capabilities

### 🔒 Security Analysis
- Automated vulnerability detection
- Hardcoded secrets scanning
- Security best practice validation
- XSS and SQL injection detection

### ⚡ Performance Analysis
- Code complexity assessment
- Performance bottleneck identification
- Memory usage optimization suggestions
- Loading time analysis

### 📋 Comprehensive Reporting
- Overall quality score (1-10)
- File-by-file analysis
- Actionable recommendations
- Security and performance metrics

## Installation

### 1. Create GitHub App
1. Go to GitHub → Settings → Developer settings → GitHub Apps
2. Click "New GitHub App"
3. Use `manifest.yml` for configuration
4. Generate private key and webhook secret

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your API keys and app configuration
```

### 3. Install Dependencies
```bash
npm install
npm run build
```

### 4. Deploy the App
```bash
npm start
```

## Configuration

### Required Environment Variables
```env
# GitHub App
GITHUB_APP_ID=your-app-id
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----..."
GITHUB_WEBHOOK_SECRET=your-webhook-secret

# LLM APIs
CLAUDE_API_KEY=your-claude-api-key
OPENAI_API_KEY=your-openai-api-key
GOOGLE_AI_API_KEY=your-google-ai-key
```

### LLM Provider Setup
1. **Claude**: Get API key from [Anthropic Console](https://console.anthropic.com/)
2. **OpenAI**: Get API key from [OpenAI Platform](https://platform.openai.com/)
3. **Google AI**: Get API key from [Google AI Studio](https://makersuite.google.com/)

## Usage

### Automatic Reviews
Once installed and configured, the app automatically:
- Reviews every new pull request
- Analyzes code changes in real-time
- Posts detailed review comments
- Provides security and performance insights

### Review Features
- **Overall Score**: 1-10 rating based on multiple criteria
- **File Analysis**: Detailed feedback on each changed file
- **Security Checks**: Automated vulnerability detection
- **Performance**: Code optimization suggestions
- **Best Practices**: Industry standard compliance

### Webhook Events
The app listens for:
- `pull_request.opened`: New PRs
- `pull_request.synchronize`: Updated PRs
- `pull_request.edited`: Modified PRs

## Architecture

```
GitHub App → Webhook Handler → LLM Services → Review Analysis → GitHub Comments
```

### Components
1. **Webhook Handler**: Receives and processes GitHub events
2. **LLM Services**: Interfaces with Claude, OpenAI, and Gemini
3. **Code Analyzer**: Extracts and analyzes code changes
4. **Security Scanner**: Detects vulnerabilities and issues
5. **Review Engine**: Generates comprehensive review reports
6. **GitHub API**: Posts comments and manages PR interactions

## Examples

### Review Comment
```
## AI Code Review Summary 🤖

**Overall Score:** 8.3/10

### Reviews by AI Models:
**CLAUDE:** 9/10
Excellent code structure and documentation...

**GPT-4:** 8/10
Good implementation but consider optimizing...

**GEMINI:** 8/10
Solid code with room for improvement...

### Security Analysis:
- **Score:** 8/10
- **Vulnerabilities Found:** 0
- **Recommendations:** 2
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is part of the SolFoundry bounty program. See the main SolFoundry repository for licensing information.

## Support

For questions or issues:
- Check the main SolFoundry repository
- Create an issue in this repository
- Contact SolFoundry maintainers

---

*Built for SolFoundry bounty program - 1M $FNDRY reward*