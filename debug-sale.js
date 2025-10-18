// Debug script to check sale contract status
const { createPublicClient, http } = require('viem');
const WhitelistSaleABI = require('./src/contracts/WhitelistSale.json');

const SALE_ADDRESS = '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707';

const client = createPublicClient({
  transport: http('http://127.0.0.1:8545'),
});

async function debugSale() {
  try {
    console.log('Debugging WhitelistSale contract...');
    console.log('Contract address:', SALE_ADDRESS);
    
    // Read sale configuration
    const saleConfig = await client.readContract({
      address: SALE_ADDRESS,
      abi: WhitelistSaleABI.abi,
      functionName: 'saleConfig',
    });
    
    console.log('\n=== Sale Configuration ===');
    console.log('Token Price:', saleConfig[0].toString(), 'wei');
    console.log('Min Purchase:', saleConfig[1].toString(), 'wei');
    console.log('Max Purchase:', saleConfig[2].toString(), 'wei');
    console.log('Max Supply:', saleConfig[3].toString(), 'wei');
    console.log('Start Time:', saleConfig[4].toString(), '(', new Date(Number(saleConfig[4]) * 1000).toISOString(), ')');
    console.log('End Time:', saleConfig[5].toString(), '(', new Date(Number(saleConfig[5]) * 1000).toISOString(), ')');
    console.log('Whitelist Required:', saleConfig[6]);
    
    // Check current status
    const [isSaleActive, isPaused, totalSold] = await Promise.all([
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
        functionName: 'totalSold',
      }),
    ]);
    
    console.log('\n=== Current Status ===');
    console.log('Current Time:', new Date().toISOString());
    console.log('Current Timestamp:', Math.floor(Date.now() / 1000));
    console.log('Is Sale Active:', isSaleActive);
    console.log('Is Paused:', isPaused);
    console.log('Total Sold:', totalSold.toString(), 'wei');
    
    // Analysis
    const now = Math.floor(Date.now() / 1000);
    const startTime = Number(saleConfig[4]);
    const endTime = Number(saleConfig[5]);
    
    console.log('\n=== Analysis ===');
    console.log('Sale should be active if:');
    console.log('- Current time >= Start time:', now >= startTime, `(${now} >= ${startTime})`);
    console.log('- Current time <= End time:', now <= endTime, `(${now} <= ${endTime})`);
    console.log('- Not paused:', !isPaused);
    console.log('- Total sold < Max supply:', Number(totalSold) < Number(saleConfig[3]));
    
    if (!isSaleActive) {
      console.log('\n🚨 ISSUE IDENTIFIED:');
      if (now < startTime) {
        console.log('❌ Sale has not started yet. Starts in:', startTime - now, 'seconds');
      } else if (now > endTime) {
        console.log('❌ Sale has ended. Ended', now - endTime, 'seconds ago');
      } else if (isPaused) {
        console.log('❌ Sale is paused');
      } else if (Number(totalSold) >= Number(saleConfig[3])) {
        console.log('❌ Sale sold out');
      } else {
        console.log('❌ Unknown reason - check contract logic');
      }
    } else {
      console.log('\n✅ Sale should be active!');
    }
    
  } catch (error) {
    console.error('Error debugging sale:', error);
  }
}

debugSale();