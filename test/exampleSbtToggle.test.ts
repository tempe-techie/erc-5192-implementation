// npx hardhat test test/exampleSbtToggle.test.ts

import { expect } from "chai";
import { network } from "hardhat";

describe("ExampleSbtToggle tests", function () {
  let ethers: any;
  let contract: any;

  let owner: any, user1: any, user2: any, user3: any, minter: any;

  const contractName = "ExampleSbtToggle";

  const tokenName = "Example SBT Toggle";
  const symbol = "ESBTT";

  const calculateGasCosts = (testName: string, receipt: any) => {
    const ethPrice = 2700; // price in USD for calculating gas costs
    const ethGwei = 0.1;
    const gasCostEthereum = ethers.formatUnits(
      String(Number(ethers.parseUnits(String(ethGwei), "gwei")) * Number(receipt.gasUsed)),
      "ether"
    );
    const gasCostUSD = Number(gasCostEthereum) * ethPrice;
    console.log(`Gas cost for ${testName}: ${gasCostEthereum} ETH (${gasCostUSD} USD)`);
  };

  before(async function () {
    const connection = await network.connect();
    ethers = connection.ethers;
  });

  beforeEach(async function () {
    [owner, user1, user2, user3, minter] = await ethers.getSigners();

    const ExampleSbtToggle = await ethers.getContractFactory(contractName);

    contract = await ExampleSbtToggle.deploy(tokenName, symbol);
    await contract.waitForDeployment();
  });

  it("should deploy the contract with the correct parameters", async function () {
    console.log("contract address:", await contract.getAddress());

    expect(await contract.name()).to.equal(tokenName);
    expect(await contract.symbol()).to.equal(symbol);
    expect(await contract.counter()).to.equal(1n);
    expect(await contract.owner()).to.equal(owner.address);
    expect(await contract.minter()).to.equal(ethers.ZeroAddress);
  });

  it("should support ERC5192 interface", async function () {
    const IERC5192_INTERFACE_ID = "0xb45a3c0e"; // ERC5192 interface ID
    expect(await contract.supportsInterface(IERC5192_INTERFACE_ID)).to.be.true;
  });

  it("should support ERC721 interface", async function () {
    const ERC721_INTERFACE_ID = "0x80ac58cd"; // ERC721 interface ID
    expect(await contract.supportsInterface(ERC721_INTERFACE_ID)).to.be.true;
  });

  it("should allow owner to set minter", async function () {
    await contract.setMinter(minter.address);
    expect(await contract.minter()).to.equal(minter.address);
  });

  it("should not allow non-owner to set minter", async function () {
    await expect(contract.connect(user1).setMinter(minter.address)).to.be.revertedWithCustomError(
      contract,
      "OwnableUnauthorizedAccount"
    );
  });

  it("should allow minter to mint tokens", async function () {
    await contract.setMinter(minter.address);
    
    const tx = await contract.connect(minter).mint(user1.address);
    const receipt = await tx.wait();
    calculateGasCosts("mint", receipt);

    expect(await contract.ownerOf(1)).to.equal(user1.address);
    expect(await contract.balanceOf(user1.address)).to.equal(1n);
    expect(await contract.counter()).to.equal(2n);
  });

  it("should not allow non-minter to mint", async function () {
    await contract.setMinter(minter.address);
    
    await expect(contract.connect(user1).mint(user2.address)).to.be.revertedWithCustomError(
      contract,
      "ErrNotMinter"
    );
  });

  it("should not allow owner to mint directly (only minter can)", async function () {
    await contract.setMinter(minter.address);
    
    await expect(contract.mint(user1.address)).to.be.revertedWithCustomError(
      contract,
      "ErrNotMinter"
    );
  });

  it("should increment counter on each mint", async function () {
    await contract.setMinter(minter.address);
    
    await contract.connect(minter).mint(user1.address);
    expect(await contract.counter()).to.equal(2n);

    await contract.connect(minter).mint(user2.address);
    expect(await contract.counter()).to.equal(3n);

    await contract.connect(minter).mint(user3.address);
    expect(await contract.counter()).to.equal(4n);
  });

  it("should return correct token IDs when minting", async function () {
    await contract.setMinter(minter.address);
    
    // Counter starts at 1, so first mint should return 1
    await contract.connect(minter).mint(user1.address);
    expect(await contract.ownerOf(1)).to.equal(user1.address);
    expect(await contract.counter()).to.equal(2n);
    
    // Second mint should return 2
    await contract.connect(minter).mint(user2.address);
    expect(await contract.ownerOf(2)).to.equal(user2.address);
    expect(await contract.counter()).to.equal(3n);
    
    // Third mint should return 3
    await contract.connect(minter).mint(user3.address);
    expect(await contract.ownerOf(3)).to.equal(user3.address);
    expect(await contract.counter()).to.equal(4n);
  });

  it("should allow minter to burn tokens", async function () {
    await contract.setMinter(minter.address);
    await contract.connect(minter).mint(user1.address);
    expect(await contract.ownerOf(1)).to.equal(user1.address);

    const tx = await contract.connect(minter).burn(1);
    const receipt = await tx.wait();
    calculateGasCosts("burn", receipt);

    await expect(contract.ownerOf(1)).to.be.revertedWithCustomError(contract, "ERC721NonexistentToken");
    expect(await contract.balanceOf(user1.address)).to.equal(0n);
  });

  it("should not allow non-minter to burn", async function () {
    await contract.setMinter(minter.address);
    await contract.connect(minter).mint(user1.address);
    
    await expect(contract.connect(user1).burn(1)).to.be.revertedWithCustomError(
      contract,
      "ErrNotMinter"
    );
  });

  it("should not allow owner to burn directly (only minter can)", async function () {
    await contract.setMinter(minter.address);
    await contract.connect(minter).mint(user1.address);
    
    await expect(contract.burn(1)).to.be.revertedWithCustomError(
      contract,
      "ErrNotMinter"
    );
  });

  it("should revert when burning non-existent token", async function () {
    await contract.setMinter(minter.address);
    
    await expect(contract.connect(minter).burn(999)).to.be.revertedWithCustomError(
      contract,
      "ERC721NonexistentToken"
    );
  });

  it("should have locked tokens initially (soulbound)", async function () {
    await contract.setMinter(minter.address);
    await contract.connect(minter).mint(user1.address);
    
    expect(await contract.locked(1)).to.be.true;
  });

  it("should not allow transfer of locked tokens", async function () {
    await contract.setMinter(minter.address);
    await contract.connect(minter).mint(user1.address);
    const tokenId = 1n;

    await expect(
      contract.connect(user1).transferFrom(user1.address, user2.address, tokenId)
    ).to.be.revertedWithCustomError(contract, "ErrLocked");

    await expect(
      contract.connect(user1)["safeTransferFrom(address,address,uint256)"](user1.address, user2.address, tokenId)
    ).to.be.revertedWithCustomError(contract, "ErrLocked");
  });

  it("should not allow approval of locked tokens", async function () {
    await contract.setMinter(minter.address);
    await contract.connect(minter).mint(user1.address);
    const tokenId = 1n;

    await expect(contract.connect(user1).approve(user2.address, tokenId)).to.be.revertedWithCustomError(
      contract,
      "ErrLocked"
    );

    await expect(contract.connect(user1).setApprovalForAll(user2.address, true)).to.be.revertedWithCustomError(
      contract,
      "ErrLocked"
    );
  });

  it("should allow owner to toggle lock", async function () {
    await contract.setMinter(minter.address);
    await contract.connect(minter).mint(user1.address);
    
    // Initially locked
    expect(await contract.locked(1)).to.be.true;
    
    // Toggle to unlock
    await contract.toggleLock();
    expect(await contract.locked(1)).to.be.false;
    
    // Toggle back to lock
    await contract.toggleLock();
    expect(await contract.locked(1)).to.be.true;
  });

  it("should not allow non-owner to toggle lock", async function () {
    await contract.setMinter(minter.address);
    await contract.connect(minter).mint(user1.address);
    
    await expect(contract.connect(user1).toggleLock()).to.be.revertedWithCustomError(
      contract,
      "OwnableUnauthorizedAccount"
    );
  });

  it("should allow transfer of unlocked tokens", async function () {
    await contract.setMinter(minter.address);
    await contract.connect(minter).mint(user1.address);
    const tokenId = 1n;
    
    // Unlock tokens
    await contract.toggleLock();
    expect(await contract.locked(1)).to.be.false;
    
    // Transfer should succeed
    await contract.connect(user1).transferFrom(user1.address, user2.address, tokenId);
    expect(await contract.ownerOf(1)).to.equal(user2.address);
    expect(await contract.balanceOf(user1.address)).to.equal(0n);
    expect(await contract.balanceOf(user2.address)).to.equal(1n);
  });

  it("should allow safeTransferFrom of unlocked tokens", async function () {
    await contract.setMinter(minter.address);
    await contract.connect(minter).mint(user1.address);
    const tokenId = 1n;
    
    // Unlock tokens
    await contract.toggleLock();
    expect(await contract.locked(1)).to.be.false;
    
    // SafeTransferFrom should succeed
    await contract.connect(user1)["safeTransferFrom(address,address,uint256)"](
      user1.address,
      user2.address,
      tokenId
    );
    expect(await contract.ownerOf(1)).to.equal(user2.address);
    expect(await contract.balanceOf(user1.address)).to.equal(0n);
    expect(await contract.balanceOf(user2.address)).to.equal(1n);
  });

  it("should allow approval of unlocked tokens", async function () {
    await contract.setMinter(minter.address);
    await contract.connect(minter).mint(user1.address);
    const tokenId = 1n;
    
    // Unlock tokens
    await contract.toggleLock();
    expect(await contract.locked(1)).to.be.false;
    
    // Approve should succeed
    await contract.connect(user1).approve(user2.address, tokenId);
    expect(await contract.getApproved(tokenId)).to.equal(user2.address);
    
    // Approved address should be able to transfer
    await contract.connect(user2).transferFrom(user1.address, user2.address, tokenId);
    expect(await contract.ownerOf(1)).to.equal(user2.address);
  });

  it("should allow setApprovalForAll of unlocked tokens", async function () {
    await contract.setMinter(minter.address);
    await contract.connect(minter).mint(user1.address);
    const tokenId = 1n;
    
    // Unlock tokens
    await contract.toggleLock();
    expect(await contract.locked(1)).to.be.false;
    
    // setApprovalForAll should succeed
    await contract.connect(user1).setApprovalForAll(user2.address, true);
    expect(await contract.isApprovedForAll(user1.address, user2.address)).to.be.true;
    
    // Approved operator should be able to transfer
    await contract.connect(user2).transferFrom(user1.address, user2.address, tokenId);
    expect(await contract.ownerOf(1)).to.equal(user2.address);
  });

  it("should revert when checking locked status of non-existent token", async function () {
    await expect(contract.locked(999)).to.be.revertedWithCustomError(contract, "ErrNotFound");
  });

  it("should emit Transfer event on mint", async function () {
    await contract.setMinter(minter.address);
    
    await expect(contract.connect(minter).mint(user1.address))
      .to.emit(contract, "Transfer")
      .withArgs(ethers.ZeroAddress, user1.address, 1n);
  });

  it("should emit Transfer event on burn", async function () {
    await contract.setMinter(minter.address);
    await contract.connect(minter).mint(user1.address);
    
    await expect(contract.connect(minter).burn(1))
      .to.emit(contract, "Transfer")
      .withArgs(user1.address, ethers.ZeroAddress, 1n);
  });

  it("should emit Locked event on mint when locked", async function () {
    await contract.setMinter(minter.address);
    
    // Initially locked, so should emit Locked event
    await expect(contract.connect(minter).mint(user1.address))
      .to.emit(contract, "Locked")
      .withArgs(1n);
  });

  it("should not emit Locked event on mint when unlocked", async function () {
    await contract.setMinter(minter.address);
    
    // Unlock tokens
    await contract.toggleLock();
    
    // Mint should not emit Locked event when unlocked
    await expect(contract.connect(minter).mint(user1.address))
      .to.emit(contract, "Transfer")
      .withArgs(ethers.ZeroAddress, user1.address, 1n)
      .to.not.emit(contract, "Locked");
  });

  it("should handle multiple mints correctly", async function () {
    await contract.setMinter(minter.address);
    
    await contract.connect(minter).mint(user1.address);
    await contract.connect(minter).mint(user2.address);
    await contract.connect(minter).mint(user3.address);

    expect(await contract.ownerOf(1)).to.equal(user1.address);
    expect(await contract.ownerOf(2)).to.equal(user2.address);
    expect(await contract.ownerOf(3)).to.equal(user3.address);

    expect(await contract.balanceOf(user1.address)).to.equal(1n);
    expect(await contract.balanceOf(user2.address)).to.equal(1n);
    expect(await contract.balanceOf(user3.address)).to.equal(1n);

    expect(await contract.counter()).to.equal(4n);
  });

  it("should allow contract owner to transfer ownership", async function () {
    await contract.transferOwnership(user1.address);
    expect(await contract.owner()).to.equal(user1.address);

    // New owner should be able to set minter
    await contract.connect(user1).setMinter(minter.address);
    expect(await contract.minter()).to.equal(minter.address);
  });

  it("should allow new contract owner to toggle lock", async function () {
    await contract.setMinter(minter.address);
    await contract.connect(minter).mint(user1.address);
    await contract.transferOwnership(user2.address);

    expect(await contract.locked(1)).to.be.true;
    await contract.connect(user2).toggleLock();
    expect(await contract.locked(1)).to.be.false;
  });

  it("should allow owner to change minter", async function () {
    await contract.setMinter(minter.address);
    expect(await contract.minter()).to.equal(minter.address);
    
    await contract.setMinter(user1.address);
    expect(await contract.minter()).to.equal(user1.address);
    
    // New minter should be able to mint
    await contract.connect(user1).mint(user2.address);
    expect(await contract.ownerOf(1)).to.equal(user2.address);
  });

  it("should maintain lock state across multiple toggles", async function () {
    await contract.setMinter(minter.address);
    await contract.connect(minter).mint(user1.address);
    const tokenId = 1n;
    
    // Toggle multiple times
    await contract.toggleLock(); // unlock
    expect(await contract.locked(1)).to.be.false;
    
    await contract.toggleLock(); // lock
    expect(await contract.locked(1)).to.be.true;
    
    await contract.toggleLock(); // unlock again
    expect(await contract.locked(1)).to.be.false;
    
    // Should be able to transfer when unlocked
    await contract.connect(user1).transferFrom(user1.address, user2.address, tokenId);
    expect(await contract.ownerOf(1)).to.equal(user2.address);
  });
});
