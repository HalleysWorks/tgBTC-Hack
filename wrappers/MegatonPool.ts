import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type MegatonPoolConfig = {};

export function megatonPoolConfigToCell(config: MegatonPoolConfig): Cell {
    return beginCell().endCell();
}

export class MegatonPool implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new MegatonPool(address);
    }

    static createFromConfig(config: MegatonPoolConfig, code: Cell, workchain = 0) {
        const data = megatonPoolConfigToCell(config);
        const init = { code, data };
        return new MegatonPool(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }
}
