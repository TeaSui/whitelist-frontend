// Whitelist the test account for the fixed contract
const { createPublicClient, createWalletClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const WhitelistSaleABI = require('./src/contracts/WhitelistSale.json');

// NEW FIXED SALE CONTRACT
const SALE_ADDRESS = '0x851356ae760d987E095750cCeb3bC6014560891C';

// Owner account (deployer)
const OWNER_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const ownerAccount = privateKeyToAccount(OWNER_PRIVATE_KEY);

// Test account to whitelist
const TEST_ACCOUNT = '0x9C110B5E0becD82Ef6c4631215C2e7bABb4fF29A'; // Account derived from key in test

const hardhatChain = {
  id: 31337,
  name: 'Hardhat',
  network: 'hardhat',
  nativeCurrency: { decimals: 18, name: 'Ethereum', symbol: 'ETH' },
  rpcUrls: { default: { http: ['http://127.0.0.1:8545'] } },
};

const publicClient = createPublicClient({
  chain: hardhatChain,
  transport: http('http://127.0.0.1:8545'),
});

const walletClient = createWalletClient({
  account: ownerAccount,
  chain: hardhatChain,
  transport: http('http://127.0.0.1:8545'),
});

async function whitelistTestAccount() {
  console.log('👤 Whitelisting test account for fixed contract...');
  console.log('Sale Contract:', SALE_ADDRESS);
  console.log('Test Account:', TEST_ACCOUNT);
  console.log('');

  try {
    // Check current whitelist status
    const isWhitelisted = await publicClient.readContract({
      address: SALE_ADDRESS,
      abi: WhitelistSaleABI.abi,
      functionName: 'whitelist',
      args: [TEST_ACCOUNT],
    });

    console.log('Current whitelist status:', isWhitelisted);

    if (!isWhitelisted) {
      console.log('Adding to whitelist...');
      
      const hash = await walletClient.writeContract({
        address: SALE_ADDRESS,
        abi: WhitelistSaleABI.abi,
        functionName: 'updateWhitelist',
        args: [TEST_ACCOUNT, true],
      });

      await publicClient.waitForTransactionReceipt({ hash });
      console.log('✅ Test account successfully whitelisted!');
    } else {
      console.log('✅ Account is already whitelisted');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

whitelistTestAccount();