# GitHub Action: Post to SolFoundry Bounties

This GitHub Action automatically converts labeled GitHub issues into SolFoundry bounties with customizable reward amounts.

## Features

- 🎯 Automatically detects issues with specified labels
- 📦 Posts bounties to SolFoundry with configurable rewards
- 💬 Posts comments on original issues with bounty details
- 🔧 Fully configurable label detection and reward amounts
- 🌍 Supports multiple repositories or single repository scope

## Usage

### Basic Configuration

Add this workflow to your `.github/workflows/` directory:

```yaml
name: 'Automatically Post Bounties to SolFoundry'

on:
  issues:
    types: [opened, labeled, edited]
  issue_comment:
    types: [created]

permissions:
  issues: write
  contents: read

jobs:
  bounty-poster:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        
      - name: Post to SolFoundry
        uses: ./.github/actions/post-to-solfoundry-bounties
        with:
          solfoundry-api-token: ${{ secrets.SOLFOUNDRY_API_TOKEN }}
          bounty-labels: 'bounty,paid-bounty,issue-bounty'
          reward-amount: '1000'
          repository-scope: '*'
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `solfoundry-api-token` | SolFoundry API token for posting bounties | Yes | `''` |
| `bounty-labels` | Comma-separated list of labels that trigger bounty creation | Yes | `'bounty'` |
| `reward-amount` | Default reward amount in $FNDRY tokens | No | `'1000'` |
| `repository-scope` | Repository scope for bounty posting (owner/repo or \*) | No | `'*'` |

## Outputs

| Output | Description |
|--------|-------------|
| `bounty-created` | Whether a bounty was created (`true`/`false`) |
| `bounty-id` | ID of the created bounty |
| `bounty-url` | URL to the created bounty |

## Event Triggers

The action triggers on:
- `issues.opened` - When a new issue is created
- `issues.labeled` - When labels are added to an issue
- `issues.edited` - When an issue is edited
- `issue_comment.created` - When a comment is added to an issue

## Examples

### Custom Configuration

```yaml
name: 'Custom Bounty Posting'

on:
  issues:
    types: [opened]

permissions:
  issues: write
  contents: read

jobs:
  post-bounty:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        
      - name: Post bounty with custom settings
        uses: ./.github/actions/post-to-solfoundry-bounties
        with:
          solfoundry-api-token: ${{ secrets.SOLFOUNDRY_API_TOKEN }}
          bounty-labels: 'enhancement,feature-request'
          reward-amount: '2500'
          repository-scope: 'my-org/my-repo'
```

### Multi-Repository Setup

```yaml
name: 'Multi-Repository Bounty Posting'

on:
  issues:
    types: [opened, labeled]

permissions:
  issues: write
  contents: read

jobs:
  bounty-poster:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        
      - name: Post to SolFoundry
        uses: ./.github/actions/post-to-solfoundry-bounties
        with:
          solfoundry-api-token: ${{ secrets.SOLFOUNDRY_API_TOKEN }}
          bounty-labels: 'bounty,work-paid'
          reward-amount: '5000'
          repository-scope: '*'  # All repositories in the organization
```

## Security

- 🔒 Uses GitHub Secrets API token for authentication
- 🔐 Only has necessary permissions (issues: write, contents: read)
- 🛡️ Validates input data before processing
- 📝 Includes audit trail in action logs

## Requirements

- GitHub repository with issues enabled
- SolFoundry API token (contact SolFoundry team to obtain)
- GitHub repository with Actions enabled

## Troubleshooting

### Common Issues

1. **Action not triggering**: 
   - Ensure your issue has the correct labels
   - Check that the workflow file is in the correct location
   - Verify the GitHub repository has Actions enabled

2. **Permission errors**:
   - Ensure the workflow has the correct permissions
   - Check that the API token has the necessary scopes

3. **No bounty created**:
   - Verify the issue labels match the configured labels
   - Check the API token is correctly set as a secret
   - Review action logs for detailed error information

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the action
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

---

**Note**: This is a reference implementation. In production, you would need to integrate with the actual SolFoundry API endpoints for posting bounties.