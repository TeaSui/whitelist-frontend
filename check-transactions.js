// Check recent transactions for the user address
const { createPublicClient, http } = require('viem');

const USER_ADDRESS = '0xE76844a9D809eaC5De362Ea71096cDf91932e09E';
const SALE_ADDRESS = '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707';

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

async function checkRecentTransactions() {
  try {
    console.log('🔍 Checking recent transactions...');
    
    // Get current block number
    const latestBlock = await client.getBlockNumber();
    console.log('Latest block:', latestBlock.toString());
    
    // Check last few blocks for transactions
    for (let i = 0; i < 10 && latestBlock - BigInt(i) >= 0; i++) {
      const blockNumber = latestBlock - BigInt(i);
      
      try {
        const block = await client.getBlock({
          blockNumber,
          includeTransactions: true,
        });
        
        if (block.transactions.length > 0) {
          console.log(`\n📦 Block ${blockNumber} (${block.transactions.length} transactions):`);
          
          for (const tx of block.transactions) {
            // Check if transaction involves our user or sale contract
            if (tx.from?.toLowerCase() === USER_ADDRESS.toLowerCase() || 
                tx.to?.toLowerCase() === SALE_ADDRESS.toLowerCase()) {
              
              console.log('  🔄 Relevant Transaction:', tx.hash);
              console.log('    From:', tx.from);
              console.log('    To:', tx.to);
              console.log('    Value:', tx.value.toString(), 'wei');
              console.log('    Gas Used:', tx.gas.toString());
              
              // Get transaction receipt for more details
              try {
                const receipt = await client.getTransactionReceipt({ hash: tx.hash });
                console.log('    Status:', receipt.status === 'success' ? '✅ Success' : '❌ Failed');
                console.log('    Gas Used:', receipt.gasUsed.toString());
                
                if (receipt.logs.length > 0) {
                  console.log('    Events:', receipt.logs.length, 'logs emitted');
                }
              } catch (receiptError) {
                console.log('    Receipt: Error getting receipt');
              }
            }
          }
        }
      } catch (blockError) {
        // Skip blocks that might not exist
        continue;
      }
    }
    
    console.log('\n🔍 Summary:');
    console.log('If you see a transaction with status "❌ Failed", that explains why no tokens were received.');
    console.log('If you see a transaction with status "✅ Success" to the sale contract, but no tokens, there might be a claiming mechanism.');
    
  } catch (error) {
    console.error('Error checking transactions:', error);
  }
}

checkRecentTransactions();