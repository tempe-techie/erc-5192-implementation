// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.28;

import { ERC5192 } from "./lib/ERC5192.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract ExampleSbtToggle is ERC5192, Ownable {
  address public minter;
  uint256 public counter = 1;

  // MODIFIERS
  modifier onlyMinter() {
    if (msg.sender != minter) revert ErrNotMinter();
    _;
  }

  // ERRORS
  error ErrNotMinter();

  // CONSTRUCTOR
  constructor(string memory name_, string memory symbol_) 
  ERC5192(name_, symbol_, true) // initially sets isLocked to true
  Ownable(msg.sender) {}

  // MINTER
  function burn(uint256 tokenId_) public onlyMinter {
    _burn(tokenId_);
  }

  function mint(address to_) public onlyMinter returns (uint256 tokenId_) {
    tokenId_ = counter++;
    _mint(to_, tokenId_);
  }

  // OWNER
  function setMinter(address minter_) public onlyOwner {
    minter = minter_;
  }

  function toggleLock() public onlyOwner {
    isLocked = !isLocked;
  }
}