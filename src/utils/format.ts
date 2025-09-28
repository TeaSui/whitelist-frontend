import { formatUnits, parseUnits } from 'ethers';

/**
 * Format a BigInt or string to a human-readable number with decimals
 */
export function formatEther(value: bigint | string, decimals = 18): string {
  if (!value) return '0';
  
  try {
    return formatUnits(value.toString(), decimals);
  } catch (error) {
    console.error('Error formatting ether:', error);
    return '0';
  }
}

/**
 * Parse a human-readable number to BigInt
 */
export function parseEther(value: string, decimals = 18): bigint {
  if (!value || value === '') return BigInt(0);
  
  try {
    return parseUnits(value, decimals);
  } catch (error) {
    console.error('Error parsing ether:', error);
    return BigInt(0);
  }
}

/**
 * Format a number with commas and optional decimal places
 */
export function formatNumber(
  value: string | number,
  options: {
    decimals?: number;
    compact?: boolean;
    currency?: string;
  } = {}
): string {
  const { decimals = 2, compact = false, currency } = options;
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '0';
  
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
    notation: compact ? 'compact' : 'standard',
    ...(currency && {
      style: 'currency',
      currency: currency,
    }),
  });
  
  return formatter.format(numValue);
}

/**
 * Format a large number with K, M, B suffixes
 */
export function formatCompact(value: string | number): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '0';
  
  const formatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  });
  
  return formatter.format(numValue);
}

/**
 * Format an Ethereum address to show first and last characters
 */
export function formatAddress(address: string, chars = 4): string {
  if (!address) return '';
  
  if (address.length <= chars * 2) return address;
  
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format a transaction hash
 */
export function formatTxHash(hash: string, chars = 6): string {
  return formatAddress(hash, chars);
}

/**
 * Format a date to a human-readable string
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) return 'Invalid Date';
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  };
  
  return new Intl.DateTimeFormat('en-US', defaultOptions).format(dateObj);
}

/**
 * Format a relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string | number): string {
  const dateObj = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return formatDate(dateObj, { month: 'short', day: 'numeric' });
}

/**
 * Format a duration from seconds
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return `${days}d ${hours}h`;
}

/**
 * Format a percentage
 */
export function formatPercentage(
  value: number,
  options: { decimals?: number } = {}
): string {
  const { decimals = 1 } = options;
  
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Format a price with currency symbol
 */
export function formatPrice(
  value: string | number,
  currency = 'USD',
  options: { decimals?: number } = {}
): string {
  const { decimals = 2 } = options;
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '$0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numValue);
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Check if a value is a valid number
 */
export function isValidNumber(value: string | number): boolean {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(numValue) && isFinite(numValue);
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(
  oldValue: number,
  newValue: number
): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
}