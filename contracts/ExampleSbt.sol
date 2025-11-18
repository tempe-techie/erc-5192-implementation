// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.28;

import { ERC5192 } from "./lib/ERC5192.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract ExampleSbt is ERC5192, Ownable {
  uint256 public counter = 1;

  constructor(string memory name_, string memory symbol_) 
  ERC5192(name_, symbol_, true) 
  Ownable(msg.sender) {}

  // OWNER
  function burn(uint256 tokenId_) public onlyOwner {
    _burn(tokenId_);
  }

  function mint(address to_) public onlyOwner returns (uint256 tokenId_) {
    tokenId_ = counter++;
    _mint(to_, tokenId_);
  }
}