require('dotenv').config(); // ← load .env first
const { Address, Cell, beginCell, toNano } = require('@ton/core');
const { TonClient, WalletContractV4, internal } = require('@ton/ton');
const { mnemonicToWalletKey } = require('@ton/crypto'); // ← use @ton/crypto
const fs = require('fs');
const path = require('path');
const config = require('../config/deploy.config');
const { DeploymentUtils } = require('./utils');

class MultiContractDeployer {
    constructor(network = 'testnet') {
        this.network = network;
        this.client = null; // will initialize later
        this.deployedContracts = {};
        this.contractDependencies = {};
        this.wallet = null;
        this.walletContract = null;
        this.sender = null;
    }

    async initialize() {
        DeploymentUtils.validateEnvironment();

        // Resolve and await the async endpoint URL
        const netCfg = config.networks[this.network];
        const url = await netCfg.endpoint(); // ← await here
        this.client = new TonClient({ endpoint: url }); // pass the real URL string

        // Derive your deployer wallet
        const key = await mnemonicToWalletKey(process.env.DEPLOYER_MNEMONIC.split(' '));
        this.wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
        this.walletContract = this.client.open(this.wallet);
        this.sender = this.walletContract.sender(key.secretKey);

        console.log(`💼 Deployer address: ${this.wallet.address.toString()}`);

        // Check wallet balance
        const balance = await this.client.getBalance(this.wallet.address);
        console.log(`💰 Wallet balance: ${this.formatTON(balance)} TON`);
        if (balance < toNano('1')) {
            throw new Error('Insufficient balance for deployment. Need at least 1 TON');
        }
    }

    /**
     * Deploy a single contract
     */
    async deployContract(contractName, contractConfig) {
        try {
            console.log(`\n🚀 Deploying ${contractName}...`);

            // Update dependencies before deployment
            await this.updateContractDependencies(contractName, contractConfig);

            // Load compiled contract
            const compiledContract = this.loadCompiledContract(contractConfig);

            // Create code cell
            const code = Cell.fromBoc(Buffer.from(compiledContract.hex, 'hex'))[0];

            // Create initial data cell
            const initData = this.createInitData(contractName, contractConfig);

            // Create StateInit
            const stateInit = beginCell().storeRef(code).storeRef(initData).endCell();

            // Calculate contract address
            const contractAddress = new Address(0, stateInit.hash());

            // Check if contract already exists
            const existingContract = await this.client.getContractState(contractAddress);
            if (existingContract.state === 'active') {
                console.log(`✅ Contract ${contractName} already deployed at: ${contractAddress.toString()}`);
                this.deployedContracts[contractName] = contractAddress.toString();
                return contractAddress;
            }

            // Deploy contract
            const deployAmount = toNano(contractConfig.deployAmount);
            const seqno = await this.walletContract.getSeqno();

            await this.walletContract.sendTransfer({
                seqno,
                secretKey: this.sender.secretKey,
                messages: [
                    internal({
                        to: contractAddress,
                        value: deployAmount,
                        init: {
                            code: code,
                            data: initData,
                        },
                        body: this.createDeployMessage(contractName, contractConfig),
                    }),
                ],
            });

            // Wait for deployment confirmation
            console.log(`⏳ Waiting for deployment confirmation...`);
            await this.waitForDeployment(contractAddress);

            console.log(`✅ ${contractName} deployed successfully at: ${contractAddress.toString()}`);
            this.deployedContracts[contractName] = contractAddress.toString();

            return contractAddress;
        } catch (error) {
            console.error(`❌ Error deploying ${contractName}:`, error);
            throw error;
        }
    }

    /**
     * Load compiled contract from file
     */
    loadCompiledContract(contractConfig) {
        // Try to load from compiled JSON first
        if (contractConfig.compiledFile && fs.existsSync(contractConfig.compiledFile)) {
            return JSON.parse(fs.readFileSync(contractConfig.compiledFile, 'utf8'));
        }

        // Fallback to buildFile
        if (contractConfig.buildFile && fs.existsSync(contractConfig.buildFile)) {
            return JSON.parse(fs.readFileSync(contractConfig.buildFile, 'utf8'));
        }

        throw new Error(`No compiled contract found for ${contractConfig.buildFile || contractConfig.compiledFile}`);
    }

