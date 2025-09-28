import { getContract } from 'viem';
import { PublicClient, WalletClient } from 'wagmi';
import WhitelistTokenABI from '@/contracts/WhitelistToken.json';
import WhitelistSaleABI from '@/contracts/WhitelistSale.json';

// Contract addresses from environment variables
export const CONTRACT_ADDRESSES = {
  WHITELIST_TOKEN: process.env.NEXT_PUBLIC_TOKEN_ADDRESS as `0x${string}`,
  WHITELIST_SALE: process.env.NEXT_PUBLIC_SALE_ADDRESS as `0x${string}`,
} as const;

// Validate contract addresses are configured
if (!CONTRACT_ADDRESSES.WHITELIST_TOKEN) {
  throw new Error('NEXT_PUBLIC_TOKEN_ADDRESS is not configured');
}

if (!CONTRACT_ADDRESSES.WHITELIST_SALE) {
  throw new Error('NEXT_PUBLIC_SALE_ADDRESS is not configured');
}

// Contract ABIs
export const CONTRACT_ABIS = {
  WHITELIST_TOKEN: WhitelistTokenABI.abi,
  WHITELIST_SALE: WhitelistSaleABI.abi,
} as const;

// Contract factory functions
export const createWhitelistTokenContract = (client: PublicClient) => {
  return getContract({
    address: CONTRACT_ADDRESSES.WHITELIST_TOKEN,
    abi: CONTRACT_ABIS.WHITELIST_TOKEN,
    publicClient: client,
  });
};

export const createWhitelistSaleContract = (client: PublicClient) => {
  return getContract({
    address: CONTRACT_ADDRESSES.WHITELIST_SALE,
    abi: CONTRACT_ABIS.WHITELIST_SALE,
    publicClient: client,
  });
};

// Contract with wallet client for write operations
export const createWhitelistTokenContractWithWallet = (
  publicClient: PublicClient,
  walletClient: WalletClient
) => {
  return getContract({
    address: CONTRACT_ADDRESSES.WHITELIST_TOKEN,
    abi: CONTRACT_ABIS.WHITELIST_TOKEN,
    publicClient,
    walletClient,
  });
};

export const createWhitelistSaleContractWithWallet = (
  publicClient: PublicClient,
  walletClient: WalletClient
) => {
  return getContract({
    address: CONTRACT_ADDRESSES.WHITELIST_SALE,
    abi: CONTRACT_ABIS.WHITELIST_SALE,
    publicClient,
    walletClient,
  });
};

// Type definitions for contract return values
export interface WhitelistStatus {
  address: string;
  isWhitelisted: boolean;
  tokenBalance: string;
  addedAt: Date | null;
}

export interface SaleInfo {
  tokenAddress: string;
  treasury: string;
  tokenPrice: string;
  minPurchase: string;
  maxPurchase: string;
  maxSupply: string;
  startTime: number;
  endTime: number;
  isPaused: boolean;
  isActive: boolean;
  totalSold: string;
  claimEnabled: boolean;
  claimStartTime: number;
}

export interface PurchaseInfo {
  buyer: string;
  tokenAmount: string;
  ethAmount: string;
  timestamp: number;
  claimed: boolean;
}