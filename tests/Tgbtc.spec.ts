import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { Tgbtc } from '../wrappers/Tgbtc';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('Tgbtc', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Tgbtc');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let tgbtc: SandboxContract<Tgbtc>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        tgbtc = blockchain.openContract(Tgbtc.createFromConfig({}, code));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await tgbtc.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: tgbtc.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and tgbtc are ready to use
    });
});
