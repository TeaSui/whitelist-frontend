import React, { useState, useEffect } from 'react';
import { useAccount, useContractWrite, useWaitForTransaction, usePublicClient } from 'wagmi';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  GiftIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { formatEther, formatNumber } from '@/utils/format';
import { CONTRACT_ADDRESSES, createWhitelistSaleContract } from '@/utils/contracts';
import WhitelistSaleABI from '@/contracts/WhitelistSale.json';

interface ClaimTokensFormProps {
  onSuccess?: (txHash: string) => void;
}

export const ClaimTokensForm: React.FC<ClaimTokensFormProps> = ({ onSuccess }) => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  const [purchaseInfo, setPurchaseInfo] = useState<any>(null);
  const [claimEnabled, setClaimEnabled] = useState<boolean>(false);
  const [claimStartTime, setClaimStartTime] = useState<bigint>(BigInt(0));
  const [loading, setLoading] = useState(false);

  // Claim transaction
  const { write: claimTokens, data: hash, isLoading: isPending, error } = useContractWrite({
    address: CONTRACT_ADDRESSES.WHITELIST_SALE,
    abi: WhitelistSaleABI.abi,
    functionName: 'claimTokens',
  });

  const { isLoading: isConfirming, isSuccess } = useWaitForTransaction({
    hash: hash?.hash,
  });

  // Fetch contract data
  useEffect(() => {
    async function fetchData() {
      if (!address || !publicClient) return;
      
      setLoading(true);
      try {
        const contract = createWhitelistSaleContract(publicClient);
        
        const [purchase, enabled, startTime] = await Promise.all([
          contract.read.getPurchaseInfo([address as `0x${string}`]),
          contract.read.claimEnabled(),
          contract.read.claimStartTime(),
        ]);
        
        setPurchaseInfo(purchase);
        setClaimEnabled(enabled);
        setClaimStartTime(startTime);
      } catch (error) {
        console.error('Error fetching claim data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [address, publicClient]);

  // Parse purchase info (FIXED VERSION - using new contract structure)
  const totalPurchased = purchaseInfo ? (purchaseInfo as any)[0] : BigInt(0);
  const totalClaimed = purchaseInfo ? (purchaseInfo as any)[1] : BigInt(0);
  const ethSpent = purchaseInfo ? (purchaseInfo as any)[2] : BigInt(0);
  const lastPurchaseTime = purchaseInfo ? (purchaseInfo as any)[3] : BigInt(0);

  const claimableAmount = totalPurchased - totalClaimed;
  const hasTokensToClaim = Number(claimableAmount) > 0;
  const currentTime = Math.floor(Date.now() / 1000);
  const canClaimNow = claimEnabled && Number(claimStartTime || 0) <= currentTime;

  const handleClaim = () => {
    if (!hasTokensToClaim || !canClaimNow) return;
    claimTokens?.();
  };

  // Handle transaction success
  useEffect(() => {
    if (isSuccess && hash?.hash) {
      toast.success('Tokens claimed successfully!');
      onSuccess?.(hash.hash);
    }
  }, [isSuccess, hash, onSuccess]);

  // Handle transaction error
  useEffect(() => {
    if (error) {
      console.error('Claim error:', error);
      toast.error(error.message || 'Claim failed');
    }
  }, [error]);

  if (!isConnected) {
    return null;
  }

  if (!hasTokensToClaim) {
    return null; // Don't show if no tokens to claim
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <div className="flex items-center mb-6">
          <GiftIcon className="h-6 w-6 text-green-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Claim Your Tokens</h2>
        </div>

        <div className="space-y-6">
          {/* Claim Info */}
          <div className="bg-white rounded-lg p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Purchased:</span>
              <span className="font-medium text-green-600">
                {formatNumber(formatEther(totalPurchased))} WLT
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Already Claimed:</span>
              <span className="font-medium text-gray-600">
                {formatNumber(formatEther(totalClaimed))} WLT
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Available to Claim:</span>
              <span className="font-medium text-blue-600">
                {formatNumber(formatEther(claimableAmount))} WLT
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">ETH Spent:</span>
              <span className="font-medium">{formatEther(ethSpent)} ETH</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Last Purchase:</span>
              <span className="font-medium">
                {Number(lastPurchaseTime) > 0 
                  ? new Date(Number(lastPurchaseTime) * 1000).toLocaleDateString()
                  : 'N/A'
                }
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Status:</span>
              <span className={`font-medium flex items-center ${hasTokensToClaim ? 'text-yellow-600' : 'text-green-600'}`}>
                {hasTokensToClaim ? (
                  <>
                    <ClockIcon className="h-4 w-4 mr-1" />
                    Ready to Claim
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    All Claimed
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Claim Status */}
          {!canClaimNow && (
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-start">
                <ClockIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-yellow-800 font-medium">Claiming Not Yet Available</p>
                  <p className="text-yellow-600 mt-1">
                    {!claimEnabled 
                      ? 'Claiming has not been enabled yet by the contract owner.'
                      : `Claiming starts ${new Date(Number(claimStartTime) * 1000).toLocaleString()}`
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Claim Button */}
          <Button
            onClick={handleClaim}
            disabled={!canClaimNow || isPending || isConfirming || !hasTokensToClaim}
            isLoading={isPending || isConfirming}
            fullWidth
            size="lg"
            className="bg-green-600 hover:bg-green-700"
          >
            {isPending
              ? 'Confirm in Wallet...'
              : isConfirming
              ? 'Processing Claim...'
              : !hasTokensToClaim
              ? 'No Tokens to Claim'
              : !canClaimNow
              ? 'Claiming Not Available'
              : `Claim ${formatNumber(formatEther(claimableAmount))} WLT`}
          </Button>

          {/* Transaction Hash */}
          {hash?.hash && (
            <div className="text-center">
              <p className="text-sm text-gray-600">Transaction submitted:</p>
              <a
                href={`https://etherscan.io/tx/${hash.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-green-600 hover:text-green-800 font-mono break-all"
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