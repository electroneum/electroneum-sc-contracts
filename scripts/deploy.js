// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const BN = require("bn.js");
const hre = require("hardhat");

async function main() {
  const [bridgeDeployer, priorityDeployer, validatorSigner] = await hre.ethers.getSigners()

  // Deploy ETNBridge
  const ETNBridgeFactory = await hre.ethers.getContractFactory("ETNBridge", { signer:bridgeDeployer });
  const ETNBridge = await hre.upgrades.deployProxy(ETNBridgeFactory, undefined, { kind: "uups" });
  await ETNBridge.waitForDeployment();
  console.log("ETNBridge deployed to:", await ETNBridge.getAddress());

  // Estimate fees to send entire balance to Bridge
  let tx = {
    to: ETNBridge.getAddress(),
    value: "0"
  }
  const estimatedGas = await bridgeDeployer.provider.estimateGas(tx)
  const fee = await bridgeDeployer.provider.getFeeData()
  const balance = await hre.ethers.provider.getBalance(bridgeDeployer.getAddress())
  const amount = new BN(balance).sub((new BN(estimatedGas)).mul(new BN(fee.maxFeePerGas))).toString()

  // Update tx object with the new value
  tx.value = amount

  // Send balance to Bridge
  await bridgeDeployer.sendTransaction(tx)

  // Send 1 ETN from Validator to Priority owner
  await validatorSigner.sendTransaction({
    to: priorityDeployer.getAddress(),
    value: hre.ethers.parseUnits("1", "ether")
  })

  const ETNPriorityTransactorsFactory = await hre.ethers.getContractFactory("ETNPriorityTransactors", { signer: priorityDeployer });
  const ETNPriorityTransactors = await hre.upgrades.deployProxy(ETNPriorityTransactorsFactory, undefined, { kind: "uups" });
  await ETNPriorityTransactors.waitForDeployment();
  console.log("ETNPriorityTransactors deployed to:", await ETNPriorityTransactors.getAddress());

  await ETNPriorityTransactors.addTransactor("043816468c0cd1ba9f8281cfb42c311b96f5aae539e51194eea6ee48fd2f971250a1ecb9d971d61e3faa65b54dbf5acc752457f9bad8877bff3a9fb3ce389346e8", true, "ETN Oracle")

  console.log("Done")
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