    /**
     * Update contract dependencies based on already deployed contracts
     */
    async updateContractDependencies(contractName, contractConfig) {
        if (contractConfig.contractType === 'adapter') {
            // Set vault address if TgBtcVault is deployed
            if (this.deployedContracts['TgBtcVault']) {
                contractConfig.initData.vaultAddress = this.deployedContracts['TgBtcVault'];
            }
        }
    }

    /**
     * Create initial data cell for contract
     */
    createInitData(contractName, contractConfig) {
        const initData = beginCell();

        // Handle specific contract initialization based on type
        switch (contractConfig.contractType) {
            case 'vault':
                // TgBtcVault initialization
                initData
                    .storeCoins(0) // ctx_total_tgbtc
                    .storeCoins(0) // ctx_total_ton
                    .storeDict(null) // ctx_lp_shares
                    .storeAddress(null) // ctx_admin_address (will be set during init)
                    .storeAddress(null) // ctx_tgbtc_jetton_master (will be set during init)
                    .storeUint(0, 1) // ctx_paused
                    .storeUint(0, 1); // ctx_reentrancy_lock
                break;

            case 'adapter':
                // Adapter initialization
                initData
                    .storeAddress(null) // vault_address (will be set during init)
                    .storeAddress(null) // pool_address (will be set during init)
                    .storeUint(0, 1) // paused
                    .storeCoins(0); // total_processed
                break;

            default:
                // Default empty initialization
                initData.storeUint(0, 1);
                break;
        }

        return initData.endCell();
    }

    /**
     * Create deployment message for contract
     */
    createDeployMessage(contractName, contractConfig) {
        const body = beginCell();

        // Handle specific contract deploy messages
        switch (contractConfig.contractType) {
            case 'vault':
                // TgBtcVault init message
                body.storeUint(contractConfig.initOp, 32) // op::init_vault
                    .storeUint(0, 64) // query_id
                    .storeAddress(Address.parse(contractConfig.initData.adminAddress))
                    .storeAddress(Address.parse(contractConfig.initData.tgbtcMasterAddress));
                break;

            case 'adapter':
                // Adapter init message
                body.storeUint(contractConfig.initOp, 32) // init operation
                    .storeUint(0, 64) // query_id
                    .storeAddress(
                        contractConfig.initData.vaultAddress
                            ? Address.parse(contractConfig.initData.vaultAddress)
                            : null,
                    )
                    .storeAddress(
                        contractConfig.initData.poolAddress ? Address.parse(contractConfig.initData.poolAddress) : null,
                    );
                break;

            default:
                // Default empty message
                body.storeUint(0, 32);
                break;
        }

        return body.endCell();
    }

    /**
     * Wait for contract deployment confirmation
     */
    async waitForDeployment(address, timeout = 60000) {
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            try {
                const state = await this.client.getContractState(address);
                if (state.state === 'active') {
                    return true;
                }
            } catch (error) {
                // Contract might not exist yet
            }

            await new Promise((resolve) => setTimeout(resolve, 3000));
        }

        throw new Error(`Deployment timeout for address: ${address.toString()}`);
    }

    /**
     * Deploy all contracts in proper order
     */
    async deployAll() {
        await this.initialize();

        const deploymentOrder = config.deploymentOrder || Object.keys(config.contracts);
        console.log(`📋 Deploying ${deploymentOrder.length} contracts on ${this.network}...`);

        for (const contractName of deploymentOrder) {
            const contractConfig = config.contracts[contractName];
            if (!contractConfig) {
                console.warn(`⚠️  Contract ${contractName} not found in config, skipping...`);
                continue;
            }

            await this.deployContract(contractName, contractConfig);

            // Wait a bit between deployments
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }

        // Save deployment results
        this.saveDeploymentResults();

        console.log('\n🎉 All contracts deployed successfully!');
        console.log('📜 Deployed contracts:');
        Object.entries(this.deployedContracts).forEach(([name, address]) => {
            console.log(`  ${name}: ${address}`);
        });
    }

    /**
     * Save deployment results to file
     */
    saveDeploymentResults() {
        const deploymentsDir = path.join(__dirname, '..', 'deployments');
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir, { recursive: true });
        }

        const resultsFile = path.join(deploymentsDir, `${this.network}.json`);

        const results = {
            network: this.network,
            timestamp: new Date().toISOString(),
            contracts: this.deployedContracts,
        };

        fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
        console.log(`💾 Deployment results saved to: ${resultsFile}`);
    }

    /**
     * Format TON amount for display
     */
    formatTON(amount) {
        return (parseInt(amount) / 1000000000).toFixed(2);
    }
}

module.exports = { MultiContractDeployer };
