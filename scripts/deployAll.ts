import { toNano, Cell, beginCell } from '@ton/core';
import { compile, NetworkProvider } from '@ton/blueprint';
import { Tgbtc } from '../wrappers/Tgbtc';
import { JettonWallet } from '../wrappers/JettonWallet';

export async function run(provider: NetworkProvider) {
    // 1. Compile both contracts
    const tgbtcCode = await compile('Tgbtc');
    const walletCodeFc = await compile('JettonWallet');

    // 2. Deploy TGBTC
    const tgbtc = Tgbtc.createFromConfig({ admin: provider.sender().address!, walletCode: walletCodeFc }, tgbtcCode);
    await provider.open(tgbtc).sendDeploy(provider.sender(), toNano('0.1'));
    await provider.waitForDeploy(tgbtc.address);
    console.log('✅ TGBTC root at:', tgbtc.address.toString());

    // 3. Deploy Jetton Wallet using that master
    const wallet = JettonWallet.createFromConfig(
        {
            balance: 0n,
            owner: provider.sender().address!,
            master: tgbtc.address,
        },
        walletCodeFc,
    );
    await provider.open(wallet).sendDeploy(provider.sender(), toNano('0.05'));
    await provider.waitForDeploy(wallet.address);
    console.log('✅ JettonWallet at:', wallet.address.toString());
}
