import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { createWhitelistSaleContract, createWhitelistTokenContract, SaleInfo, CONTRACT_ADDRESSES } from '@/utils/contracts';
import { getSaleInfo } from '@/lib/api';

export const useSaleInfo = () => {
  const publicClient = usePublicClient();
  
  return useQuery<SaleInfo | null>({
    queryKey: ['saleInfo'],
    queryFn: async (): Promise<SaleInfo | null> => {
      // Skip API and use contract directly since API is not available
      console.log('Using contract data directly...');
        
      // Use direct contract calls
      if (!publicClient) {
        throw new Error('No blockchain connection available');
      }

      try {
        const saleContract = createWhitelistSaleContract(publicClient);
        
        // Call all contract methods in parallel for better performance
        const [
          tokenAddress,
          treasury,
          saleConfigData,
          totalSold,
          totalEthRaised,
          isPaused,
          isSaleActive,
          claimEnabled,
          claimStartTime,
        ] = await Promise.all([
          saleContract.read.token(),
          saleContract.read.treasury(),
          saleContract.read.saleConfig(),
          saleContract.read.totalSold(),
          saleContract.read.totalEthRaised(),
          saleContract.read.paused(),
          saleContract.read.isSaleActive(),
          saleContract.read.claimEnabled(),
          saleContract.read.claimStartTime(),
        ]);

        const result = {
          contractAddress: CONTRACT_ADDRESSES.WHITELIST_SALE,
          tokenAddress: tokenAddress as string,
          treasury: treasury as string,
          saleConfig: {
            tokenPrice: (saleConfigData as any)[0] as bigint,
            minPurchase: (saleConfigData as any)[1] as bigint,
            maxPurchase: (saleConfigData as any)[2] as bigint,
            maxSupply: (saleConfigData as any)[3] as bigint,
            startTime: (saleConfigData as any)[4] as bigint,
            endTime: (saleConfigData as any)[5] as bigint,
            whitelistRequired: (saleConfigData as any)[6] as boolean,
          },
          totalSold: totalSold as bigint,
          totalEthRaised: totalEthRaised as bigint,
          isPaused: isPaused as boolean,
          isSaleActive: isSaleActive as boolean,
          claimEnabled: claimEnabled as boolean,
          claimStartTime: claimStartTime as bigint,
        };

        console.log('🔍 Contract Sale Info:', {
          isSaleActive: result.isSaleActive,
          isPaused: result.isPaused,
          startTime: result.saleConfig.startTime.toString(),
          endTime: result.saleConfig.endTime.toString(),
          currentTime: Math.floor(Date.now() / 1000),
        });

        return result;
      } catch (contractError) {
        console.error('Contract calls failed:', contractError);
        throw contractError;
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on network/RPC errors that won't resolve
      if (error?.message?.includes('could not detect network') || 
          error?.message?.includes('missing provider')) {
        return false;
      }
      return failureCount < 3;
    },
  });
};