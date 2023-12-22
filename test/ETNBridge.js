
const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { deployProxy } = require('@openzeppelin/hardhat-upgrades');
const BN = require("bn.js/lib/bn")
const { ethers, upgrades } = require("hardhat");

const WeiToEther = function(weiValue) { return ethers.parseUnits(weiValue, "ether") }

const testData = [
    {   // Valid inputs 1
        address: "0x0000000000000000000000000000000000000010",
        legacyAddress: "etnkPPMb6BN24rzhF2LadK3RMn596R87dBidbV2m1UjpNniTMBQaFcD9cZFwfTvc6hN899kAjg6979oB1HXVFwRu4eCCKs0001",
        amount: WeiToEther("1"),
        txHash: "37af53586d6e40c2f70840e1d5949031b47456821aab87ae2e6f0e06c4fa7001"
    },
    {   // Valid inputs 2
        address: "0x0000000000000000000000000000000000000020",
        legacyAddress: "etnkPPMb6BN24rzhF2LadK3RMn596R87dBidbV2m1UjpNniTMBQaFcD9cZFwfTvc6hN899kAjg6979oB1HXVFwRu4eCCKs0002",
        amount: WeiToEther("1"),
        txHash: "37af53586d6e40c2f70840e1d5949031b47456821aab87ae2e6f0e06c4fa7002"
    },
    {   // Amount greater than contract's balance
        address: "0x0000000000000000000000000000000000000030",
        legacyAddress: "etnkPPMb6BN24rzhF2LadK3RMn596R87dBidbV2m1UjpNniTMBQaFcD9cZFwfTvc6hN899kAjg6979oB1HXVFwRu4eCCKs0003",
        amount: WeiToEther("10000"),
        txHash: "37af53586d6e40c2f70840e1d5949031b47456821aab87ae2e6f0e06c4fa7003"
    },
    {   // Invalid legacy etn address 1
        address: "0x0000000000000000000000000000000000000040",
        legacyAddress: "etnkPPMb6BN24rzhF2LadK3",
        amount: WeiToEther("1"),
        txHash: "37af53586d6e40c2f70840e1d5949031b47456821aab87ae2e6f0e06c4fa7004"
    },
    {   // Invalid legacy etn address 2
        address: "0x0000000000000000000000000000000000000050",
        legacyAddress: "etnkPPMb6BN24rzhF2LadK3RMn596R87dBidbV2m1UjpNniTMBQaFcD9cZFwfTvc6hN899kAjg6979oB1HXVFwRu4eCCKs000300000000000000000",
        amount: WeiToEther("1"),
        txHash: "37af53586d6e40c2f70840e1d5949031b47456821aab87ae2e6f0e06c4fa7005"
    },
    {   // Invalid sc etn address
        address: "0x0000000000000000000000000000000000000000",
        legacyAddress: "etnkPPMb6BN24rzhF2LadK3RMn596R87dBidbV2m1UjpNniTMBQaFcD9cZFwfTvc6hN899kAjg6979oB1HXVFwRu4eCCKs0003",
        amount: WeiToEther("1"),
        txHash: "37af53586d6e40c2f70840e1d5949031b47456821aab87ae2e6f0e06c4fa7006"
    },
    {   // Invalid tx hash
        address: "0x0000000000000000000000000000000000000060",
        legacyAddress: "etnkPPMb6BN24rzhF2LadK3RMn596R87dBidbV2m1UjpNniTMBQaFcD9cZFwfTvc6hN899kAjg6979oB1HXVFwRu4eCCKs0004",
        amount: WeiToEther("1"),
        txHash: "37af53586d6e40c2f70840e1d5949031b47456821aab87ae2e6f0e06c4fa70020000"
    },
    {   // Duplicate tx hash
        address: "0x0000000000000000000000000000000000000060",
        legacyAddress: "etnkPPMb6BN24rzhF2LadK3RMn596R87dBidbV2m1UjpNniTMBQaFcD9cZFwfTvc6hN899kAjg6979oB1HXVFwRu4eCCKs0004",
        amount: WeiToEther("1"),
        txHash: "37af53586d6e40c2f70840e1d5949031b47456821aab87ae2e6f0e06c4fa7002"
    },
    {   // Legacy etn address mapped to a different sc address
        address: "0x0000000000000000000000000000000000000060",
        legacyAddress: "etnkPPMb6BN24rzhF2LadK3RMn596R87dBidbV2m1UjpNniTMBQaFcD9cZFwfTvc6hN899kAjg6979oB1HXVFwRu4eCCKs0002",
        amount: WeiToEther("1"),
        txHash: "37af53586d6e40c2f70840e1d5949031b47456821aab87ae2e6f0e06c4fa7007"
    },
    {   // SC Address mapped to a different legacy address (1)
        address: "0x0000000000000000000000000000000000000070",
        legacyAddress: "etnkPPMb6BN24rzhF2LadK3RMn596R87dBidbV2m1UjpNniTMBQaFcD9cZFwfTvc6hN899kAjg6979oB1HXVFwRu4eCCKs0005",
        amount: WeiToEther("1"),
        txHash: "37af53586d6e40c2f70840e1d5949031b47456821aab87ae2e6f0e06c4fa7008"
    },
    {   // SC Address mapped to a different legacy address (2)
        address: "0x0000000000000000000000000000000000000070",
        legacyAddress: "etnkPPMb6BN24rzhF2LadK3RMn596R87dBidbV2m1UjpNniTMBQaFcD9cZFwfTvc6hN899kAjg6979oB1HXVFwRu4eCCKs0015",
        amount: WeiToEther("1"),
        txHash: "37af53586d6e40c2f70840e1d5949031b47456821aab87ae2e6f0e06c4fa7009"
    },
    {   // SC Address mapped to a different legacy address (3)
        address: "0x0000000000000000000000000000000000000070",
        legacyAddress: "etnkPPMb6BN24rzhF2LadK3RMn596R87dBidbV2m1UjpNniTMBQaFcD9cZFwfTvc6hN899kAjg6979oB1HXVFwRu4eCCKs0025",
        amount: WeiToEther("1"),
        txHash: "37af53586d6e40c2f70840e1d5949031b47456821aab87ae2e6f0e06c4fa7010"
    },
    {   // Valid inputs, multiple
        address: "0x0000000000000000000000000000000000000080",
        legacyAddress: "etnkPPMb6BN24rzhF2LadK3RMn596R87dBidbV2m1UjpNniTMBQaFcD9cZFwfTvc6hN899kAjg6979oB1HXVFwRu4eCCKs0006",
        amount: WeiToEther("1"),
        txHash: "37af53586d6e40c2f70840e1d5949031b47456821aab87ae2e6f0e06c4fa7011"
    },
    {   // Valid inputs, multiple
        address: "0x0000000000000000000000000000000000000080",
        legacyAddress: "etnkPPMb6BN24rzhF2LadK3RMn596R87dBidbV2m1UjpNniTMBQaFcD9cZFwfTvc6hN899kAjg6979oB1HXVFwRu4eCCKs0006",
        amount: WeiToEther("1"),
        txHash: "37af53586d6e40c2f70840e1d5949031b47456821aab87ae2e6f0e06c4fa7012"
    }
    ,
    {   // Valid inputs, multiple
        address: "0x0000000000000000000000000000000000000080",
        legacyAddress: "etnkPPMb6BN24rzhF2LadK3RMn596R87dBidbV2m1UjpNniTMBQaFcD9cZFwfTvc6hN899kAjg6979oB1HXVFwRu4eCCKs0006",
        amount: WeiToEther("1"),
        txHash: "37af53586d6e40c2f70840e1d5949031b47456821aab87ae2e6f0e06c4fa7013"
    }
]

