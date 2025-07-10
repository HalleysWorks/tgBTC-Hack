import { toNano, Address } from '@ton/core';
import { compile, NetworkProvider } from '@ton/blueprint';
import { Vault } from '../wrappers/Vault';

export async function run(provider: NetworkProvider) {
    const code = await compile('Vault');

    // Minimal initial config: zero balances/shares; pool placeholders
    const vault = Vault.createFromConfig(
        {
            totalTonBalance: 0n,
            totalTgbtcBalance: 0n,
            totalShares: 0n,
            admin: provider.sender().address!,
            stonPool: Address.parse('EQDQAps_kD0OMEvI2Vkb1-m2FtI3Qx50zdO2YEbYvlVZKAEy'),
            dedustPool: Address.parse('EQBZMw7MrjuE-RIVXA3WX4Su6eW12m5LCLsMCeynKANVadB3'),
            megatonPool: Address.parse('EQB52aT77-_AesFVKmM6Wb7iUkBN-rCBILfURFSQwVVsShc_'),
        },
        code,
    );

    // Deploy with 0.1 TON
    await provider.open(vault).sendDeploy(provider.sender(), toNano('0.1'));

    // Wait for confirmation
    await provider.waitForDeploy(vault.address);

    console.log('✅ Vault deployed at:', vault.address.toString());
}
