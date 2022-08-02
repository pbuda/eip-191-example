import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { BigNumber, Signer, utils } from 'ethers';
import { arrayify, keccak256, solidityKeccak256 } from 'ethers/lib/utils';
import { ethers } from 'hardhat';
import { AuthoritiesStruct, SignatureStruct, VSMStruct } from '../typechain-types/contracts/VSMBridge.sol/Authority';

describe('VSM Bridge', function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshopt in every test.
  async function deployBridge() {
    // Contracts are deployed using the first signer/account by default
    const [app, gyri, user] = await ethers.getSigners();
    const MintableERC20 = await ethers.getContractFactory('MintableERC20');
    const token = await MintableERC20.deploy();
    const VSMBridge = await ethers.getContractFactory('VSMBridge');
    const bridge = await VSMBridge.deploy();
    await bridge.initialize({ keys: [app.address] });

    await token.grantRole(await token.MINTER_ROLE(), bridge.address);

    return { bridge, token, app, gyri, user };
  }

  it('should emit the authority update event', async function () {
    const { bridge, token, app, gyri, user } = await loadFixture(deployBridge);

    const incomingEvent = {
      emitter: ethers.utils.formatBytes32String('GYRI'),
      chainId: 1,
      sequence: 1,
    };

    const updateAuthorities: AuthoritiesStruct = {
      keys: [app.address, gyri.address],
    };

    const nonce = generateNonce(incomingEvent);

    const payload = utils.defaultAbiCoder.encode(['address[]'], [updateAuthorities.keys]);

    const encodedBody = utils.defaultAbiCoder.encode(
      ['bytes32', 'uint8', 'uint64', 'bytes32', 'bytes'],
      [incomingEvent.emitter, incomingEvent.chainId, incomingEvent.sequence, nonce, payload]
    );

    const digest = solidityKeccak256(['bytes'], [encodedBody]);

    const signature = await sign(app, digest);

    const vsm: VSMStruct = {
      emitter: incomingEvent.emitter,
      chainId: incomingEvent.chainId,
      sequence: incomingEvent.sequence,
      nonce,
      payload,
      signatures: [signature],
    };

    await expect(bridge.updateAuthorities(vsm)).to.emit(bridge, 'AuthorityUpdated').withArgs([app.address, gyri.address]);
  });
});

const generateNonce = (incomingEvent: any) => {
  return solidityKeccak256(
    ['bytes'],
    [utils.defaultAbiCoder.encode(['bytes32', 'uint8', 'uint64'], [incomingEvent.emitter, incomingEvent.chainId, incomingEvent.sequence])]
  );
};

const sign = async (account: Signer, digest: string): Promise<SignatureStruct> => {
  const appSignature = await account.signMessage(arrayify(digest));
  const splitSignature = ethers.utils.splitSignature(appSignature);
  return {
    r: splitSignature.r,
    s: splitSignature.s,
    v: splitSignature.v,
    index: 0,
  };
};
