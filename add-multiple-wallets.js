// Add multiple Hardhat test accounts to the whitelist
const { createWalletClient, createPublicClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const WhitelistSaleABI = require('./src/contracts/WhitelistSale.json');

const SALE_ADDRESS = '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707';
const OWNER_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Hardhat account #0

// Hardhat's default test accounts (first 10)
const TEST_ACCOUNTS = [
  {
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    name: 'Account #0 (Owner)'
  },
  {
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
    name: 'Account #1'
  },
  {
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
    name: 'Account #2'
  },
  {
    address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    privateKey: '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
    name: 'Account #3'
  },
  {
    address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    privateKey: '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a',
    name: 'Account #4'
  },
  {
    address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
    privateKey: '0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba',
    name: 'Account #5'
  },
  {
    address: '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
    privateKey: '0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e',
    name: 'Account #6'
  },
  {
    address: '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955',
    privateKey: '0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356',
    name: 'Account #7'
  },
  {
    address: '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f',
    privateKey: '0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97',
    name: 'Account #8'
  },
  {
    address: '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720',
    privateKey: '0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6',
    name: 'Account #9'
  }
];

const account = privateKeyToAccount(OWNER_PRIVATE_KEY);

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
  account,
  chain: hardhatChain,
  transport: http('http://127.0.0.1:8545'),
});

async function addMultipleWallets() {
  console.log('🔄 Adding multiple test accounts to whitelist...\n');

  try {
    // Get addresses to whitelist (skip account #0 as it's already whitelisted)
    const addressesToWhitelist = TEST_ACCOUNTS.slice(1).map(acc => acc.address);
    
    console.log('📋 Accounts to whitelist:');
    TEST_ACCOUNTS.slice(1).forEach(acc => {
      console.log(`  ${acc.name}: ${acc.address}`);
    });
    console.log('');

    // Add all addresses to whitelist in batch
    console.log('⏳ Adding addresses to whitelist...');
    const hash = await walletClient.writeContract({
      address: SALE_ADDRESS,
      abi: WhitelistSaleABI.abi,
      functionName: 'updateWhitelistBatch',
      args: [addressesToWhitelist, true], // addresses[], whitelisted
    });

    console.log('📝 Transaction hash:', hash);
    console.log('⏳ Waiting for confirmation...');

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log('✅ Transaction confirmed!\n');

    // Verify all addresses are whitelisted
    console.log('🔍 Verifying whitelist status...');
    for (const acc of TEST_ACCOUNTS.slice(1)) {
      const isWhitelisted = await publicClient.readContract({
        address: SALE_ADDRESS,
        abi: WhitelistSaleABI.abi,
        functionName: 'whitelist',
        args: [acc.address],
      });
      
      console.log(`  ${acc.name}: ${isWhitelisted ? '✅ Whitelisted' : '❌ Not whitelisted'}`);
    }

    console.log('\n🎉 Success! All test accounts are now whitelisted!');
    console.log('\n📱 To test with different wallets:');
    console.log('1. In MetaMask, click "Import Account"');
    console.log('2. Select "Private Key"');
    console.log('3. Use any of these private keys:');
    console.log('');
    
    TEST_ACCOUNTS.slice(1, 6).forEach(acc => { // Show first 5 for testing
      console.log(`${acc.name}:`);
      console.log(`  Address: ${acc.address}`);
      console.log(`  Private Key: ${acc.privateKey}`);
      console.log('');
    });

    console.log('💡 Each account starts with 10,000 ETH for testing!');

  } catch (error) {
    console.error('❌ Error adding wallets:', error);
  }
}

addMultipleWallets();