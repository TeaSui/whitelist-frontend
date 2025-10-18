// Debug the internal error in purchaseTokens
const { createPublicClient, http } = require('viem');
const WhitelistSaleABI = require('./src/contracts/WhitelistSale.json');
const WhitelistTokenABI = require('./src/contracts/WhitelistToken.json');

const SALE_ADDRESS = '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707';
const TOKEN_ADDRESS = '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9';
const TEST_USER = '0xE76844a9D809eaC5De362Ea71096cDf91932e09E';

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

async function debugInternalError() {
  console.log('🔍 Debugging Internal Error...');
  console.log('Sale Contract:', SALE_ADDRESS);
  console.log('Token Contract:', TOKEN_ADDRESS);
  console.log('Test User:', TEST_USER);
  console.log('');

  try {
    // 1. Check if contracts exist and are responding
    console.log('📋 1. Contract Status Check:');
    
    const [saleOwner, tokenOwner] = await Promise.all([
      client.readContract({
        address: SALE_ADDRESS,
        abi: WhitelistSaleABI.abi,
        functionName: 'owner',
      }),
      client.readContract({
        address: TOKEN_ADDRESS,
        abi: WhitelistTokenABI.abi,
        functionName: 'owner',
      }),
    ]);
    
    console.log('  Sale Contract Owner:', saleOwner);
    console.log('  Token Contract Owner:', tokenOwner);
    console.log('');

    // 2. Check sale status
    console.log('📋 2. Sale Status:');
    const [isSaleActive, isPaused, saleConfig] = await Promise.all([
      client.readContract({
        address: SALE_ADDRESS,
        abi: WhitelistSaleABI.abi,
        functionName: 'isSaleActive',
      }),
      client.readContract({
        address: SALE_ADDRESS,
        abi: WhitelistSaleABI.abi,
        functionName: 'paused',
      }),
      client.readContract({
        address: SALE_ADDRESS,
        abi: WhitelistSaleABI.abi,
        functionName: 'saleConfig',
      }),
    ]);

    console.log('  Sale Active:', isSaleActive);
    console.log('  Is Paused:', isPaused);
    console.log('  Max Supply:', saleConfig[3].toString());
    console.log('  Total Sold:', await client.readContract({
      address: SALE_ADDRESS,
      abi: WhitelistSaleABI.abi,
      functionName: 'totalSold',
    }).then(r => r.toString()));
    console.log('');

    // 3. Check whitelist status
    console.log('📋 3. Whitelist Status:');
    const isWhitelisted = await client.readContract({
      address: SALE_ADDRESS,
      abi: WhitelistSaleABI.abi,
      functionName: 'whitelist',
      args: [TEST_USER],
    });
    console.log('  User Whitelisted:', isWhitelisted);
    console.log('');

    // 4. Check token contract relationship
    console.log('📋 4. Token Contract Integration:');
    const saleTokenAddress = await client.readContract({
      address: SALE_ADDRESS,
      abi: WhitelistSaleABI.abi,
      functionName: 'token',
    });
    console.log('  Sale Contract Token Address:', saleTokenAddress);
    console.log('  Expected Token Address:', TOKEN_ADDRESS);
    console.log('  Addresses Match:', saleTokenAddress.toLowerCase() === TOKEN_ADDRESS.toLowerCase());
    console.log('');

    // 5. Check token balance in sale contract
    console.log('📋 5. Token Availability:');
    const saleContractBalance = await client.readContract({
      address: TOKEN_ADDRESS,
      abi: WhitelistTokenABI.abi,
      functionName: 'balanceOf',
      args: [SALE_ADDRESS],
    });
    console.log('  Sale Contract Token Balance:', (Number(saleContractBalance) / 1e18).toFixed(4), 'WLT');
    
    const totalSupply = await client.readContract({
      address: TOKEN_ADDRESS,
      abi: WhitelistTokenABI.abi,
      functionName: 'totalSupply',
    });
    console.log('  Total Token Supply:', (Number(totalSupply) / 1e18).toFixed(4), 'WLT');
    console.log('');

    // 6. Potential Issues Analysis
    console.log('🔍 6. Issue Analysis:');
    
    if (!isSaleActive) {
      console.log('  ❌ ISSUE: Sale is not active');
    }
    
    if (isPaused) {
      console.log('  ❌ ISSUE: Sale is paused');
    }
    
    if (!isWhitelisted) {
      console.log('  ❌ ISSUE: User is not whitelisted');
    }
    
    if (Number(saleContractBalance) === 0) {
      console.log('  ❌ ISSUE: Sale contract has no tokens to sell');
      console.log('  💡 SOLUTION: Transfer tokens to the sale contract');
    }
    
    if (saleTokenAddress.toLowerCase() !== TOKEN_ADDRESS.toLowerCase()) {
      console.log('  ❌ ISSUE: Sale contract points to wrong token address');
    }

    // 7. Check if max supply is reached
    const totalSold = await client.readContract({
      address: SALE_ADDRESS,
      abi: WhitelistSaleABI.abi,
      functionName: 'totalSold',
    });
    
    if (Number(totalSold) >= Number(saleConfig[3])) {
      console.log('  ❌ ISSUE: Sale has reached maximum supply');
      console.log('  Total Sold:', (Number(totalSold) / 1e18).toFixed(4));
      console.log('  Max Supply:', (Number(saleConfig[3]) / 1e18).toFixed(4));
    }

    console.log('\n💡 Next Steps:');
    console.log('1. Check if tokens need to be transferred to sale contract');
    console.log('2. Verify all contract parameters are correct');
    console.log('3. Try with a smaller purchase amount');

  } catch (error) {
    console.error('❌ Error during debugging:', error);
  }
}

debugInternalError();