import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { createWhitelistTokenContract, WhitelistStatus } from '@/utils/contracts';
import { getWhitelistStatus } from '@/lib/api';

export const useWhitelistStatus = (address?: string) => {
  const publicClient = usePublicClient();
  
  return useQuery<WhitelistStatus | null>({
    queryKey: ['whitelistStatus', address],
    queryFn: async (): Promise<WhitelistStatus | null> => {
      if (!address) return null;
      
      try {
        // Try backend API first
        console.log('Fetching whitelist status from backend API...');
        const apiResponse = await getWhitelistStatus(address);
        
        // Get token balance from contract (not available in API)
        let tokenBalance = '0';
        if (publicClient) {
          try {
            const contract = createWhitelistTokenContract(publicClient);
            const balance = await contract.read.balanceOf([address as `0x${string}`]);
            tokenBalance = balance.toString();
          } catch (contractError) {
            console.warn('Failed to get token balance from contract:', contractError);
          }
        }

        return {
          address: apiResponse.address,
          isWhitelisted: apiResponse.isWhitelisted,
          tokenBalance,
          addedAt: apiResponse.isWhitelisted ? new Date() : null,
        };
      } catch (apiError) {
        console.warn('Backend API failed, falling back to contract:', apiError);
        
        // Fallback to direct contract calls
        if (!publicClient) {
          throw new Error('No backend API and no blockchain connection available');
        }

        try {
          const contract = createWhitelistTokenContract(publicClient);
          
          // Call contract methods in parallel for better performance
          const [isWhitelisted, tokenBalance] = await Promise.all([
            contract.read.whitelist([address as `0x${string}`]),
            contract.read.balanceOf([address as `0x${string}`])
          ]);

          return {
            address,
            isWhitelisted: Boolean(isWhitelisted),
            tokenBalance: tokenBalance.toString(),
            addedAt: isWhitelisted ? new Date() : null,
          };
        } catch (contractError) {
          console.error('Both API and contract calls failed:', contractError);
          throw contractError;
        }
      }
    },
    enabled: !!address,
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on validation errors
      if (error?.message?.includes('Invalid Ethereum address')) {
        return false;
      }
      return failureCount < 3;
    },
  });
};