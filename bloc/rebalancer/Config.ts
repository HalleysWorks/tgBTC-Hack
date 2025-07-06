// rebalancer/config.ts
import { RebalancerConfig } from './Index';

export const CONFIG: RebalancerConfig = {
    network: 'testnet',
    apiKey: process.env.TONX_API_KEY!,
    vaultAddress: process.env.VAULT_ADDRESS!,
    pools: [
        { name: 'STON.fi', address: 'EQA...', dex: 'ston' },
        { name: 'Dedust', address: 'EQB...', dex: 'dedust' },
        { name: 'Megaton', address: 'EQC...', dex: 'megaton' },
    ],
    rebalanceThreshold: 0.03,
    queryInterval: 15000,
};
