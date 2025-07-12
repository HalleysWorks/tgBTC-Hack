// scripts/deployMegatonPool.ts

import { toNano } from '@ton/core';
import { compile, NetworkProvider } from '@ton/blueprint';
import { MegatonPool, MegatonPoolConfig } from '../wrappers/MegatonPool';

export async function run(provider: NetworkProvider) {
    // 1. Compile the FunC contract by its filename (must match your compile.targets)
    const code = await compile('megaton_pool.fc');

    // 2. Build the initial on-chain config
    const config: MegatonPoolConfig = {
        admin: provider.sender().address!,
        vault: provider.sender().address!, // replace with actual vault address once deployed
    };

    // 3. Instantiate the contract object
    const poolContract = await MegatonPool.createFromConfig(config, code);

    // 4. Deploy it with 0.05 TON gas allowance
    //    Use provider.open(...) to wrap the instance for calls
    const pool = provider.open(poolContract);
    await pool.sendDeploy(
        provider.sender(), // who pays for the deployment
        toNano('0.05'), // amount of TON to attach
    );

    // 5. Wait until it shows up on-chain
    await provider.waitForDeploy(poolContract.address);

    console.log('✅ MegatonPool deployed at:', poolContract.address.toString());
    console.log('🧭 Explorer:', `https://testnet.tonscan.org/address/${poolContract.address.toString()}`);
}
