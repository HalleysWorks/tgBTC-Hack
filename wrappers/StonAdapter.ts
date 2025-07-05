import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export class StonAdapter implements Contract {
    readonly address: Address;
    readonly init?: { code: Cell; data: Cell };

    constructor(address: Address, init?: { code: Cell; data: Cell }) {
        this.address = address;
        this.init = init;
    }

    static createFromAddress(address: Address) {
        return new StonAdapter(address);
    }

    static createFromConfig(code: Cell, data: Cell, workchain = 0) {
        const address = contractAddress(workchain, { code, data });
        return new StonAdapter(address, { code, data });
    }

    /**
     * Query STON.fi pool reserves.
     * @param provider ContractProvider instance
     * @param via Sender (your wallet/signer)
     * @param poolAddress Address of the pool (Cell parsed as slice)
     * @param queryId unique identifier for callback
     */
    async queryPoolReserves(
        provider: ContractProvider,
        via: Sender,
        opts: {
            poolAddress: Address;
            queryId: bigint;
        },
    ) {
        const body = beginCell()
            .storeUint(0x18, 6) // internal header
            .storeAddress(opts.poolAddress)
            .storeCoins(BigInt(100_000_000)) // 0.1 TON for gas
            .storeUint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1) // body header
            .storeUint(0x43c034e6, 32) // STON_GET_POOL_DATA
            .storeUint(opts.queryId, 64)
            .endCell();

        await provider.internal(via, {
            value: BigInt(0), // no extra TON
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body,
        });
    }

    /**
     * Add liquidity to STON.fi pool.
     * @param provider ContractProvider instance
     * @param via Sender
     * @param opts Liquidity options
     */
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
        const body = beginCell()
            .storeUint(0x18, 6) // internal header
            .storeAddress(opts.poolAddress)
            .storeCoins(BigInt(200_000_000)) // 0.2 TON for gas
            .storeUint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
            .storeUint(0xfcf9e58f, 32) // provide_lp op
            .storeUint(opts.queryId, 64)
            .storeAddress(via.address) // owner_addr
            .storeCoins(BigInt(1)) // min_lp_out
            .storeCoins(opts.amount0)
            .storeCoins(opts.amount1)
            .endCell();

        await provider.internal(via, {
            value: BigInt(0),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body,
        });
    }

    /**
     * Handle a callback from STON pool query.
     * (This is a “get” call; actual processing should be done off-chain.)
     */
    async handlePoolResponse(provider: ContractProvider): Promise<{
        op: number;
        queryId: bigint;
        reserve0: bigint;
        reserve1: bigint;
        token0: Address;
        token1: Address;
    }> {
        const result = await provider.get('handle_ston_pool_response', []);
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
