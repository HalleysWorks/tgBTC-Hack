import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { DedustPool } from '../wrappers/DedustPool';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('DedustPool', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('DedustPool');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let dedustPool: SandboxContract<DedustPool>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        dedustPool = blockchain.openContract(DedustPool.createFromConfig({}, code));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await dedustPool.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: dedustPool.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and dedustPool are ready to use
    });
});
