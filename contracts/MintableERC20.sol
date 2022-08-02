// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";

contract MintableERC20 is ERC20PresetMinterPauser {
    constructor() ERC20PresetMinterPauser("", "") {}
}
