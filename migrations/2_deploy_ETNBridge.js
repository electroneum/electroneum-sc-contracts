// migrations/3_deploy_upgradeable_box.js
const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const ETNBridge = artifacts.require('ETNBridge');
const ETNPriorityTransactors = artifacts.require('ETNPriorityTransactors');

module.exports = async function (deployer) {
  await deployProxy(ETNBridge, undefined, { deployer, kind: "uups" });
  const priority_contract = await deployProxy(ETNPriorityTransactors, undefined, { deployer, kind: "uups" });

  await priority_contract.addTransactor("04ce7edc292d7b747fab2f23584bbafaffde5c8ff17cf689969614441e0527b90015ea9fee96aed6d9c0fc2fbe0bd1883dee223b3200246ff1e21976bdbc9a0fc8", true, "Test Entity 1")
  await priority_contract.addTransactor("04af80b90d25145da28c583359beb47b21796b2fe1a23c1511e443e7a64dfdb27d7434c380f0aa4c500e220aa1a9d068514b1ff4d5019e624e7ba1efe82b340a59", true, "Test Entity 2")
  await priority_contract.addTransactor("0409b02f8a5fddd222ade4ea4528faefc399623af3f736be3c44f03e2df22fb792f3931a4d9573d333ca74343305762a753388c3422a86d98b713fc91c1ea04842", true, "Test Entity 3")

};
