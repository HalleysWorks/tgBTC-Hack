import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type DedustPoolConfig = {};

export function dedustPoolConfigToCell(config: DedustPoolConfig): Cell {
    return beginCell().endCell();
}

export class DedustPool implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new DedustPool(address);
    }

    static createFromConfig(config: DedustPoolConfig, code: Cell, workchain = 0) {
        const data = dedustPoolConfigToCell(config);
        const init = { code, data };
        return new DedustPool(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }
}
