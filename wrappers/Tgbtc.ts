import { Address, Cell, beginCell, contractAddress, Contract, ContractProvider, Sender, SendMode } from '@ton/core';

export type TgbtcConfig = {
    admin: Address;
    walletCode: Cell;
};

export function tgbtcConfigToCell(config: TgbtcConfig): Cell {
    // Initial totalSupply = 0
    return beginCell()
        .storeUint(0n, 64) // totalSupply
        .storeAddress(config.admin) // admin
        .storeRef(config.walletCode) // walletCode cell
        .endCell();
}

export class Tgbtc implements Contract {
    readonly address: Address;
    readonly init?: { code: Cell; data: Cell };

    private constructor(address: Address, init?: { code: Cell; data: Cell }) {
        this.address = address;
        this.init = init;
    }

    static createFromConfig(config: TgbtcConfig, code: Cell, workchain = 0): Tgbtc {
        const data = tgbtcConfigToCell(config);
        const init = { code, data };
        const address = contractAddress(workchain, init);
        return new Tgbtc(address, init);
    }

    static createFromAddress(address: Address): Tgbtc {
        return new Tgbtc(address);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    // Getter for total supply and admin
    async getJettonData(provider: ContractProvider): Promise<{ totalSupply: bigint; admin: Address }> {
        const res = await provider.get('get_jetton_data', []);
        const supply = res.stack.readBigNumber();
        // skip reserved amount
        res.stack.readBigNumber();
        const admin = res.stack.readAddress();
        return { totalSupply: supply, admin };
    }
}
