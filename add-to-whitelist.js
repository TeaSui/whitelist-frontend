// Script to add address to whitelist
const { createWalletClient, createPublicClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const WhitelistSaleABI = require('./src/contracts/WhitelistSale.json');

const SALE_ADDRESS = '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707';
const ADDRESS_TO_WHITELIST = '0xE76844a9D809eaC5De362Ea71096cDf91932e09E';

// You'll need to use an account that has owner privileges on the contract
// This should be the same account that deployed the contract
const OWNER_PRIVATE_KEY = process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Default Hardhat account #0

const account = privateKeyToAccount(OWNER_PRIVATE_KEY);

// Define Hardhat local chain
const hardhatChain = {
  id: 31337,
  name: 'Hardhat',
  network: 'hardhat',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
    public: { http: ['http://127.0.0.1:8545'] },
  },
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

async function addToWhitelist() {
  try {
    console.log('Adding address to whitelist...');
    console.log('Contract:', SALE_ADDRESS);
    console.log('Address to whitelist:', ADDRESS_TO_WHITELIST);
    console.log('Owner account:', account.address);
    
    // First check if we're the owner
    const contractOwner = await publicClient.readContract({
      address: SALE_ADDRESS,
      abi: WhitelistSaleABI.abi,
      functionName: 'owner',
    });
    
    console.log('Contract owner:', contractOwner);
    
    if (contractOwner.toLowerCase() !== account.address.toLowerCase()) {
      console.error('❌ Current account is not the contract owner!');
      console.log('💡 You need to use the account that deployed the contract');
      return;
    }
    
    // Add to whitelist
    console.log('Calling updateWhitelist...');
    const hash = await walletClient.writeContract({
      address: SALE_ADDRESS,
      abi: WhitelistSaleABI.abi,
      functionName: 'updateWhitelist',
      args: [ADDRESS_TO_WHITELIST, true], // address, whitelisted
    });
    
    console.log('Transaction hash:', hash);
    console.log('Waiting for confirmation...');
    
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log('✅ Transaction confirmed!');
    
    // Verify the address is now whitelisted
    const isWhitelisted = await publicClient.readContract({
      address: SALE_ADDRESS,
      abi: WhitelistSaleABI.abi,
      functionName: 'whitelist',
      args: [ADDRESS_TO_WHITELIST],
    });
    
    console.log('Is now whitelisted:', isWhitelisted);
    
    if (isWhitelisted) {
      console.log('🎉 Address successfully added to whitelist!');
      console.log('💡 You can now purchase tokens from the frontend');
    }
    
  } catch (error) {
    console.error('Error adding to whitelist:', error);
  }
}

addToWhitelist();