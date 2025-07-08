import { toNano } from '@ton/core';
import { DedustPool } from '../wrappers/DedustPool';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const dedustPool = provider.open(DedustPool.createFromConfig({}, await compile('DedustPool')));

    await dedustPool.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(dedustPool.address);

    // run methods on `dedustPool`
}
