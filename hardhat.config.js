require('@openzeppelin/hardhat-upgrades');
require("@nomicfoundation/hardhat-toolbox");

const { vars } = require("hardhat/config");


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
      accounts: [vars.get("BRIDGE_PRIVATE_KEY"), vars.get("PRIORITY_PRIVATE_KEY"), vars.get("VALIDATOR_PRIVATE_KEY")]
    },
    etn_sc_testnet: {
      url: "http://localhost:8545",
      chainId: 5201420,
      accounts: [vars.get("BRIDGE_PRIVATE_KEY"), vars.get("PRIORITY_PRIVATE_KEY"), vars.get("VALIDATOR_PRIVATE_KEY")]
    },
    hardhat: {
      accounts: [ 
        // Bridge Deployer
        { balance: "17951808565760000000000000000", privateKey: "d1d2b8c9bf8e9c5c088944d1567c2bb5fca08b53c7ae9803a29cb9918df93900" }, // 100000 ETN
        // Priority Deployer
        { balance: "0", privateKey: "559331a529dd7610c6db33b1ad6c46c068062260360724ec6dae14f60383f9b3" },
        // Validator
        { balance: "10000000000000000000", privateKey: "d0df44de8d4e5f45c2b3abf54ffde057ee93f5445a411ce6f83826be106bf199" }, // 10 ETN
      ],
      gas: "auto",
    }
  }
};
