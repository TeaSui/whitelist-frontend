// Add the current user (from successful transactions) to whitelist
const { createWalletClient, createPublicClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const WhitelistSaleABI = require('./src/contracts/WhitelistSale.json');

const SALE_ADDRESS = '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707';
const CURRENT_USER = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'; // From the transaction logs
const OWNER_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Hardhat account #0

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

async function addCurrentUser() {
  try {
    console.log('Adding current user to whitelist...');
    console.log('Current user (from transactions):', CURRENT_USER);
    
    // Check if already whitelisted
    const isAlreadyWhitelisted = await publicClient.readContract({
      address: SALE_ADDRESS,
      abi: WhitelistSaleABI.abi,
      functionName: 'whitelist',
      args: [CURRENT_USER],
    });
    
    if (isAlreadyWhitelisted) {
      console.log('✅ User is already whitelisted!');
      
      // Check their purchase info
      const purchaseInfo = await publicClient.readContract({
        address: SALE_ADDRESS,
        abi: WhitelistSaleABI.abi,
        functionName: 'getPurchaseInfo',
        args: [CURRENT_USER],
      });
      
      console.log('📊 Purchase Info:');
      console.log('  Tokens purchased:', (Number(purchaseInfo[0]) / 1e18).toFixed(4), 'WLT');
      console.log('  ETH spent:', (Number(purchaseInfo[1]) / 1e18).toFixed(6), 'ETH');
      console.log('  Claimed:', purchaseInfo[3]);
      
      if (Number(purchaseInfo[0]) > 0 && !purchaseInfo[3]) {
        console.log('\n🎯 Tokens need to be claimed! The user should call claimTokens()');
      }
      
    } else {
      console.log('Adding to whitelist...');
      const hash = await walletClient.writeContract({
        address: SALE_ADDRESS,
        abi: WhitelistSaleABI.abi,
        functionName: 'updateWhitelist',
        args: [CURRENT_USER, true],
      });
      
      await publicClient.waitForTransactionReceipt({ hash });
      console.log('✅ User successfully whitelisted!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

addCurrentUser();