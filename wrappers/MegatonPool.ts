import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type MegatonPoolConfig = {
    admin: Address;
    vault: Address;
};

export function megatonPoolConfigToCell(config: MegatonPoolConfig): Cell {
    return beginCell().storeAddress(config.admin).storeAddress(config.vault).endCell();
}

export class MegatonPool implements Contract {
    readonly address: Address;
    readonly init?: { code: Cell; data: Cell };

    constructor(address: Address, init?: { code: Cell; data: Cell }) {
        this.address = address;
        this.init = init;
    }

    static createFromAddress(address: Address) {
        return new MegatonPool(address);
    }

    static async createFromConfig(config: MegatonPoolConfig, code: Cell, workchain = 0) {
        const data = megatonPoolConfigToCell(config);
        const init = { code, data };
        const addr = contractAddress(workchain, init);
        return new MegatonPool(addr, init);
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
