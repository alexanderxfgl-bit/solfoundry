const { Probot } = require('probot');
const express = require('express');
const cors = require('cors');
const { processPRReview } = require('./pr-review');
const { handleInstallation } = require('./installation');
const { handleUninstallation } = require('./uninstallation');

class AICodeReviewApp {
  constructor() {
    this.probot = new Probot({
      appId: process.env.APP_ID,
      privateKey: process.env.PRIVATE_KEY,
      webhookSecret: process.env.WEBHOOK_SECRET,
    });
    
    this.setupServer();
    this.setupWebhooks();
  }

  setupServer() {
    const app = express();
    app.use(cors());
    app.use(express.json());
    
    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    
    // Configuration endpoint for installations
    app.get('/config/:installationId', async (req, res) => {
      try {
        const { installationId } = req.params;
        const config = await this.getInstallationConfig(installationId);
        res.json(config);
      } catch (error) {
        console.error('Error fetching config:', error);
        res.status(500).json({ error: 'Failed to fetch configuration' });
      }
    });
    
    // Update configuration endpoint
    app.post('/config/:installationId', async (req, res) => {
      try {
        const { installationId } = req.params;
        const config = req.body;
        await this.updateInstallationConfig(installationId, config);
        res.json({ success: true });
      } catch (error) {
        console.error('Error updating config:', error);
        res.status(500).json({ error: 'Failed to update configuration' });
      }
    });
    
    this.server = app.listen(3000, () => {
      console.log('AI Code Review GitHub App server running on port 3000');
    });
  }

  setupWebhooks() {
    this.probot.on('pull_request', async (context) => {
      try {
        const { action, pull_request, repository } = context.payload;
        
        // Only handle opened and synchronize events
        if (action === 'opened' || action === 'synchronize') {
          console.log(`Processing PR #${pull_request.number} in ${repository.full_name}`);
          
          const config = await this.getInstallationConfig(context.payload.installation.id);
          await processPRReview(context, config);
        }
      } catch (error) {
        console.error('Error processing PR webhook:', error);
      }
    });

    this.probot.on('installation', handleInstallation);
    this.probot.on('installation.deleted', handleUninstallation);
  }

  async getInstallationConfig(installationId) {
    // For now, return default configuration
    // In production, this would fetch from a database
    return {
      enabled: true,
      strictness: 'medium',
      includeSecurity: true,
      includePerformance: true,
      includeBestPractices: true,
      models: {
        claude: { enabled: true, maxTokens: 4000 },
        openai: { enabled: true, maxTokens: 4000 },
        gemini: { enabled: true, maxTokens: 4000 }
      },
      excludePatterns: [
        '**/*.md',
        '**/*.txt',
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**'
      ],
      fileTypes: {
        include: ['**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx', '**/*.py', '**/*.java', '**/*.cpp', '**/*.c']
      }
    };
  }

  async updateInstallationConfig(installationId, config) {
    // In production, this would save to a database
    console.log(`Updated configuration for installation ${installationId}:`, config);
  }
}

// Start the app
if (require.main === module) {
  new AICodeReviewApp();
}

module.exports = { AICodeReviewApp };