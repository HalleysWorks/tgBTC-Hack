// scripts/deployVault.ts

import { toNano, Address } from '@ton/core';
import { compile, NetworkProvider } from '@ton/blueprint';
import { Vault, VaultConfig } from '../wrappers/Vault';

export async function run(provider: NetworkProvider) {
    // 1. Compile the FunC contract by its filename (must match compile.targets)
    const code = await compile('vault.fc');

    // 2. Build the initial on-chain configuration for Vault
    // This config must match the storage layout exactly:
    // 0 uint64 : total TON balance (nanoTON)
    // 1 uint64 : total tgBTC balance (nanoJetton)
    // 2 addr   : admin
    // 3 addr   : STON.fi pool
    // 4 addr   : DeDust pool
    // 5 addr   : Megaton pool
    // 6 uint64 : totalShares
    // 7 cell   : params (unused)

    const config: VaultConfig = {
        totalTonBalance: 0n, // Start with 0 TON balance
        totalTgbtcBalance: 0n, // Start with 0 tgBTC balance
        admin: provider.sender().address!,
        stonPool: Address.parse('EQDbezboymmTdBEt0_pO49bZV0kK26ZaBOOiOyekQAXZaeB7'),
        dedustPool: Address.parse('EQCCL2mH3OrsHUJk_s01g4S1zSpnISKOjnkZ02FkQqoY6aWx'),
        megatonPool: Address.parse('EQB52aT77-_AesFVKmM6Wb7iUkBN-rCBILfURFSQwVVsShc_'),
        totalShares: 0n, // Start with 0 shares
    };

    // 3. Instantiate the Vault contract object
    const vaultContract = Vault.createFromConfig(config, code);

    // 4. Open it for interactions
    const vault = provider.open(vaultContract);

    // 5. Deploy with 0.1 TON gas allowance
    await vault.sendDeploy(provider.sender(), toNano('0.1'));

    // 6. Wait for on-chain deployment
    await provider.waitForDeploy(vaultContract.address);

    console.log('✅ Vault deployed at:', vaultContract.address.toString());
    console.log('🧭 Explorer:', `https://testnet.tonscan.org/address/${vaultContract.address.toString()}`);

    // 7. Optional: Test the deployment by calling getters
    try {
        const totalShares = await vault.getTotalShares();
        const [tonBalance, tgbtcBalance] = await vault.getStateBalances();

        console.log('📊 Initial State:');
        console.log('  Total Shares:', totalShares.toString());
        console.log('  TON Balance:', tonBalance.toString());
        console.log('  tgBTC Balance:', tgbtcBalance.toString());
    } catch (error) {
        console.error('❌ Failed to read initial state:', error);
    }
}
