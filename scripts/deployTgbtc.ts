import { toNano } from '@ton/core';
import { Tgbtc } from '../wrappers/Tgbtc';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const tgbtc = provider.open(Tgbtc.createFromConfig({}, await compile('Tgbtc')));

    await tgbtc.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(tgbtc.address);

    // run methods on `tgbtc`
}
