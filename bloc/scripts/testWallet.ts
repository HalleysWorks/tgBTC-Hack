// scripts/testWallet.ts
import { TonClient, WalletContractV4 } from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';

async function testWallet() {
    const client = new TonClient({
        endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
    });

    // Load from environment
    const mnemonic = process.env.WALLET_MNEMONIC!.split(' ');
    const keyPair = await mnemonicToPrivateKey(mnemonic);

    const wallet = WalletContractV4.create({
        workchain: 0,
        publicKey: keyPair.publicKey,
    });

    const contract = client.open(wallet);
    const balance = await contract.getBalance();

    console.log('✅ Wallet connected successfully!');
    console.log('📍 Address:', wallet.address.toString());
    console.log('💰 Balance:', Number(balance) / 1e9, 'TON');

    return contract;
}

testWallet().catch(console.error);
