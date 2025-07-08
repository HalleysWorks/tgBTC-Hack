import { toNano } from '@ton/core';
import { MegatonPool } from '../wrappers/MegatonPool';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const megatonPool = provider.open(MegatonPool.createFromConfig({}, await compile('MegatonPool')));

    await megatonPool.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(megatonPool.address);

    // run methods on `megatonPool`
}
