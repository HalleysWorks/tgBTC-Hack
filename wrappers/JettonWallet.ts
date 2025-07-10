import { Address, Cell, beginCell, contractAddress, Contract, ContractProvider, Sender, SendMode } from '@ton/core';

export type JettonWalletConfig = {
    balance: bigint;
    owner: Address;
    master: Address;
};

export function jettonWalletConfigToCell(config: JettonWalletConfig): Cell {
    return beginCell()
        .storeUint(config.balance, 64) // initial balance (usually zero)
        .storeAddress(config.owner) // owner of this wallet
        .storeAddress(config.master) // jetton master (token root)
        .endCell();
}

export class JettonWallet implements Contract {
    readonly address: Address;
    readonly init?: { code: Cell; data: Cell };

    private constructor(address: Address, init?: { code: Cell; data: Cell }) {
        this.address = address;
        this.init = init;
    }

    static createFromConfig(config: JettonWalletConfig, code: Cell, workchain = 0): JettonWallet {
        const data = jettonWalletConfigToCell(config);
        const init = { code, data };
        const address = contractAddress(workchain, init);
        return new JettonWallet(address, init);
    }

    static createFromAddress(address: Address): JettonWallet {
        return new JettonWallet(address);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async getWalletData(provider: ContractProvider): Promise<{ balance: bigint; owner: Address; master: Address }> {
        const res = await provider.get('get_wallet_data', []);
        const balance = res.stack.readBigNumber();
        const owner = res.stack.readAddress();
        const master = res.stack.readAddress();
        return { balance, owner, master };
    }
}
