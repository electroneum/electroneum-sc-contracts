require('@openzeppelin/hardhat-upgrades');
require("@nomicfoundation/hardhat-toolbox");

const { vars } = require("hardhat/config");

const bridge_contract_address = vars.get("BRIDGE_CONTRACT_ADDRESS");
const priority_contract_address = vars.get("PRIORITY_CONTRACT_ADDRESS");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.23",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
      evmVersion: 'london'
    }
  },
  networks: {
    etn_sc_privatenet: {
      url: "http://localhost:8545",
      chainId: 1337,
      accounts: [vars.get("BRIDGE_PRIVATE_KEY"), vars.get("PRIORITY_PRIVATE_KEY"), vars.get("FUNDER_PRIVATE_KEY")]
    },
    etn_sc_testnet: {
      url: "http://localhost:8545",
      chainId: 5201420,
      accounts: [vars.get("BRIDGE_PRIVATE_KEY"), vars.get("PRIORITY_PRIVATE_KEY"), vars.get("FUNDER_PRIVATE_KEY")]
    },
    etn_sc: {
      url: "http://localhost:8545",
      chainId: 52014,
      accounts: [vars.get("BRIDGE_PRIVATE_KEY"), vars.get("PRIORITY_PRIVATE_KEY"), vars.get("FUNDER_PRIVATE_KEY")]
    },
    hardhat: {
      accounts: [ 
        // Bridge Deployer
        { balance: "17951808565760000000000000000", privateKey: vars.get("BRIDGE_PRIVATE_KEY") }, // 100000 ETN
        // Priority Deployer
        { balance: "0", privateKey: vars.get("PRIORITY_PRIVATE_KEY") },
        // Funder
        { balance: "10000000000000000000", privateKey: vars.get("FUNDER_PRIVATE_KEY") }, // 10 ETN
      ],
      gas: "auto",
    }
  }
};
