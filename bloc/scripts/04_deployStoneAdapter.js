const { MultiContractDeployer } = require('./deployer');
const { DeploymentUtils } = require('./utils');
const config = require('../config/deploy.config');
require('dotenv').config();

/**
 * Deploy StonAdapter contract
 * Depends on TgBtcVault being deployed first
 */
async function deployStonAdapter(network = 'testnet') {
    console.log(`🔄 Deploying StonAdapter to ${network}...`);

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
        const adapterConfig = { ...config.contracts.StonAdapter };
        adapterConfig.initData.vaultAddress = deployments.contracts.TgBtcVault;

        const address = await deployer.deployContract('StonAdapter', adapterConfig);

        console.log(`✅ StonAdapter deployed successfully at: ${address.toString()}`);
        return address;
    } catch (error) {
        console.error('❌ StonAdapter deployment failed:', error);
        throw error;
    }
}

if (require.main === module) {
    const network = process.argv.includes('--mainnet') ? 'mainnet' : 'testnet';
    deployStonAdapter(network).catch(console.error);
}

module.exports = { deployStonAdapter };
