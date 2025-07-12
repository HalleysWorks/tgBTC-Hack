// blueprint.config.ts
import { CompilerConfig } from '@ton/blueprint';

const funcCompile: CompilerConfig = {
    lang: 'func',
    targets: [
        'contracts/dedust_pool.fc',
        'contracts/ston_pool.fc',
        'contracts/megaton_pool.fc',
        'contracts/tgbtc.fc',
        'contracts/jetton_wallet.fc',
        'contracts/vault.fc',
    ],
};

export default {
    network: {
        type: 'custom',
        endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
        version: 'v2',
        key: '<YOUR_TONCENTER_API_KEY>',
    },

    // NOTE: CLI picks up this section automatically
    compile: {
        contracts: {
            func: funcCompile,
        },
    },
};
