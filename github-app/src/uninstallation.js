async function handleUninstallation(context) {
  const { installation, repositories } = context.payload;
  
  console.log(`Installation deleted for ${installation.account.login}`);
  console.log(`Repositories affected: ${repositories.length}`);
  
  // In production, you would:
  // 1. Remove installation data from database
  // 2. Clean up any resources associated with this installation
  // 3. Optionally notify the user
  
  const affectedRepos = repositories.map(r => r.full_name);
  
  console.log('Uninstallation data:', {
    installationId: installation.id,
    account: installation.account,
    repositories: affectedRepos,
    uninstalledAt: new Date().toISOString(),
  });
  
  // In a production system, you might want to:
  // - Remove installation from your database
  // - Cancel any active subscriptions or services
  // - Send a farewell notification
  // - Log the uninstallation for analytics
  
  console.log('Installation cleanup completed for installation', installation.id);
}

module.exports = { handleUninstallation };