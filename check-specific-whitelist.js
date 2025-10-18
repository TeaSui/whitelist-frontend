// Check if the specific failing address is properly whitelisted
const { createPublicClient, createWalletClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const WhitelistSaleABI = require('./src/contracts/WhitelistSale.json');

const SALE_ADDRESS = '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707';
const FAILING_ADDRESS = '0xE76844a9D809eaC5De362Ea71096cDf91932e09E';
const OWNER_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

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

async function checkAndFixWhitelist() {
  console.log('🔍 Checking whitelist status for failing address...');
  console.log('Address:', FAILING_ADDRESS);
  console.log('');

  try {
    // Check current whitelist status
    const isWhitelisted = await publicClient.readContract({
      address: SALE_ADDRESS,
      abi: WhitelistSaleABI.abi,
      functionName: 'whitelist',
      args: [FAILING_ADDRESS],
    });

    console.log('Current whitelist status:', isWhitelisted);

    if (!isWhitelisted) {
      console.log('❌ Address is NOT whitelisted. Adding to whitelist...');
      
      const hash = await walletClient.writeContract({
        address: SALE_ADDRESS,
        abi: WhitelistSaleABI.abi,
        functionName: 'updateWhitelist',
        args: [FAILING_ADDRESS, true],
      });

      await publicClient.waitForTransactionReceipt({ hash });
      console.log('✅ Address successfully whitelisted!');
    } else {
      console.log('✅ Address is already whitelisted');
    }

    // Now test the purchase function with simulation
    console.log('\n🧪 Testing purchase simulation...');
    
    try {
      const { request } = await publicClient.simulateContract({
        account: FAILING_ADDRESS,
        address: SALE_ADDRESS,
        abi: WhitelistSaleABI.abi,
        functionName: 'purchaseTokens',
        args: [BigInt('10000000000000000000'), []], // 10 tokens, empty proof
        value: BigInt('10000000000000000'), // 0.01 ETH
      });
      
      console.log('✅ Purchase simulation successful!');
      console.log('The issue might be in the frontend transaction handling.');
      
    } catch (simError) {
      console.log('❌ Purchase simulation failed:');
      console.log('Error:', simError.message);
      
      // Try to extract the revert reason
      if (simError.message.includes('revert')) {
        const revertMatch = simError.message.match(/revert (.+)/);
        if (revertMatch) {
          console.log('Revert reason:', revertMatch[1]);
        }
      }
      
      // Check if it's a gas issue
      if (simError.message.includes('gas') || simError.message.includes('Gas')) {
        console.log('💡 This might be a gas estimation issue.');
        console.log('💡 Try increasing gas limit in MetaMask.');
      }
    }

    // Test with merkle tree verification
    console.log('\n🌲 Testing merkle tree verification...');
    try {
      const merkleRoot = await publicClient.readContract({
        address: SALE_ADDRESS,
        abi: WhitelistSaleABI.abi,
        functionName: 'merkleRoot',
      });
      
      console.log('Merkle root:', merkleRoot);
      
      if (merkleRoot === '0x0000000000000000000000000000000000000000000000000000000000000000') {
        console.log('✅ Using simple whitelist (merkle root is zero)');
      } else {
        console.log('⚠️ Merkle tree is set - need proper merkle proof');
      }
      
      const canVerify = await publicClient.readContract({
        address: SALE_ADDRESS,
        abi: WhitelistSaleABI.abi,
        functionName: 'isWhitelisted',
        args: [FAILING_ADDRESS, []], // Empty proof
      });
      
      console.log('Can verify with empty proof:', canVerify);
      
    } catch (merkleError) {
      console.log('Merkle verification error:', merkleError.message);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAndFixWhitelist();