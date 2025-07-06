// rebalancer/utils.ts
import { Address } from '@ton/core';

/**
 * Sleep for given milliseconds.
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Safely parse a TON address string.
 */
export function parseAddress(addr: string): Address {
    try {
        return Address.parse(addr);
    } catch {
        throw new Error(`Invalid address: ${addr}`);
    }
}

/**
 * Normalize a BigInt price with 6 decimal places.
 */
export function normalizePrice(n: bigint, decimals = 6): number {
    return Number(n) / 10 ** decimals;
}
