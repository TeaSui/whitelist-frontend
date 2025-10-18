// Test the fixed buy and claim workflow
const { createPublicClient, createWalletClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const WhitelistSaleABI = require('./src/contracts/WhitelistSale.json');
const WhitelistTokenABI = require('./src/contracts/WhitelistToken.json');

// TEST CONTRACT ADDRESSES (IMMEDIATE START)
const SALE_ADDRESS = '0xb7278A61aa25c888815aFC32Ad3cC52fF24fE575';
const TOKEN_ADDRESS = '0x5f3f1dBD7B74C6B46e8c44f98792A1dAf8d69154';

// Test with Account 0 (has ETH balance)
const TEST_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Account 0
const account = privateKeyToAccount(TEST_PRIVATE_KEY);

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

async function testFixedWorkflow() {
  console.log('🧪 Testing Fixed Buy and Claim Workflow...');
  console.log('Test Account:', account.address);
  console.log('Sale Contract (FIXED WhitelistSale):', SALE_ADDRESS);
  console.log('Token Contract:', TOKEN_ADDRESS);
  console.log('');

  try {
    // Step 1: Check initial state
    console.log('📊 Step 1: Check Initial State');
    const initialBalance = await publicClient.readContract({
      address: TOKEN_ADDRESS,
      abi: WhitelistTokenABI.abi,
      functionName: 'balanceOf',
      args: [account.address],
    });

    const initialPurchaseInfo = await publicClient.readContract({
      address: SALE_ADDRESS,
      abi: WhitelistSaleABI.abi,
      functionName: 'getPurchaseInfo',
      args: [account.address],
    });

    console.log('Initial Token Balance:', (Number(initialBalance) / 1e18).toFixed(4), 'WLT');
    console.log('Initial Purchase Info:');
    console.log('  Total Purchased:', (Number(initialPurchaseInfo[0]) / 1e18).toFixed(4), 'WLT');
    console.log('  Total Claimed:', (Number(initialPurchaseInfo[1]) / 1e18).toFixed(4), 'WLT');
    console.log('  ETH Spent:', (Number(initialPurchaseInfo[2]) / 1e18).toFixed(6), 'ETH');
    console.log('');

    // Step 2: First Purchase (10 tokens)
    console.log('💰 Step 2: First Purchase (10 tokens)');
    const purchase1Hash = await walletClient.writeContract({
      address: SALE_ADDRESS,
      abi: WhitelistSaleABI.abi,
      functionName: 'purchaseTokens',
      args: [BigInt('10000000000000000000'), []], // 10 tokens, empty proof
      value: BigInt('10000000000000000'), // 0.01 ETH
    });

    await publicClient.waitForTransactionReceipt({ hash: purchase1Hash });
    console.log('✅ First purchase successful!');

    // Check state after first purchase
    const afterPurchase1Info = await publicClient.readContract({
      address: SALE_ADDRESS,
      abi: WhitelistSaleABI.abi,
      functionName: 'getPurchaseInfo',
      args: [account.address],
    });

    console.log('After Purchase 1:');
    console.log('  Total Purchased:', (Number(afterPurchase1Info[0]) / 1e18).toFixed(4), 'WLT');
    console.log('  Total Claimed:', (Number(afterPurchase1Info[1]) / 1e18).toFixed(4), 'WLT');
    console.log('  ETH Spent:', (Number(afterPurchase1Info[2]) / 1e18).toFixed(6), 'ETH');
    console.log('');

    // Step 3: First Claim (should get 10 tokens)
    console.log('🎯 Step 3: First Claim (should claim 10 tokens)');
    const claim1Hash = await walletClient.writeContract({
      address: SALE_ADDRESS,
      abi: WhitelistSaleABI.abi,
      functionName: 'claimTokens',
    });

    await publicClient.waitForTransactionReceipt({ hash: claim1Hash });
    console.log('✅ First claim successful!');

    // Check balance after first claim
    const afterClaim1Balance = await publicClient.readContract({
      address: TOKEN_ADDRESS,
      abi: WhitelistTokenABI.abi,
      functionName: 'balanceOf',
      args: [account.address],
    });

    const afterClaim1Info = await publicClient.readContract({
      address: SALE_ADDRESS,
      abi: WhitelistSaleABI.abi,
      functionName: 'getPurchaseInfo',
      args: [account.address],
    });

    console.log('After Claim 1:');
    console.log('  Token Balance:', (Number(afterClaim1Balance) / 1e18).toFixed(4), 'WLT');
    console.log('  Total Purchased:', (Number(afterClaim1Info[0]) / 1e18).toFixed(4), 'WLT');
    console.log('  Total Claimed:', (Number(afterClaim1Info[1]) / 1e18).toFixed(4), 'WLT');
    console.log('  ETH Spent:', (Number(afterClaim1Info[2]) / 1e18).toFixed(6), 'ETH');
    console.log('');

    // Step 4: Second Purchase (50 tokens)
    console.log('💰 Step 4: Second Purchase (50 tokens)');
    const purchase2Hash = await walletClient.writeContract({
      address: SALE_ADDRESS,
      abi: WhitelistSaleABI.abi,
      functionName: 'purchaseTokens',
      args: [BigInt('50000000000000000000'), []], // 50 tokens, empty proof
      value: BigInt('50000000000000000'), // 0.05 ETH
    });

    await publicClient.waitForTransactionReceipt({ hash: purchase2Hash });
    console.log('✅ Second purchase successful!');

    // Check state after second purchase
    const afterPurchase2Info = await publicClient.readContract({
      address: SALE_ADDRESS,
      abi: WhitelistSaleABI.abi,
      functionName: 'getPurchaseInfo',
      args: [account.address],
    });

    console.log('After Purchase 2:');
    console.log('  Total Purchased:', (Number(afterPurchase2Info[0]) / 1e18).toFixed(4), 'WLT');
    console.log('  Total Claimed:', (Number(afterPurchase2Info[1]) / 1e18).toFixed(4), 'WLT');
    console.log('  ETH Spent:', (Number(afterPurchase2Info[2]) / 1e18).toFixed(6), 'ETH');
    console.log('');

    // Step 5: Second Claim (should get ONLY 50 tokens, not 60)
    console.log('🎯 Step 5: Second Claim (should claim ONLY 50 tokens)');
    const claim2Hash = await walletClient.writeContract({
      address: SALE_ADDRESS,
      abi: WhitelistSaleABI.abi,
      functionName: 'claimTokens',
    });

    await publicClient.waitForTransactionReceipt({ hash: claim2Hash });
    console.log('✅ Second claim successful!');

    // Check balance after second claim
    const afterClaim2Balance = await publicClient.readContract({
      address: TOKEN_ADDRESS,
      abi: WhitelistTokenABI.abi,
      functionName: 'balanceOf',
      args: [account.address],
    });

    const afterClaim2Info = await publicClient.readContract({
      address: SALE_ADDRESS,
      abi: WhitelistSaleABI.abi,
      functionName: 'getPurchaseInfo',
      args: [account.address],
    });

    console.log('After Claim 2:');
    console.log('  Token Balance:', (Number(afterClaim2Balance) / 1e18).toFixed(4), 'WLT');
    console.log('  Total Purchased:', (Number(afterClaim2Info[0]) / 1e18).toFixed(4), 'WLT');
    console.log('  Total Claimed:', (Number(afterClaim2Info[1]) / 1e18).toFixed(4), 'WLT');
    console.log('  ETH Spent:', (Number(afterClaim2Info[2]) / 1e18).toFixed(6), 'ETH');
    console.log('');

    // Step 6: Third Purchase (10 tokens)
    console.log('💰 Step 6: Third Purchase (10 tokens)');
    const purchase3Hash = await walletClient.writeContract({
      address: SALE_ADDRESS,
      abi: WhitelistSaleABI.abi,
      functionName: 'purchaseTokens',
      args: [BigInt('10000000000000000000'), []], // 10 tokens, empty proof
      value: BigInt('10000000000000000'), // 0.01 ETH
    });

    await publicClient.waitForTransactionReceipt({ hash: purchase3Hash });
    console.log('✅ Third purchase successful!');

    // Step 7: Third Claim (should get ONLY 10 tokens, not 70)
    console.log('🎯 Step 7: Third Claim (should claim ONLY 10 tokens)');
    const claim3Hash = await walletClient.writeContract({
      address: SALE_ADDRESS,
      abi: WhitelistSaleABI.abi,
      functionName: 'claimTokens',
    });

    await publicClient.waitForTransactionReceipt({ hash: claim3Hash });
    console.log('✅ Third claim successful!');

    // Final state check
    const finalBalance = await publicClient.readContract({
      address: TOKEN_ADDRESS,
      abi: WhitelistTokenABI.abi,
      functionName: 'balanceOf',
      args: [account.address],
    });

    const finalInfo = await publicClient.readContract({
      address: SALE_ADDRESS,
      abi: WhitelistSaleABI.abi,
      functionName: 'getPurchaseInfo',
      args: [account.address],
    });

    console.log('🏁 FINAL RESULTS:');
    console.log('═'.repeat(50));
    console.log('Final Token Balance:', (Number(finalBalance) / 1e18).toFixed(4), 'WLT');
    console.log('Total Purchased:', (Number(finalInfo[0]) / 1e18).toFixed(4), 'WLT');
    console.log('Total Claimed:', (Number(finalInfo[1]) / 1e18).toFixed(4), 'WLT');
    console.log('Total ETH Spent:', (Number(finalInfo[2]) / 1e18).toFixed(6), 'ETH');
    console.log('═'.repeat(50));

    // Verify the fix worked
    const expectedBalance = 70; // 10 + 50 + 10
    const actualBalance = Number(finalBalance) / 1e18;
    
    if (Math.abs(actualBalance - expectedBalance) < 0.0001) {
      console.log('✅ SUCCESS: Fix works correctly!');
      console.log('✅ Expected:', expectedBalance, 'WLT');
      console.log('✅ Actual:', actualBalance.toFixed(4), 'WLT');
    } else {
      console.log('❌ FAILED: Still has the bug!');
      console.log('❌ Expected:', expectedBalance, 'WLT');
      console.log('❌ Actual:', actualBalance.toFixed(4), 'WLT');
    }

  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

testFixedWorkflow();