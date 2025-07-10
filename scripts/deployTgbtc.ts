import { toNano, Cell } from '@ton/core';
import { compile, NetworkProvider } from '@ton/blueprint';
import { Tgbtc } from '../wrappers/Tgbtc';

export async function run(provider: NetworkProvider) {
    // 1. Compile the tgBTC root contract
    const tgbtcCode = await compile('Tgbtc');
    // 2. Compile the JettonWallet contract for walletCode
    const walletCode = await compile('JettonWallet');

    // 3. Instantiate root with admin and walletCode
    const tgbtc = Tgbtc.createFromConfig(
        {
            admin: provider.sender().address!,
            walletCode: walletCode,
        },
        tgbtcCode,
    );

    // 4. Deploy root
    await provider.open(tgbtc).sendDeploy(provider.sender(), toNano('0.1'));
    await provider.waitForDeploy(tgbtc.address);
    console.log('✅ tgBTC root deployed at:', tgbtc.address.toString());

    // 5. (Optional) Deploy an example wallet right after, using the newly-deployed root
    // const { JettonWallet } = await import('../wrappers/JettonWallet');
    // const wallet = JettonWallet.createFromConfig(
    //   { balance: 0n, owner: provider.sender().address!, master: tgbtc.address },
    //   walletCode
    // );
    // await provider.open(wallet).sendDeploy(provider.sender(), toNano('0.05'));
    // await provider.waitForDeploy(wallet.address);
    // console.log('✅ Example JettonWallet at:', wallet.address.toString());
}
