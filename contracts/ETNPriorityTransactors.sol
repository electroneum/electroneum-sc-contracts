// contracts/ETNPriorityTransactors.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

// Import from the OpenZeppelin Contracts library
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "./ETNPriorityTransactorsInterface.sol";

// Make ETNPriorityTransactors inherit from the Ownable contract
contract ETNPriorityTransactors is ETNPriorityTransactorsInterface, Initializable, UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable {

    TransactorMeta[] internal transactorList;
    mapping(string => bool) internal publicKeyMap;
    mapping(string => uint) internal keyToIndex;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    ///@dev required by the OZ UUPS module
    function _authorizeUpgrade(address) internal override onlyOwner {}

    function initialize() public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
    }

    function addTransactor(string memory _publicKey, bool _isWaiver, string memory _name, uint64 _startHeight, uint64 _endHeight) public onlyOwner nonReentrant {
        require(bytes(_publicKey).length == 130, "Invalid public key");
        require(bytes(_name).length > 0, "Name is empty");
        require(publicKeyMap[_publicKey] == false, "Transactor already exists");
        require(_startHeight > block.number, "Start height should be in the future");
        require(_endHeight > block.number || _endHeight == 0, "End height should be in the future or zero");
        require(_startHeight < _endHeight || _endHeight == 0, "Start height is greater than end height");

        TransactorMeta memory t;
        t.publicKey = _publicKey;
        t.name = _name;
        t.isGasPriceWaiver = _isWaiver;
        t.startHeight = _startHeight;
        t.endHeight = _endHeight;

        transactorList.push(t);

        keyToIndex[_publicKey] = transactorList.length - 1;
        publicKeyMap[_publicKey] = true;
    }

    // Consensus is ok with this because a snapshot of the per-height version of the contract is stored in node levelDB
    function removeTransactor(string memory _publicKey) public onlyOwner nonReentrant {
        require(bytes(_publicKey).length == 130, "Invalid public key");
        require(publicKeyMap[_publicKey] == true, "Transactor not found");

        uint index = keyToIndex[_publicKey];
        
        TransactorMeta memory last = transactorList[transactorList.length - 1];
        keyToIndex[last.publicKey] = index;
        transactorList[index] = last;
        transactorList.pop();

        delete(keyToIndex[_publicKey]);
        delete(publicKeyMap[_publicKey]);
    }

    function setEndHeight(string memory _publicKey, uint64 _endHeight) public onlyOwner nonReentrant{
        require(bytes(_publicKey).length == 130, "Invalid public key");
        require(publicKeyMap[_publicKey] == true, "Transactor not found");
        require(_endHeight > block.number, "EndHeight should be in the future");

        uint index = keyToIndex[_publicKey];
        require(transactorList[index].startHeight <= _endHeight, "Start height is greater than end height");

        transactorList[index].endHeight = _endHeight;
    }


    function setIsWaiver(string memory _publicKey, bool _isWaiver) public onlyOwner nonReentrant {
        require(bytes(_publicKey).length == 130, "Invalid public key");
        require(publicKeyMap[_publicKey] == true, "Transactor not found");

        transactorList[keyToIndex[_publicKey]].isGasPriceWaiver = _isWaiver;
    }

    function getTransactors() public view returns (TransactorMeta[] memory) {
        return transactorList;
    }

    function getTransactorByKey(string memory _publicKey) public view returns (TransactorMeta memory) {
        require(bytes(_publicKey).length == 130, "Invalid public key");
        require(publicKeyMap[_publicKey] == true, "Transactor not found");

        return transactorList[keyToIndex[_publicKey]];
    }
}