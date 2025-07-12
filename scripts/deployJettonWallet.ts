// scripts/deployJettonWallet.ts

import { toNano } from '@ton/core';
import { compile, NetworkProvider } from '@ton/blueprint';
import { JettonWallet, JettonWalletConfig } from '../wrappers/JettonWallet';
import { Address } from '@ton/core';

export async function run(provider: NetworkProvider) {
    // 1. Compile the JettonWallet contract
    const walletCode = await compile('jetton_wallet.fc');

    // 2. Build the on-chain config for a new JettonWallet
    const config: JettonWalletConfig = {
        balance: 0n,
        owner: provider.sender().address!,
        master: Address.parse('EQDLpbQ2sNlYHfBb88iAVqJYgywQpNvlsVkVpxVqor8Yws9T'),
    };

    // 3. Instantiate and open the JettonWallet contract
    const wallet = provider.open(JettonWallet.createFromConfig(config, walletCode));

    // 4. Deploy with 0.05 TON
    await wallet.sendDeploy(provider.sender(), toNano('0.05'));
    await provider.waitForDeploy(wallet.address);

    console.log('✅ JettonWallet deployed at:', wallet.address.toString());
    console.log('🧭 Explorer:', `https://testnet.tonscan.org/address/${wallet.address.toString()}`);
}
