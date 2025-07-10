import { Config } from '@ton/blueprint';

export const config: Config = {
    network: {
        endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
        type: 'testnet',
        version: 'v4',
        // Optional: add API key for better rate limits
        // key: 'YOUR_API_KEY_HERE',
    },
};