async function assertCrosschainTransferResult(contract, testData, obj) {
    expect(await ethers.provider.getBalance(testData.address)).equal(obj.expectedEOABalance, "wrong user balance")
    expect(await ethers.provider.getBalance(contract.getAddress())).equal(obj.expectedContractBalance, "wrong contract balance")
    expect(await contract.getAddressFromLegacy(testData.legacyAddress)).equal(obj.expectedGetAddressFromLegacy, 'wrong address from getAddressFromLegacy()')

    const getLegacyETNAddressResult = await contract.getLegacyETNAddress(testData.address)
    
    expect(getLegacyETNAddressResult.length).to.equals(obj.expectedGetLegacyETNAddress.length)
    for(let i = 0; i < obj.expectedGetLegacyETNAddress.length; i++) {
        expect(getLegacyETNAddressResult[i]).to.equals(obj.expectedGetLegacyETNAddress[i], 'wrong legacy address from getLegacyETNAddress()')
    }

    const userTxHistory = await contract.getTxHistory(testData.address)
    expect(userTxHistory.length).equal(obj.expectedTXHistoryLength, 'wrong length in getTxHistory()')
    for(let i = 0; i < obj.expectedTXHistoryLength; i++) {
        expect(userTxHistory[i]).equal(obj.expectedTXHistoryHashList[i], 'wrong tx hash in getTxHistory()')
    }

    expect(await contract.getTxAmount(testData.txHash)).equal(obj.expectedGetTxAmount, 'wrong amount in getTxAmount()')
    expect(await contract.getTotalTxCount()).equal(obj.expectedTotalTxCount, 'wrong crosschain tx count in getTotalTxCount()')
    expect((await contract.getTotalCrosschainAmount()).toString()).equal(obj.expectedTotalCrosschainAmount.toString(), 'wrong total crosschain amount in getTotalCrosschainAmount()')
    expect(await contract.getLastCrosschainLegacyTxHash()).equal(obj.expectedLastCrosschainLegacyTxHash, 'wrong tx hash in getLastCrosschainLegacyTxHash()')
    expect(await contract.getAddressCosschainAmount(testData.address)).to.equals(obj.expectedAddressCrosschainBalance)
}

