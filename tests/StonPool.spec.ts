import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { StonPool } from '../wrappers/StonPool';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('StonPool', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('StonPool');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let stonPool: SandboxContract<StonPool>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        stonPool = blockchain.openContract(StonPool.createFromConfig({}, code));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await stonPool.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: stonPool.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and stonPool are ready to use
    });
});
