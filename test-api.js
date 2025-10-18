// Quick test to see what the API returns vs contract
const axios = require('axios');
const { createPublicClient, http } = require('viem');
const WhitelistSaleABI = require('./src/contracts/WhitelistSale.json');

const SALE_ADDRESS = '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707';
const API_URL = 'http://localhost:8080';

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

async function compareApiVsContract() {
  console.log('🔍 Comparing API vs Contract data...\n');

  // Test API
  try {
    console.log('📡 Testing API...');
    const apiResponse = await axios.get(`${API_URL}/api/sale`);
    console.log('✅ API Response:', {
      isActive: apiResponse.data.isActive,
      startTime: apiResponse.data.startTime,
      endTime: apiResponse.data.endTime,
      isPaused: apiResponse.data.isPaused,
    });
  } catch (apiError) {
    console.log('❌ API Error:', apiError.message);
  }

  // Test Contract
  try {
    console.log('\n🔗 Testing Contract...');
    const [saleConfig, isSaleActive, isPaused] = await Promise.all([
      client.readContract({
        address: SALE_ADDRESS,
        abi: WhitelistSaleABI.abi,
        functionName: 'saleConfig',
      }),
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
    ]);

    console.log('✅ Contract Response:', {
      isSaleActive,
      startTime: saleConfig[4].toString(),
      endTime: saleConfig[5].toString(),
      isPaused,
      currentTime: Math.floor(Date.now() / 1000),
    });
  } catch (contractError) {
    console.log('❌ Contract Error:', contractError.message);
  }
}

compareApiVsContract();