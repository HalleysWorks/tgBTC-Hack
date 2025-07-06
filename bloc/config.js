// config.js

const { getHttpEndpoint } = require('@orbs-network/ton-access');

module.exports = {
    // Network: "testnet" or "mainnet"
    network: process.env.NETWORK || 'testnet',

    // For deploy scripts: explicit networks map
    networks: {
        testnet: {
            // deployer.js will await this
            endpoint: async () => await getHttpEndpoint({ network: 'testnet' }),
            apiKey: '', // not used with TON Access
        },
        mainnet: {
            endpoint: async () => await getHttpEndpoint({ network: 'mainnet' }),
            apiKey: '',
        },
    },

    // For bot and interactions: convenience getter
    getEndpoint: async () => {
        const net = process.env.NETWORK === 'mainnet' ? 'mainnet' : 'testnet';
        return await getHttpEndpoint({ network: net });
    },

    // Deployed vault address (for bot and interactions)
    vaultAddress: process.env.VAULT_ADDRESS || 'EQB...',

    // Pool configurations
    pools: [
        {
            name: 'STON.fi',
            address: process.env.STON_POOL_ADDRESS || 'EQA...',
            dex: 'ston',
        },
        {
            name: 'Dedust',
            address: process.env.DEDUST_POOL_ADDRESS || 'EQB...',
            dex: 'dedust',
        },
        {
            name: 'Megaton',
            address: process.env.MEGATON_POOL_ADDRESS || 'EQC...',
            dex: 'megaton',
        },
    ],

    // Rebalancer settings
    rebalanceThreshold: parseFloat(process.env.REBALANCE_THRESHOLD) || 0.03,
    queryInterval: parseInt(process.env.QUERY_INTERVAL, 10) || 15000,
};
