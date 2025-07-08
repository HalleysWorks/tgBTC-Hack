const { LiquidityPoolAPI } = require('../frontend-integration/api-helpers');
const { DEPLOYED_CONTRACTS, TESTNET_CONFIG } = require('../frontend-integration/contract-addresses');
const { toNano } = require('@ton/core');

(async () => {
    const api = new LiquidityPoolAPI(TESTNET_CONFIG.ENDPOINT, DEPLOYED_CONTRACTS.VAULT);
    console.log(await api.depositLiquidity(toNano('50')));
    console.log(await api.triggerRebalance());
    console.log(await api.getPoolData());
})();
