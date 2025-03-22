// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleStorage {
    uint256 private storedValue;

    function updateValue(uint256 _value) external {
        storedValue = _value;
    }

    function retrieveValue() external view returns (uint256) {
        return storedValue;
    }
}
