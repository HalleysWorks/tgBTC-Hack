const { TonClient } = require('@ton/ton');
const { Address } = require('@ton/core');
const config = require('../config/deploy.config');

/**
 * Contract verification utilities
 */
class ContractVerifier {
    constructor(network = 'testnet') {
        this.network = network;
        this.client = new TonClient({
            endpoint: config.networks[network].endpoint,
            apiKey: config.networks[network].apiKey,
        });
    }

    /**
     * Verify contract deployment
     */
    async verifyContract(address, contractName) {
        console.log(`🔍 Verifying ${contractName} at ${address}...`);

        try {
            const state = await this.client.getContractState(Address.parse(address));

            if (state.state === 'active') {
                console.log(`✅ ${contractName} is active`);
                console.log(`   Balance: ${state.balance} nanoTON`);
                console.log(`   Last transaction: ${state.lastTransaction?.lt || 'N/A'}`);
                return true;
            } else {
                console.log(`❌ ${contractName} is not active (state: ${state.state})`);
                return false;
            }
        } catch (error) {
            console.error(`❌ Error verifying ${contractName}:`, error);
            return false;
        }
    }

    /**
     * Verify all deployed contracts
     */
    async verifyAll() {
        console.log(`🔍 Verifying all contracts on ${this.network}...`);

        try {
            const deployments = require(`../deployments/${this.network}.json`);
            const results = {};

            for (const [contractName, address] of Object.entries(deployments.contracts)) {
                results[contractName] = await this.verifyContract(address, contractName);
            }

            const totalContracts = Object.keys(results).length;
            const activeContracts = Object.values(results).filter(Boolean).length;

            console.log(`\n📊 Verification Summary:`);
            console.log(`   Total contracts: ${totalContracts}`);
            console.log(`   Active contracts: ${activeContracts}`);
            console.log(`   Success rate: ${((activeContracts / totalContracts) * 100).toFixed(1)}%`);

            return results;
        } catch (error) {
            console.error('❌ Verification failed:', error);
            throw error;
        }
    }
}

/**
 * Main verification function
 */
async function verify() {
    const args = process.argv.slice(2);
    const network = args.includes('--mainnet') ? 'mainnet' : 'testnet';
    const contractName = args[0];

    const verifier = new ContractVerifier(network);

    if (contractName && contractName !== '--mainnet' && contractName !== '--testnet') {
        // Verify specific contract
        const deployments = require(`../deployments/${network}.json`);
        const address = deployments.contracts[contractName];

        if (!address) {
            console.error(`❌ Contract ${contractName} not found in deployments`);
            return;
        }

        await verifier.verifyContract(address, contractName);
    } else {
        // Verify all contracts
        await verifier.verifyAll();
    }
}

if (require.main === module) {
    verify().catch(console.error);
}

module.exports = { verify, ContractVerifier };
