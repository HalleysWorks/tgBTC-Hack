const { toNano, Address } = require('@ton/core');
const { Vault } = require('../wrappers/Vault');

async function run(provider) {
    const vault = await Vault.create({
        admin: provider.sender().address,
        ston_pool: Address.parse(process.env.STON_POOL),
        dedust_pool: Address.parse(process.env.DEDUST_POOL),
        megaton_pool: Address.parse(process.env.MEGATON_POOL),
    });
    await provider.deploy(vault.init, toNano('0.5'));
    console.log('Vault:', vault.address.toString());
}
module.exports = { run };
