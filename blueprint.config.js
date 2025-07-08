// blueprint.config.js
/** @type {import('@ton/blueprint').Config} */
module.exports = {
  network: {
    endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
    type:     'testnet',
    version:  'v2',
  },
  sourcesDir: 'contracts',
  importsDir: 'contracts/imports',
  outDir:     'build',
  contracts: {
    vault:        { file: 'vault/vault.fc',             alias: 'Vault' },
    ston:         { file: 'dex-pools/ston-pool.fc',     alias: 'StonPool' },
    dedust:       { file: 'dex-pools/dedust-pool.fc',   alias: 'DeDustPool' },
    megaton:      { file: 'dex-pools/megaton-pool.fc',  alias: 'MegatonPool' },
    tgbtc:        { file: 'jettons/tgbtc.fc',           alias: 'TgBtc' },
    jettonWallet: { file: 'jettons/jetton-wallet.fc',   alias: 'JettonWallet' },
  },
};
