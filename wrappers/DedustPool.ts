import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type DeDustConfig = {
    tonReserve: bigint;
    tgBtcReserve: bigint;
    totalLp: bigint;
    apyBps: number;
    admin: Address;
};

export function dedustConfigToCell(config: DeDustConfig): Cell {
    return beginCell()
        .storeUint(config.tonReserve, 64) // TON reserve (nanoTON)
        .storeUint(config.tgBtcReserve, 64) // tgBTC reserve (nanoJetton)
        .storeUint(config.totalLp, 64) // Total LP tokens minted
        .storeUint(BigInt(config.apyBps), 32) // Mock APY in basis points
        .storeAddress(config.admin) // Admin address
        .endCell();
}

export class DeDust implements Contract {
    readonly address: Address;
    readonly init?: { code: Cell; data: Cell };

    private constructor(address: Address, init?: { code: Cell; data: Cell }) {
        this.address = address;
        this.init = init;
    }

    static createFromAddress(address: Address) {
        return new DeDust(address);
    }

    static createFromConfig(config: DeDustConfig, code: Cell, workchain = 0) {
        const data = dedustConfigToCell(config);
        const init = { code, data };
        const address = contractAddress(workchain, init);
        return new DeDust(address, init);
    }

    /** Deploy the contract with the given initial balance (e.g., toNano('0.05')) */
    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    /** Call add_liquidity: op = 10, tonAmt and tgBtcAmt in nano units */
    async sendAddLiquidity(provider: ContractProvider, via: Sender, tonAmt: bigint, tgBtcAmt: bigint) {
        const body = beginCell()
            .storeUint(10, 32) // op add_liquidity
            .storeAddress(via.address!)
            .storeUint(tonAmt, 64)
            .storeUint(tgBtcAmt, 64)
            .endCell();
        await provider.internal(via, {
            value: tonAmt + toNano('0.01'), // include small gas allowance
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body,
        });
    }

    /** Call remove_liquidity: op = 11, burnLp in LP tokens */
    async sendRemoveLiquidity(provider: ContractProvider, via: Sender, burnLp: bigint) {
        const body = beginCell()
            .storeUint(11, 32) // op remove_liquidity
            .storeAddress(via.address!)
            .storeUint(burnLp, 64)
            .endCell();
        await provider.internal(via, {
            value: toNano('0.01'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body,
        });
    }

    /** Query the pool info: returns [tonReserve, tgBtcReserve, totalLp, apyBps] */
    async getPoolInfo(provider: ContractProvider): Promise<{
        tonReserve: bigint;
        tgBtcReserve: bigint;
        totalLp: bigint;
        apyBps: number;
    }> {
        const res = await provider.get('get_pool_info', []);
        const tonReserve = res.stack.readBigNumber();
        const tgBtcReserve = res.stack.readBigNumber();
        const totalLp = res.stack.readBigNumber();
        const apyBps = Number(res.stack.readNumber());
        return { tonReserve, tgBtcReserve, totalLp, apyBps };
    }

    /** Query the mock APY in basis points */
    async getYield(provider: ContractProvider): Promise<number> {
        const res = await provider.get('get_yield', []);
        return Number(res.stack.readNumber());
    }
}

// Helper to convert TON string to bigint
function toNano(ton: string): bigint {
    return BigInt(Math.floor(Number(ton) * 1e9));
}
