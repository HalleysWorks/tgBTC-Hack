// scripts/dedust.compile.ts
import { CompilerConfig } from '@ton/blueprint';

export const compile: CompilerConfig = {
    lang: 'func',
    targets: ['contracts/dedust_pool.fc'],
    // No additional changes needed here
};
