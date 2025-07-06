const { TonClient, WalletContractV4 } = require('@ton/ton');
const { Address, beginCell } = require('@ton/core');
const { mnemonicToWalletKey } = require('ton-crypto');
const config = require('../config/deploy.config');

/**
 * Basic contract interaction utilities
 */
class ContractInteractor {
    constructor(network = 'testnet') {
        this.network = network;
        this.client = new TonClient({
            endpoint: config.networks[network].endpoint,
            apiKey: config.networks[network].apiKey,
        });
    }

    async initialize() {
        const key = await mnemonicToWalletKey(process.env.DEPLOYER_MNEMONIC.split(' '));
        this.wallet = WalletContractV4.create({
            publicKey: key.publicKey,
            workchain: 0,
        });

        this.walletContract = this.client.open(this.wallet);
        this.sender = this.walletContract.sender(key.secretKey);
    }

    /**
     * Send deposit message to TgBtcVault
     */
    async deposit(vaultAddress, tgbtcAmount, tonAmount) {
        console.log(`💰 Depositing ${tgbtcAmount} TGBTC and ${tonAmount} TON to vault...`);

        const body = beginCell()
            .storeUint(1, 32) // op::deposit
            .storeUint(0, 64) // query_id
            .storeCoins(tgbtcAmount)
            .storeCoins(tonAmount)
            .endCell();

        const seqno = await this.walletContract.getSeqno();

        await this.walletContract.sendTransfer({
            seqno,
            secretKey: this.sender.secretKey,
            messages: [
                {
                    to: Address.parse(vaultAddress),
                    value: tonAmount,
                    body: body,
                },
            ],
        });

        console.log('✅ Deposit transaction sent');
    }

    /**
     * Send withdraw message to TgBtcVault
     */
    async withdraw(vaultAddress, shares) {
        console.log(`💸 Withdrawing ${shares} shares from vault...`);

        const body = beginCell()
            .storeUint(2, 32) // op::withdraw
            .storeUint(0, 64) // query_id
            .storeCoins(shares)
            .endCell();

        const seqno = await this.walletContract.getSeqno();

        await this.walletContract.sendTransfer({
            seqno,
            secretKey: this.sender.secretKey,
            messages: [
                {
                    to: Address.parse(vaultAddress),
                    value: 100000000, // 0.1 TON for gas
                    body: body,
                },
            ],
        });

        console.log('✅ Withdraw transaction sent');
    }

    /**
     * Get contract state
     */
    async getContractState(address) {
        const state = await this.client.getContractState(Address.parse(address));
        return state;
    }
}

/**
 * Main interaction function
 */
async function interact() {
    const args = process.argv.slice(2);
    const network = args.includes('--mainnet') ? 'mainnet' : 'testnet';
    const action = args[0];

    const interactor = new ContractInteractor(network);
    await interactor.initialize();

    // Load deployed contracts
    const deployments = require(`../deployments/${network}.json`);
    const vaultAddress = deployments.contracts.TgBtcVault;

    switch (action) {
        case 'deposit':
            const tgbtcAmount = args[1] || '1000000000'; // 1 TGBTC
            const tonAmount = args[2] || '1000000000'; // 1 TON
            await interactor.deposit(vaultAddress, tgbtcAmount, tonAmount);
            break;

        case 'withdraw':
            const shares = args[1] || '500000000'; // 0.5 shares
            await interactor.withdraw(vaultAddress, shares);
            break;

        case 'state':
            const state = await interactor.getContractState(vaultAddress);
            console.log('Contract state:', state);
            break;

        default:
            console.log('Usage: node scripts/interact.js [deposit|withdraw|state] [amount]');
    }
}

if (require.main === module) {
    interact().catch(console.error);
}

module.exports = { interact, ContractInteractor };
