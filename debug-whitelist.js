// Debug script to check whitelist status
const { createPublicClient, http } = require('viem');
const WhitelistSaleABI = require('./src/contracts/WhitelistSale.json');

const SALE_ADDRESS = '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707';
const TEST_ADDRESS = '0xE76844a9D809eaC5De362Ea71096cDf91932e09E'; // From the error

const client = createPublicClient({
  transport: http('http://127.0.0.1:8545'),
});

async function debugWhitelist() {
  try {
    console.log('Debugging Whitelist for address:', TEST_ADDRESS);
    
    // Check if address is whitelisted using empty proof (should fail)
    try {
      const isWhitelistedEmpty = await client.readContract({
        address: SALE_ADDRESS,
        abi: WhitelistSaleABI.abi,
        functionName: 'isWhitelisted',
        args: [TEST_ADDRESS, []], // Empty merkle proof
      });
      console.log('Is whitelisted with empty proof:', isWhitelistedEmpty);
    } catch (error) {
      console.log('Empty proof check failed:', error.message);
    }
    
    // Get the current merkle root
    const merkleRoot = await client.readContract({
      address: SALE_ADDRESS,
      abi: WhitelistSaleABI.abi,
      functionName: 'merkleRoot',
    });
    
    console.log('Current Merkle Root:', merkleRoot);
    
    if (merkleRoot === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      console.log('\n🚨 ISSUE IDENTIFIED:');
      console.log('❌ Merkle root is not set (all zeros)');
      console.log('💡 The contract owner needs to call setMerkleRoot() with a valid merkle tree root');
      console.log('💡 OR the contract needs to be configured to not require whitelist');
    } else {
      console.log('\n📋 Merkle root is set. Need to:');
      console.log('1. Generate proper merkle proofs for whitelisted addresses');
      console.log('2. OR add this address to the whitelist via contract admin');
    }
    
    // Check if there's a simple whitelist mapping
    try {
      const simpleWhitelist = await client.readContract({
        address: SALE_ADDRESS,
        abi: WhitelistSaleABI.abi,
        functionName: 'whitelist',
        args: [TEST_ADDRESS],
      });
      console.log('Simple whitelist mapping:', simpleWhitelist);
    } catch (error) {
      console.log('No simple whitelist mapping found');
    }
    
  } catch (error) {
    console.error('Error debugging whitelist:', error);
  }
}

debugWhitelist();