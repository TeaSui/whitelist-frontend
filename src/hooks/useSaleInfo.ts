import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { createWhitelistSaleContract, createWhitelistTokenContract, SaleInfo } from '@/utils/contracts';
import { getSaleInfo } from '@/lib/api';

export const useSaleInfo = () => {
  const publicClient = usePublicClient();
  
  return useQuery<SaleInfo | null>({
    queryKey: ['saleInfo'],
    queryFn: async (): Promise<SaleInfo | null> => {
      try {
        // Try backend API first
        console.log('Fetching sale info from backend API...');
        const apiResponse = await getSaleInfo();
        
        return {
          tokenAddress: apiResponse.tokenAddress,
          treasury: apiResponse.treasury,
          tokenPrice: apiResponse.tokenPrice,
          minPurchase: apiResponse.minPurchase,
          maxPurchase: apiResponse.maxPurchase,
          maxSupply: apiResponse.maxSupply,
          startTime: apiResponse.startTime,
          endTime: apiResponse.endTime,
          isPaused: apiResponse.isPaused,
          isActive: apiResponse.isActive,
          totalSold: apiResponse.totalSold,
          claimEnabled: apiResponse.claimEnabled,
          claimStartTime: apiResponse.claimStartTime,
        };
      } catch (apiError) {
        console.warn('Backend API failed, falling back to contract:', apiError);
        
        // Fallback to direct contract calls
        if (!publicClient) {
          throw new Error('No backend API and no blockchain connection available');
        }

        try {
          const saleContract = createWhitelistSaleContract(publicClient);
          const tokenContract = createWhitelistTokenContract(publicClient);
          
          // Call all contract methods in parallel for better performance
          const [
            tokenAddress,
            treasury,
            tokenPrice,
            minPurchase,
            maxPurchase,
            maxSupply,
            startTime,
            endTime,
            isPaused,
            isActive,
            claimEnabled,
            claimStartTime,
            tokenTotalSupply
          ] = await Promise.all([
            saleContract.read.token(),
            saleContract.read.treasury(),
            saleContract.read.tokenPrice(),
            saleContract.read.minPurchase(),
            saleContract.read.maxPurchase(),
            saleContract.read.maxSupply(),
            saleContract.read.startTime(),
            saleContract.read.endTime(),
            saleContract.read.paused(),
            saleContract.read.isActive(),
            saleContract.read.claimEnabled(),
            saleContract.read.claimStartTime(),
            tokenContract.read.totalSupply()
          ]);

          // Calculate total sold (maxSupply - remaining tokens in sale contract)
          const saleBalance = await tokenContract.read.balanceOf([saleContract.address]);
          const totalSold = maxSupply - saleBalance;

          return {
            tokenAddress,
            treasury,
            tokenPrice: tokenPrice.toString(),
            minPurchase: minPurchase.toString(),
            maxPurchase: maxPurchase.toString(),
            maxSupply: maxSupply.toString(),
            startTime: Number(startTime),
            endTime: Number(endTime),
            isPaused: Boolean(isPaused),
            isActive: Boolean(isActive),
            totalSold: totalSold.toString(),
            claimEnabled: Boolean(claimEnabled),
            claimStartTime: Number(claimStartTime),
          };
        } catch (contractError) {
          console.error('Both API and contract calls failed:', contractError);
          throw contractError;
        }
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 5 * 60 * 1000, // 5 minutes
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