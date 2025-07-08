// wrappers/StonPool.js
const { Cell, beginCell, contractAddress, Address } = require('@ton/core');
const { compileTarget } = require('./compile');

class StonPool {
  constructor(address, init) {
    this.address = address;
    this.init = init; // { code: Cell, data: Cell }
  }

  /** Compile the FunC contract and return its code Cell */
  static async compile() {
    const boc = await compileTarget('contracts/dex-pools/ston-pool.fc');
    return Cell.fromBoc(boc)[0];
  }

  /**
   * Create a new StonPool instance (for deployment) with init data
   * @param {{ admin: Address, apy?: number, tokenAddress?: Address }} config
   */
  static async create(config) {
    const code = await this.compile();
    const data = beginCell()
      .storeUint(0, 64)                                // ton_reserve
      .storeUint(0, 64)                                // tgbtc_reserve
      .storeUint(0, 64)                                // lp_total
      .storeUint(config.apy ?? 650, 32)                // mock_apy
      .storeAddress(config.admin)                      // admin
      .endCell();

    const init = { code, data };
    const address = contractAddress({ workchain: 0, initialCode: code, initialData: data });
    return new StonPool(address, init);
  }

  /** Instantiate wrapper for an already deployed contract */
  static fromAddress(address) {
    return new StonPool(Address.parse(address), null);
  }

  /** Deploy contract on-chain */
  async deploy(provider, via, value) {
    await provider.internal(via, {
      value,
      sendMode: 1,
      body: beginCell().endCell(),
      init: this.init,
    });
  }

  /** Add liquidity: tonAmount and tokenAmount are BigInt */
  async addLiquidity(provider, via, tonAmount, tokenAmount) {
    const body = beginCell()
      .storeUint(10, 32)       // op = 10
      .storeUint(0, 64)        // query_id
      .storeUint(tonAmount, 64)
      .storeUint(tokenAmount, 64)
      .endCell();

    await provider.internal(via, {
      value: tonAmount + 100_000_000n, // attach some gas
      sendMode: 1,
      body,
    });
  }

  /** Remove liquidity: lpTokens is BigInt */
  async removeLiquidity(provider, via, lpTokens) {
    const body = beginCell()
      .storeUint(11, 32)       // op = 11
      .storeUint(0, 64)        // query_id
      .storeUint(lpTokens, 64)
      .endCell();

    await provider.internal(via, {
      value: 100_000_000n,
      sendMode: 1,
      body,
    });
  }

  /** Fetch pool info: returns { tonReserve, tgbtcReserve, lpTotal, apy } */
  async getPoolInfo(provider) {
    const result = await provider.get('get_pool_info', []);
    const tonReserve   = result.stack.readBigNumber();
    const tgbtcReserve = result.stack.readBigNumber();
    const lpTotal      = result.stack.readBigNumber();
    const apy          = result.stack.readNumber();
    return { tonReserve, tgbtcReserve, lpTotal, apy };
  }

  /** Fetch mock yield (APY) */
  async getYield(provider) {
    const result = await provider.get('get_yield', []);
    return result.stack.readNumber();
  }

  /** Query LP share of a user */
  async getLpShares(provider, userAddress) {
    const body = beginCell().storeAddress(Address.parse(userAddress)).endCell();
    const result = await provider.get('get_lp_shares', [{ type: 'slice', cell: body }]);
    return result.stack.readBigNumber();
  }
}

module.exports = { StonPool };
