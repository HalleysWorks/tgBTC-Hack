// MegatonPool.js
const { Cell, beginCell, contractAddress } = require('@ton/core');
const { compileTarget } = require('./compile');

class MegatonPool {
  constructor(address, init) {
    this.address = address;
    this.init = init;
  }

  // Compile the Megaton pool FunC contract and return its code Cell
  static async compile() {
    const boc = await compileTarget('contracts/dex/megaton-pool.fc');
    return Cell.fromBoc(boc)[0];
  }

  // Create a new pool instance: reserves = 0, LP = 0, plus apy and admin
  static async create(config) {
    // config: { admin: Address, apy: number (bps) }
    const code = await this.compile();

    // Build initial data cell
    const data = beginCell()
      .storeUint(0, 64)              // TON reserve (nanoTON)
      .storeUint(0, 64)              // tgBTC reserve (nanoJetton)
      .storeUint(0, 64)              // Total LP tokens minted
      .storeUint(config.apy || 0, 32)// Mock APY in basis points
      .storeAddress(config.admin)    // Admin address
      .endCell();

    const init = { code, data };
    const address = contractAddress(0, init);

    return new MegatonPool(address, init);
  }

  // Instantiate from an existing on-chain address
  static createFromAddress(address) {
    return new MegatonPool(address, null);
  }

  // Send add_liquidity (op code 10)
  async sendAddLiquidity(provider, via, value, tonAmount, tgbtcAmount) {
    const body = beginCell()
      .storeUint(10, 32)            // op: add_liquidity
      .storeMsgAddress(via)         // sender
      .storeUint(tonAmount, 64)     // TON amount
      .storeUint(tgbtcAmount, 64)   // tgBTC amount
      .endCell();

    await provider.internal(via, {
      value,
      sendMode: 1,
      body,
    });
  }

  // Send remove_liquidity (op code 11)
  async sendRemoveLiquidity(provider, via, value, lpAmount) {
    const body = beginCell()
      .storeUint(11, 32)            // op: remove_liquidity
      .storeMsgAddress(via)
      .storeUint(lpAmount, 64)      // LP tokens to burn
      .endCell();

    await provider.internal(via, {
      value,
      sendMode: 1,
      body,
    });
  }

  // Query pool info: { tonReserve, tgbtcReserve, totalLP, apy }
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

module.exports = { MegatonPool };
