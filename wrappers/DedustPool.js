// DedustPool.js
const { Cell, beginCell, contractAddress } = require('@ton/core');
const { compileTarget } = require('./compile');

class DedustPool {
  constructor(address, init) {
    this.address = address;
    this.init = init;
  }

  // Compile the pool contract
  static async compile() {
    const boc = await compileTarget('contracts/dex/dedust-pool.fc');
    return Cell.fromBoc(boc)[0];
  }

  // Create initial data cell and compute address
  static async create(config) {
    // config fields: admin, apy (uint32 bps)
    const code = await this.compile();

    // Build initial data: reserves start at 0, LP = 0
    const data = beginCell()
      .storeUint(0, 64)              // TON reserve (nanoTON)
      .storeUint(0, 64)              // tgBTC reserve (nanoJetton)
      .storeUint(0, 64)              // Total LP minted
      .storeUint(config.apy || 0, 32) // Mock APY (bps)
      .storeAddress(config.admin)    // Admin address
      .endCell();

    const init = { code, data };
    const address = contractAddress(0, init);
    return new DedustPool(address, init);
  }

  // Instantiate from existing on-chain address
  static createFromAddress(address) {
    return new DedustPool(address, null);
  }

  // Send add_liquidity message
  async sendAddLiquidity(provider, via, value, tonAmount, tgbtcAmount) {
    const body = beginCell()
      .storeUint(10, 32)            // op code = 10
      .storeMsgAddress(via)         // sender
      .storeUint(tonAmount, 64)
      .storeUint(tgbtcAmount, 64)
      .endCell();

    await provider.internal(via, {
      value,
      sendMode: 1,
      body,
    });
  }

  // Send remove_liquidity message
  async sendRemoveLiquidity(provider, via, value, lpAmount) {
    const body = beginCell()
      .storeUint(11, 32)            // op code = 11
      .storeMsgAddress(via)         // sender
      .storeUint(lpAmount, 64)
      .endCell();

    await provider.internal(via, {
      value,
      sendMode: 1,
      body,
    });
  }

  // Query pool info: returns { tonReserve, tgbtcReserve, totalLP, apy }
  async getPoolInfo(provider) {
    const result = await provider.get('get_pool_info', []);
    return {
      tonReserve:   result.stack.readBigNumber(),
      tgbtcReserve: result.stack.readBigNumber(),
      totalLP:      result.stack.readBigNumber(),
      apy:          result.stack.readNumber(),
    };
  }

  // Query APY (basis points)
  async getApy(provider) {
    const result = await provider.get('get_yield', []);
    return result.stack.readNumber();
  }
}

module.exports = { DedustPool };
