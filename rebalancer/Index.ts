// rebalancer/index.ts
import { TONXJsonRpcProvider } from '@tonx/core';
import { Address, beginCell } from '@ton/core';

export interface PoolConfig {
    name: string;
    address: string;
    dex: 'ston' | 'dedust' | 'megaton';
}

export interface RebalancerConfig {
    network: 'mainnet' | 'testnet';
    apiKey: string;
    vaultAddress: string;
    pools: PoolConfig[];
    rebalanceThreshold: number; // e.g. 0.03 for 3%
    queryInterval: number; // ms, e.g. 15000
}

export class RebalancerBot {
    private client: TONXJsonRpcProvider;
    private vaultAddress: Address;
    private pools: PoolConfig[];
    private rebalanceThreshold: number;
    private queryInterval: number;

    constructor(private config: RebalancerConfig) {
        this.client = new TONXJsonRpcProvider({
            network: config.network,
            apiKey: config.apiKey,
        });
        // parse vaultAddress once
        this.vaultAddress = Address.parse(config.vaultAddress);
        this.pools = config.pools;
        this.rebalanceThreshold = config.rebalanceThreshold;
        this.queryInterval = config.queryInterval;
    }

    public async start() {
        console.log('Starting rebalancer bot...');
        setInterval(() => this.checkAndRebalance(), this.queryInterval);
    }

    private async checkAndRebalance() {
        try {
            const poolData = await this.fetchAllPoolData();
            const { needsRebalancing, plan } = this.analyzePoolImbalances(poolData);
            if (needsRebalancing) {
                await this.executeRebalance(plan);
            }
        } catch (error) {
            console.error('Rebalancing error:', error);
        }
    }

    private async fetchAllPoolData() {
        const results = await Promise.all(this.pools.map((pool) => this.fetchPoolReserves(pool)));
        return results.map((data, i) => ({ ...this.pools[i], ...data! }));
    }

    private async fetchPoolReserves(pool: PoolConfig) {
        try {
            // parse the pool address & use runGetMethod
            const addr = Address.parse(pool.address);
            const result = await this.client.runGetMethod({
                address: addr,
                method: 'get_pool_data',
                stack: [], // your empty args array
            });
            const [r0, r1] = result.stack;
            const reserve0 = r0.readBigNumber();
            const reserve1 = r1.readBigNumber();
            const price = reserve1 === 0n ? 0 : Number((reserve0 * 1_000_000n) / reserve1) / 1_000_000;
            return { reserve0, reserve1, price, timestamp: Date.now() };
        } catch (err) {
            console.error(`Error fetching ${pool.name} data:`, err);
            return null;
        }
    }

    private analyzePoolImbalances(
        data: Array<
            PoolConfig & {
                reserve0: bigint;
                reserve1: bigint;
                price: number;
                timestamp: number;
            }
        >,
    ) {
        const valid = data.filter((d) => d !== null) as any[];
        if (valid.length < 2) return { needsRebalancing: false, plan: [] };

        const prices = valid.map((p) => p.price);
        const avg = prices.reduce((s, x) => s + x, 0) / prices.length;

        const imbalances = valid.map((pool) => ({
            ...pool,
            deviation: Math.abs(pool.price - avg) / avg,
        }));
        const maxDev = Math.max(...imbalances.map((p) => p.deviation));

        if (maxDev > this.rebalanceThreshold) {
            return {
                needsRebalancing: true,
                plan: this.createRebalancePlan(imbalances, avg),
            };
        }
        return { needsRebalancing: false, plan: [] };
    }

    private createRebalancePlan(
        imbalances: Array<
            PoolConfig & {
                reserve0: bigint;
                reserve1: bigint;
                price: number;
                deviation: number;
            }
        >,
        targetPrice: number,
    ) {
        const plan: Array<{
            pool: string;
            deltaTgBTC: bigint;
            deltaTON: bigint;
        }> = [];

        imbalances.forEach((pool) => {
            if (pool.deviation > this.rebalanceThreshold) {
                const factor = pool.deviation * 0.5; // Conservative adjustment
                if (pool.price > targetPrice) {
                    plan.push({
                        pool: pool.address,
                        deltaTgBTC: -BigInt(Math.floor(Number(pool.reserve0) * factor)),
                        deltaTON: BigInt(Math.floor(Number(pool.reserve1) * factor)),
                    });
                } else {
                    plan.push({
                        pool: pool.address,
                        deltaTgBTC: BigInt(Math.floor(Number(pool.reserve0) * factor)),
                        deltaTON: -BigInt(Math.floor(Number(pool.reserve1) * factor)),
                    });
                }
            }
        });

        return plan;
    }

    private async executeRebalance(actions: Array<{ pool: string; deltaTgBTC: bigint; deltaTON: bigint }>) {
        for (const action of actions) {
            try {
                await this.sendRebalanceTransaction(action);
                console.log(`Rebalanced pool ${action.pool}`);
                await new Promise((r) => setTimeout(r, 2000));
            } catch (err) {
                console.error(`Failed to rebalance ${action.pool}:`, err);
            }
        }
    }

    private async sendRebalanceTransaction(action: { pool: string; deltaTgBTC: bigint; deltaTON: bigint }) {
        const poolAddr = Address.parse(action.pool);

        const body = beginCell()
            .storeUint(0x3, 32) // op::rebalance
            .storeUint(Date.now(), 64) // query_id
            .storeAddress(poolAddr) // pool address
            .storeInt(action.deltaTgBTC, 257) // delta tgBTC
            .storeInt(action.deltaTON, 257) // delta TON
            .endCell();

        // TODO: actually send `body` to your vault contract at `this.vaultAddress`
        console.log('Prepared rebalance message:', {
            pool: action.pool,
            deltaTgBTC: action.deltaTgBTC.toString(),
            deltaTON: action.deltaTON.toString(),
        });
    }
}
