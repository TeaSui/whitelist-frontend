import { useQuery } from '@tanstack/react-query';
import { healthCheck } from '@/lib/api';

export const useBackendHealth = () => {
  return useQuery({
    queryKey: ['backendHealth'],
    queryFn: async () => {
      try {
        console.log('Checking backend health...');
        const response = await healthCheck();
        return {
          isHealthy: true,
          status: response.status,
          service: response.service,
          version: response.version,
        };
      } catch (error) {
        console.warn('Backend health check failed:', error);
        return {
          isHealthy: false,
          status: 'unhealthy',
          service: 'whitelist-token-backend',
          version: 'unknown',
          error: error.message,
        };
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error) => {
      // Only retry network errors, not API errors
      return failureCount < 2;
    },
  });
};