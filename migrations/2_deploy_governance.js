// migrations/3_deploy_upgradeable_box.js
const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const ETNBridge = artifacts.require('ETNBridge');
const ETNGovernance = artifacts.require('ETNGovernance');

module.exports = async function (deployer) {
  await deployProxy(
    ETNGovernance, 
    [["0xC21EE98b5A90a6a45aBA37FA5eDdF90F5E8e1816", "0xfF0d56Bd960c455a71f908496C79e8EAFEC34cCF", "0x07AfbE0D7D36b80454Be1e185f55e02b9453625a", "0x4f9a82D7e094DE7Fb70d9Ce2033EC0d65AC31124", "0x97F060952B1008c75CB030e3599725Ad5CC306A2"]], 
    { deployer, kind: "uups" }
    );

  await deployProxy(
    ETNBridge,
    undefined,
    { deployer, kind: "uups" }
  );
};