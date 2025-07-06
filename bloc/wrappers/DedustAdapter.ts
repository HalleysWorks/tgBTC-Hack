// wrappers/DedustAdapter.ts
import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export class DedustAdapter implements Contract {
    readonly address: Address;
    readonly init?: { code: Cell; data: Cell };

    constructor(address: Address, init?: { code: Cell; data: Cell }) {
        this.address = address;
        this.init = init;
    }

    static createFromAddress(address: Address) {
        return new DedustAdapter(address);
    }

    static createFromConfig(code: Cell, data: Cell, workchain = 0) {
        const address = contractAddress(workchain, { code, data });
        return new DedustAdapter(address, { code, data });
    }

    async queryPoolReserves(
        provider: ContractProvider,
        via: Sender,
        opts: {
            poolAddress: Address;
            queryId: bigint;
        },
    ) {
        const DEDUST_GET_POOL_DATA = 0xdeadbeef; // ← replace with actual opcode
        const body = beginCell()
            .storeUint(0x18, 6) // internal header
            .storeAddress(opts.poolAddress)
            .storeCoins(100_000_000n) // 0.1 TON gas
            .storeUint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
            .storeUint(DEDUST_GET_POOL_DATA, 32)
            .storeUint(opts.queryId, 64)
            .endCell();

        await provider.internal(via, {
            value: 0n,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body,
        });
    }

    async addLiquidity(
        provider: ContractProvider,
        via: Sender,
        opts: {
            poolAddress: Address;
            amount0: bigint;
            amount1: bigint;
            queryId: bigint;
        },
    ) {
        const DEDUST_PROVIDE_LP_OP = 0xfeedbeef; // ← replace with actual opcode
        const body = beginCell()
            .storeUint(0x18, 6)
            .storeAddress(opts.poolAddress)
            .storeCoins(200_000_000n) // 0.2 TON gas
            .storeUint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
            .storeUint(DEDUST_PROVIDE_LP_OP, 32)
            .storeUint(opts.queryId, 64)
            .storeAddress(via.address) // owner
            .storeCoins(1n) // min LP out
            .storeCoins(opts.amount0)
            .storeCoins(opts.amount1)
            .endCell();

        await provider.internal(via, {
            value: 0n,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body,
        });
    }

    async handlePoolResponse(provider: ContractProvider): Promise<{
        op: number;
        queryId: bigint;
        reserve0: bigint;
        reserve1: bigint;
        token0: Address;
        token1: Address;
    }> {
        const result = await provider.get('handle_dedust_pool_response', []);
        const stack = result.stack;
        return {
            op: stack.readNumber(),
            queryId: stack.readBigNumber(),
            reserve0: stack.readBigNumber(),
            reserve1: stack.readBigNumber(),
            token0: stack.readAddress(),
            token1: stack.readAddress(),
        };
    }
}
