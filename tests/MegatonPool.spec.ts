import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { MegatonPool } from '../wrappers/MegatonPool';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('MegatonPool', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('MegatonPool');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let megatonPool: SandboxContract<MegatonPool>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        megatonPool = blockchain.openContract(MegatonPool.createFromConfig({}, code));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await megatonPool.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: megatonPool.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and megatonPool are ready to use
    });
});
