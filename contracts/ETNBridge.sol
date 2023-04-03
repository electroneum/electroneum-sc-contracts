// contracts/ETNBridge.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

// Import from the OpenZeppelin Contracts library
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

// Make ETNBridge inherit from the Ownable contract
contract ETNBridge is Initializable, UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable {

    // Croschain mappings
    mapping(string => address) internal crosschainLegacyETNtoAddress;
    mapping(address => string) internal crosschainAddressToLegacyETN;
    mapping(address => uint256) internal crosschainBalance;
    mapping(address => string[]) internal addressTxMap;
    mapping(string => uint256) internal txMap;

    // Counter for total crosschain amount and txs
    uint256 internal totalCrosschainAmount;
    uint internal totalCrosschainTxs;

    string internal lastCrosschainLegacyTxHash;

    // Event definitions
    event CrossChainTransfer(string indexed _from, address indexed _to, uint256 _value);
    event DepositReceived(address indexed _from, uint256 _value);

    // fallback() and receive() definition. This allows ETN to be sent to this contract address.
    fallback() external payable { require(msg.data.length == 0, ""); }
    receive() external payable { emit DepositReceived(msg.sender, msg.value); }

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

    function crosschainTransfer(address payable _address, string memory _legacyETNAddress, uint256 _amount, string memory _txHash, bool _isOracle) public onlyOwner nonReentrant {
        // Address verification
        require(_address == address(_address), "Invalid address format");
        require(_address != address(0), "Invalid address");
        bytes memory tempLegacyETNBytes = bytes(_legacyETNAddress);
        require(tempLegacyETNBytes.length == 98, "Invalid legacy ETN address");
        // Amount verification
        require(_amount > 0, "Invalid amount");
        require(address(this).balance >= _amount, "Insufficient ETN balance in the bridge contract");
        //Tx hash verification
        bytes memory tempTXHashBytes = bytes(_txHash);
        require(tempTXHashBytes.length == 64, "Invalid transaction hash");
        require(txMap[_txHash] == 0, "Duplicate crosschain transaction");

        // Transfer ETN from contract to EOA
        uint256 addressOldBalance = _address.balance;
        uint256 contractOldBalance = address(this).balance;

        // Compute total amount transacted
        totalCrosschainAmount += _amount;

        // Count crosschain tx
        totalCrosschainTxs += 1;

        // Store a map of legacy etn address <-> address
        if(crosschainLegacyETNtoAddress[_legacyETNAddress] == address(0)) {
            crosschainLegacyETNtoAddress[_legacyETNAddress] = _address;
            crosschainAddressToLegacyETN[_address] = _legacyETNAddress;
        }

        // Push tx hash into address -> tx_hash[] map
        addressTxMap[_address].push(_txHash);

        // Mark tx_hash computed by storing tx amount into txMap[hash]
        txMap[_txHash] = _amount;

        if(_isOracle) {
            lastCrosschainLegacyTxHash = _txHash;
        }

        _address.transfer(_amount);
        require(_address.balance == addressOldBalance + _amount, "Invalid ETN transfer: recipient balance not updated");
        require(address(this).balance == contractOldBalance - _amount, "Invalid ETN transfer: sender balance not updated");

        // Log event
        emit CrossChainTransfer(_legacyETNAddress, _address, _amount);
    }

    // Get legacy ETN address
    function getLegacyETNAddress(address _address) public view returns (string memory) {
        return crosschainAddressToLegacyETN[_address];
    }

    // Get new address from legacy etn address
    function getAddressFromLegacy(string memory _legacyETNAddress) public view returns (address) {
        return crosschainLegacyETNtoAddress[_legacyETNAddress];
    }

    // Get transaction history for a particular address
    function getTxHistory(address _address) public view returns (string[] memory) {
        return addressTxMap[_address];
    }

    // Get amount for a particular transaction
    function getTxAmount(string memory txHash) public view returns (uint256) {
        return txMap[txHash];
    }

    // Get total count of txs sent to this bridge contract
    function getTotalTxCount() public view returns (uint) {
        return totalCrosschainTxs;
    }

    // Get total amount of ETN sent to this bridge contract
    function getTotalCrosschainAmount() public view returns (uint256) {
        return totalCrosschainAmount;
    }

    function getLastCrosschainLegacyTxHash() public view returns (string memory) {
        return lastCrosschainLegacyTxHash;
    }
}