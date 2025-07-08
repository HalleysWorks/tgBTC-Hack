const { toNano } = require('@ton/core');
const { StonPool } = require('../wrappers/StonPool');
const { DedustPool } = require('../wrappers/DedustPool');
const { MegatonPool } = require('../wrappers/MegatonPool');

async function run(provider) {
    const ston = await StonPool.create({ admin: provider.sender().address, apy: 650 });
    await provider.deploy(ston.init, toNano('0.3'));
    console.log('STON Pool', ston.address.toString());

    const dedust = await DedustPool.create({ admin: provider.sender().address, apy: 450 });
    await provider.deploy(dedust.init, toNano('0.3'));
    console.log('DeDust Pool', dedust.address.toString());

    const mega = await MegatonPool.create({ admin: provider.sender().address, apy: 500 });
    await provider.deploy(mega.init, toNano('0.3'));
    console.log('Megaton Pool', mega.address.toString());
}
module.exports = { run };
