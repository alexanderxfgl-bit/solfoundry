# GitHub App Installation Guide

## Quick Start

1. **Create GitHub App**
   ```bash
   # Navigate to the GitHub App directory
   cd github-app
   
   # Create GitHub App in GitHub Developer Portal
   # Note: This must be done manually via GitHub web interface
   ```

2. **Configure GitHub App**
   - App Name: "SolFoundry AI Code Review"
   - Homepage URL: Your app's website/repository URL
   - Webhook URL: `https://your-domain.com/api/github/webhooks`
   - Webhook Secret: Generate a secure secret
   - Permissions:
     - Pull requests: Read & Write
     - Commit statuses: Read & Write
     - Metadata: Read

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env with your configuration
   nano .env
   ```

4. **Install Dependencies**
   ```bash
   npm install
   ```

5. **Build the App**
   ```bash
   npm run build
   ```

6. **Start the Server**
   ```bash
   npm start
   ```

## Manual GitHub App Creation

### Step 1: Access GitHub Developer Portal

1. Go to: https://github.com/settings/developers
2. Click "GitHub Apps" > "New GitHub App"

### Step 2: Basic Information

- **App name**: SolFoundry AI Code Review
- **Homepage URL**: https://github.com/SolFoundry/solfoundry
- **Callback URL**: Leave empty (webhook URL configured separately)

### Step 3: Webhook Configuration

- **Webhook URL**: `https://your-domain.com/api/github/webhooks`
- **Content type**: `application/json`
- **Secret**: Generate and store securely

### Step 4: Repository Permissions

| Permission | Access | Description |
|------------|--------|-------------|
| Pull requests | Read & Write | Access and modify PRs |
| Commit statuses | Read & Write | Update PR status checks |
| Metadata | Read | Access repository metadata |

### Step 5: Events

Subscribe to these events:
- [x] Pull requests
- [x] Installation

### Step 6: Create App

Click "Create GitHub App", then:

1. **Generate Private Key**
   - Click "Generate a private key"
   - Download and save the private key file
   - Add the key content to your `.env` file as `PRIVATE_KEY`

2. **Get App ID**
   - Copy the App ID and add to your `.env` file

3. **Install App**
   - Click "Install App"
   - Select repositories or "Install all repositories"
   - Click "Install"

## Environment Configuration

Edit `.env` file with your configuration:

```env
# GitHub App Configuration
APP_ID=1234567
PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
... your private key here ...
-----END RSA PRIVATE KEY-----"
WEBHOOK_SECRET=your-webhook-secret

# AI Model API Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...

# Server Configuration
PORT=3000
NODE_ENV=production
```

## API Key Setup

### OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Create a new secret key
3. Add to `.env` as `OPENAI_API_KEY`

### Anthropic API Key

1. Go to https://console.anthropic.com/
2. Create a new API key
3. Add to `.env` as `ANTHROPIC_API_KEY`

### Google Gemini API Key

1. Go to https://makersuite.google.com/app/apikey
2. Create a new API key
3. Add to `.env` as `GEMINI_API_KEY`

## Deployment Options

### Local Development

```bash
# Install dependencies
npm install

# Start in development mode
npm run dev
```

### Production Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## Verification

1. **Check App Installation**
   - Go to repository settings > Apps
   - Verify the app is installed and has correct permissions

2. **Test Webhook**
   - Create a test PR in an installed repository
   - Check for AI review comments

3. **Verify API Access**
   - Check that all AI API keys are working
   - Test with a simple PR to verify functionality

## Troubleshooting

### Common Issues

1. **App not installed**
   - Verify GitHub App installation in repository settings
   - Check that the app has proper permissions

2. **Webhook not working**
   - Verify webhook URL is accessible
   - Check webhook secret matches
   - Verify server is running on correct port

3. **AI API errors**
   - Verify API keys are correct
   - Check API quota limits
   - Verify API endpoints are accessible

### Debug Mode

Enable debug logging:
```env
DEBUG=solfoundry-ai-review:*
LOG_LEVEL=debug
```

## Support

For installation issues:
1. Check the [troubleshooting guide](TROUBLESHOOTING.md)
2. Review [GitHub App documentation](https://docs.github.com/en/apps)
3. Open an issue in the SolFoundry repository

---

*This installation guide is for the SolFoundry AI Code Review GitHub App.*