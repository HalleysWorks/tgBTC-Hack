import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type TgBtcVaultConfig = {
    admin_address: Address;
    tgbtc_jetton_master: Address;
    total_tgbtc: bigint;
    total_ton: bigint;
    lp_shares: Cell;
    paused: boolean;
};

export function tgBtcVaultConfigToCell(config: TgBtcVaultConfig): Cell {
    return beginCell()
        .storeCoins(config.total_tgbtc)
        .storeCoins(config.total_ton)
        .storeRef(config.lp_shares)
        .storeAddress(config.admin_address)
        .storeAddress(config.tgbtc_jetton_master)
        .storeBit(config.paused)
        .storeBit(false)
        .endCell();
}

export class TgBtcVault implements Contract {
    readonly address: Address;
    readonly init?: { code: Cell; data: Cell };

    constructor(address: Address, init?: { code: Cell; data: Cell }) {
        this.address = address;
        this.init = init;
    }

    static createFromAddress(address: Address) {
        return new TgBtcVault(address);
    }

    static createFromConfig(config: TgBtcVaultConfig, code: Cell, workchain = 0) {
        const data = tgBtcVaultConfigToCell(config);
        const init = { code, data };
        const address = contractAddress(workchain, init);
        return new TgBtcVault(address, init);
    }

    async sendDeposit(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            tgbtc_amount: bigint;
            ton_amount: bigint;
            query_id?: number;
        },
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x1, 32) // op::deposit
                .storeUint(opts.query_id ?? 0, 64)
                .storeCoins(opts.tgbtc_amount)
                .storeCoins(opts.ton_amount)
                .endCell(),
        });
    }

    async sendWithdraw(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            shares: bigint;
            query_id?: number;
        },
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x2, 32) // op::withdraw
                .storeUint(opts.query_id ?? 0, 64)
                .storeCoins(opts.shares)
                .endCell(),
        });
    }

    async sendRebalance(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            pool_address: Address;
            delta_tgbtc: bigint;
            delta_ton: bigint;
            query_id?: number;
        },
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x3, 32) // op::rebalance
                .storeUint(opts.query_id ?? 0, 64)
                .storeAddress(opts.pool_address)
                .storeInt(opts.delta_tgbtc, 257)
                .storeInt(opts.delta_ton, 257)
                .endCell(),
        });
    }

    async sendPause(provider: ContractProvider, via: Sender, opts: { value: bigint; query_id?: number }) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x4, 32) // op::pause
                .storeUint(opts.query_id ?? 0, 64)
                .endCell(),
        });
    }

    async sendUnpause(provider: ContractProvider, via: Sender, opts: { value: bigint; query_id?: number }) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x5, 32) // op::unpause
                .storeUint(opts.query_id ?? 0, 64)
                .endCell(),
        });
    }

    async getVaultState(provider: ContractProvider) {
        const result = await provider.get('get_vault_state', []);
        return {
            total_tgbtc: result.stack.readBigNumber(),
            total_ton: result.stack.readBigNumber(),
            total_shares: result.stack.readBigNumber(),
            paused: result.stack.readBoolean(),
        };
    }

    async getUserShares(provider: ContractProvider, userAddress: Address) {
        const result = await provider.get('get_user_shares', [
            { type: 'slice', cell: beginCell().storeAddress(userAddress).endCell() },
        ]);
        return result.stack.readBigNumber();
    }

    async getAdmin(provider: ContractProvider) {
        const result = await provider.get('get_admin', []);
        return result.stack.readAddress();
    }

    async getJettonMaster(provider: ContractProvider) {
        const result = await provider.get('get_jetton_master', []);
        return result.stack.readAddress();
    }
}
