import { useQuery } from '@tanstack/react-query';
import { getUserPurchases } from '@/lib/api';

interface PurchaseRecord {
  txHash: string;
  buyer: string;
  tokenAmount: string;
  ethAmount: string;
  timestamp: number;
  blockNumber: number;
}

export const useUserPurchases = (address?: string) => {
  return useQuery<PurchaseRecord[]>({
    queryKey: ['userPurchases', address],
    queryFn: async (): Promise<PurchaseRecord[]> => {
      if (!address) return [];
      
      try {
        console.log('Fetching user purchases from backend API...');
        const response = await getUserPurchases(address);
        return response.purchases || [];
      } catch (error) {
        console.error('Failed to fetch user purchases:', error);
        // Return empty array instead of throwing, since purchases are not critical
        return [];
      }
    },
    enabled: !!address,
    staleTime: 60 * 1000, // 1 minute
    cacheTime: 10 * 60 * 1000, // 10 minutes (longer cache for historical data)
  });
};