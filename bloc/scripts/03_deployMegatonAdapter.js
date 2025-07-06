const { MultiContractDeployer } = require('./deployer');
const { DeploymentUtils } = require('./utils');
const config = require('../config/deploy.config');
require('dotenv').config();

/**
 * Deploy MegatonAdapter contract
 * Depends on TgBtcVault being deployed first
 */
async function deployMegatonAdapter(network = 'testnet') {
    console.log(`🔄 Deploying MegatonAdapter to ${network}...`);

    try {
        // Validate environment
        DeploymentUtils.validateEnvironment();

        const deployer = new MultiContractDeployer(network);
        await deployer.initialize();

        // Check if TgBtcVault is deployed
        const deployments = require(`../deployments/${network}.json`);
        if (!deployments.contracts?.TgBtcVault) {
            throw new Error('TgBtcVault must be deployed first');
        }

        // Update adapter config with vault address
        const adapterConfig = { ...config.contracts.MegatonAdapter };
        adapterConfig.initData.vaultAddress = deployments.contracts.TgBtcVault;

        const address = await deployer.deployContract('MegatonAdapter', adapterConfig);

        console.log(`✅ MegatonAdapter deployed successfully at: ${address.toString()}`);
        return address;
    } catch (error) {
        console.error('❌ MegatonAdapter deployment failed:', error);
        throw error;
    }
}

if (require.main === module) {
    const network = process.argv.includes('--mainnet') ? 'mainnet' : 'testnet';
    deployMegatonAdapter(network).catch(console.error);
}

module.exports = { deployMegatonAdapter };
