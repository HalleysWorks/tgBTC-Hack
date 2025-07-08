const { Blockchain, SandboxContract, TreasuryContract } = require('@ton/sandbox');
const { Cell, toNano, Address } = require('@ton/core');
const { StonPool } = require('../../wrappers/StonPool');
const { DedustPool } = require('../../wrappers/DedustPool');
const { MegatonPool } = require('../../wrappers/MegatonPool');

describe('DEX Pool Contracts', () => {
    let blockchain;
    let deployer;
    let user1;
    let user2;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        user1 = await blockchain.treasury('user1');
        user2 = await blockchain.treasury('user2');
    });

    describe('StonPool', () => {
        let stonPool;

        beforeEach(async () => {
            stonPool = blockchain.openContract(
                await StonPool.create({
                    admin: deployer.address,
                    apy: 650, // 6.5%
                }),
            );

            const deployResult = await stonPool.sendDeploy(deployer.getSender(), toNano('0.3'));
            expect(deployResult.transactions).toHaveTransaction({
                from: deployer.address,
                to: stonPool.address,
                deploy: true,
                success: true,
            });
        });

        it('should deploy correctly', async () => {
            const poolInfo = await stonPool.getPoolInfo();
            expect(poolInfo.tonBalance).toBe(0n);
            expect(poolInfo.tokenBalance).toBe(0n);
            expect(poolInfo.apy).toBe(650);
        });

        it('should handle liquidity addition', async () => {
            const result = await stonPool.sendAddLiquidity(
                user1.getSender(),
                toNano('0.1'),
                toNano('10'),
                toNano('100'),
            );

            expect(result.transactions).toHaveTransaction({
                from: user1.address,
                to: stonPool.address,
                success: true,
            });

            const poolInfo = await stonPool.getPoolInfo();
            expect(poolInfo.tonBalance).toBeGreaterThan(0n);
        });

        it('should handle liquidity removal', async () => {
            // First add liquidity
            await stonPool.sendAddLiquidity(user1.getSender(), toNano('0.1'), toNano('10'), toNano('100'));

            // Then remove liquidity
            const result = await stonPool.sendRemoveLiquidity(user1.getSender(), toNano('0.05'), toNano('5'));

            expect(result.transactions).toHaveTransaction({
                from: user1.address,
                to: stonPool.address,
                success: true,
            });
        });

        it('should return correct yield', async () => {
            const yield = await stonPool.getYield();
            expect(yield).toBe(650); // 6.5% APY
        });

        it('should handle swap operations', async () => {
            // Add initial liquidity
            await stonPool.sendAddLiquidity(deployer.getSender(), toNano('0.1'), toNano('100'), toNano('1000'));

            // Perform swap
            const result = await stonPool.sendSwap(
                user1.getSender(),
                toNano('0.05'),
                toNano('5'),
                toNano('45'), // min output with slippage
            );

            expect(result.transactions).toHaveTransaction({
                from: user1.address,
                to: stonPool.address,
                success: true,
            });
        });
    });

    describe('DedustPool', () => {
        let dedustPool;

        beforeEach(async () => {
            dedustPool = blockchain.openContract(
                await DedustPool.create({
                    admin: deployer.address,
                    apy: 450, // 4.5%
                }),
            );

            await dedustPool.sendDeploy(deployer.getSender(), toNano('0.3'));
        });

        it('should have different yield than STON', async () => {
            const yield = await dedustPool.getYield();
            expect(yield).toBe(450); // 4.5% APY
        });

        it('should handle multi-user liquidity', async () => {
            // User1 adds liquidity
            await dedustPool.sendAddLiquidity(user1.getSender(), toNano('0.1'), toNano('50'), toNano('500'));

            // User2 adds liquidity
            await dedustPool.sendAddLiquidity(user2.getSender(), toNano('0.1'), toNano('30'), toNano('300'));

            const poolInfo = await dedustPool.getPoolInfo();
            expect(poolInfo.tonBalance).toBeGreaterThan(toNano('70'));
            expect(poolInfo.tokenBalance).toBeGreaterThan(toNano('700'));
        });
    });

    describe('MegatonPool', () => {
        let megatonPool;

        beforeEach(async () => {
            megatonPool = blockchain.openContract(
                await MegatonPool.create({
                    admin: deployer.address,
                    apy: 500, // 5.0%
                }),
            );

            await megatonPool.sendDeploy(deployer.getSender(), toNano('0.3'));
        });

        it('should have medium yield', async () => {
            const yield = await megatonPool.getYield();
            expect(yield).toBe(500); // 5.0% APY
        });

        it('should handle emergency operations', async () => {
            // Add liquidity first
            await megatonPool.sendAddLiquidity(user1.getSender(), toNano('0.1'), toNano('20'), toNano('200'));

            // Admin can pause pool
            const result = await megatonPool.sendSetPoolStatus(
                deployer.getSender(),
                toNano('0.05'),
                1, // PAUSED
            );

            expect(result.transactions).toHaveTransaction({
                from: deployer.address,
                to: megatonPool.address,
                success: true,
            });
        });
    });

    describe('Cross-Pool Comparisons', () => {
        let stonPool, dedustPool, megatonPool;

        beforeEach(async () => {
            // Deploy all three pools
            stonPool = blockchain.openContract(await StonPool.create({ admin: deployer.address, apy: 650 }));
            dedustPool = blockchain.openContract(await DedustPool.create({ admin: deployer.address, apy: 450 }));
            megatonPool = blockchain.openContract(await MegatonPool.create({ admin: deployer.address, apy: 500 }));

            await stonPool.sendDeploy(deployer.getSender(), toNano('0.3'));
            await dedustPool.sendDeploy(deployer.getSender(), toNano('0.3'));
            await megatonPool.sendDeploy(deployer.getSender(), toNano('0.3'));
        });

        it('should have different yields for optimization', async () => {
            const stonYield = await stonPool.getYield();
            const dedustYield = await dedustPool.getYield();
            const megatonYield = await megatonPool.getYield();

            expect(stonYield).toBe(650);
            expect(dedustYield).toBe(450);
            expect(megatonYield).toBe(500);

            // STON should have highest yield
            expect(stonYield).toBeGreaterThan(dedustYield);
            expect(stonYield).toBeGreaterThan(megatonYield);
        });

        it('should all accept liquidity deposits', async () => {
            const amount = toNano('10');
            const tokenAmount = toNano('100');

            const stonResult = await stonPool.sendAddLiquidity(user1.getSender(), toNano('0.1'), amount, tokenAmount);
            const dedustResult = await dedustPool.sendAddLiquidity(
                user1.getSender(),
                toNano('0.1'),
                amount,
                tokenAmount,
            );
            const megatonResult = await megatonPool.sendAddLiquidity(
                user1.getSender(),
                toNano('0.1'),
                amount,
                tokenAmount,
            );

            expect(stonResult.transactions).toHaveTransaction({ success: true });
            expect(dedustResult.transactions).toHaveTransaction({ success: true });
            expect(megatonResult.transactions).toHaveTransaction({ success: true });
        });
    });
});
