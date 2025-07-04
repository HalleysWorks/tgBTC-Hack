import { TonClient, Address } from '@ton/ton';

async function checkBalance() {
    const client = new TonClient({
        endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
    });

    const address = Address.parse('YOUR_WALLET_ADDRESS_HERE');
    const balance = await client.getBalance(address);

    console.log('💰 Wallet Balance:', balance.toString(), 'nanoTON');
    console.log('💰 Balance in TON:', Number(balance) / 1e9);
}

checkBalance().catch(console.error);
