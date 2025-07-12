// scripts/deployTgbtc.ts

import { toNano, Cell } from '@ton/core';
import { compile, NetworkProvider } from '@ton/blueprint';
import { Tgbtc, TgbtcConfig } from '../wrappers/Tgbtc';

export async function run(provider: NetworkProvider) {
    // 1. Compile the tgBTC root contract and the JettonWallet code
    const tgbtcCode = await compile('tgbtc.fc');
    const walletCode = await compile('jetton_wallet.fc');

    // 2. Build the initial on-chain config for the tgBTC root
    const config: TgbtcConfig = {
        admin: provider.sender().address!,
        walletCode: walletCode,
    };

    // 3. Instantiate the tgBTC root contract
    const tgbtc = provider.open(Tgbtc.createFromConfig(config, tgbtcCode));

    // 4. Deploy the tgBTC root with 0.1 TON
    await tgbtc.sendDeploy(provider.sender(), toNano('0.1'));
    await provider.waitForDeploy(tgbtc.address);
    console.log('✅ tgbtc root deployed at:', tgbtc.address.toString());

    // 5. (Optional) Deploy a demo JettonWallet instance
    // const { JettonWallet, JettonWalletConfig } = await import('../wrappers/JettonWallet');
    // const walletConfig: JettonWalletConfig = {
    //   balance: 0n,
    //   owner: provider.sender().address!,
    //   master: tgbtc.address,
    // };
    // const wallet = provider.open(JettonWallet.createFromConfig(walletConfig, walletCode));
    // await wallet.sendDeploy(provider.sender(), toNano('0.05'));
    // await provider.waitForDeploy(wallet.address);
    // console.log('✅ Demo JettonWallet deployed at:', wallet.address.toString());
}
