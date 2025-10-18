import React, { useState, useEffect } from 'react';
import { useAccount, useBalance, useContractWrite, useWaitForTransaction } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  CurrencyDollarIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { formatNumber } from '@/utils/format';
import { useWhitelistStatus } from '@/hooks/useWhitelistStatus';
import { useSaleInfo } from '@/hooks/useSaleInfo';
import WhitelistSaleABI from '@/contracts/WhitelistSale.json';

interface TokenPurchaseFormProps {
  onSuccess?: (txHash: string) => void;
}

export const TokenPurchaseForm: React.FC<TokenPurchaseFormProps> = ({ onSuccess }) => {
  const { address, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({ address });
  const { data: whitelistStatus } = useWhitelistStatus(address);
  const { data: saleInfo } = useSaleInfo();
  
  const [tokenAmount, setTokenAmount] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [estimatedGas, setEstimatedGas] = useState<bigint | null>(null);

  const { write: writeContract, data: hash, isLoading: isPending, error } = useContractWrite({
    address: saleInfo?.contractAddress as `0x${string}`,
    abi: WhitelistSaleABI.abi,
    functionName: 'purchaseTokens',
    gas: 200000n, // Set explicit gas limit
  });
  const { isLoading: isConfirming, isSuccess } = useWaitForTransaction({
    hash: hash?.hash,
  });

  // Calculate ETH required for token amount
  const calculateEthRequired = (tokens: string): bigint => {
    if (!tokens || !saleInfo?.saleConfig.tokenPrice) return BigInt(0);
    try {
      const tokenAmountWei = parseEther(tokens);
      return (tokenAmountWei * saleInfo.saleConfig.tokenPrice) / parseEther('1');
    } catch {
      return BigInt(0);
    }
  };

  const ethRequired = calculateEthRequired(tokenAmount);
  const hasInsufficientBalance = ethBalance ? ethRequired > ethBalance.value : false;
  const isValidAmount = tokenAmount && parseFloat(tokenAmount) > 0;

  // Validation
  const getValidationError = (): string | null => {
    if (!isConnected) return 'Please connect your wallet';
    if (!whitelistStatus?.isWhitelisted) return 'Address not whitelisted';
    if (!tokenAmount || parseFloat(tokenAmount) <= 0) return 'Enter a valid token amount';
    if (!saleInfo) return 'Sale information not loaded';
    
    
    const tokenAmountBigInt = parseEther(tokenAmount);
    
    // Check minimum purchase
    if (saleInfo.saleConfig.minPurchase && tokenAmountBigInt < saleInfo.saleConfig.minPurchase) {
      return `Minimum purchase: ${formatEther(saleInfo.saleConfig.minPurchase)} tokens`;
    }
    
    // Check maximum purchase
    if (saleInfo.saleConfig.maxPurchase && tokenAmountBigInt > saleInfo.saleConfig.maxPurchase) {
      return `Maximum purchase: ${formatEther(saleInfo.saleConfig.maxPurchase)} tokens`;
    }
    
    if (hasInsufficientBalance) return 'Insufficient ETH balance';
    
    // Check if sale is active
    if (!saleInfo.isSaleActive) return 'Sale is not currently active';
    
    return null;
  };

  const validationError = getValidationError();
  const canPurchase = !validationError && !isPending && !isConfirming;

  const handleMaxClick = () => {
    if (!ethBalance || !saleInfo?.saleConfig.tokenPrice) return;
    
    // Calculate max tokens based on ETH balance
    const maxTokensFromBalance = (ethBalance.value * parseEther('1')) / saleInfo.saleConfig.tokenPrice;
    
    // Check against sale limits
    let maxTokens = maxTokensFromBalance;
    if (saleInfo.saleConfig.maxPurchase && maxTokens > saleInfo.saleConfig.maxPurchase) {
      maxTokens = saleInfo.saleConfig.maxPurchase;
    }
    
    setTokenAmount(formatEther(maxTokens));
  };

  const handlePurchase = async () => {
    if (!saleInfo || !isValidAmount || validationError) return;

    try {
      // For now, use empty merkle proof since we're using simple whitelist mapping
      // In production, you'd generate proper merkle proofs for gas optimization
      const merkleProof: `0x${string}`[] = [];

      console.log('🔄 Initiating purchase:', {
        tokenAmount,
        ethRequired: ethRequired.toString(),
        merkleProof,
        contractAddress: saleInfo.contractAddress,
      });

      writeContract?.({
        args: [parseEther(tokenAmount), merkleProof],
        value: ethRequired,
        gas: 200000n, // Explicit gas limit
      });
    } catch (err) {
      console.error('Purchase failed:', err);
      toast.error('Purchase failed. Please try again.');
    }
  };

  // Handle transaction success
  useEffect(() => {
    if (isSuccess && hash?.hash) {
      toast.success('Tokens purchased successfully!');
      setTokenAmount('');
      onSuccess?.(hash.hash);
    }
  }, [isSuccess, hash, onSuccess]);

  // Handle transaction error
  useEffect(() => {
    if (error) {
      console.error('Transaction error:', error);
      toast.error(error.message || 'Transaction failed');
    }
  }, [error]);

  if (!isConnected) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Wallet Not Connected
          </h3>
          <p className="text-gray-600">
            Please connect your wallet to purchase tokens.
          </p>
        </div>
      </Card>
    );
  }

  if (!whitelistStatus?.isWhitelisted) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Not Whitelisted
          </h3>
          <p className="text-gray-600">
            Your address is not on the whitelist for this token sale.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-6">
        <div className="flex items-center mb-6">
          <CurrencyDollarIcon className="h-6 w-6 text-primary-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Purchase Tokens</h2>
        </div>

        <div className="space-y-6">
          {/* Token Amount Input */}
          <div>
            <Input
              label="Token Amount"
              type="number"
              placeholder="0.0"
              value={tokenAmount}
              onChange={(e) => setTokenAmount(e.target.value)}
              error={validationError || undefined}
              suffix={
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">WLT</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMaxClick}
                    className="text-xs px-2 py-1"
                  >
                    MAX
                  </Button>
                </div>
              }
              fullWidth
            />
          </div>

          {/* Purchase Summary */}
          {isValidAmount && !validationError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-50 rounded-lg p-4 space-y-3"
            >
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Token Amount:</span>
                <span className="font-medium">{formatNumber(tokenAmount)} WLT</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Price per Token:</span>
                <span className="font-medium">
                  {saleInfo?.saleConfig.tokenPrice ? formatEther(saleInfo.saleConfig.tokenPrice) : '--'} ETH
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Cost:</span>
                <span className="font-medium">{formatEther(ethRequired)} ETH</span>
              </div>
              
              {estimatedGas && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Estimated Gas:</span>
                  <span className="font-medium">{formatEther(estimatedGas)} ETH</span>
                </div>
              )}

              <div className="border-t pt-3">
                <div className="flex justify-between font-semibold">
                  <span>Total Required:</span>
                  <span>{formatEther(ethRequired + (estimatedGas || BigInt(0)))} ETH</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Balance Info */}
          <div className="bg-blue-50 rounded-lg p-4 flex items-start space-x-3">
            <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-blue-800 font-medium">Your ETH Balance</p>
              <p className="text-blue-600">
                {ethBalance ? formatEther(ethBalance.value) : '0'} ETH
              </p>
            </div>
          </div>

          {/* Purchase Button */}
          <Button
            onClick={handlePurchase}
            disabled={!canPurchase}
            isLoading={isPending || isConfirming}
            fullWidth
            size="lg"
          >
            {isPending
              ? 'Confirm in Wallet...'
              : isConfirming
              ? 'Processing Transaction...'
              : 'Purchase Tokens'}
          </Button>

          {/* Transaction Hash */}
          {hash?.hash && (
            <div className="text-center">
              <p className="text-sm text-gray-600">Transaction submitted:</p>
              <a
                href={`https://etherscan.io/tx/${hash.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-600 hover:text-primary-800 font-mono break-all"
              >
                {hash.hash}
              </a>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};