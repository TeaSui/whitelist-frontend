// Debug the claim mechanism issue
const { createPublicClient, http } = require('viem');
const WhitelistSaleABI = require('./src/contracts/WhitelistSale.json');
const WhitelistTokenABI = require('./src/contracts/WhitelistToken.json');

const SALE_ADDRESS = '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707';
const TOKEN_ADDRESS = '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9';
const YOUR_ADDRESS = '0xE76844a9D809eaC5De362Ea71096cDf91932e09E'; // The address you're using

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

async function debugClaimIssue() {
  console.log('🔍 Debugging Claim Issue...');
  console.log('User Address:', YOUR_ADDRESS);
  console.log('');

  try {
    // Get current purchase info
    const purchaseInfo = await client.readContract({
      address: SALE_ADDRESS,
      abi: WhitelistSaleABI.abi,
      functionName: 'getPurchaseInfo',
      args: [YOUR_ADDRESS],
    });

    console.log('📊 Current Purchase Info:');
    console.log('  Tokens Purchased:', (Number(purchaseInfo[0]) / 1e18).toFixed(4), 'WLT');
    console.log('  ETH Spent:', (Number(purchaseInfo[1]) / 1e18).toFixed(6), 'ETH');
    console.log('  Timestamp:', new Date(Number(purchaseInfo[2]) * 1000).toLocaleString());
    console.log('  Already Claimed:', purchaseInfo[3]);
    console.log('');

    // Get current token balance
    const tokenBalance = await client.readContract({
      address: TOKEN_ADDRESS,
      abi: WhitelistTokenABI.abi,
      functionName: 'balanceOf',
      args: [YOUR_ADDRESS],
    });

    console.log('💰 Current Token Balance:', (Number(tokenBalance) / 1e18).toFixed(4), 'WLT');
    console.log('');

    // Analyze recent transactions to understand the pattern
    console.log('🔍 Analyzing Recent Transactions...');
    
    // Get the last few blocks to see purchase and claim patterns
    const latestBlock = await client.getBlockNumber();
    
    let purchases = [];
    let claims = [];
    
    // Check last 20 blocks for transactions from your address
    for (let i = 0; i < 20 && latestBlock - BigInt(i) >= 0; i++) {
      const blockNumber = latestBlock - BigInt(i);
      
      try {
        const block = await client.getBlock({
          blockNumber,
          includeTransactions: true,
        });
        
        for (const tx of block.transactions) {
          if (tx.from?.toLowerCase() === YOUR_ADDRESS.toLowerCase() && 
              tx.to?.toLowerCase() === SALE_ADDRESS.toLowerCase()) {
            
            // Get transaction receipt to see the events
            const receipt = await client.getTransactionReceipt({ hash: tx.hash });
            
            if (receipt.status === 'success') {
              // Parse the logs to understand what happened
              if (Number(tx.value) > 0) {
                // Purchase transaction (has ETH value)
                purchases.push({
                  block: Number(blockNumber),
                  hash: tx.hash,
                  ethValue: Number(tx.value) / 1e18,
                  gasUsed: Number(receipt.gasUsed),
                  logs: receipt.logs.length,
                });
              } else {
                // Claim transaction (no ETH value)
                claims.push({
                  block: Number(blockNumber),
                  hash: tx.hash,
                  gasUsed: Number(receipt.gasUsed),
                  logs: receipt.logs.length,
                });
              }
            }
          }
        }
      } catch (blockError) {
        // Skip blocks that might not exist
        continue;
      }
    }

    console.log('📈 Purchase History (recent first):');
    purchases.reverse().forEach((purchase, index) => {
      console.log(`  ${index + 1}. Block ${purchase.block}: ${purchase.ethValue} ETH (${purchase.ethValue * 1000} tokens expected)`);
    });
    console.log('');

    console.log('🎯 Claim History (recent first):');
    claims.reverse().forEach((claim, index) => {
      console.log(`  ${index + 1}. Block ${claim.block}: Gas used ${claim.gasUsed}, Logs: ${claim.logs}`);
    });
    console.log('');

    // HYPOTHESIS TESTING
    console.log('🧠 Issue Analysis:');
    console.log('');
    
    console.log('📋 Pattern you described:');
    console.log('  1st: Buy 10 → Claim 10 ✅');
    console.log('  2nd: Buy 50 → Claim 60 ❌ (should be 50)');
    console.log('  3rd: Buy 10 → Claim 70 ❌ (should be 10)');
    console.log('');

    console.log('💡 Possible Issues:');
    console.log('  1. Contract is accumulating instead of resetting purchases');
    console.log('  2. Multiple purchases are being stored incorrectly');
    console.log('  3. Claim function is not marking claims as completed');
    console.log('  4. There might be a bonus/multiplier mechanism');
    console.log('');

    // Check the contract storage structure
    console.log('🔍 Contract Storage Analysis:');
    
    // The purchases mapping stores: amount, ethSpent, timestamp, claimed
    // Let's see if there are multiple purchases not being handled correctly
    
    const totalPurchased = await client.readContract({
      address: SALE_ADDRESS,
      abi: WhitelistSaleABI.abi,
      functionName: 'totalPurchased',
      args: [YOUR_ADDRESS],
    });
    
    console.log('  Total Purchased (from mapping):', (Number(totalPurchased) / 1e18).toFixed(4), 'WLT');
    console.log('  Purchase Info Amount:', (Number(purchaseInfo[0]) / 1e18).toFixed(4), 'WLT');
    console.log('  These should match if working correctly');
    console.log('');

    // Check if there's a pattern in the differences
    const expectedFromPurchases = purchases.reduce((sum, p) => sum + (p.ethValue * 1000), 0);
    console.log('📊 Expected vs Actual:');
    console.log('  Expected from purchases:', expectedFromPurchases, 'WLT');
    console.log('  Actually claimed/balance:', (Number(tokenBalance) / 1e18).toFixed(4), 'WLT');
    console.log('  Difference:', ((Number(tokenBalance) / 1e18) - expectedFromPurchases).toFixed(4), 'WLT');

    if ((Number(tokenBalance) / 1e18) > expectedFromPurchases) {
      console.log('  🚨 You received MORE tokens than expected!');
      console.log('  This suggests the contract has a bug or bonus mechanism');
    }

  } catch (error) {
    console.error('❌ Error during analysis:', error);
  }
}

debugClaimIssue();