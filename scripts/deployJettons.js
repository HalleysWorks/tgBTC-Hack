const { toNano } = require('@ton/core');
const { TgBtc } = require('../wrappers/TgBtc');

async function run(provider) {
    const minter = await TgBtc.create({ admin: provider.sender().address });
    await provider.deploy(minter.init, toNano('0.2'));
    console.log('tgBTC minter', minter.address.toString());
}
module.exports = { run };
