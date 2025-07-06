// config/deploy.config.js
const { getHttpEndpoint } = require('@orbs-network/ton-access');

module.exports = {
    networks: {
        testnet: {
            endpoint: async () => await getHttpEndpoint({ network: 'testnet' }),
            apiKey: '',
        },
        mainnet: {
            endpoint: async () => await getHttpEndpoint({ network: 'mainnet' }),
            apiKey: '',
        },
    },

    contracts: {
        TgBtcVault: {
            buildFile: './build/TgBtcVault.compiled.json',
            compiledFile: './build/TgBtcVault.compiled.json',
            contractType: 'vault',
            initData: {
                adminAddress: process.env.ADMIN_ADDRESS,
                tgbtcMasterAddress: process.env.TGBTC_MASTER_ADDRESS,
            },
            deployAmount: '0.1',
            initOp: 0,
        },
        DedustAdapter: {
            buildFile: './build/DedustAdapter.compiled.json',
            compiledFile: './build/DedustAdapter.compiled.json',
            contractType: 'adapter',
            initData: { poolAddress: process.env.DEDUST_POOL_ADDRESS },
            deployAmount: '0.05',
            initOp: 1,
        },
        MegatonAdapter: {
            buildFile: './build/MegatonAdapter.compiled.json',
            compiledFile: './build/MegatonAdapter.compiled.json',
            contractType: 'adapter',
            initData: { poolAddress: process.env.MEGATON_POOL_ADDRESS },
            deployAmount: '0.05',
            initOp: 1,
        },
        StonAdapter: {
            buildFile: './build/StonAdapter.compiled.json',
            compiledFile: './build/StonAdapter.compiled.json',
            contractType: 'adapter',
            initData: { poolAddress: process.env.STON_POOL_ADDRESS },
            deployAmount: '0.05',
            initOp: 1,
        },
    },

    deploymentOrder: ['TgBtcVault', 'DedustAdapter', 'MegatonAdapter', 'StonAdapter'],
};
