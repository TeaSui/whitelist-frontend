// Check user's token balance and purchase info
const { createPublicClient, http } = require('viem');
const WhitelistSaleABI = require('./src/contracts/WhitelistSale.json');
const WhitelistTokenABI = require('./src/contracts/WhitelistToken.json');

const SALE_ADDRESS = '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707';
const TOKEN_ADDRESS = '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9';
const USER_ADDRESS = '0xE76844a9D809eaC5De362Ea71096cDf91932e09E';

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

async function checkUserStatus() {
  console.log('🔍 Checking user purchase status...');
  console.log('User Address:', USER_ADDRESS);
  console.log('Sale Contract:', SALE_ADDRESS);
  console.log('Token Contract:', TOKEN_ADDRESS);
  console.log('');

  try {
    // Check purchase info from sale contract
    const purchaseInfo = await client.readContract({
      address: SALE_ADDRESS,
      abi: WhitelistSaleABI.abi,
      functionName: 'getPurchaseInfo',
      args: [USER_ADDRESS],
    });

    console.log('📊 Purchase Info from Sale Contract:');
    console.log('  Token Amount:', purchaseInfo[0].toString(), 'wei');
    console.log('  ETH Spent:', purchaseInfo[1].toString(), 'wei');
    console.log('  Timestamp:', purchaseInfo[2].toString());
    console.log('  Claimed:', purchaseInfo[3]);
    console.log('');

    // Check token balance
    const tokenBalance = await client.readContract({
      address: TOKEN_ADDRESS,
      abi: WhitelistTokenABI.abi,
      functionName: 'balanceOf',
      args: [USER_ADDRESS],
    });

    console.log('💰 Token Balance:');
    console.log('  Raw Balance:', tokenBalance.toString(), 'wei');
    console.log('  Formatted Balance:', (Number(tokenBalance) / 1e18).toFixed(4), 'WLT');
    console.log('');

    // Check if claiming is required
    const claimEnabled = await client.readContract({
      address: SALE_ADDRESS,
      abi: WhitelistSaleABI.abi,
      functionName: 'claimEnabled',
    });

    const claimStartTime = await client.readContract({
      address: SALE_ADDRESS,
      abi: WhitelistSaleABI.abi,
      functionName: 'claimStartTime',
    });

    console.log('🎯 Claim Status:');
    console.log('  Claim Enabled:', claimEnabled);
    console.log('  Claim Start Time:', claimStartTime.toString());
    console.log('  Current Time:', Math.floor(Date.now() / 1000));
    console.log('');

    // Analysis
    if (Number(purchaseInfo[0]) > 0 && Number(tokenBalance) === 0) {
      if (claimEnabled && !purchaseInfo[3]) {
        console.log('💡 ANALYSIS: Tokens purchased but not yet claimed!');
        console.log('   You need to call claimTokens() to receive your tokens.');
        
        const currentTime = Math.floor(Date.now() / 1000);
        if (currentTime >= Number(claimStartTime)) {
          console.log('   ✅ Claiming is available NOW!');
        } else {
          console.log('   ⏰ Claiming starts in:', Number(claimStartTime) - currentTime, 'seconds');
        }
      } else {
        console.log('❓ ANALYSIS: Tokens should have been transferred directly. Investigating...');
      }
    } else if (Number(tokenBalance) > 0) {
      console.log('✅ ANALYSIS: Tokens successfully received!');
    } else {
      console.log('❌ ANALYSIS: No purchase found or tokens received.');
    }

  } catch (error) {
    console.error('Error checking user status:', error);
  }
}

checkUserStatus();