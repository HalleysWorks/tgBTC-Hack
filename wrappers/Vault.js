// Vault.js
const { Cell, beginCell, contractAddress } = require('@ton/core');
const { compileTarget } = require('./compile');

class Vault {
  constructor(address, init) {
    this.address = address;
    this.init = init;
  }

  static async compile() {
    // Compile the FunC source and return the code Cell
    const boc = await compileTarget('contracts/vault/vault.fc');
    return Cell.fromBoc(boc)[0];
  }

  static async create(config) {
    // Build the initial data cell
    const data = beginCell()
      .storeUint(0, 64)                    // TON balance (u64)
      .storeUint(0, 64)                    // BTC balance (u64)
      .storeAddress(config.admin)          // Admin address
      .storeAddress(config.ston_pool)      // StonPool address
      .storeAddress(config.dedust_pool)    // DedustPool address
      .storeAddress(config.megaton_pool)   // MegatonPool address
      .storeDict(null)                     // Optional dictionary
      .storeRef(beginCell().endCell())     // Empty reference cell
      .endCell();

    // Compile code and assemble init
    const code = await this.compile();
    const init = { code, data };

    // Compute contract address correctly
    const address = contractAddress(0, init);

    return new Vault(address, init);
  }

  // (Other send/get wrappers omitted for brevity)
}

module.exports = { Vault };
