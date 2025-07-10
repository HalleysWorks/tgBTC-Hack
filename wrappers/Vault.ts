import { Address, beginCell, Cell, contractAddress, Contract, ContractProvider, Sender, SendMode } from '@ton/core';

export type VaultConfig = {
    totalTonBalance: bigint;
    totalTgbtcBalance: bigint;
    totalShares: bigint;
    admin: Address;
    stonPool: Address;
    dedustPool: Address;
    megatonPool: Address;
};

// Layer A: state values
function buildStateCell(config: VaultConfig): Cell {
    return beginCell()
        .storeUint(config.totalTonBalance, 64)
        .storeUint(config.totalTgbtcBalance, 64)
        .storeUint(config.totalShares, 64)
        .endCell();
}

// Layer B1: admin + stonPool
function buildAddrCell1(config: VaultConfig): Cell {
    return beginCell().storeAddress(config.admin).storeAddress(config.stonPool).endCell();
}

// Layer B2: dedustPool + megatonPool
function buildAddrCell2(config: VaultConfig): Cell {
    return beginCell().storeAddress(config.dedustPool).storeAddress(config.megatonPool).endCell();
}

// Layer C: top cell referencing everything
export function vaultConfigToCell(config: VaultConfig): Cell {
    const state = buildStateCell(config);
    const a1 = buildAddrCell1(config);
    const a2 = buildAddrCell2(config);

    return beginCell().storeRef(state).storeRef(a1).storeRef(a2).endCell();
}

export class Vault implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell },
    ) {}

    static createFromConfig(config: VaultConfig, code: Cell, workchain = 0) {
        const data = vaultConfigToCell(config);
        const init = { code, data };
        const address = contractAddress(workchain, init);
        return new Vault(address, init);
    }

    static createFromAddress(address: Address) {
        return new Vault(address);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async getStateBalances(provider: ContractProvider): Promise<[bigint, bigint]> {
        const res = await provider.get('get_state_balances', []);
        return [res.stack.readBigNumber(), res.stack.readBigNumber()];
    }

    async getTotalShares(provider: ContractProvider): Promise<bigint> {
        const res = await provider.get('get_total_shares', []);
        return res.stack.readBigNumber();
    }
}
