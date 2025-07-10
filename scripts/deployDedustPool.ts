import { toNano, Address } from '@ton/core';
import { compile, NetworkProvider } from '@ton/blueprint';
import { DeDust } from '../wrappers/DedustPool';

export async function run(provider: NetworkProvider) {
    // 1. Compile the DeDust contract
    const code = await compile('DeDust');

    // 2. Initialize deployment config with zero reserves and a mock APY
    const dedust = provider.open(
        DeDust.createFromConfig(
            { tonReserve: 0n, tgBtcReserve: 0n, totalLp: 0n, apyBps: 450, admin: provider.sender().address! },
            code,
        ),
    );

    // 3. Send deploy (use 0.05 TON for gas)
    await dedust.sendDeploy(provider.sender(), toNano('0.05'));
    await provider.waitForDeploy(dedust.address);

    console.log('DeDust deployed at:', dedust.address.toString());
}
