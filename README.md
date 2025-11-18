# ERC-5192 Implementation for OpenZeppelin v5.4.0 contracts

This repo holds implementation code for ERC-5192 using OpenZeppelin contracts version 5.4.0.

The code is adapted from https://github.com/attestate/ERC5192.

## Usage

### Running Tests

To run all the tests in the project, execute the following command:

```shell
npx hardhat test
```

### Environment variables

Hardhat has an encrypted keystore for environment variables.

Make sure to set the following environment variables before deploying:
- `SEPOLIA_RPC_URL` - Sepolia RPC endpoint (and similar for other networks)
- `DEPLOYER_PRIVATE_KEY` - Private key of the deployer account
- `ETHERSCAN_API_KEY` - API key for Etherscan verification (optional)

```shell
npx hardhat keystore set SEPOLIA_RPC_URL
npx hardhat keystore set DEPLOYER_PRIVATE_KEY
npx hardhat keystore set ETHERSCAN_API_KEY
```


### Deploy the contract

The project includes a TypeScript deployment script using ethers.js that automatically tests the deployed contract:

**Deploy to local Hardhat network:**
```shell
npx hardhat run scripts/exampleSbt.deploy.ts
```

**Deploy to Sepolia testnet:**
```shell
npx hardhat run scripts/exampleSbt.deploy.ts --network sepolia
```

**Deploy to a simulated OP network:**
```shell
npx hardhat run scripts/exampleSbt.deploy.ts --network hardhatOp
```

**Deploy to a simulated mainnet:**
```shell
npx hardhat run scripts/exampleSbt.deploy.ts --network hardhatMainnet
```

After deployment, the script will provide instructions for verifying the contract. For Sepolia, you can verify using:

```shell
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```
