require('babel-register');
require('babel-polyfill');
require('dotenv').config();
//const HDWalletProvider = require('truffle-hdwallet-provider-privkey');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const privateKeys = process.env.PRIVATE_KEYS || ""

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*" // Match any network id
    },
    kovan: {
      provider: function() {
        return new HDWalletProvider(
          privateKeys.split(','), // Array of account private keys
          `https://kovan.infura.io/v3/${process.env.INFURA_API_KEY}`// Url to an Ethereum Node
        )
      },
      gas: 5000000,
      gasPrice: 25000000000,
      network_id: 42
    },

    mumbai: {
      provider: () => new HDWalletProvider([privateKeys], `https://rpc-mumbai.matic.today`),
      network_id: 80001,
      confirmations: 2,
      networkCheckTimeout: 6000,
      timeoutBlocks: 200,
      skipDryRun: true
    },

    polygon: {
      provider: () => new HDWalletProvider([privateKeys], `https://rpc-mainnet.maticvigil.com/v1/5bbc254ae4e2461d35dcde77308f508ba8b18ad0`),
      network_id: 137,
      //gas: 6000000,           // Gas sent with each transaction (default: ~6700000)
      //gasPrice: 7000000000,  // 3 gwei (in wei) (default: 100 gwei)
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
      networkCheckTimeout: 100000,
    },

  },
  contracts_directory: './src/contracts/',
  contracts_build_directory: './src/abis/',
  compilers: {
    solc: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
}