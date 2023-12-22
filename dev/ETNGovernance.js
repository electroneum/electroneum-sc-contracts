const BN = require("bn.js/lib/bn");

const ETNGovernance = artifacts.require("ETNGovernance");

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("ETNGovernance", function (accounts) {

  it("candidateRegistration: initialize", async function () {
    const contract = await ETNGovernance.deployed()

    let validators = await contract.getValidators()
    const expected = [
      '0xC21EE98b5A90a6a45aBA37FA5eDdF90F5E8e1816',
      '0xfF0d56Bd960c455a71f908496C79e8EAFEC34cCF',
      '0x07AfbE0D7D36b80454Be1e185f55e02b9453625a',
      '0x4f9a82D7e094DE7Fb70d9Ce2033EC0d65AC31124',
      '0x97F060952B1008c75CB030e3599725Ad5CC306A2'
    ]
    assert.equal(validators.toString(), expected.toString(), "invalid initial set of validators")
  });

  it("candidateRegistration: success", async function () {
    const contract = await ETNGovernance.deployed()

    let amount = 6000000e18
    let bnAmount = toBN(amount)

    await contract.candidateRegistration({ from: accounts[0], value: bnAmount })

    let validatorVotes = await contract.getValidatorVotes(accounts[0])
    assert.equal(validatorVotes, amount / 1e18, "validator amount not equal")

    let validatorScore = await contract.getValidatorScore(accounts[0])
    assert.equal(validatorScore, 100, "validator score not equal")

    let balance = await web3.eth.getBalance(contract.address)
    let expect_balance = toBN(6000000e18)

    assert.equal(balance, expect_balance, "incorrect balance")
  });

  it("candidateRegistration: duplicate validator", async function () {
    const contract = await ETNGovernance.deployed()

    try{
      await contract.candidateRegistration({ from: accounts[0], value: toBN(5000000e18) })
      assert.fail();
    }catch (error) {
      assert.ok(error.toString().includes("address is a validator"));
    }
  });

  it("candidateRegistration: small amount", async function () {
    const contract = await ETNGovernance.deployed()

    try{
      await contract.candidateRegistration({ from: accounts[1], value: toBN(15e17) })
      assert.fail();
    }catch (error) {
      assert.ok(error.toString().includes("registration amount too little"));
    }
  });

  it("candidateRegistration: multiple of 1 ETN", async function () {
    const contract = await ETNGovernance.deployed()

    try{
      await contract.candidateRegistration({ from: accounts[1], value: toBN(50000005e17) })
      assert.fail();
    }catch (error) {
      assert.ok(error.toString().includes("amount must be multiple of 1ETN"));
    }
  });

  it("candidateSupport: validator address not found", async function () {
    const contract = await ETNGovernance.deployed()

    try{
      await contract.candidateSupport(accounts[1], { from: accounts[1], value: toBN(10e18) })
      assert.fail();
    }catch (error) {
      assert.ok(error.toString().includes("validator address not found"));
    }
  });

  it("candidateSupport: support ammount can't be zero", async function () {
    const contract = await ETNGovernance.deployed()

    try{
      await contract.candidateSupport(accounts[0], { from: accounts[1], value: 0 })
      assert.fail();
    }catch (error) {
      assert.ok(error.toString().includes("support ammount can't be zero"));
    }
  });

  it("candidateSupport: amount must be multiple of 10ETN", async function () {
    const contract = await ETNGovernance.deployed()

    try{
      await contract.candidateSupport(accounts[0], { from: accounts[1], value: toBN(15e18) })
      assert.fail();
    }catch (error) {
      assert.ok(error.toString().includes("amount must be multiple of 10ETN"));
    }

    try{
      await contract.candidateSupport(accounts[0], { from: accounts[1], value: toBN(1e18) })
      assert.fail();
    }catch (error) {
      assert.ok(error.toString().includes("amount must be multiple of 10ETN"));
    }
  });

  it("candidateSupport: success", async function () {
    const contract = await ETNGovernance.deployed()

    await contract.candidateSupport(accounts[0], { from: accounts[1], value: toBN(10e18) })
    let vVotes = await contract.getValidatorVotes(accounts[0])
    assert.equal(vVotes, 6000001)

    await contract.candidateSupport(accounts[0], { from: accounts[1], value: toBN(20e18) })
    vVotes = await contract.getValidatorVotes(accounts[0])
    assert.equal(vVotes, 6000003)

    await contract.candidateSupport(accounts[0], { from: accounts[1], value: toBN(100e18) })
    vVotes = await contract.getValidatorVotes(accounts[0])
    assert.equal(vVotes, 6000013)
  });

  it("withdrawSupport: validator address not found", async function () {
    const contract = await ETNGovernance.deployed()

    try{
      await contract.withdrawSupport(accounts[1], { from: accounts[1] })
      assert.fail();
    }catch (error) {
      assert.ok(error.toString().includes("validator address not found"));
    }
  });

  it("withdrawSupport: success", async function () {
    const contract = await ETNGovernance.deployed()

    let supOldBalance = await web3.eth.getBalance(accounts[1])

    await contract.withdrawSupport(accounts[0], { from: accounts[1] })
    vVotes = await contract.getValidatorVotes(accounts[0])
    assert.equal(vVotes, 6000000)

    const balance = await web3.eth.getBalance(contract.address)
    const expected_balance = toBN(6000000e18)
    assert.equal(balance.toString(), expected_balance)

  });

  it("withdrawSupport: supporter not found", async function () {
    const contract = await ETNGovernance.deployed()

    try{
      await contract.withdrawSupport(accounts[0], { from: accounts[0] })
      assert.fail();
    }catch (error) {
      assert.ok(error.toString().includes("address is not a supporter"));
    }
  });

  it("newEpoch: ", async function () {


    const contract = await ETNGovernance.deployed()
  
    await contract.newEpoch(17279, { from: accounts[0] })

    let validators = await contract.getValidators()
    console.log(validators);

  });

  function toBN(amount) {
    const str = amount.toLocaleString('fullwide', {useGrouping:false})
    var res = new BN(str).toString()
    return res
  }
});
