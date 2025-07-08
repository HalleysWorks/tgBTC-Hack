const { Blockchain, SandboxContract, TreasuryContract } = require('@ton/sandbox');
const { Cell, toNano, Address } = require('@ton/core');
const { Vault } = require('../../wrappers/Vault');
const { StonPool } = require('../../wrappers/StonPool');
const { DedustPool } = require('../../wrappers/DedustPool');
const { MegatonPool } = require('../../wrappers/MegatonPool');
const { TgBtc } = require('../../wrappers/TgBtc');

describe('Liquidity Pool Optimization Integration', () => {
    let blockchain;
    let deployer;
    let user1;
    let user2;
    let vault;
    let stonPool;
    let dedustPool;
    let megatonPool;
    let tgBtc;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        user1 = await blockchain.treasury('user1');
        user2 = await blockchain.treasury('user2');

        // Deploy tgBTC jetton
        tgBtc = blockchain.openContract(
            await TgBtc.create({
                admin: deployer.address,
                totalSupply: toNano('1000000'), // 1M tgBTC
            }),
        );
        await tgBtc.sendDeploy(deployer.getSender(), toNano('0.2'));

        // Deploy all DEX pools
        stonPool = blockchain.openContract(
            await StonPool.create({
                admin: deployer.address,
                apy: 650,
                tokenAddress: tgBtc.address,
            }),
        );

        dedustPool = blockchain.openContract(
            await DedustPool.create({
                admin: deployer.address,
                apy: 450,
                tokenAddress: tgBtc.address,
            }),
        );

        megatonPool = blockchain.openContract(
            await MegatonPool.create({
                admin: deployer.address,
                apy: 500,
                tokenAddress: tgBtc.address,
            }),
        );

        await stonPool.sendDeploy(deployer.getSender(), toNano('0.3'));
        await dedustPool.sendDeploy(deployer.getSender(), toNano('0.3'));
        await megatonPool.sendDeploy(deployer.getSender(), toNano('0.3'));

        // Deploy vault with pool addresses
        vault = blockchain.openContract(
            await Vault.create({
                admin: deployer.address,
                ston_pool: stonPool.address,
                dedust_pool: dedustPool.address,
                megaton_pool: megatonPool.address,
            }),
        );
        await vault.sendDeploy(deployer.getSender(), toNano('0.5'));
    });

    describe('End-to-End Optimization Flow', () => {
        it('should complete full optimization cycle', async () => {
            // Step 1: Users deposit liquidity to vault
            console.log('Step 1: User deposits...');

            const depositResult1 = await vault.sendDeposit(
                user1.getSender(),
                toNano('0.1'),
                toNano('100'), // 100 TON
                toNano('1000'), // 1000 tgBTC
            );

            const depositResult2 = await vault.sendDeposit(
                user2.getSender(),
                toNano('0.1'),
                toNano('50'), // 50 TON
                toNano('500'), // 500 tgBTC
            );

            expect(depositResult1.transactions).toHaveTransaction({ success: true });
            expect(depositResult2.transactions).toHaveTransaction({ success: true });

            // Step 2: Check initial vault balance
            console.log('Step 2: Check vault balance...');
            const initialBalance = await vault.getBalance();
            expect(initialBalance.tonBalance).toBeGreaterThan(toNano('140'));
            expect(initialBalance.tgbtcBalance).toBeGreaterThan(toNano('1400'));

            // Step 3: Trigger rebalancing
            console.log('Step 3: Trigger rebalancing...');
            const rebalanceResult = await vault.sendRebalance(
                deployer.getSender(),
                toNano('0.2'), // Gas for rebalancing
            );

            expect(rebalanceResult.transactions).toHaveTransaction({ success: true });

            // Step 4: Verify fund distribution
            console.log('Step 4: Check fund distribution...');
            const stonInfo = await stonPool.getPoolInfo();
            const dedustInfo = await dedustPool.getPoolInfo();
            const megatonInfo = await megatonPool.getPoolInfo();

            // STON should have most funds (highest yield)
            expect(stonInfo.tonBalance).toBeGreaterThan(dedustInfo.tonBalance);
            expect(stonInfo.tonBalance).toBeGreaterThan(megatonInfo.tonBalance);

            // All pools should have some funds
            expect(stonInfo.tonBalance).toBeGreaterThan(0n);
            expect(dedustInfo.tonBalance).toBeGreaterThan(0n);
            expect(megatonInfo.tonBalance).toBeGreaterThan(0n);
        });

        it('should handle user withdrawals after optimization', async () => {
            // Setup: Deposit and rebalance
            await vault.sendDeposit(user1.getSender(), toNano('0.1'), toNano('100'), toNano('1000'));

            await vault.sendRebalance(deployer.getSender(), toNano('0.2'));

            // Test withdrawal
            const userShares = await vault.getLpShares(user1.address);
            expect(userShares).toBeGreaterThan(0n);

            const withdrawResult = await vault.sendWithdraw(
                user1.getSender(),
                toNano('0.1'),
                userShares / 2n, // Withdraw half
            );

            expect(withdrawResult.transactions).toHaveTransaction({ success: true });

            // Check updated shares
            const newShares = await vault.getLpShares(user1.address);
            expect(newShares).toBeLessThan(userShares);
        });

        it('should optimize based on changing yields', async () => {
            // Initial deposit
            await vault.sendDeposit(user1.getSender(), toNano('0.1'), toNano('100'), toNano('1000'));

            // First rebalance - STON should get most funds
            await vault.sendRebalance(deployer.getSender(), toNano('0.2'));

            const stonInfo1 = await stonPool.getPoolInfo();
            const dedustInfo1 = await dedustPool.getPoolInfo();

            expect(stonInfo1.tonBalance).toBeGreaterThan(dedustInfo1.tonBalance);

            // Simulate yield change - make DeDust more attractive
            await dedustPool.sendUpdateYield(
                deployer.getSender(),
                toNano('0.05'),
                800, // 8% APY
            );

            // Second rebalance - should redistribute
            await vault.sendRebalance(deployer.getSender(), toNano('0.2'));

            const dedustYield = await dedustPool.getYield();
            expect(dedustYield).toBe(800);
        });

        it('should handle multiple users and complex scenarios', async () => {
            // Multiple users deposit
            const users = [user1, user2];
            const deposits = [
                { ton: toNano('80'), tgbtc: toNano('800') },
                { ton: toNano('120'), tgbtc: toNano('1200') },
            ];

            for (let i = 0; i < users.length; i++) {
                await vault.sendDeposit(users[i].getSender(), toNano('0.1'), deposits[i].ton, deposits[i].tgbtc);
            }

            // Check individual shares
            const user1Shares = await vault.getLpShares(user1.address);
            const user2Shares = await vault.getLpShares(user2.address);

            expect(user1Shares).toBeGreaterThan(0n);
            expect(user2Shares).toBeGreaterThan(0n);
            expect(user2Shares).toBeGreaterThan(user1Shares); // User2 deposited more

            // Rebalance
            await vault.sendRebalance(deployer.getSender(), toNano('0.2'));

            // Partial withdrawals
            await vault.sendWithdraw(user1.getSender(), toNano('0.1'), user1Shares / 3n);

            await vault.sendWithdraw(user2.getSender(), toNano('0.1'), user2Shares / 4n);

            // Second rebalance after withdrawals
            await vault.sendRebalance(deployer.getSender(), toNano('0.2'));

            // Verify system stability
            const finalBalance = await vault.getBalance();
            expect(finalBalance.tonBalance).toBeGreaterThan(0n);
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('should handle insufficient balance withdrawals', async () => {
            await vault.sendDeposit(user1.getSender(), toNano('0.1'), toNano('10'), toNano('100'));

            const userShares = await vault.getLpShares(user1.address);

            // Try to withdraw more than balance
            const withdrawResult = await vault.sendWithdraw(
                user1.getSender(),
                toNano('0.1'),
                userShares * 2n, // Double the shares
            );

            // Should fail gracefully
            expect(withdrawResult.transactions).toHaveTransaction({
                from: user1.address,
                to: vault.address,
                success: false,
            });
        });

        it('should handle empty pool rebalancing', async () => {
            // Try to rebalance with no funds
            const rebalanceResult = await vault.sendRebalance(deployer.getSender(), toNano('0.2'));

            // Should not crash
            expect(rebalanceResult.transactions).toHaveTransaction({
                from: deployer.address,
                to: vault.address,
                success: true,
            });
        });

        it('should handle zero yield pools', async () => {
            // Set all pools to zero yield
            await stonPool.sendUpdateYield(deployer.getSender(), toNano('0.05'), 0);
            await dedustPool.sendUpdateYield(deployer.getSender(), toNano('0.05'), 0);
            await megatonPool.sendUpdateYield(deployer.getSender(), toNano('0.05'), 0);

            // Deposit and rebalance
            await vault.sendDeposit(user1.getSender(), toNano('0.1'), toNano('30'), toNano('300'));

            const rebalanceResult = await vault.sendRebalance(deployer.getSender(), toNano('0.2'));

            expect(rebalanceResult.transactions).toHaveTransaction({ success: true });
        });
    });

    describe('Performance and Gas Optimization', () => {
        it('should execute rebalancing within gas limits', async () => {
            // Large deposit to test gas efficiency
            await vault.sendDeposit(
                user1.getSender(),
                toNano('0.1'),
                toNano('1000'), // 1000 TON
                toNano('10000'), // 10000 tgBTC
            );

            const rebalanceResult = await vault.sendRebalance(
                deployer.getSender(),
                toNano('0.5'), // Higher gas limit
            );

            expect(rebalanceResult.transactions).toHaveTransaction({ success: true });

            // Check gas consumption
            const gasUsed = rebalanceResult.transactions
                .filter((tx) => tx.description.type === 'generic')
                .reduce((sum, tx) => sum + tx.description.computePhase.gasUsed, 0);

            console.log('Gas used for rebalancing:', gasUsed);
            expect(gasUsed).toBeLessThan(1000000); // Should be under 1M gas
        });

        it('should handle concurrent operations', async () => {
            // Simulate concurrent deposits
            const deposit1 = vault.sendDeposit(user1.getSender(), toNano('0.1'), toNano('50'), toNano('500'));

            const deposit2 = vault.sendDeposit(user2.getSender(), toNano('0.1'), toNano('75'), toNano('750'));

            const [result1, result2] = await Promise.all([deposit1, deposit2]);

            expect(result1.transactions).toHaveTransaction({ success: true });
            expect(result2.transactions).toHaveTransaction({ success: true });

            // Verify both users have shares
            const user1Shares = await vault.getLpShares(user1.address);
            const user2Shares = await vault.getLpShares(user2.address);

            expect(user1Shares).toBeGreaterThan(0n);
            expect(user2Shares).toBeGreaterThan(0n);
        });
    });
});