describe("ETNBridge initial setup", function () {
    
    async function deployETNBridge() {   
        // Contracts are deployed using the first signer/account by default
        const [owner] = await ethers.getSigners();
    
        const ETNBridgeFactory = await ethers.getContractFactory("ETNBridge");
        
        const ETNBridge = await upgrades.deployProxy(ETNBridgeFactory, undefined, { owner, kind: "uups" })
        return { ETNBridge, owner };
    }

    it("contract: initialize", async function () {
        const { ETNBridge, owner } = await loadFixture(deployETNBridge);
        expect(await ETNBridge.owner()).to.equals(owner.address, "wrong owner address")
    })

    it("crosschainTransfer: valid inputs, but 0 bridge balance", async function () {
        const { ETNBridge } = await loadFixture(deployETNBridge);

        const oldUserBalance = await ethers.provider.getBalance(testData[0].address)
        const oldContractBalance = await ethers.provider.getBalance(ETNBridge.getAddress())

        expect(ETNBridge.crosschainTransfer(testData[0].address, testData[0].legacyAddress, testData[0].amount, testData[0].txHash, true)).revertedWith("test")
        //await truffleAssert.reverts(contract.crosschainTransfer(testData[0].address, testData[0].legacyAddress, testData[0].amount, testData[0].txHash, true), "Insufficient ETN balance in the bridge contract")

        await assertCrosschainTransferResult(ETNBridge, testData[0], {
            expectedEOABalance: oldUserBalance,
            expectedContractBalance: oldContractBalance,
            expectedGetAddressFromLegacy: '0x0000000000000000000000000000000000000000',
            expectedGetLegacyETNAddress: [],
            expectedTXHistoryLength: 0,
            expectedTXHistoryHashList: [],
            expectedGetTxAmount: 0,
            expectedTotalTxCount: 0,
            expectedTotalCrosschainAmount: 0,
            expectedLastCrosschainLegacyTxHash: '',
            expectedAddressCrosschainBalance: 0
        })
    })

    it("receive: send balance to contract", async function () {
        const { ETNBridge, owner } = await loadFixture(deployETNBridge);

        const initTx = await owner.sendTransaction({
            to: ETNBridge.getAddress(),
            value: WeiToEther("1000"),
        })

        const expectedValue = WeiToEther("1000")
        
        // Assert DepositReceived event was emitted
        await expect(initTx).to.emit(ETNBridge, "DepositReceived").withArgs(owner.address, WeiToEther("1000"))

        const balance = await ethers.provider.getBalance(ETNBridge.getAddress())
        expect(balance).to.equals(expectedValue, "wrong contract balance")
    })
})

