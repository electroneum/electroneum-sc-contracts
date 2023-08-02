// migrations/3_deploy_upgradeable_box.js
const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const ETNBridge = artifacts.require('ETNBridge');
const ETNPriorityTransactors = artifacts.require('ETNPriorityTransactors');

module.exports = async function (deployer) {
  await deployProxy(ETNBridge, undefined, { deployer, kind: "uups" });
  await deployProxy(ETNPriorityTransactors, undefined, { deployer, kind: "uups" });
};