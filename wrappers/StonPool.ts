import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type StonPoolConfig = {};

export function stonPoolConfigToCell(config: StonPoolConfig): Cell {
    return beginCell().endCell();
}

export class StonPool implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new StonPool(address);
    }

    static createFromConfig(config: StonPoolConfig, code: Cell, workchain = 0) {
        const data = stonPoolConfigToCell(config);
        const init = { code, data };
        return new StonPool(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }
}
