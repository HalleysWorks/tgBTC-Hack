const { TonClient, Address } = require('@ton/ton');
const { Vault } = require('../../wrappers/Vault');

class LiquidityPoolAPI {
    constructor(endpoint, vaultAddr) {
        this.client = new TonClient({ endpoint });
        this.vault = this.client.open(Vault.createFromAddress(Address.parse(vaultAddr)));
    }
    async depositLiquidity(amount) {
        return this.vault.sendDeposit(this.client.sender(), amount, 0n);
    }
    async withdrawLiquidity(shares) {
        return this.vault.sendWithdraw(this.client.sender(), shares, shares);
    }
    async triggerRebalance() {
        return this.vault.sendRebalance(this.client.sender(), 100_000_000n);
    }
    async getPoolData() {
        return this.vault.getBalance();
    }
    async getLpShares(addr) {
        return this.vault.getLpShares(Address.parse(addr));
    }
}
module.exports = { LiquidityPoolAPI };
