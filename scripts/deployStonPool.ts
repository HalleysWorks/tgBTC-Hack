// scripts/deployStonPool.ts

import { toNano } from '@ton/core';
import { compile, NetworkProvider } from '@ton/blueprint';
import { StonPool, StonPoolConfig } from '../wrappers/StonPool';

export async function run(provider: NetworkProvider) {
    // 1. Compile the FunC contract by its filename (must match your compile.targets)
    const code = await compile('ston_pool.fc');

    // 2. Build the initial on-chain config
    const config: StonPoolConfig = {
        admin: provider.sender().address!,
        vault: provider.sender().address!, // replace with actual vault address once deployed
    };

    // 3. Instantiate the contract object
    const poolContract = await StonPool.createFromConfig(config, code);

    // 4. Open the contract for interactions
    const pool = provider.open(poolContract);

    // 5. Deploy it with 0.05 TON gas allowance
    await pool.sendDeploy(
        provider.sender(), // who pays for the deployment
        toNano('0.05'), // amount of TON to attach
    );

    // 6. Wait until it shows up on-chain
    await provider.waitForDeploy(poolContract.address);

    // 7. Log the deployed address and explorer link
    console.log('✅ StonPool deployed at:', poolContract.address.toString());
    console.log('🧭 Explorer:', `https://testnet.tonscan.org/address/${poolContract.address.toString()}`);
}
