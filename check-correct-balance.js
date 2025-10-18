// Check the balance of the account that's actually making transactions
const { createPublicClient, http } = require('viem');
const WhitelistSaleABI = require('./src/contracts/WhitelistSale.json');
const WhitelistTokenABI = require('./src/contracts/WhitelistToken.json');

const SALE_ADDRESS = '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707';
const TOKEN_ADDRESS = '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9';
const ACTUAL_USER = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'; // From the transactions

const hardhatChain = {
  id: 31337,
  name: 'Hardhat',
  network: 'hardhat',
  nativeCurrency: { decimals: 18, name: 'Ethereum', symbol: 'ETH' },
  rpcUrls: { default: { http: ['http://127.0.0.1:8545'] } },
};

const client = createPublicClient({
  chain: hardhatChain,
  transport: http('http://127.0.0.1:8545'),
});

async function checkActualUserStatus() {
  console.log('🔍 Checking ACTUAL user who made transactions...');
  console.log('Actual User Address:', ACTUAL_USER);
  console.log('');

  try {
    // Check purchase info from sale contract
    const purchaseInfo = await client.readContract({
      address: SALE_ADDRESS,
      abi: WhitelistSaleABI.abi,
      functionName: 'getPurchaseInfo',
      args: [ACTUAL_USER],
    });

    console.log('📊 Purchase Info:');
    console.log('  Token Amount:', (Number(purchaseInfo[0]) / 1e18).toFixed(4), 'WLT');
    console.log('  ETH Spent:', (Number(purchaseInfo[1]) / 1e18).toFixed(6), 'ETH');
    console.log('  Timestamp:', purchaseInfo[2].toString());
    console.log('  Claimed:', purchaseInfo[3]);
    console.log('');

    // Check token balance
    const tokenBalance = await client.readContract({
      address: TOKEN_ADDRESS,
      abi: WhitelistTokenABI.abi,
      functionName: 'balanceOf',
      args: [ACTUAL_USER],
    });

    console.log('💰 Current Token Balance:');
    console.log('  Raw Balance:', tokenBalance.toString(), 'wei');
    console.log('  Formatted Balance:', (Number(tokenBalance) / 1e18).toFixed(4), 'WLT');
    console.log('');

    // Analysis
    if (Number(purchaseInfo[0]) > 0) {
      console.log('✅ FOUND THE ISSUE!');
      console.log('The transactions are happening from:', ACTUAL_USER);
      console.log('But you are connected to a different wallet in MetaMask.');
      console.log('');
      console.log('🔧 SOLUTION:');
      console.log('1. In MetaMask, switch to the account with address:', ACTUAL_USER);
      console.log('2. OR import this private key into MetaMask:');
      console.log('   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
      console.log('   (This is Hardhat\'s default test account #0)');
      console.log('');
      
      if (purchaseInfo[3]) {
        console.log('🎉 Tokens already claimed! Balance:', (Number(tokenBalance) / 1e18).toFixed(4), 'WLT');
      } else {
        console.log('⏳ Tokens purchased but not yet claimed.');
        console.log('💡 After switching wallets, you can claim your', (Number(purchaseInfo[0]) / 1e18).toFixed(4), 'WLT tokens!');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkActualUserStatus();