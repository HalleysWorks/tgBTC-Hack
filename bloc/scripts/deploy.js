const { MultiContractDeployer } = require('./deployer');

/**
 * Main deployment orchestrator for all TON contracts
 * Handles sequential deployment with dependency management
 */
async function main() {
    const args = process.argv.slice(2);
    const network = args.includes('--mainnet') ? 'mainnet' : 'testnet';

    console.log(`🚀 Starting deployment to ${network}...`);

    try {
        const deployer = new MultiContractDeployer(network);
        await deployer.deployAll();
        console.log('✅ All contracts deployed successfully!');
    } catch (error) {
        console.error('❌ Deployment failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main };
