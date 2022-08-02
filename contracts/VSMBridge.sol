// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "hardhat/console.sol";

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

struct Authorities {
    address[] keys;
}

struct Signature {
    bytes32 r;
    bytes32 s;
    uint8 v;
    uint8 index;
}

struct VSM {
    bytes32 emitter;
    uint8 chainId;
    uint64 sequence;
    bytes32 nonce;
    bytes payload;
    Signature[] signatures;
}

contract Authority {
    event AuthorityUpdated(address[] keys);

    Authorities private _authorities;

    function Authority__initialize(Authorities memory initial) public {
        _authorities = initial;
    }

    function updateAuthorities(VSM memory message) external {
        bool result = verifySignatures(message);
        require(result, "not verified");
        Authorities memory newAuthorities = parseAuthorityUpdate(message.payload);
        _authorities = newAuthorities;
        emit AuthorityUpdated(newAuthorities.keys);
    }

    function parseAuthorityUpdate(bytes memory payload) internal pure returns (Authorities memory a) {
        a.keys = abi.decode(payload, (address[]));
    }

    function verifySignatures(VSM memory message) public view returns (bool result) {
        require(message.signatures.length == _authorities.keys.length, "too few signatures");
        bytes32 digest = ECDSA.toEthSignedMessageHash(
            keccak256(abi.encode(message.emitter, message.chainId, message.sequence, message.nonce, message.payload))
        );
        for (uint256 i = 0; i < message.signatures.length; i++) {
            Signature memory signature = message.signatures[i];
            // address pub = ecrecover(digest, signature.v, signature.r, signature.s);
            if (ECDSA.recover(digest, signature.v, signature.r, signature.s) != _authorities.keys[signature.index]) {
                return false;
            }
        }
        return true;
    }
}

contract VSMBridge is Authority {
    function initialize(Authorities memory initial) external {
        Authority__initialize(initial);
    }
}
