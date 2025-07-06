const { Address, Cell } = require('@ton/core');
const fs = require('fs');

/**
 * Utility functions for TON smart contract deployment
 */
class DeploymentUtils {
    /**
     * Parse address string to Address object
     */
    static parseAddress(address) {
        if (!address) return null;
        try {
            return Address.parse(address);
        } catch (error) {
            throw new Error(`Invalid address format: ${address}`);
        }
    }

    /**
     * Format TON amount for display
     */
    static formatTON(amount) {
        return (parseInt(amount) / 1000000000).toFixed(9);
    }

    /**
     * Load compiled contract from file
     */
    static loadCompiledContract(filePath) {
        if (!fs.existsSync(filePath)) {
            throw new Error(`Compiled contract not found: ${filePath}`);
        }
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }

    /**
     * Create code cell from hex string
     */
    static createCodeCell(hex) {
        return Cell.fromBoc(Buffer.from(hex, 'hex'))[0];
    }

    /**
     * Validate environment variables
     */
    static validateEnvironment() {
        const required = ['DEPLOYER_MNEMONIC', 'ADMIN_ADDRESS', 'TGBTC_MASTER_ADDRESS'];
        const missing = required.filter((key) => !process.env[key]);

        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }
    }

    /**
     * Check if contract exists on network
     */
    static async contractExists(client, address) {
        try {
            const state = await client.getContractState(address);
            return state.state === 'active';
        } catch (error) {
            return false;
        }
    }

    /**
     * Generate random query ID
     */
    static generateQueryId() {
        return Math.floor(Math.random() * 1000000000);
    }

    /**
     * Sleep for specified milliseconds
     */
    static sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

module.exports = { DeploymentUtils };
