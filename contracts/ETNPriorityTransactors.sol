// contracts/ETNBridge.sol
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

        TransactorMeta memory t;
        t.publicKey = _publicKey;
        t.name = _name;
        t.isGasPriceWaiver = _isWaiver;
        t.startHeight = _startHeight;
        t.endHeight = _endHeight;

        transactorList.push(t);

        publicKeyMap[_publicKey] = true;
    }

    function removeTransactor(string memory _publicKey) public onlyOwner nonReentrant {
        require(bytes(_publicKey).length == 130, "Invalid public key");
        require(publicKeyMap[_publicKey] == true, "Transactor not found");

        transactorList[getTransactorIndex(_publicKey)] = transactorList[transactorList.length - 1];
        transactorList.pop();

        delete(publicKeyMap[_publicKey]);
    }

    function setEndHeight(string memory _publicKey, uint64 _endHeight) public onlyOwner nonReentrant{
        require(bytes(_publicKey).length == 130, "Invalid public key");
        require(publicKeyMap[_publicKey] == true, "Transactor not found");
        require(_endHeight > block.number, "EndHeight should be in the future");

        transactorList[getTransactorIndex(_publicKey)].endHeight = _endHeight;
    }

    function setIsWaiver(string memory _publicKey, bool _isWaiver) public onlyOwner nonReentrant {
        require(bytes(_publicKey).length == 130, "Invalid public key");
        require(publicKeyMap[_publicKey] == true, "Transactor not found");

        transactorList[getTransactorIndex(_publicKey)].isGasPriceWaiver = _isWaiver;
    }

    function getTransactors() public view returns (TransactorMeta[] memory) {
        return transactorList;
    }

    function getTransactorIndex(string memory _publicKey) private view returns (uint) {
        uint index;
        for(uint i = 0; i < transactorList.length; i++) {
            if(keccak256(abi.encodePacked(_publicKey)) == keccak256(abi.encodePacked(transactorList[i].publicKey))) {
                index = i;
                break;
            }
        }
        return index;
    }
}