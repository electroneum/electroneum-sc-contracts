// migrations/3_deploy_upgradeable_box.js
const { upgradeProxy } = require('@openzeppelin/truffle-upgrades');

const ETNGovernance = artifacts.require('ETNGovernance');

module.exports = async function (deployer) {
  //const existing = await ETNGovernance.deployed();
  //await upgradeProxy(existing.address, ETNGovernance, { deployer });
};