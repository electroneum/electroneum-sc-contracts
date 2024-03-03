// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { toBigInt } = require("ethers");
const hre = require("hardhat");
const { vars } = require("hardhat/config");

const priorityTransactors = [
    { priorityPubKey: "04e69d3085f42801bf135ac6f2f8b21a9157d775344f9c29e42602ebe13d7a60dc989f5dc3d2888cf457acda9e2c90e2542def6980c9250c8ac0416879f718f169", isWaiver: true, name: "ETN Oracle" },
]

/*
 * deploy_ETNPriorityTransactors.js
 *
 * This script deploys the ETNPriorityTransactors.sol along with its ERC1967Proxy contract and adds some priority transactors (ETNIP-1)
 * 
 * Breakdown:
 * 1) Check if ETNPriorityTransactors is already deployed at "0x1ef0959497375a7539e487749584aeb4947b7a90" and if not, then:
 * 2) Fund ETNPriorityTransactors account owner with a few ETN in order to deploy the contract
 * 3) Deploy ETNPriorityTransactors and ERC1967Proxy
 * 4) Add priority transtors from priorityTransactors[] to ETNPriorityTransactors contract
*/

async function main() {
  const [_, priorityDeployer, validatorSigner] = await hre.ethers.getSigners();
  
  // 1) Check if ETNPriorityTransactors is already deployed
  const isPriorityContractDeployed = (await priorityDeployer.provider.getCode(vars.get("PRIORITY_CONTRACT_ADDRESS"))) != '0x';
  console.log("Check ETNPriorityTransactors deployed: " + isPriorityContractDeployed);

  // Return if ERC1967Proxy is deployed
  if(isPriorityContractDeployed) {
    return;
  }

  // 2) Send 5 ETN from Validator to Priority owner
  const priorityOwnerTx = await validatorSigner.sendTransaction({
    to: priorityDeployer.getAddress(),
    value: hre.ethers.parseUnits("5", "ether")
  })
  await priorityOwnerTx.wait(1);

  // 3) Deploy ERC1967Proxy & ETNPriorityTransactors
  console.log("Deploying ETNPriorityTransactors...");
  const ETNPriorityTransactorsFactory = await hre.ethers.getContractFactory("ETNPriorityTransactors", { signer: priorityDeployer });
  const ETNPriorityTransactors = await hre.upgrades.deployProxy(ETNPriorityTransactorsFactory, undefined, { kind: "uups" });
  await ETNPriorityTransactors.waitForDeployment();
  console.log("ETNPriorityTransactors Proxy deployed to:", await ETNPriorityTransactors.getAddress());

  // 4) Add priority transactors
  priorityTransactors.forEach(async t => {
    await ETNPriorityTransactors.addTransactor(t.priorityPubKey, t.isWaiver, t.name);
    console.log("Priority transactor added: " + t.name)
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
