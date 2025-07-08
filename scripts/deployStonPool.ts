import { toNano } from '@ton/core';
import { StonPool } from '../wrappers/StonPool';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const stonPool = provider.open(StonPool.createFromConfig({}, await compile('StonPool')));

    await stonPool.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(stonPool.address);

    // run methods on `stonPool`
}
