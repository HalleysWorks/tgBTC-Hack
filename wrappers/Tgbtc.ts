import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type TgbtcConfig = {};

export function tgbtcConfigToCell(config: TgbtcConfig): Cell {
    return beginCell().endCell();
}

export class Tgbtc implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Tgbtc(address);
    }

    static createFromConfig(config: TgbtcConfig, code: Cell, workchain = 0) {
        const data = tgbtcConfigToCell(config);
        const init = { code, data };
        return new Tgbtc(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }
}
