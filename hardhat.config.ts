import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      chainId: 31337,
    },
  },
  solidity: '0.8.9',
  gasReporter: {
    enabled: false,
  },
};

export default config;
