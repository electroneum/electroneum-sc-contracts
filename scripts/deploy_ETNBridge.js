// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { toBigInt } = require("ethers");
const hre = require("hardhat");
const { vars } = require("hardhat/config");

/*
 * deploy_ETNBridge.js
 *
 * This script deploys the ETNBridge.sol along with its ERC1967Proxy contract and sends the Bridge Owner balance to ETNBridge contract
 * 
 * Breakdown:
 * 1) Check if ETNBridge is already deployed at "0xe5da12b1bcf74ff0aec20671beabc466f8b54727" and if not, then:
 * 2) Get current balance of the bridge contract owner (this should be the legacy chain circulating supply)
 * 3) Deploy ETNBridge and ERC1967Proxy
 * 4) Get current balance of the bridge contract owner again (after deployment)
 * 5) Calculate the deployment cost by subtracting balance #4 from #2
 * 6) Estimate gas cost & fees based on current network conditions
 * 7) Reimburse the deployment costs + extra for subsequent fee from the funder account to ETNBridge contract owner. This assures the ETNBridge contract ends up with the correct balance (#2)
 * 8) Send the circulating supply balance (#2) from ETNBridge account owner to the ETNBridge contract
*/

async function main() {
  const [bridgeDeployer, _, funderSigner] = await hre.ethers.getSigners();
  
  // 1) Check if ETNBridge is already deployed
  const isBridgeContractDeployed = (await bridgeDeployer.provider.getCode(vars.get("BRIDGE_CONTRACT_ADDRESS"))) != '0x';
  console.log("Check ETNBridge deployed: " + isBridgeContractDeployed);

  // Return if ERC1967Proxy is deployed
  if(isBridgeContractDeployed) {
    return;
  }

  // 2) Get ETNBridge account owner balance, ie Circulating Supply from legacy chain
  const legacyCirculatingSupply = await hre.ethers.provider.getBalance(bridgeDeployer.getAddress());
  console.log("Legacy Circulating Supply: " + legacyCirculatingSupply);

  // 3) Deploy ERC1967Proxy & ETNBridge
  console.log("Deploying ETNBridge...");
  const ETNBridgeFactory = await hre.ethers.getContractFactory("ETNBridge", { signer: bridgeDeployer });
  const ETNBridge = await hre.upgrades.deployProxy(ETNBridgeFactory, undefined, { kind: "uups" });
  await ETNBridge.waitForDeployment();
  console.log("ETNBridge Proxy deployed to:", await ETNBridge.getAddress());

  // 4) & 5) Calculate the deployment cost to refund ETNBridge account owner needed to transfer legacy circulating supply to the bridge
  const deploymentCost = legacyCirculatingSupply - await hre.ethers.provider.getBalance(bridgeDeployer.getAddress());

  // Costruct the transfer of legacy circulating supply from owner address to bridge contract
  let circulatingSupplyTx = {
    to: ETNBridge.getAddress(),
    value: "0" // use value=0 for estimateGas()
  };
  
  // 6) Estimate fees to send circulating supply to Bridge
  const estimatedGas = await bridgeDeployer.provider.estimateGas(circulatingSupplyTx);
  const fee = await bridgeDeployer.provider.getFeeData();

  // 7) Send ETN from Funder to Bridge owner to cover tx fee + deployment cost
  const funderTx = await funderSigner.sendTransaction({
    to: bridgeDeployer.getAddress(),
    value: deploymentCost + (estimatedGas * fee.maxFeePerGas)
  });
  await funderTx.wait(1);

  // Update tx value with the actual legacy circulating supply amount
  circulatingSupplyTx.value = legacyCirculatingSupply;

  // 8) Send legacy circulating supply to Bridge
  const txResponse = await bridgeDeployer.sendTransaction(circulatingSupplyTx)
  await txResponse.wait(1);
  console.log("Balance sent to ETNBridge: " + txResponse.value);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