describe("ETNBridge crosschainTransfer", function () {

    let deployedETNBridge

    async function deployETNBridge() {   
        // Contracts are deployed using the first signer/account by default
        const [owner] = await ethers.getSigners();
    
        const ETNBridgeFactory = await ethers.getContractFactory("ETNBridge");
        
        const ETNBridge = await upgrades.deployProxy(ETNBridgeFactory, undefined, { owner, kind: "uups" })

        const tx = await owner.sendTransaction({
            to: ETNBridge.getAddress(),
            value: WeiToEther("1000"),
        })

        // Assert DepositReceived event was emitted
        await expect(tx).to.emit(ETNBridge, "DepositReceived").withArgs(owner.address, WeiToEther("1000"))

        deployedETNBridge = ETNBridge

        return { ETNBridge, owner };
    }

    it("crosschainTransfer: valid inputs ( oracle=true )", async function () {
        const { ETNBridge, owner } = await loadFixture(deployETNBridge);

        const currentTestData = testData[0]

        const oldUserBalance = await ethers.provider.getBalance(currentTestData.address)
        const oldContractBalance = await ethers.provider.getBalance(ETNBridge.getAddress())
        const oldTotalTxCount = await ETNBridge.getTotalTxCount()
        const oldTotalCrosschainAmount = await ETNBridge.getTotalCrosschainAmount()

        const tx = await ETNBridge.crosschainTransfer(currentTestData.address, currentTestData.legacyAddress, currentTestData.amount, currentTestData.txHash, true)

        await expect(tx).to.emit(ETNBridge, "CrossChainTransfer").withArgs(anyValue, currentTestData.legacyAddress, currentTestData.address, currentTestData.amount)

        await assertCrosschainTransferResult(ETNBridge, currentTestData, {
            expectedEOABalance: (new BN(oldUserBalance)).add(new BN(currentTestData.amount)),
            expectedContractBalance: (new BN(oldContractBalance)).sub(new BN(currentTestData.amount)),
            expectedGetAddressFromLegacy: currentTestData.address,
            expectedGetLegacyETNAddress: [currentTestData.legacyAddress],
            expectedTXHistoryLength: 1,
            expectedTXHistoryHashList: [currentTestData.txHash],
            expectedGetTxAmount: currentTestData.amount,
            expectedTotalTxCount: parseInt(oldTotalTxCount)+1,
            expectedTotalCrosschainAmount: (new BN(oldTotalCrosschainAmount)).add(new BN(currentTestData.amount)),
            expectedLastCrosschainLegacyTxHash: currentTestData.txHash,
            expectedAddressCrosschainBalance: currentTestData.amount
        })
    })

    it("crosschainTransfer: valid inputs ( oracle=false )", async function () {
        const ETNBridge = deployedETNBridge

        const currentTestData = testData[1]

        const oldUserBalance = await ethers.provider.getBalance(currentTestData.address)
        const oldContractBalance = await ethers.provider.getBalance(ETNBridge.getAddress())
        const oldTotalTxCount = await ETNBridge.getTotalTxCount()
        const oldTotalCrosschainAmount = await ETNBridge.getTotalCrosschainAmount()

        const tx = await ETNBridge.crosschainTransfer(currentTestData.address, currentTestData.legacyAddress, currentTestData.amount, currentTestData.txHash, false)

        // Assert CrossChainTransfer event was emitted
        await expect(tx).to.emit(ETNBridge, "CrossChainTransfer").withArgs(anyValue, currentTestData.legacyAddress, currentTestData.address, currentTestData.amount)

        await assertCrosschainTransferResult(ETNBridge, currentTestData, {
            expectedEOABalance: (new BN(oldUserBalance)).add(new BN(currentTestData.amount)),
            expectedContractBalance: (new BN(oldContractBalance)).sub(new BN(currentTestData.amount)),
            expectedGetAddressFromLegacy: currentTestData.address,
            expectedGetLegacyETNAddress: [currentTestData.legacyAddress],
            expectedTXHistoryLength: 1,
            expectedTXHistoryHashList: [currentTestData.txHash],
            expectedGetTxAmount: currentTestData.amount,
            expectedTotalTxCount: parseInt(oldTotalTxCount)+1,
            expectedTotalCrosschainAmount: (new BN(oldTotalCrosschainAmount)).add(new BN(testData[0].amount)),
            expectedLastCrosschainLegacyTxHash: testData[0].txHash,
            expectedAddressCrosschainBalance: currentTestData.amount
        })
    })

    it("crosschainTransfer: tx amount greater than contract balance", async function () {
        const ETNBridge = deployedETNBridge

        const currentTestData = testData[2]

        const oldUserBalance = await ethers.provider.getBalance(currentTestData.address)
        const oldContractBalance = await ethers.provider.getBalance(ETNBridge.getAddress())
        const oldTotalTxCount = await ETNBridge.getTotalTxCount()
        const oldTotalCrosschainAmount = await ETNBridge.getTotalCrosschainAmount()

        await expect(ETNBridge.crosschainTransfer(currentTestData.address, currentTestData.legacyAddress, currentTestData.amount, currentTestData.txHash, true)).revertedWith("Insufficient ETN balance in the bridge contract")

        await assertCrosschainTransferResult(ETNBridge, currentTestData, {
            expectedEOABalance: oldUserBalance,
            expectedContractBalance: oldContractBalance,
            expectedGetAddressFromLegacy: '0x0000000000000000000000000000000000000000',
            expectedGetLegacyETNAddress: [],
            expectedTXHistoryLength: 0,
            expectedTXHistoryHashList: [],
            expectedGetTxAmount: 0,
            expectedTotalTxCount: parseInt(oldTotalTxCount),
            expectedTotalCrosschainAmount: oldTotalCrosschainAmount,
            expectedLastCrosschainLegacyTxHash: testData[0].txHash,
            expectedAddressCrosschainBalance: 0
        })
    })

    it("crosschainTransfer: invalid legacy etn address ( < 98 )", async function () {
        const ETNBridge = deployedETNBridge

        const currentTestData = testData[3]

        const oldUserBalance = await ethers.provider.getBalance(currentTestData.address)
        const oldContractBalance = await ethers.provider.getBalance(ETNBridge.getAddress())
        const oldTotalTxCount = await ETNBridge.getTotalTxCount()
        const oldTotalCrosschainAmount = await ETNBridge.getTotalCrosschainAmount()

        await expect(ETNBridge.crosschainTransfer(currentTestData.address, currentTestData.legacyAddress, currentTestData.amount, currentTestData.txHash, true)).revertedWith("Invalid legacy ETN address")

        await assertCrosschainTransferResult(ETNBridge, currentTestData, {
            expectedEOABalance: oldUserBalance,
            expectedContractBalance: oldContractBalance,
            expectedGetAddressFromLegacy: '0x0000000000000000000000000000000000000000',
            expectedGetLegacyETNAddress: [],
            expectedTXHistoryLength: 0,
            expectedTXHistoryHashList: [],
            expectedGetTxAmount: 0,
            expectedTotalTxCount: parseInt(oldTotalTxCount),
            expectedTotalCrosschainAmount: oldTotalCrosschainAmount,
            expectedLastCrosschainLegacyTxHash: testData[0].txHash,
            expectedAddressCrosschainBalance: 0
        })
    })

    it("crosschainTransfer: invalid legacy etn address ( > 98 )", async function () {
        const ETNBridge = deployedETNBridge

        const currentTestData = testData[4]

        const oldUserBalance = await ethers.provider.getBalance(currentTestData.address)
        const oldContractBalance = await ethers.provider.getBalance(ETNBridge.getAddress())
        const oldTotalTxCount = await ETNBridge.getTotalTxCount()
        const oldTotalCrosschainAmount = await ETNBridge.getTotalCrosschainAmount()

        await expect(ETNBridge.crosschainTransfer(currentTestData.address, currentTestData.legacyAddress, currentTestData.amount, currentTestData.txHash, true)).revertedWith("Invalid legacy ETN address")

        await assertCrosschainTransferResult(ETNBridge, currentTestData, {
            expectedEOABalance: oldUserBalance,
            expectedContractBalance: oldContractBalance,
            expectedGetAddressFromLegacy: '0x0000000000000000000000000000000000000000',
            expectedGetLegacyETNAddress: [],
            expectedTXHistoryLength: 0,
            expectedTXHistoryHashList: [],
            expectedGetTxAmount: 0,
            expectedTotalTxCount: parseInt(oldTotalTxCount),
            expectedTotalCrosschainAmount: oldTotalCrosschainAmount,
            expectedLastCrosschainLegacyTxHash: testData[0].txHash,
            expectedAddressCrosschainBalance: 0
        })
    })

    it("crosschainTransfer: invalid sc etn address ( 0x0 )", async function () {
        const ETNBridge = deployedETNBridge

        const currentTestData = testData[5]

        const oldUserBalance = await ethers.provider.getBalance(currentTestData.address)
        const oldContractBalance = await ethers.provider.getBalance(ETNBridge.getAddress())
        const oldTotalTxCount = await ETNBridge.getTotalTxCount()
        const oldTotalCrosschainAmount = await ETNBridge.getTotalCrosschainAmount()

        await expect(ETNBridge.crosschainTransfer(currentTestData.address, currentTestData.legacyAddress, currentTestData.amount, currentTestData.txHash, true)).rejectedWith("Invalid address")

        await assertCrosschainTransferResult(ETNBridge, currentTestData, {
            expectedEOABalance: oldUserBalance,
            expectedContractBalance: oldContractBalance,
            expectedGetAddressFromLegacy: '0x0000000000000000000000000000000000000000',
            expectedGetLegacyETNAddress: [],
            expectedTXHistoryLength: 0,
            expectedTXHistoryHashList: [],
            expectedGetTxAmount: 0,
            expectedTotalTxCount: parseInt(oldTotalTxCount),
            expectedTotalCrosschainAmount: oldTotalCrosschainAmount,
            expectedLastCrosschainLegacyTxHash: testData[0].txHash,
            expectedAddressCrosschainBalance: 0
        })
    })

    it("crosschainTransfer: invalid tx hash", async function () {
        const ETNBridge = deployedETNBridge

        const currentTestData = testData[6]

        const oldUserBalance = await ethers.provider.getBalance(currentTestData.address)
        const oldContractBalance = await ethers.provider.getBalance(ETNBridge.getAddress())
        const oldTotalTxCount = await ETNBridge.getTotalTxCount()
        const oldTotalCrosschainAmount = await ETNBridge.getTotalCrosschainAmount()

        await expect(ETNBridge.crosschainTransfer(currentTestData.address, currentTestData.legacyAddress, currentTestData.amount, currentTestData.txHash, true)).revertedWith("Invalid transaction hash")

        await assertCrosschainTransferResult(ETNBridge, currentTestData, {
            expectedEOABalance: oldUserBalance,
            expectedContractBalance: oldContractBalance,
            expectedGetAddressFromLegacy: '0x0000000000000000000000000000000000000000',
            expectedGetLegacyETNAddress: [],
            expectedTXHistoryLength: 0,
            expectedTXHistoryHashList: [],
            expectedGetTxAmount: 0,
            expectedTotalTxCount: parseInt(oldTotalTxCount),
            expectedTotalCrosschainAmount: oldTotalCrosschainAmount,
            expectedLastCrosschainLegacyTxHash: testData[0].txHash,
            expectedAddressCrosschainBalance: 0
        })
    })

    it("crosschainTransfer: duplicate tx hash", async function () {
        const ETNBridge = deployedETNBridge

        const currentTestData = testData[7]

        const oldUserBalance = await ethers.provider.getBalance(currentTestData.address)
        const oldContractBalance = await ethers.provider.getBalance(ETNBridge.getAddress())
        const oldTotalTxCount = await ETNBridge.getTotalTxCount()
        const oldTotalCrosschainAmount = await ETNBridge.getTotalCrosschainAmount()

        await expect(ETNBridge.crosschainTransfer(currentTestData.address, currentTestData.legacyAddress, currentTestData.amount, currentTestData.txHash, true)).revertedWith("Duplicate crosschain transaction")

        await assertCrosschainTransferResult(ETNBridge, currentTestData, {
            expectedEOABalance: oldUserBalance,
            expectedContractBalance: oldContractBalance,
            expectedGetAddressFromLegacy: '0x0000000000000000000000000000000000000000',
            expectedGetLegacyETNAddress: [],
            expectedTXHistoryLength: 0,
            expectedTXHistoryHashList: [],
            expectedGetTxAmount: testData[0].amount,
            expectedTotalTxCount: parseInt(oldTotalTxCount),
            expectedTotalCrosschainAmount: oldTotalCrosschainAmount,
            expectedLastCrosschainLegacyTxHash: testData[0].txHash,
            expectedAddressCrosschainBalance: 0
        })
    })

    it("crosschainTransfer: legacy etn address mapped to a different sc address", async function () {
        const ETNBridge = deployedETNBridge

        const currentTestData = testData[8]

        const oldUserBalance = await ethers.provider.getBalance(currentTestData.address)
        const oldContractBalance = await ethers.provider.getBalance(ETNBridge.getAddress())
        const oldTotalTxCount = await ETNBridge.getTotalTxCount()
        const oldTotalCrosschainAmount = await ETNBridge.getTotalCrosschainAmount()

        await expect(ETNBridge.crosschainTransfer(currentTestData.address, currentTestData.legacyAddress, currentTestData.amount, currentTestData.txHash, true)).revertedWith("This legacy ETN address is already mapped to a different address")

        await assertCrosschainTransferResult(ETNBridge, currentTestData, {
            expectedEOABalance: oldUserBalance,
            expectedContractBalance: oldContractBalance,
            expectedGetAddressFromLegacy: testData[1].address,
            expectedGetLegacyETNAddress: [],
            expectedTXHistoryLength: 0,
            expectedTXHistoryHashList: [],
            expectedGetTxAmount: 0,
            expectedTotalTxCount: parseInt(oldTotalTxCount),
            expectedTotalCrosschainAmount: oldTotalCrosschainAmount,
            expectedLastCrosschainLegacyTxHash: testData[0].txHash,
            expectedAddressCrosschainBalance: 0
        })
    })

    it("crosschainTransfer: sc address mapped to a different legacy address (1)", async function () {
        const ETNBridge = deployedETNBridge

        const currentTestData = testData[9]

        const oldUserBalance = await ethers.provider.getBalance(currentTestData.address)
        const oldContractBalance = await ethers.provider.getBalance(ETNBridge.getAddress())
        const oldTotalTxCount = await ETNBridge.getTotalTxCount()
        const oldTotalCrosschainAmount = await ETNBridge.getTotalCrosschainAmount()

        const tx = await ETNBridge.crosschainTransfer(currentTestData.address, currentTestData.legacyAddress, currentTestData.amount, currentTestData.txHash, true)

        // Assert CrossChainTransfer event was emitted
        await expect(tx).to.emit(ETNBridge, 'CrossChainTransfer').withArgs(anyValue, currentTestData.legacyAddress, currentTestData.address, currentTestData.amount)

        await assertCrosschainTransferResult(ETNBridge, currentTestData, {
            expectedEOABalance: (new BN(oldUserBalance)).add(new BN(currentTestData.amount)),
            expectedContractBalance: (new BN(oldContractBalance)).sub(new BN(currentTestData.amount)),
            expectedGetAddressFromLegacy: currentTestData.address,
            expectedGetLegacyETNAddress: [currentTestData.legacyAddress],
            expectedTXHistoryLength: 1,
            expectedTXHistoryHashList: [currentTestData.txHash],
            expectedGetTxAmount: currentTestData.amount,
            expectedTotalTxCount: parseInt(oldTotalTxCount)+1,
            expectedTotalCrosschainAmount: (new BN(oldTotalCrosschainAmount)).add(new BN(currentTestData.amount)),
            expectedLastCrosschainLegacyTxHash: currentTestData.txHash,
            expectedAddressCrosschainBalance: currentTestData.amount
        })
    })

    it("crosschainTransfer: sc address mapped to a different legacy address (2)", async function () {
        const ETNBridge = deployedETNBridge

        const currentTestData = testData[10]

        const oldUserBalance = await ethers.provider.getBalance(currentTestData.address)
        const oldContractBalance = await ethers.provider.getBalance(ETNBridge.getAddress())
        const oldTotalTxCount = await ETNBridge.getTotalTxCount()
        const oldTotalCrosschainAmount = await ETNBridge.getTotalCrosschainAmount()

        const tx = await ETNBridge.crosschainTransfer(currentTestData.address, currentTestData.legacyAddress, currentTestData.amount, currentTestData.txHash, true)

        // Assert CrossChainTransfer event was emitted
        await expect(tx).to.emit(ETNBridge, 'CrossChainTransfer').withArgs(anyValue, currentTestData.legacyAddress, currentTestData.address, currentTestData.amount)

        await assertCrosschainTransferResult(ETNBridge, currentTestData, {
            expectedEOABalance: (new BN(oldUserBalance)).add(new BN(currentTestData.amount)),
            expectedContractBalance: (new BN(oldContractBalance)).sub(new BN(currentTestData.amount)),
            expectedGetAddressFromLegacy: currentTestData.address,
            expectedGetLegacyETNAddress: [testData[9].legacyAddress, currentTestData.legacyAddress],
            expectedTXHistoryLength: 2,
            expectedTXHistoryHashList: [testData[9].txHash, currentTestData.txHash],
            expectedGetTxAmount: currentTestData.amount,
            expectedTotalTxCount: parseInt(oldTotalTxCount)+1,
            expectedTotalCrosschainAmount: (new BN(oldTotalCrosschainAmount)).add(new BN(currentTestData.amount)),
            expectedLastCrosschainLegacyTxHash: currentTestData.txHash,
            expectedAddressCrosschainBalance: (new BN(testData[9].amount)).add(new BN(currentTestData.amount))
        })
    })

    it("crosschainTransfer: sc address mapped to a different legacy address (3)", async function () {
        const ETNBridge = deployedETNBridge

        const currentTestData = testData[11]

        const oldUserBalance = await ethers.provider.getBalance(currentTestData.address)
        const oldContractBalance = await ethers.provider.getBalance(ETNBridge.getAddress())
        const oldTotalTxCount = await ETNBridge.getTotalTxCount()
        const oldTotalCrosschainAmount = await ETNBridge.getTotalCrosschainAmount()

        const tx = await ETNBridge.crosschainTransfer(currentTestData.address, currentTestData.legacyAddress, currentTestData.amount, currentTestData.txHash, true)

        // Assert CrossChainTransfer event was emitted
        await expect(tx).to.emit(ETNBridge, 'CrossChainTransfer').withArgs(anyValue, currentTestData.legacyAddress, currentTestData.address, currentTestData.amount)

        await assertCrosschainTransferResult(ETNBridge, currentTestData, {
            expectedEOABalance: (new BN(oldUserBalance)).add(new BN(currentTestData.amount)),
            expectedContractBalance: (new BN(oldContractBalance)).sub(new BN(currentTestData.amount)),
            expectedGetAddressFromLegacy: currentTestData.address,
            expectedGetLegacyETNAddress: [testData[9].legacyAddress, testData[10].legacyAddress, currentTestData.legacyAddress],
            expectedTXHistoryLength: 3,
            expectedTXHistoryHashList: [testData[9].txHash, testData[10].txHash, currentTestData.txHash],
            expectedGetTxAmount: currentTestData.amount,
            expectedTotalTxCount: parseInt(oldTotalTxCount)+1,
            expectedTotalCrosschainAmount: (new BN(oldTotalCrosschainAmount)).add(new BN(currentTestData.amount)),
            expectedLastCrosschainLegacyTxHash: currentTestData.txHash,
            expectedAddressCrosschainBalance: (new BN(testData[9].amount)).add(new BN(testData[10].amount)).add(new BN(currentTestData.amount))
        })
    })

    it("crosschainTransfer: valid inputs, same address, different tx hashes (1)", async function () {
        const ETNBridge = deployedETNBridge

        const currentTestData = testData[12]

        const oldUserBalance = await ethers.provider.getBalance(currentTestData.address)
        const oldContractBalance = await ethers.provider.getBalance(ETNBridge.getAddress())
        const oldTotalTxCount = await ETNBridge.getTotalTxCount()
        const oldTotalCrosschainAmount = await ETNBridge.getTotalCrosschainAmount()

        const tx = await ETNBridge.crosschainTransfer(currentTestData.address, currentTestData.legacyAddress, currentTestData.amount, currentTestData.txHash, true)

        // Assert CrossChainTransfer event was emitted
        await expect(tx).to.emit(ETNBridge, 'CrossChainTransfer').withArgs(anyValue, currentTestData.legacyAddress, currentTestData.address, currentTestData.amount)

        await assertCrosschainTransferResult(ETNBridge, currentTestData, {
            expectedEOABalance: (new BN(oldUserBalance)).add(new BN(currentTestData.amount)),
            expectedContractBalance: (new BN(oldContractBalance)).sub(new BN(currentTestData.amount)),
            expectedGetAddressFromLegacy: currentTestData.address,
            expectedGetLegacyETNAddress: [currentTestData.legacyAddress],
            expectedTXHistoryLength: 1,
            expectedTXHistoryHashList: [currentTestData.txHash],
            expectedGetTxAmount: currentTestData.amount,
            expectedTotalTxCount: parseInt(oldTotalTxCount)+1,
            expectedTotalCrosschainAmount: (new BN(oldTotalCrosschainAmount)).add(new BN(testData[0].amount)),
            expectedLastCrosschainLegacyTxHash: currentTestData.txHash,
            expectedAddressCrosschainBalance: currentTestData.amount
        })
    })

    it("crosschainTransfer: valid inputs, same address, different tx hashes (2)", async function () {
        const ETNBridge = deployedETNBridge

        const currentTestData = testData[13]

        const oldUserBalance = await ethers.provider.getBalance(currentTestData.address)
        const oldContractBalance = await ethers.provider.getBalance(ETNBridge.getAddress())
        const oldTotalTxCount = await ETNBridge.getTotalTxCount()
        const oldTotalCrosschainAmount = await ETNBridge.getTotalCrosschainAmount()

        const tx = await ETNBridge.crosschainTransfer(currentTestData.address, currentTestData.legacyAddress, currentTestData.amount, currentTestData.txHash, true)

        // Assert CrossChainTransfer event was emitted
        await expect(tx).to.emit(ETNBridge, 'CrossChainTransfer').withArgs(anyValue, currentTestData.legacyAddress, currentTestData.address, currentTestData.amount)

        await assertCrosschainTransferResult(ETNBridge, currentTestData, {
            expectedEOABalance: (new BN(oldUserBalance)).add(new BN(currentTestData.amount)),
            expectedContractBalance: (new BN(oldContractBalance)).sub(new BN(currentTestData.amount)),
            expectedGetAddressFromLegacy: currentTestData.address,
            expectedGetLegacyETNAddress: [currentTestData.legacyAddress],
            expectedTXHistoryLength: 2,
            expectedTXHistoryHashList: [testData[12].txHash, currentTestData.txHash],
            expectedGetTxAmount: currentTestData.amount,
            expectedTotalTxCount: parseInt(oldTotalTxCount)+1,
            expectedTotalCrosschainAmount: (new BN(oldTotalCrosschainAmount)).add(new BN(testData[0].amount)),
            expectedLastCrosschainLegacyTxHash: currentTestData.txHash,
            expectedAddressCrosschainBalance: (new BN(testData[12].amount)).add(new BN(currentTestData.amount))
        })
    })

    it("crosschainTransfer: valid inputs, same address, different tx hashes (3)", async function () {
        const ETNBridge = deployedETNBridge

        const currentTestData = testData[14]

        const oldUserBalance = await ethers.provider.getBalance(currentTestData.address)
        const oldContractBalance = await ethers.provider.getBalance(ETNBridge.getAddress())
        const oldTotalTxCount = await ETNBridge.getTotalTxCount()
        const oldTotalCrosschainAmount = await ETNBridge.getTotalCrosschainAmount()

        const tx = await ETNBridge.crosschainTransfer(currentTestData.address, currentTestData.legacyAddress, currentTestData.amount, currentTestData.txHash, true)

        // Assert CrossChainTransfer event was emitted
        await expect(tx).to.emit(ETNBridge, 'CrossChainTransfer').withArgs(anyValue, currentTestData.legacyAddress, currentTestData.address, currentTestData.amount)

        await assertCrosschainTransferResult(ETNBridge, currentTestData, {
            expectedEOABalance: (new BN(oldUserBalance)).add(new BN(currentTestData.amount)),
            expectedContractBalance: (new BN(oldContractBalance)).sub(new BN(currentTestData.amount)),
            expectedGetAddressFromLegacy: currentTestData.address,
            expectedGetLegacyETNAddress: [currentTestData.legacyAddress],
            expectedTXHistoryLength: 3,
            expectedTXHistoryHashList: [testData[12].txHash, testData[13].txHash, currentTestData.txHash],
            expectedGetTxAmount: currentTestData.amount,
            expectedTotalTxCount: parseInt(oldTotalTxCount)+1,
            expectedTotalCrosschainAmount: (new BN(oldTotalCrosschainAmount)).add(new BN(testData[0].amount)),
            expectedLastCrosschainLegacyTxHash: currentTestData.txHash,
            expectedAddressCrosschainBalance: (new BN(testData[12].amount)).add(new BN(testData[13].amount)).add(new BN(currentTestData.amount))
        })
    })
})