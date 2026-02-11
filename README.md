# Electroneum Smart Chain — Contract Suite

Smart contracts for the Electroneum Smart Chain (ETN-SC), covering the cross-chain bridge from the legacy Electroneum network and the priority transactors system (ETNIP-1). Built with Hardhat and OpenZeppelin upgradeable contracts (UUPS proxy pattern).

---

## Table of Contents

- [Repository Structure](#repository-structure)
- [Contracts](#contracts)
  - [ETNBridge](#etnbridge)
  - [ETNPriorityTransactors](#etnprioritytransactors)
  - [ETNPriorityTransactorsInterface](#etnprioritytransactorsinterface)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
  - [Hardhat Variables](#hardhat-variables)
  - [Account Roles](#account-roles)
- [Compilation](#compilation)
- [Testing](#testing)
- [Deployment](#deployment)
  - [Deployment Order](#deployment-order)
  - [Deploy to Local Hardhat Network](#deploy-to-local-hardhat-network)
  - [Deploy to Private Network (Docker)](#deploy-to-private-network-docker)
  - [Deploy to Testnet / Mainnet](#deploy-to-testnet--mainnet)
- [Integration with electroneum-sc-privatenet-docker](#integration-with-electroneum-sc-privatenet-docker)
  - [How It Works](#how-it-works)
  - [Directory Layout](#directory-layout)
  - [Starting the Private Network with Contracts](#starting-the-private-network-with-contracts)
  - [Account Mapping (Genesis to Hardhat)](#account-mapping-genesis-to-hardhat)
  - [RPC URL Handling](#rpc-url-handling)
- [Network Configuration](#network-configuration)
- [Contract Verification](#contract-verification)
- [Development Contracts](#development-contracts)
- [Mainnet Deployment Addresses](#mainnet-deployment-addresses)

---

## Repository Structure

```
electroneum-sc-contracts/
├── contracts/
│   ├── ETNBridge.sol                        # Cross-chain bridge contract
│   ├── ETNPriorityTransactors.sol           # Priority transactors (ETNIP-1)
│   └── ETNPriorityTransactorsInterface.sol  # Interface for priority transactors
├── scripts/
│   ├── deploy_ETNBridge.js                  # Bridge deployment script
│   └── deploy_ETNPriorityTransactors.js     # Priority transactors deployment script
├── test/
│   └── ETNBridge.js                         # Bridge contract tests
├── dev/
│   ├── ETNGovernance.sol                    # Governance contract (not deployed)
│   ├── ETNGovernanceInterface.sol           # Governance interface
│   ├── ETNGovernance.js                     # Governance test
│   ├── ERC1967Proxy.json                    # Proxy ABI artifact
│   ├── verify-proxy-remix.txt               # Remix verification instructions
│   └── hardhat-verify-proxy/                # Proxy verification helpers
├── wetn/
│   └── WETN.sol                             # Wrapped ETN (legacy, Solidity 0.4.18)
├── Dockerfile                               # Docker image for privatenet deployment
├── hardhat.config.js                        # Hardhat configuration
└── package.json                             # Dependencies
```

---

## Contracts

### ETNBridge

**File:** `contracts/ETNBridge.sol` | **Solidity:** 0.8.23 | **Pattern:** UUPS Upgradeable Proxy

Manages the one-way migration of ETN from the legacy Electroneum blockchain to the new EVM-compatible smart chain. An oracle (the contract owner) calls `crosschainTransfer()` for each legacy transaction, mapping legacy 98-character `etnk...` addresses to SC addresses and transferring the corresponding ETN.

**Key behaviour:**
- Each legacy address maps to exactly one SC address (enforced, immutable once set)
- A single SC address can receive from multiple legacy addresses
- Transaction hashes (64-char) must be unique to prevent double-spending
- The contract holds the legacy circulating supply and distributes it via transfers
- Pausable by owner for emergency stop
- Reentrancy-protected on all state-changing operations

**Public functions:**

| Function | Access | Description |
|---|---|---|
| `crosschainTransfer(address, legacyAddr, amount, txHash, isOracle)` | Owner | Execute a cross-chain transfer |
| `pause()` / `unpause()` | Owner | Emergency stop |
| `getLegacyETNAddress(address)` | View | Get legacy addresses mapped to an SC address |
| `getAddressFromLegacy(legacyAddr)` | View | Reverse lookup: legacy address to SC address |
| `getTxHistory(address)` | View | Transaction hashes for an address |
| `getTxAmount(txHash)` | View | Amount for a specific transaction |
| `getTotalTxCount()` | View | Total cross-chain transactions processed |
| `getTotalCrosschainAmount()` | View | Total ETN transferred across chains |
| `getAddressCosschainAmount(address)` | View | Total ETN migrated for a specific address |
| `getLastCrosschainLegacyTxHash()` | View | Last oracle transaction hash |

**Events:**
- `CrossChainTransfer(string indexed _from, string _from, address indexed _to, uint256 _value)`
- `DepositReceived(address indexed _from, uint256 _value)`

### ETNPriorityTransactors

**File:** `contracts/ETNPriorityTransactors.sol` | **Solidity:** 0.8.23 | **Pattern:** UUPS Upgradeable Proxy

Manages a list of priority transactors who can bypass gas price requirements per the ETNIP-1 protocol. The blockchain node software reads this contract at the address specified in the chain config's `PriorityTransactorsContractAddress` to determine which public keys have priority transaction privileges.

**Key behaviour:**
- Transactors are identified by their 130-character hex public key (uncompressed, no `0x` prefix)
- Each transactor has a name and an `isGasPriceWaiver` flag
- Owner-only management (add, remove, toggle waiver)
- O(1) lookup, O(1) removal via swap-and-pop

**Public functions:**

| Function | Access | Description |
|---|---|---|
| `addTransactor(publicKey, isWaiver, name)` | Owner | Add a priority transactor |
| `removeTransactor(publicKey)` | Owner | Remove a transactor |
| `setIsWaiver(publicKey, isWaiver)` | Owner | Toggle gas price waiver flag |
| `getTransactors()` | View | List all transactors |
| `getTransactorByKey(publicKey)` | View | Get transactor details by public key |

### ETNPriorityTransactorsInterface

**File:** `contracts/ETNPriorityTransactorsInterface.sol`

Interface defining the `TransactorMeta` struct and view functions. Used by the blockchain node software to read the transactor list.

```solidity
struct TransactorMeta {
    bool isGasPriceWaiver;
    string publicKey;     // 130-char hex (65 bytes uncompressed)
    string name;
}
```

---

## Architecture

```
Legacy Electroneum Chain                    Electroneum Smart Chain (EVM)
─────────────────────                      ──────────────────────────────

  Legacy ETN Transactions                    ┌──────────────────────┐
          │                                  │    ETNBridge          │
          │  Oracle monitors legacy chain    │    (UUPS Proxy)       │
          └──────────────────────────────────▶  crosschainTransfer() │
                                             │    Holds circulating  │
                                             │    supply             │
                                             └──────────────────────┘

                                             ┌──────────────────────┐
                                             │ ETNPriorityTransactors│
  Blockchain nodes read this contract ──────▶│    (UUPS Proxy)       │
  to apply ETNIP-1 gas price rules           │    getTransactors()   │
                                             └──────────────────────┘
```

**Deployment flow:**

```
1. Bridge Deployer (pre-funded with legacy circulating supply)
   └─▶ Deploys ETNBridge proxy + implementation
   └─▶ Sends entire circulating supply to the bridge contract
       (Funder reimburses deployment gas costs to keep bridge balance exact)

2. Priority Deployer (initially 0 balance)
   └─▶ Funded with 5 ETN by Funder
   └─▶ Deploys ETNPriorityTransactors proxy + implementation
   └─▶ Adds initial priority transactors (e.g., ETN Oracle)
```

---

## Prerequisites

- **Node.js** >= 16
- **npm** or **yarn**
- **Hardhat** (installed as dev dependency)
- **Docker** (for privatenet deployment only)

---

## Installation

```bash
git clone https://github.com/electroneum/electroneum-sc-contracts.git
cd electroneum-sc-contracts
npm install
```

---

## Configuration

### Hardhat Variables

This project uses [Hardhat configuration variables](https://hardhat.org/hardhat-runner/docs/guides/configuration-variables) (stored in `~/.hardhat/vars.json`) instead of `.env` files.

Set all required variables before compiling or deploying:

```bash
# Private keys for the three deployer roles
npx hardhat vars set BRIDGE_PRIVATE_KEY
npx hardhat vars set PRIORITY_PRIVATE_KEY
npx hardhat vars set FUNDER_PRIVATE_KEY

# Contract addresses (set after first deployment, or use a placeholder like 0x0...0 initially)
npx hardhat vars set BRIDGE_CONTRACT_ADDRESS
npx hardhat vars set PRIORITY_CONTRACT_ADDRESS
```

> **Important:** All five variables must be set before `hardhat.config.js` can load. For initial setup before any deployment, set the contract address variables to a dummy value like `0x0000000000000000000000000000000000000000`.

### Account Roles

The deployment scripts expect exactly three signers in this order:

| Index | Role | Purpose | Required Balance |
|---|---|---|---|
| 0 | **Bridge Deployer** | Deploys ETNBridge, holds legacy circulating supply | Legacy circulating supply (~17.95B ETN) |
| 1 | **Priority Deployer** | Deploys ETNPriorityTransactors | 0 (funded by Funder during deployment) |
| 2 | **Funder** | Reimburses deployment costs, funds Priority Deployer | >= 10 ETN |

---

## Compilation

```bash
npx hardhat compile
```

Compiler settings (from `hardhat.config.js`):
- Solidity 0.8.23
- Optimizer: enabled, 1000 runs
- EVM target: `london`

---

## Testing

```bash
npx hardhat test
```

Tests cover the ETNBridge contract including:
- Contract initialization and ownership
- Valid cross-chain transfers (oracle and non-oracle)
- Insufficient bridge balance rejection
- Invalid legacy address validation (must be exactly 98 characters)
- Zero-address rejection
- Invalid/duplicate transaction hash rejection
- Legacy address remapping prevention (1:1 enforcement)
- Multiple legacy addresses to single SC address mapping
- Multiple transactions for the same address

---

## Deployment

### Deployment Order

**ETNBridge MUST be deployed before ETNPriorityTransactors.** The Funder account needs sufficient balance to fund the Priority Deployer, and the bridge deployment flow reimburses gas costs from the Funder.

### Deploy to Local Hardhat Network

```bash
# Step 1: Deploy bridge
npx hardhat run scripts/deploy_ETNBridge.js

# Step 2: Update BRIDGE_CONTRACT_ADDRESS with the output address
npx hardhat vars set BRIDGE_CONTRACT_ADDRESS <deployed-address>

# Step 3: Deploy priority transactors
npx hardhat run scripts/deploy_ETNPriorityTransactors.js

# Step 4: Update PRIORITY_CONTRACT_ADDRESS
npx hardhat vars set PRIORITY_CONTRACT_ADDRESS <deployed-address>
```

### Deploy to Private Network (Docker)

When deploying manually against a running private network (not via Docker auto-deploy):

```bash
# Ensure the private network is running on localhost:8545
npx hardhat run scripts/deploy_ETNBridge.js --network etn_sc_privatenet
npx hardhat run scripts/deploy_ETNPriorityTransactors.js --network etn_sc_privatenet
```

For automated deployment as part of `docker compose up`, see the [integration section](#integration-with-electroneum-sc-privatenet-docker) below.

### Deploy to Testnet / Mainnet

```bash
# Testnet (chain ID 5201420)
npx hardhat run scripts/deploy_ETNBridge.js --network etn_sc_testnet
npx hardhat run scripts/deploy_ETNPriorityTransactors.js --network etn_sc_testnet

# Mainnet (chain ID 52014)
npx hardhat run scripts/deploy_ETNBridge.js --network etn_sc
npx hardhat run scripts/deploy_ETNPriorityTransactors.js --network etn_sc
```

---

## Integration with electroneum-sc-privatenet-docker

This repo is designed to work with the [electroneum-sc-privatenet-docker](https://github.com/electroneum/electroneum-sc-privatenet-docker) setup. When `docker compose up` is run, a `contracts` container automatically deploys both ETNBridge and ETNPriorityTransactors to the private chain.

### How It Works

The integration involves four components working together:

1. **`Dockerfile`** (this repo) — Builds a Node.js image with Hardhat, installs dependencies, and pre-compiles the contracts. A dummy `~/.hardhat/vars.json` is created at build time so `hardhat compile` can run without real keys.

2. **`config/etn-sc/deploy.sh`** (privatenet-docker repo) — The container entrypoint. It waits for the RPC node to be reachable, writes the real Hardhat vars from environment variables, then runs both deployment scripts in order.

3. **`docker-compose.yml`** (privatenet-docker repo) — Defines the `contracts` service, which builds from this repo's Dockerfile, passes the genesis account private keys and a `RPC_URL` as environment variables, and depends on the `rpcnode` service.

4. **`hardhat.config.js`** (this repo) — The `etn_sc_privatenet` network URL reads from `process.env.RPC_URL`, falling back to `http://localhost:8545`. Inside Docker, `RPC_URL` is set to `http://172.16.239.15:8545` (the RPC node's internal IP).

### Directory Layout

Both repos must be siblings on disk:

```
~/
├── electroneum-sc-contracts/              # This repo
└── electroneum-sc-privatenet-docker/      # Docker private network
```

The `docker-compose.yml` in the privatenet repo references `../electroneum-sc-contracts` as the build context.

### Starting the Private Network with Contracts

```bash
cd ~/electroneum-sc-privatenet-docker

# Build and start everything (chain nodes, contracts, explorer)
docker compose up -d --build

# Watch contract deployment progress
docker compose logs -f contracts

# You should see output like:
#   Waiting for RPC node to be ready...
#   RPC node is ready.
#   Deploying ETNBridge...
#   ETNBridge Proxy deployed to: 0x...
#   Deploying ETNPriorityTransactors...
#   ETNPriorityTransactors Proxy deployed to: 0x...
#   Deployment complete.
```

The contracts container runs once and exits after deployment. The chain retains the deployed contracts.

To redeploy contracts on a fresh chain:

```bash
# Tear down everything including chain data
docker compose down -v --remove-orphans

# Rebuild and start
docker compose up -d --build
```

### Account Mapping (Genesis to Hardhat)

The Docker private network genesis pre-funds these accounts. They are mapped to Hardhat deployment roles via environment variables in `docker-compose.yml`:

| Genesis Address | Private Key | Genesis Balance | Hardhat Role                                                                                                |
|---|---|---|-------------------------------------------------------------------------------------------------------------|
| `0xfe3b557e8fb62b89f4916b721be55ceb828dbd73` | `8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63` | ~17.95B ETN (legacy circulating supply) | **Bridge Deployer** (signer 0)                                                                              |
| `0x627306090abaB3A6e1400e9345bC60c78a8BEf57` | `c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3` | 90,000 ETN | **Priority Deployer** (signer 1)                                                                            |
| `0xf17f52151EbEF6C7334FAD080c5704D77216b732` | `ae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f` | 90,000 ETN | **Reimburser of bridge deployer and sends 5ETN to priority deployer so it can afford to deploy** (signer 2) |
| `0x2e18Dba2a20913Be8901F7b054879eAbE8968009` | *(not in genesis)* | 90,000 ETN | Not used by deployment                                                                                      |

> **Note:** The Priority Deployer has 0 ETN in the Docker genesis but 0 in the Hardhat local network config. This is fine — the deployment script funds it from the Validator regardless.

### RPC URL Handling

The `etn_sc_privatenet` network in `hardhat.config.js` uses:

```javascript
url: process.env.RPC_URL || "http://localhost:8545"
```

- **On your host machine:** `RPC_URL` is unset, so Hardhat connects to `localhost:8545` (port-forwarded from Docker).
- **Inside the Docker container:** `RPC_URL=http://172.16.239.15:8545` is set via `docker-compose.yml`, pointing directly to the RPC node's internal IP.

---

## Network Configuration

| Network | Chain ID | RPC URL | Config Name |
|---|---|---|---|
| Private (Docker) | 1337 | `http://localhost:8545` (host) / `http://172.16.239.15:8545` (Docker internal) | `etn_sc_privatenet` |
| Testnet | 5201420 | `http://localhost:8545` | `etn_sc_testnet` |
| Mainnet | 52014 | `http://localhost:8545` | `etn_sc` |
| Hardhat (local) | 31337 | In-process | `hardhat` |

All remote networks expect a local RPC node (or SSH tunnel) at `localhost:8545`.

---

## Contract Verification

For verifying UUPS proxy contracts on BlockScout, see the guides in `dev/`:
- `dev/hardhat-verify-proxy/README.md` — Compiler settings for ERC1967Proxy verification
- `dev/verify-proxy-remix.txt` — Step-by-step Remix flattening approach

---

## Development Contracts

The `dev/` directory contains contracts that are not deployed to production:

- **ETNGovernance.sol** — Validator governance and staking system with epoch-based rotation, minimum stake (5M ETN), vote calculation, and quicksort-based validator ranking. Solidity 0.8.16.
- **WETN.sol** (in `wetn/`) — Wrapped ETN token (ERC20 wrapper around native ETN). Very old Solidity 0.4.18.

---

## Mainnet Deployment Addresses

From the OpenZeppelin upgrade manifest (`.openzeppelin/unknown-52014.json`):

| Contract | Proxy Address | Implementation Address |
|---|---|---|
| ETNBridge | `0xB7990022d3F22B6FB3afb626E05289ee3bf0AE62` | `0x16D78eDE0D1C5E2750B734dB6C870C5BE10A564C` |
| ETNPriorityTransactors | `0x92cdF1FC0e54D3150F100265ae2717b0689660Ee` | `0xbEA3a70a8F68e2A11da9F3e861FB061871cd1211` |
