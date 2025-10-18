import type { NextPage } from 'next';
import Head from 'next/head';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import { 
  CheckCircleIcon, 
  XCircleIcon,
  CurrencyDollarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { TokenPurchaseForm } from '@/components/TokenPurchaseForm';
import { ClaimTokensForm } from '@/components/ClaimTokensForm';
import { useSaleInfo } from '@/hooks/useSaleInfo';
import { useWhitelistStatus } from '@/hooks/useWhitelistStatus';
import { useUserPurchases } from '@/hooks/useUserPurchases';
import { useBackendHealth } from '@/hooks/useBackendHealth';
import { formatEther, formatNumber } from '@/utils/format';

const Dashboard: NextPage = () => {
  const { address, isConnected } = useAccount();
  const { data: saleInfo, isLoading: saleInfoLoading } = useSaleInfo();
  const { data: whitelistStatus, isLoading: whitelistLoading } = useWhitelistStatus(address);
  const { data: userPurchases, isLoading: purchasesLoading } = useUserPurchases(address);
  const { data: backendHealth } = useBackendHealth();

  if (!isConnected) {
    return (
      <Container className="py-24">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Connect Your Wallet
          </h1>
          <p className="text-gray-600">
            Please connect your wallet to access the dashboard.
          </p>
        </div>
      </Container>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard - Whitelist Token</title>
        <meta name="description" content="Your whitelist token sale dashboard" />
      </Head>

      <Container className="py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
                <p className="text-gray-600">
                  Welcome back! Here's your token sale information.
                </p>
              </div>
              
              {/* Backend Status Indicator */}
              <div className="flex items-center space-x-2">
                <div className={`h-2 w-2 rounded-full ${backendHealth?.isHealthy ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-sm text-gray-600">
                  Backend: {backendHealth?.isHealthy ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Whitelist Status */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Whitelist Status</h2>
                {whitelistLoading ? (
                  <div className="h-6 w-6 bg-gray-200 rounded-full animate-pulse" />
                ) : whitelistStatus?.isWhitelisted ? (
                  <CheckCircleIcon className="h-6 w-6 text-green-500" />
                ) : (
                  <XCircleIcon className="h-6 w-6 text-red-500" />
                )}
              </div>
              
              {whitelistLoading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                </div>
              ) : whitelistStatus ? (
                <div>
                  <p className={`text-sm font-medium ${whitelistStatus.isWhitelisted ? 'text-green-600' : 'text-red-600'}`}>
                    {whitelistStatus.isWhitelisted ? 'Whitelisted ✓' : 'Not Whitelisted ✗'}
                  </p>
                  {whitelistStatus.isWhitelisted && (
                    <div className="mt-3 space-y-2 text-sm text-gray-600">
                      <div>Token Balance: {formatNumber(formatEther(whitelistStatus.tokenBalance))} WLT</div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Unable to load whitelist status</p>
              )}
            </Card>

            {/* Account Info */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Account</h2>
                <CurrencyDollarIcon className="h-6 w-6 text-blue-500" />
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Wallet Address</p>
                  <p className="text-sm font-mono text-gray-900 break-all">
                    {address}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Network</p>
                  <p className="text-sm text-gray-900">Hardhat Local (31337)</p>
                </div>
              </div>
            </Card>

            {/* Sale Information */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Sale Info</h2>
                <ChartBarIcon className="h-6 w-6 text-purple-500" />
              </div>
              
              {saleInfoLoading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                </div>
              ) : saleInfo ? (
                <div className="space-y-2 text-sm text-gray-600">
                  <div>Token Price: {formatEther(saleInfo.saleConfig.tokenPrice)} ETH</div>
                  <div>Total Supply: {formatNumber(formatEther(saleInfo.saleConfig.maxSupply))} WLT</div>
                  <div>Tokens Sold: {formatNumber(formatEther(saleInfo.totalSold))} WLT</div>
                  <div>
                    Progress: {((Number(formatEther(saleInfo.totalSold)) / Number(formatEther(saleInfo.saleConfig.maxSupply))) * 100).toFixed(1)}%
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Unable to load sale information</p>
              )}
            </Card>
          </div>

          {/* Claim Tokens Form - Show first if there are tokens to claim */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-8"
          >
            <ClaimTokensForm 
              onSuccess={(txHash) => {
                console.log('Claim successful:', txHash);
                // Refresh data after successful claim
                window.location.reload();
              }}
            />
          </motion.div>

          {/* Token Purchase Form */}
          {whitelistStatus?.isWhitelisted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mt-8"
            >
              <TokenPurchaseForm 
                onSuccess={(txHash) => {
                  console.log('Purchase successful:', txHash);
                  // Refresh data after successful purchase
                  window.location.reload();
                }}
              />
            </motion.div>
          )}

          {/* Purchase History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-8"
          >
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Purchase History</h2>
              
              {purchasesLoading ? (
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                </div>
              ) : userPurchases && userPurchases.length > 0 ? (
                <div className="space-y-4">
                  {userPurchases.map((purchase, index) => (
                    <div key={purchase.txHash} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {formatNumber(formatEther(purchase.tokenAmount))} WLT
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(purchase.timestamp * 1000).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-900">
                            {formatEther(purchase.ethAmount)} ETH
                          </p>
                          <a
                            href={`https://etherscan.io/tx/${purchase.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            View Transaction
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No purchases found.</p>
              )}
            </Card>
          </motion.div>
        </motion.div>
      </Container>
    </>
  );
};

export default Dashboard;