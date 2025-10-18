// Add test accounts to the fixed contract whitelist
const { createPublicClient, createWalletClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const WhitelistSaleABI = require('./src/contracts/WhitelistSale.json');

// FIXED CONTRACT ADDRESS
const SALE_ADDRESS = '0x0E801D84Fa97b50751Dbf25036d067dCf18858bF';

// Owner account (deployer)
const OWNER_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const ownerAccount = privateKeyToAccount(OWNER_PRIVATE_KEY);

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

async function addTestAccounts() {
  console.log('👤 Adding test accounts to fixed contract whitelist...');
  console.log('Sale Contract:', SALE_ADDRESS);
  console.log('');

  try {
    // Test accounts (from Hardhat default accounts)
    const testAccounts = [
      "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Account 0
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Account 1
      "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Account 2
      "0x90F79bf6EB2c4f870365E785982E1f101E93b906", // Account 3
      "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", // Account 4
      "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc", // Account 5
      "0x976EA74026E726554dB657fA54763abd0C3a0aa9", // Account 6
      "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955", // Account 7
      "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f", // Account 8
      "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720", // Account 9
      "0xE76844a9D809eaC5De362Ea71096cDf91932e09E", // Previously used address
    ];

    const hash = await walletClient.writeContract({
      address: SALE_ADDRESS,
      abi: WhitelistSaleABI.abi,
      functionName: 'updateWhitelistBatch',
      args: [testAccounts, true],
    });

    await publicClient.waitForTransactionReceipt({ hash });
    console.log('✅ All test accounts successfully whitelisted!');
    console.log('Whitelisted accounts:', testAccounts.length);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addTestAccounts();