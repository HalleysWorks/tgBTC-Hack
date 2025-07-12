// scripts/deployDedustPool.ts
import { toNano, Address } from '@ton/core';
import { compile, NetworkProvider } from '@ton/blueprint';
import { DeDust, DeDustConfig } from '../wrappers/DedustPool';

export async function run(provider: NetworkProvider) {
    // 1. Compile the DeDust contract
    //    Use the same name you registered in blueprint.config.ts
    const code = await compile('dedust_pool.fc');

    // 2. Build initial config
    const config: DeDustConfig = {
        tonReserve: 0n,
        tgBtcReserve: 0n,
        totalLp: 0n,
        apyBps: 450,
        admin: provider.sender().address!, // your wallet address
    };

    // 3. Create the DeDust instance
    const dedust = provider.open(DeDust.createFromConfig(config, code));

    // 4. Deploy with gas allowance (0.05 TON)
    await dedust.sendDeploy(provider.sender(), toNano('0.05'));

    // 5. Wait for deployment
    await provider.waitForDeploy(dedust.address);

    console.log('DeDust deployed at:', dedust.address.toString());
}
