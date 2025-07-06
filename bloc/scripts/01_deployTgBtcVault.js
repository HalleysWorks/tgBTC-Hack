const { MultiContractDeployer } = require('./deployer');
const { DeploymentUtils } = require('./utils');
const config = require('../config/deploy.config');
require('dotenv').config();

/**
 * Deploy TgBtcVault contract
 * This must be deployed first as other contracts depend on it
 */
async function deployTgBtcVault(network = 'testnet') {
    console.log(`🏦 Deploying TgBtcVault to ${network}...`);

    try {
        // Validate environment
        DeploymentUtils.validateEnvironment();

        const deployer = new MultiContractDeployer(network);
        await deployer.initialize();

        const address = await deployer.deployContract('TgBtcVault', config.contracts.TgBtcVault);

        console.log(`✅ TgBtcVault deployed successfully at: ${address.toString()}`);
        return address;
    } catch (error) {
        console.error('❌ TgBtcVault deployment failed:', error);
        throw error;
    }
}

if (require.main === module) {
    const network = process.argv.includes('--mainnet') ? 'mainnet' : 'testnet';
    deployTgBtcVault(network).catch(console.error);
}

module.exports = { deployTgBtcVault };
