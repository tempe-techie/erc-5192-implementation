// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.28;

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { IERC5192 } from "./IERC5192.sol";

abstract contract ERC5192 is ERC721, IERC5192 {
  bool private isLocked;

  error ErrLocked();
  error ErrNotFound();

  constructor(string memory _name, string memory _symbol, bool _isLocked)
    ERC721(_name, _symbol)
  {
    isLocked = _isLocked;
  }

  modifier checkLock() {
    if (isLocked) revert ErrLocked();
    _;
  }

  function locked(uint256 tokenId) external view returns (bool) {
    if (_ownerOf(tokenId) == address(0)) revert ErrNotFound();
    return isLocked;
  }

  function safeTransferFrom(
    address from,
    address to,
    uint256 tokenId,
    bytes memory data
  ) public virtual override checkLock {
    super.safeTransferFrom(from, to, tokenId, data);
  }

  function transferFrom(address from, address to, uint256 tokenId)
    public
    virtual
    override
    checkLock
  {
    super.transferFrom(from, to, tokenId);
  }

  function approve(address approved, uint256 tokenId) public virtual override checkLock {
    super.approve(approved, tokenId);
  }

  function setApprovalForAll(address operator, bool approved)
    public
    virtual
    override
    checkLock
  {
    super.setApprovalForAll(operator, approved);
  }

  function supportsInterface(bytes4 interfaceId)
    public
    view
    virtual
    override
    returns (bool)
  {
    return interfaceId == type(IERC5192).interfaceId
      || super.supportsInterface(interfaceId);
  }

  function _update(address to, uint256 tokenId, address auth)
    internal
    virtual
    override
    returns (address)
  {
    address previousOwner = super._update(to, tokenId, auth);
    
    // Emit Locked event when minting (from == address(0)) and contract is locked
    if (previousOwner == address(0) && isLocked) {
      emit Locked(tokenId);
    }
    
    return previousOwner;
  }
}