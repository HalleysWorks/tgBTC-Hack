import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type StonPoolConfig = {
    admin: Address;
    vault: Address;
};

export function stonPoolConfigToCell(config: StonPoolConfig): Cell {
    return beginCell().storeAddress(config.admin).storeAddress(config.vault).endCell();
}

export class StonPool implements Contract {
    readonly address: Address;
    readonly init?: { code: Cell; data: Cell };

    constructor(address: Address, init?: { code: Cell; data: Cell }) {
        this.address = address;
        this.init = init;
    }

    static createFromAddress(address: Address) {
        return new StonPool(address);
    }

    static async createFromConfig(config: StonPoolConfig, code: Cell, workchain = 0) {
        const data = stonPoolConfigToCell(config);
        const init = { code, data };
        const addr = contractAddress(workchain, init);
        return new StonPool(addr, init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    // Example getter (if present in your contract)
    async getAdmin(provider: ContractProvider): Promise<Address> {
        const res = await provider.get('get_admin', []);
        return res.stack.readAddress();
    }
}
