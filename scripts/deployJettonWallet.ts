// scripts/deployJettonWallet.ts
import { toNano, Address } from '@ton/core';
import { compile, NetworkProvider } from '@ton/blueprint';
import { JettonWallet } from '../wrappers/JettonWallet';

export async function run(provider: NetworkProvider, args: { master: string }) {
    const code = await compile('JettonWallet');
    const masterAddr = Address.parse(args.master);

    const wallet = JettonWallet.createFromConfig(
        { balance: 0n, owner: provider.sender().address!, master: masterAddr },
        code,
    );
    await provider.open(wallet).sendDeploy(provider.sender(), toNano('0.05'));
    await provider.waitForDeploy(wallet.address);
    console.log('✅ JettonWallet at:', wallet.address.toString());
}
