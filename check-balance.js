require('dotenv').config();
const { getHttpEndpoint } = require('@orbs-network/ton-access');
const { TonClient } = require('@ton/ton');
const { Address } = require('@ton/core');

async function main() {
    const endpoint = await getHttpEndpoint({ network: 'testnet' });
    const client = new TonClient({ endpoint });
    const address = Address.parse(process.env.ADMIN_ADDRESS);
    const balance = await client.getBalance(address);

    const balanceNano = Number(balance);
    console.log(`Testnet balance for ${address.toString()}: ${balanceNano} nanoTON`);
    console.log(`Which is ${(balanceNano / 1e9).toFixed(6)} TON`);
}

main().catch(console.error);
