const { Blockchain, TreasuryContract } = require('@ton/sandbox');
const { toNano } = require('@ton/core');
const { Vault } = require('../../wrappers/Vault');

describe('Vault', () => {
    let chain, deployer, vault;
    beforeEach(async () => {
        chain = await Blockchain.create();
        deployer = await chain.treasury('deployer');
        vault = await Vault.create({
            admin: deployer.address,
            ston_pool: deployer.address,
            dedust_pool: deployer.address,
            megaton_pool: deployer.address,
        });
        await chain.deploy(vault.init, toNano('0.3'), deployer.getSender());
    });

    it('deposits', async () => {
        const res = await vault.sendDeposit(chain, deployer.getSender(), toNano('0.2'), toNano('10'));
        expect(res.transactions).toHaveTransaction({ to: vault.address, success: true });
    });
});
