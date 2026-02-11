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
    {priorityPubKey: "04a34b99f22c790c4e36b2b3c2c35a36db06226e41c692fc82b8b56ac1c540c5bd5b8dec5235a0fa8722476c7709c02559e3aa73aa03918ba2d492eea75abea235", isWaiver: true, name: "ETN Oracle", privateKey: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" },
    {priorityPubKey: "0409abc94f95636930c9ba88c6ef633d06d3573db8331707d681b34372915d157a5c9c3f066cfa315e7ea504d1ff92330f8eff5a7ebe7a686fb5ca6eead949258b", isWaiver: true, name: "Gas Price Waiver Key", privateKey: "8236f08425125828960d38366af36cd229e87cda6683558a1ef868e26c1b8fd3" },
    {priorityPubKey: "0461413585811d3ab1a7c366b6153834c78eea8c89ae57e42065e6ee138077437d05ab2591f42ecf5e9b54046739c38be1695f12e0d06eb8efd037ae09bb69e6e9", isWaiver: false, name: "Non Gas Price Waiver Key", privateKey: "5d96d2db21f10d1910e84579f70c7c090f5cc89c644675377409e58159d96910"}
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
  const [_, priorityDeployer, funderSigner] = await hre.ethers.getSigners();
  
  // 1) Check if ETNPriorityTransactors is already deployed
  const isPriorityContractDeployed = (await priorityDeployer.provider.getCode(vars.get("PRIORITY_CONTRACT_ADDRESS"))) != '0x';
  console.log("Check ETNPriorityTransactors deployed: " + isPriorityContractDeployed);

  // Return if ERC1967Proxy is deployed
  if(isPriorityContractDeployed) {
    return;
  }

  // 2) Send 5 ETN from Funder to Priority owner
  const priorityOwnerTx = await funderSigner.sendTransaction({
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
