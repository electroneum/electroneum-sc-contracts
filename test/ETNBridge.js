const { deployProxy } = require('@openzeppelin/truffle-upgrades');
const ETNBridge = artifacts.require("ETNBridge")
const truffleAssert = require('truffle-assertions')
const BN = require("bn.js/lib/bn")

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("ETNBridge", function (accounts) {

    const testData = [
        {   // Valid inputs 1
            address: "0x0000000000000000000000000000000000000010",
            legacyAddress: "etnkPPMb6BN24rzhF2LadK3RMn596R87dBidbV2m1UjpNniTMBQaFcD9cZFwfTvc6hN899kAjg6979oB1HXVFwRu4eCCKs0001",
            amount: web3.utils.toWei("1", "ether"),
            txHash: "37af53586d6e40c2f70840e1d5949031b47456821aab87ae2e6f0e06c4fa7001"
        },
        {   // Valid inputs 2
            address: "0x0000000000000000000000000000000000000020",
            legacyAddress: "etnkPPMb6BN24rzhF2LadK3RMn596R87dBidbV2m1UjpNniTMBQaFcD9cZFwfTvc6hN899kAjg6979oB1HXVFwRu4eCCKs0002",
            amount: web3.utils.toWei("1", "ether"),
            txHash: "37af53586d6e40c2f70840e1d5949031b47456821aab87ae2e6f0e06c4fa7002"
        },
        {   // Amount greater than contract's balance
            address: "0x0000000000000000000000000000000000000030",
            legacyAddress: "etnkPPMb6BN24rzhF2LadK3RMn596R87dBidbV2m1UjpNniTMBQaFcD9cZFwfTvc6hN899kAjg6979oB1HXVFwRu4eCCKs0003",
            amount: web3.utils.toWei("10000", "ether"),
            txHash: "37af53586d6e40c2f70840e1d5949031b47456821aab87ae2e6f0e06c4fa7003"
        },
        {   // Invalid legacy etn address 1
            address: "0x0000000000000000000000000000000000000040",
            legacyAddress: "etnkPPMb6BN24rzhF2LadK3",
            amount: web3.utils.toWei("1", "ether"),
            txHash: "37af53586d6e40c2f70840e1d5949031b47456821aab87ae2e6f0e06c4fa7004"
        },
        {   // Invalid legacy etn address 2
            address: "0x0000000000000000000000000000000000000050",
            legacyAddress: "etnkPPMb6BN24rzhF2LadK3RMn596R87dBidbV2m1UjpNniTMBQaFcD9cZFwfTvc6hN899kAjg6979oB1HXVFwRu4eCCKs000300000000000000000",
            amount: web3.utils.toWei("1", "ether"),
            txHash: "37af53586d6e40c2f70840e1d5949031b47456821aab87ae2e6f0e06c4fa7005"
        },
        {   // Invalid sc etn address
            address: "0x0000000000000000000000000000000000000000",
            legacyAddress: "etnkPPMb6BN24rzhF2LadK3RMn596R87dBidbV2m1UjpNniTMBQaFcD9cZFwfTvc6hN899kAjg6979oB1HXVFwRu4eCCKs0003",
            amount: web3.utils.toWei("1", "ether"),
            txHash: "37af53586d6e40c2f70840e1d5949031b47456821aab87ae2e6f0e06c4fa7006"
        },
        {   // Invalid tx hash
            address: "0x0000000000000000000000000000000000000060",
            legacyAddress: "etnkPPMb6BN24rzhF2LadK3RMn596R87dBidbV2m1UjpNniTMBQaFcD9cZFwfTvc6hN899kAjg6979oB1HXVFwRu4eCCKs0004",
            amount: web3.utils.toWei("1", "ether"),
            txHash: "37af53586d6e40c2f70840e1d5949031b47456821aab87ae2e6f0e06c4fa70020000"
        },
        {   // Duplicate tx hash
            address: "0x0000000000000000000000000000000000000060",
            legacyAddress: "etnkPPMb6BN24rzhF2LadK3RMn596R87dBidbV2m1UjpNniTMBQaFcD9cZFwfTvc6hN899kAjg6979oB1HXVFwRu4eCCKs0004",
            amount: web3.utils.toWei("1", "ether"),
            txHash: "37af53586d6e40c2f70840e1d5949031b47456821aab87ae2e6f0e06c4fa7002"
        },
        {   // Legacy etn address mapped to a different sc address
            address: "0x0000000000000000000000000000000000000060",
            legacyAddress: "etnkPPMb6BN24rzhF2LadK3RMn596R87dBidbV2m1UjpNniTMBQaFcD9cZFwfTvc6hN899kAjg6979oB1HXVFwRu4eCCKs0002",
            amount: web3.utils.toWei("1", "ether"),
            txHash: "37af53586d6e40c2f70840e1d5949031b47456821aab87ae2e6f0e06c4fa7007"
        },
        {   // SC Address mapped to a different legacy address
            address: "0x0000000000000000000000000000000000000020",
            legacyAddress: "etnkPPMb6BN24rzhF2LadK3RMn596R87dBidbV2m1UjpNniTMBQaFcD9cZFwfTvc6hN899kAjg6979oB1HXVFwRu4eCCKs0005",
            amount: web3.utils.toWei("1", "ether"),
            txHash: "37af53586d6e40c2f70840e1d5949031b47456821aab87ae2e6f0e06c4fa7008"
        },
        {   // Valid inputs, multiple
            address: "0x0000000000000000000000000000000000000020",
            legacyAddress: "etnkPPMb6BN24rzhF2LadK3RMn596R87dBidbV2m1UjpNniTMBQaFcD9cZFwfTvc6hN899kAjg6979oB1HXVFwRu4eCCKs0002",
            amount: web3.utils.toWei("1", "ether"),
            txHash: "37af53586d6e40c2f70840e1d5949031b47456821aab87ae2e6f0e06c4fa7009"
        },
        {   // Valid inputs, multiple
            address: "0x0000000000000000000000000000000000000020",
            legacyAddress: "etnkPPMb6BN24rzhF2LadK3RMn596R87dBidbV2m1UjpNniTMBQaFcD9cZFwfTvc6hN899kAjg6979oB1HXVFwRu4eCCKs0002",
            amount: web3.utils.toWei("1", "ether"),
            txHash: "37af53586d6e40c2f70840e1d5949031b47456821aab87ae2e6f0e06c4fa7010"
        }
        ,
        {   // Valid inputs, multiple
            address: "0x0000000000000000000000000000000000000020",
            legacyAddress: "etnkPPMb6BN24rzhF2LadK3RMn596R87dBidbV2m1UjpNniTMBQaFcD9cZFwfTvc6hN899kAjg6979oB1HXVFwRu4eCCKs0002",
            amount: web3.utils.toWei("1", "ether"),
            txHash: "37af53586d6e40c2f70840e1d5949031b47456821aab87ae2e6f0e06c4fa7011"
        }
    ]

    async function assertCrosschainTransferResult(contract, testData, obj) {
        assert.equal(await web3.eth.getBalance(testData.address), obj.expectedEOABalance, "wrong user balance")
        assert.equal(await web3.eth.getBalance(contract.address), obj.expectedContractBalance, "wrong contract balance")
        assert.equal(await contract.getAddressFromLegacy(testData.legacyAddress), obj.expectedGetAddressFromLegacy, 'wrong address from getAddressFromLegacy()')
        assert.equal(await contract.getLegacyETNAddress(testData.address), obj.expectedGetLegacyETNAddress, 'wrong legacy address from getLegacyETNAddress()')

        const userTxHistory = await contract.getTxHistory(testData.address)
        assert.equal(userTxHistory.length, obj.expectedTXHistoryLength, 'wrong length in getTxHistory()')
        for(let i = 0; i < obj.txHistoryLength; i++) {
            assert.equal(userTxHistory[i], obj.expectedTXHistoryHashList[i], 'wrong tx hash in getTxHistory()')
        }

        assert.equal(await contract.getTxAmount(testData.txHash), obj.expectedGetTxAmount, 'wrong amount in getTxAmount()')
        assert.equal(await contract.getTotalTxCount(), obj.expectedTotalTxCount, 'wrong crosschain tx count in getTotalTxCount()')
        assert.equal((await contract.getTotalCrosschainAmount()).toString(), obj.expectedTotalCrosschainAmount.toString(), 'wrong total crosschain amount in getTotalCrosschainAmount()')
        assert.equal(await contract.getLastCrosschainLegacyTxHash(), obj.expectedLastCrosschainLegacyTxHash, 'wrong tx hash in getLastCrosschainLegacyTxHash()')
    }

    it("contract: initialize", async function () {
        const contract = await ETNBridge.deployed()

        const expectedOwnerAddress = accounts[0]
        const ownerAddress = await contract.owner()

        assert.equal(ownerAddress.toString(), expectedOwnerAddress.toString(), "wrong owner address")
    })

    it("crosschainTransfer: valid inputs, but 0 bridge balance", async function () {
        const contract = await ETNBridge.deployed()

        const oldUserBalance = await web3.eth.getBalance(testData[0].address)
        const oldContractBalance = await web3.eth.getBalance(contract.address)

        await truffleAssert.reverts(contract.crosschainTransfer(testData[0].address, testData[0].legacyAddress, testData[0].amount, testData[0].txHash, true), "Insufficient ETN balance in the bridge contract")

        await assertCrosschainTransferResult(contract, testData[0], {
            expectedEOABalance: oldUserBalance,
            expectedContractBalance: oldContractBalance,
            expectedGetAddressFromLegacy: '0x0000000000000000000000000000000000000000',
            expectedGetLegacyETNAddress: '',
            expectedTXHistoryLength: 0,
            expectedTXHistoryHashList: [],
            expectedGetTxAmount: 0,
            expectedTotalTxCount: 0,
            expectedTotalCrosschainAmount: 0,
            expectedLastCrosschainLegacyTxHash: ''
        })
    })

    it("receive: send balance to contract", async function () {
        const contract = await ETNBridge.deployed()

        const expectedBalance = web3.utils.toWei("1000", "ether")
        const initTx = await contract.send(expectedBalance)

        // Assert DepositReceived event was emitted
        truffleAssert.eventEmitted(initTx, 'DepositReceived', (ev) => {
            assert.equal(ev._from, accounts[0], 'DepositReceived Event: wrong sender address')
            assert.equal(ev._value, expectedBalance, 'DepositReceived Event: wrong deposit amount')
            return true
        })

        const balance = await web3.eth.getBalance(contract.address)
        assert.equal(balance, expectedBalance, "wrong contract balance")
    })

    it("crosschainTransfer: valid inputs ( oracle=true )", async function () {
        const contract = await ETNBridge.deployed()

        const currentTestData = testData[0]

        const oldUserBalance = await web3.eth.getBalance(currentTestData.address)
        const oldContractBalance = await web3.eth.getBalance(contract.address)
        const oldTotalTxCount = await contract.getTotalTxCount()
        const oldTotalCrosschainAmount = await contract.getTotalCrosschainAmount()

        const tx = await contract.crosschainTransfer(currentTestData.address, currentTestData.legacyAddress, currentTestData.amount, currentTestData.txHash, true)

        // Assert CrossChainTransfer event was emitted
        truffleAssert.eventEmitted(tx, 'CrossChainTransfer', (ev) => {
            assert.equal(ev._from, currentTestData.legacyAddress, "CrossChainTransfer Event: wrong etn-sc address")
            assert.equal(ev._to, currentTestData.address, "CrossChainTransfer Event: wrong etn-sc address")
            assert.equal(ev._value, currentTestData.amount, "CrossChainTransfer Event: wrong amount")
            return true
        })

        await assertCrosschainTransferResult(contract, currentTestData, {
            expectedEOABalance: (new BN(oldUserBalance)).add(new BN(currentTestData.amount)),
            expectedContractBalance: (new BN(oldContractBalance)).sub(new BN(currentTestData.amount)),
            expectedGetAddressFromLegacy: currentTestData.address,
            expectedGetLegacyETNAddress: currentTestData.legacyAddress,
            expectedTXHistoryLength: 1,
            expectedTXHistoryHashList: [currentTestData.txHash],
            expectedGetTxAmount: currentTestData.amount,
            expectedTotalTxCount: parseInt(oldTotalTxCount)+1,
            expectedTotalCrosschainAmount: (new BN(oldTotalCrosschainAmount)).add(new BN(currentTestData.amount)),
            expectedLastCrosschainLegacyTxHash: currentTestData.txHash
        })
    })

    it("crosschainTransfer: valid inputs ( oracle=false )", async function () {
        const contract = await ETNBridge.deployed()

        const currentTestData = testData[1]

        const oldUserBalance = await web3.eth.getBalance(currentTestData.address)
        const oldContractBalance = await web3.eth.getBalance(contract.address)
        const oldTotalTxCount = await contract.getTotalTxCount()
        const oldTotalCrosschainAmount = await contract.getTotalCrosschainAmount()

        const tx = await contract.crosschainTransfer(currentTestData.address, currentTestData.legacyAddress, currentTestData.amount, currentTestData.txHash, false)

        // Assert CrossChainTransfer event was emitted
        truffleAssert.eventEmitted(tx, 'CrossChainTransfer', (ev) => {
            assert.equal(ev._from, currentTestData.legacyAddress, "CrossChainTransfer Event: wrong etn-sc address")
            assert.equal(ev._to, currentTestData.address, "CrossChainTransfer Event: wrong etn-sc address")
            assert.equal(ev._value, currentTestData.amount, "CrossChainTransfer Event: wrong amount")
            return true
        })

        await assertCrosschainTransferResult(contract, currentTestData, {
            expectedEOABalance: (new BN(oldUserBalance)).add(new BN(currentTestData.amount)),
            expectedContractBalance: (new BN(oldContractBalance)).sub(new BN(currentTestData.amount)),
            expectedGetAddressFromLegacy: currentTestData.address,
            expectedGetLegacyETNAddress: currentTestData.legacyAddress,
            expectedTXHistoryLength: 1,
            expectedTXHistoryHashList: [currentTestData.txHash],
            expectedGetTxAmount: currentTestData.amount,
            expectedTotalTxCount: parseInt(oldTotalTxCount)+1,
            expectedTotalCrosschainAmount: (new BN(oldTotalCrosschainAmount)).add(new BN(testData[0].amount)),
            expectedLastCrosschainLegacyTxHash: testData[0].txHash
        })
    })

    it("crosschainTransfer: tx amount greater than contract balance", async function () {
        const contract = await ETNBridge.deployed()

        const currentTestData = testData[2]

        const oldUserBalance = await web3.eth.getBalance(currentTestData.address)
        const oldContractBalance = await web3.eth.getBalance(contract.address)
        const oldTotalTxCount = await contract.getTotalTxCount()
        const oldTotalCrosschainAmount = await contract.getTotalCrosschainAmount()

        await truffleAssert.reverts(contract.crosschainTransfer(currentTestData.address, currentTestData.legacyAddress, currentTestData.amount, currentTestData.txHash, true), "Insufficient ETN balance in the bridge contract")

        await assertCrosschainTransferResult(contract, currentTestData, {
            expectedEOABalance: oldUserBalance,
            expectedContractBalance: oldContractBalance,
            expectedGetAddressFromLegacy: '0x0000000000000000000000000000000000000000',
            expectedGetLegacyETNAddress: '',
            expectedTXHistoryLength: 0,
            expectedTXHistoryHashList: [],
            expectedGetTxAmount: 0,
            expectedTotalTxCount: parseInt(oldTotalTxCount),
            expectedTotalCrosschainAmount: oldTotalCrosschainAmount,
            expectedLastCrosschainLegacyTxHash: testData[0].txHash
        })
    })

    it("crosschainTransfer: invalid legacy etn address ( < 98 )", async function () {
        const contract = await ETNBridge.deployed()

        const currentTestData = testData[3]

        const oldUserBalance = await web3.eth.getBalance(currentTestData.address)
        const oldContractBalance = await web3.eth.getBalance(contract.address)
        const oldTotalTxCount = await contract.getTotalTxCount()
        const oldTotalCrosschainAmount = await contract.getTotalCrosschainAmount()

        await truffleAssert.reverts(contract.crosschainTransfer(currentTestData.address, currentTestData.legacyAddress, currentTestData.amount, currentTestData.txHash, true), "Invalid legacy ETN address")

        await assertCrosschainTransferResult(contract, currentTestData, {
            expectedEOABalance: oldUserBalance,
            expectedContractBalance: oldContractBalance,
            expectedGetAddressFromLegacy: '0x0000000000000000000000000000000000000000',
            expectedGetLegacyETNAddress: '',
            expectedTXHistoryLength: 0,
            expectedTXHistoryHashList: [],
            expectedGetTxAmount: 0,
            expectedTotalTxCount: parseInt(oldTotalTxCount),
            expectedTotalCrosschainAmount: oldTotalCrosschainAmount,
            expectedLastCrosschainLegacyTxHash: testData[0].txHash
        })
    })

    it("crosschainTransfer: invalid legacy etn address ( > 98 )", async function () {
        const contract = await ETNBridge.deployed()

        const currentTestData = testData[4]

        const oldUserBalance = await web3.eth.getBalance(currentTestData.address)
        const oldContractBalance = await web3.eth.getBalance(contract.address)
        const oldTotalTxCount = await contract.getTotalTxCount()
        const oldTotalCrosschainAmount = await contract.getTotalCrosschainAmount()

        await truffleAssert.reverts(contract.crosschainTransfer(currentTestData.address, currentTestData.legacyAddress, currentTestData.amount, currentTestData.txHash, true), "Invalid legacy ETN address")

        await assertCrosschainTransferResult(contract, currentTestData, {
            expectedEOABalance: oldUserBalance,
            expectedContractBalance: oldContractBalance,
            expectedGetAddressFromLegacy: '0x0000000000000000000000000000000000000000',
            expectedGetLegacyETNAddress: '',
            expectedTXHistoryLength: 0,
            expectedTXHistoryHashList: [],
            expectedGetTxAmount: 0,
            expectedTotalTxCount: parseInt(oldTotalTxCount),
            expectedTotalCrosschainAmount: oldTotalCrosschainAmount,
            expectedLastCrosschainLegacyTxHash: testData[0].txHash
        })
    })

    it("crosschainTransfer: invalid sc etn address ( 0x0 )", async function () {
        const contract = await ETNBridge.deployed()

        const currentTestData = testData[5]

        const oldUserBalance = await web3.eth.getBalance(currentTestData.address)
        const oldContractBalance = await web3.eth.getBalance(contract.address)
        const oldTotalTxCount = await contract.getTotalTxCount()
        const oldTotalCrosschainAmount = await contract.getTotalCrosschainAmount()

        await truffleAssert.reverts(contract.crosschainTransfer(currentTestData.address, currentTestData.legacyAddress, currentTestData.amount, currentTestData.txHash, true), "Invalid address")

        await assertCrosschainTransferResult(contract, currentTestData, {
            expectedEOABalance: oldUserBalance,
            expectedContractBalance: oldContractBalance,
            expectedGetAddressFromLegacy: '0x0000000000000000000000000000000000000000',
            expectedGetLegacyETNAddress: '',
            expectedTXHistoryLength: 0,
            expectedTXHistoryHashList: [],
            expectedGetTxAmount: 0,
            expectedTotalTxCount: parseInt(oldTotalTxCount),
            expectedTotalCrosschainAmount: oldTotalCrosschainAmount,
            expectedLastCrosschainLegacyTxHash: testData[0].txHash
        })
    })

    it("crosschainTransfer: invalid tx hash", async function () {
        const contract = await ETNBridge.deployed()

        const currentTestData = testData[6]

        const oldUserBalance = await web3.eth.getBalance(currentTestData.address)
        const oldContractBalance = await web3.eth.getBalance(contract.address)
        const oldTotalTxCount = await contract.getTotalTxCount()
        const oldTotalCrosschainAmount = await contract.getTotalCrosschainAmount()

        await truffleAssert.reverts(contract.crosschainTransfer(currentTestData.address, currentTestData.legacyAddress, currentTestData.amount, currentTestData.txHash, true), "Invalid transaction hash")

        await assertCrosschainTransferResult(contract, currentTestData, {
            expectedEOABalance: oldUserBalance,
            expectedContractBalance: oldContractBalance,
            expectedGetAddressFromLegacy: '0x0000000000000000000000000000000000000000',
            expectedGetLegacyETNAddress: '',
            expectedTXHistoryLength: 0,
            expectedTXHistoryHashList: [],
            expectedGetTxAmount: 0,
            expectedTotalTxCount: parseInt(oldTotalTxCount),
            expectedTotalCrosschainAmount: oldTotalCrosschainAmount,
            expectedLastCrosschainLegacyTxHash: testData[0].txHash
        })
    })

    it("crosschainTransfer: duplicate tx hash", async function () {
        const contract = await ETNBridge.deployed()

        const currentTestData = testData[7]

        const oldUserBalance = await web3.eth.getBalance(currentTestData.address)
        const oldContractBalance = await web3.eth.getBalance(contract.address)
        const oldTotalTxCount = await contract.getTotalTxCount()
        const oldTotalCrosschainAmount = await contract.getTotalCrosschainAmount()

        await truffleAssert.reverts(contract.crosschainTransfer(currentTestData.address, currentTestData.legacyAddress, currentTestData.amount, currentTestData.txHash, true), "Duplicate crosschain transaction")

        await assertCrosschainTransferResult(contract, currentTestData, {
            expectedEOABalance: oldUserBalance,
            expectedContractBalance: oldContractBalance,
            expectedGetAddressFromLegacy: '0x0000000000000000000000000000000000000000',
            expectedGetLegacyETNAddress: '',
            expectedTXHistoryLength: 0,
            expectedTXHistoryHashList: [],
            expectedGetTxAmount: testData[0].amount,
            expectedTotalTxCount: parseInt(oldTotalTxCount),
            expectedTotalCrosschainAmount: oldTotalCrosschainAmount,
            expectedLastCrosschainLegacyTxHash: testData[0].txHash
        })
    })

    it("crosschainTransfer: legacy etn address mapped to a different sc address", async function () {
        const contract = await ETNBridge.deployed()

        const currentTestData = testData[8]

        const oldUserBalance = await web3.eth.getBalance(currentTestData.address)
        const oldContractBalance = await web3.eth.getBalance(contract.address)
        const oldTotalTxCount = await contract.getTotalTxCount()
        const oldTotalCrosschainAmount = await contract.getTotalCrosschainAmount()

        await truffleAssert.reverts(contract.crosschainTransfer(currentTestData.address, currentTestData.legacyAddress, currentTestData.amount, currentTestData.txHash, true), "This legacy ETN address is already mapped to a different address")

        await assertCrosschainTransferResult(contract, currentTestData, {
            expectedEOABalance: oldUserBalance,
            expectedContractBalance: oldContractBalance,
            expectedGetAddressFromLegacy: testData[1].address,
            expectedGetLegacyETNAddress: '',
            expectedTXHistoryLength: 0,
            expectedTXHistoryHashList: [],
            expectedGetTxAmount: 0,
            expectedTotalTxCount: parseInt(oldTotalTxCount),
            expectedTotalCrosschainAmount: oldTotalCrosschainAmount,
            expectedLastCrosschainLegacyTxHash: testData[0].txHash
        })
    })

    it("crosschainTransfer: sc address mapped to a different legacy address", async function () {
        const contract = await ETNBridge.deployed()

        const currentTestData = testData[9]

        const oldUserBalance = await web3.eth.getBalance(currentTestData.address)
        const oldContractBalance = await web3.eth.getBalance(contract.address)
        const oldTotalTxCount = await contract.getTotalTxCount()
        const oldTotalCrosschainAmount = await contract.getTotalCrosschainAmount()

        await truffleAssert.reverts(contract.crosschainTransfer(currentTestData.address, currentTestData.legacyAddress, currentTestData.amount, currentTestData.txHash, true), "This address is already mapped to a different legacy ETN address")

        await assertCrosschainTransferResult(contract, currentTestData, {
            expectedEOABalance: oldUserBalance,
            expectedContractBalance: oldContractBalance,
            expectedGetAddressFromLegacy: '0x0000000000000000000000000000000000000000',
            expectedGetLegacyETNAddress: testData[1].legacyAddress,
            expectedTXHistoryLength: 1,
            expectedTXHistoryHashList: [testData[1].txHash],
            expectedGetTxAmount: 0,
            expectedTotalTxCount: parseInt(oldTotalTxCount),
            expectedTotalCrosschainAmount: oldTotalCrosschainAmount,
            expectedLastCrosschainLegacyTxHash: testData[0].txHash
        })
    })

    it("crosschainTransfer: valid inputs, same address, different tx hashes (1)", async function () {
        const contract = await ETNBridge.deployed()

        const currentTestData = testData[10]

        const oldUserBalance = await web3.eth.getBalance(currentTestData.address)
        const oldContractBalance = await web3.eth.getBalance(contract.address)
        const oldTotalTxCount = await contract.getTotalTxCount()
        const oldTotalCrosschainAmount = await contract.getTotalCrosschainAmount()

        const tx = await contract.crosschainTransfer(currentTestData.address, currentTestData.legacyAddress, currentTestData.amount, currentTestData.txHash, false)

        // Assert CrossChainTransfer event was emitted
        truffleAssert.eventEmitted(tx, 'CrossChainTransfer', (ev) => {
            assert.equal(ev._from, currentTestData.legacyAddress, "CrossChainTransfer Event: wrong etn-sc address")
            assert.equal(ev._to, currentTestData.address, "CrossChainTransfer Event: wrong etn-sc address")
            assert.equal(ev._value, currentTestData.amount, "CrossChainTransfer Event: wrong amount")
            return true
        })

        await assertCrosschainTransferResult(contract, currentTestData, {
            expectedEOABalance: (new BN(oldUserBalance)).add(new BN(currentTestData.amount)),
            expectedContractBalance: (new BN(oldContractBalance)).sub(new BN(currentTestData.amount)),
            expectedGetAddressFromLegacy: currentTestData.address,
            expectedGetLegacyETNAddress: currentTestData.legacyAddress,
            expectedTXHistoryLength: 2,
            expectedTXHistoryHashList: [testData[1].txHash, currentTestData.txHash],
            expectedGetTxAmount: currentTestData.amount,
            expectedTotalTxCount: parseInt(oldTotalTxCount)+1,
            expectedTotalCrosschainAmount: (new BN(oldTotalCrosschainAmount)).add(new BN(testData[0].amount)),
            expectedLastCrosschainLegacyTxHash: testData[0].txHash
        })
    })

    it("crosschainTransfer: valid inputs, same address, different tx hashes (2)", async function () {
        const contract = await ETNBridge.deployed()

        const currentTestData = testData[11]

        const oldUserBalance = await web3.eth.getBalance(currentTestData.address)
        const oldContractBalance = await web3.eth.getBalance(contract.address)
        const oldTotalTxCount = await contract.getTotalTxCount()
        const oldTotalCrosschainAmount = await contract.getTotalCrosschainAmount()

        const tx = await contract.crosschainTransfer(currentTestData.address, currentTestData.legacyAddress, currentTestData.amount, currentTestData.txHash, false)

        // Assert CrossChainTransfer event was emitted
        truffleAssert.eventEmitted(tx, 'CrossChainTransfer', (ev) => {
            assert.equal(ev._from, currentTestData.legacyAddress, "CrossChainTransfer Event: wrong etn-sc address")
            assert.equal(ev._to, currentTestData.address, "CrossChainTransfer Event: wrong etn-sc address")
            assert.equal(ev._value, currentTestData.amount, "CrossChainTransfer Event: wrong amount")
            return true
        })

        await assertCrosschainTransferResult(contract, currentTestData, {
            expectedEOABalance: (new BN(oldUserBalance)).add(new BN(currentTestData.amount)),
            expectedContractBalance: (new BN(oldContractBalance)).sub(new BN(currentTestData.amount)),
            expectedGetAddressFromLegacy: currentTestData.address,
            expectedGetLegacyETNAddress: currentTestData.legacyAddress,
            expectedTXHistoryLength: 3,
            expectedTXHistoryHashList: [testData[1].txHash, testData[10].txHash, currentTestData.txHash],
            expectedGetTxAmount: currentTestData.amount,
            expectedTotalTxCount: parseInt(oldTotalTxCount)+1,
            expectedTotalCrosschainAmount: (new BN(oldTotalCrosschainAmount)).add(new BN(testData[0].amount)),
            expectedLastCrosschainLegacyTxHash: testData[0].txHash
        })
    })

    it("crosschainTransfer: valid inputs, same address, different tx hashes (3)", async function () {
        const contract = await ETNBridge.deployed()

        const currentTestData = testData[12]

        const oldUserBalance = await web3.eth.getBalance(currentTestData.address)
        const oldContractBalance = await web3.eth.getBalance(contract.address)
        const oldTotalTxCount = await contract.getTotalTxCount()
        const oldTotalCrosschainAmount = await contract.getTotalCrosschainAmount()

        const tx = await contract.crosschainTransfer(currentTestData.address, currentTestData.legacyAddress, currentTestData.amount, currentTestData.txHash, false)

        // Assert CrossChainTransfer event was emitted
        truffleAssert.eventEmitted(tx, 'CrossChainTransfer', (ev) => {
            assert.equal(ev._from, currentTestData.legacyAddress, "CrossChainTransfer Event: wrong etn-sc address")
            assert.equal(ev._to, currentTestData.address, "CrossChainTransfer Event: wrong etn-sc address")
            assert.equal(ev._value, currentTestData.amount, "CrossChainTransfer Event: wrong amount")
            return true
        })

        await assertCrosschainTransferResult(contract, currentTestData, {
            expectedEOABalance: (new BN(oldUserBalance)).add(new BN(currentTestData.amount)),
            expectedContractBalance: (new BN(oldContractBalance)).sub(new BN(currentTestData.amount)),
            expectedGetAddressFromLegacy: currentTestData.address,
            expectedGetLegacyETNAddress: currentTestData.legacyAddress,
            expectedTXHistoryLength: 4,
            expectedTXHistoryHashList: [testData[1].txHash, testData[10].txHash, testData[11].txHash, currentTestData.txHash],
            expectedGetTxAmount: currentTestData.amount,
            expectedTotalTxCount: parseInt(oldTotalTxCount)+1,
            expectedTotalCrosschainAmount: (new BN(oldTotalCrosschainAmount)).add(new BN(testData[0].amount)),
            expectedLastCrosschainLegacyTxHash: testData[0].txHash
        })
    })
})