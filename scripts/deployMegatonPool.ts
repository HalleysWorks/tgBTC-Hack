import { toNano } from '@ton/core';
import { compile, NetworkProvider } from '@ton/blueprint';
import { MegatonPool } from '../wrappers/MegatonPool';

export async function run(provider: NetworkProvider) {
    const code = await compile('MegatonPool');
    const pool = await MegatonPool.createFromConfig(
        {
            admin: provider.sender().address!,
            vault: provider.sender().address!, // replace with real vault address if already deployed
        },
        code,
    );

    await provider.open(pool).sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(pool.address);

    console.log('✅ MegatonPool deployed at:', pool.address.toString());
    console.log('Testnet Explorer:', 'https://testnet.tonscan.org/address/' + pool.address.toString());
}
