/**
 * Main export file for all deployment scripts
 */
module.exports = {
    // Core deployment functionality
    MultiContractDeployer: require('./deployer').MultiContractDeployer,
    DeploymentUtils: require('./utils').DeploymentUtils,

    // Individual contract deployers
    deployTgBtcVault: require('./01_deployTgBtcVault').deployTgBtcVault,
    deployDedustAdapter: require('./02_deployDedustAdapter').deployDedustAdapter,
    deployMegatonAdapter: require('./03_deployMegatonAdapter').deployMegatonAdapter,
    deployStonAdapter: require('./04_deployStonAdapter').deployStonAdapter,

    // Utility functions
    interact: require('./interact').interact,
    verify: require('./verify').verify,
};
