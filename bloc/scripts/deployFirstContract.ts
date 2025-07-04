import { toNano } from '@ton/core';
import { FirstContract } from '../wrappers/FirstContract';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const firstContract = provider.open(
        FirstContract.createFromConfig(
            {
                id: Math.floor(Math.random() * 10000),
                counter: 0,
            },
            await compile('FirstContract')
        )
    );

    await firstContract.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(firstContract.address);

    console.log('ID', await firstContract.getID());
}
