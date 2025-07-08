// tgbtc.js
const { Cell, beginCell, contractAddress } = require('@ton/core');
const { compileTarget } = require('./compile');

class TgBtc {
  constructor(address, init) {
    this.address = address;
    this.init = init;
  }

  static async compile() {
    // Compile the jetton master contract and return its code Cell
    const boc = await compileTarget('contracts/jettons/tgbtc.fc');
    return Cell.fromBoc(boc)[0];
  }

  static async compileWallet() {
    // Compile the standard jetton-wallet contract and return its code Cell
    const boc = await compileTarget('contracts/jettons/jetton-wallet.fc');
    return Cell.fromBoc(boc)[0];
  }

  static async create(config) {
    // Compile master contract and wallet code
    const code = await this.compile();
    const walletCode = await this.compileWallet();

    // Build the initial data cell
    const data = beginCell()
      .storeUint(config.totalSupply || 0, 64) // total_supply (u64)
      .storeAddress(config.admin)            // admin address
      .storeRef(walletCode)                   // jetton wallet code
      .endCell();

    const init = { code, data };
    const address = contractAddress(0, init);

    return new TgBtc(address, init);
  }

  static createFromAddress(address) {
    // Instantiate a TgBtc object when you already know the on-chain address
    return new TgBtc(address, null);
  }

  async sendDeploy(provider, via, value) {
    await provider.internal(via, {
      value,
      sendMode: 1,
      body: beginCell().endCell(),
    });
  }

  async sendMint(provider, via, value, to, amount) {
    await provider.internal(via, {
      value,
      sendMode: 1,
      body: beginCell()
        .storeUint(1, 32)   // op: mint
        .storeUint(0, 64)   // query_id
        .storeAddress(to)   // recipient
        .storeUint(amount, 64)
        .endCell(),
    });
  }

  async sendBurn(provider, via, value, amount) {
    await provider.internal(via, {
      value,
      sendMode: 1,
      body: beginCell()
        .storeUint(2, 32)   // op: burn
        .storeUint(0, 64)   // query_id
        .storeUint(amount, 64)
        .endCell(),
    });
  }

  async sendChangeAdmin(provider, via, value, newAdmin) {
    await provider.internal(via, {
      value,
      sendMode: 1,
      body: beginCell()
        .storeUint(3, 32)   // op: change_admin
        .storeUint(0, 64)   // query_id
        .storeAddress(newAdmin)
        .endCell(),
    });
  }

  async sendUpdateMetadata(provider, via, value, metadataCell) {
    await provider.internal(via, {
      value,
      sendMode: 1,
      body: beginCell()
        .storeUint(4, 32)   // op: update_metadata
        .storeUint(0, 64)   // query_id
        .storeRef(metadataCell)
        .endCell(),
    });
  }

  async getJettonData(provider) {
    const result = await provider.get('get_jetton_data', []);
    return {
      totalSupply: result.stack.readBigNumber(),
      mintable:    result.stack.readBigNumber(),
      adminAddress: result.stack.readAddress(),
      jettonContent: result.stack.readCell(),
      jettonWalletCode: result.stack.readCell(),
    };
  }

  async getWalletAddress(provider, ownerAddress) {
    const result = await provider.get('get_wallet_address', [
      {
        type: 'slice',
        cell: beginCell().storeAddress(ownerAddress).endCell(),
      },
    ]);
    return result.stack.readAddress();
  }

  static createMetadata(config) {
    // Build metadata Cell for name, symbol, decimals, description, image
    return beginCell()
      .storeBuffer(Buffer.from(config.name || 'tgBTC'))
      .storeBuffer(Buffer.from(config.symbol || 'tBTC'))
      .storeUint(config.decimals || 9, 8)
      .storeBuffer(Buffer.from(config.description || 'Testnet Bitcoin'))
      .storeBuffer(Buffer.from(config.image || ''))
      .endCell();
  }

  static calculateWalletDeploymentCost() {
    // Estimated cost to deploy a wallet
    return 50_000_000n; // 0.05 TON
  }
}

module.exports = { TgBtc };
