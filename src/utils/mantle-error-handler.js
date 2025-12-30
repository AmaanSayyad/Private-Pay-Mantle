/**
 * Mantle Network Error Handler
 * Provides user-friendly error handling for Mantle blockchain operations
 */

export class MantleError extends Error {
  constructor(message, code, originalError = null) {
    super(message);
    this.name = 'MantleError';
    this.code = code;
    this.originalError = originalError;
  }
}

export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  CONTRACT_ERROR: 'CONTRACT_ERROR',
  USER_REJECTED: 'USER_REJECTED',
  INVALID_ADDRESS: 'INVALID_ADDRESS',
  GAS_ESTIMATION_FAILED: 'GAS_ESTIMATION_FAILED',
  TIMEOUT: 'TIMEOUT',
  UNKNOWN: 'UNKNOWN'
};

const ERROR_MESSAGES = {
  [ERROR_CODES.NETWORK_ERROR]: 'Unable to connect to Mantle network. Please check your connection.',
  [ERROR_CODES.TRANSACTION_FAILED]: 'Transaction failed. Please try again.',
  [ERROR_CODES.INSUFFICIENT_FUNDS]: 'Insufficient MNT balance for this transaction.',
  [ERROR_CODES.CONTRACT_ERROR]: 'Smart contract error. Please try again later.',
  [ERROR_CODES.USER_REJECTED]: 'Transaction was rejected.',
  [ERROR_CODES.INVALID_ADDRESS]: 'Invalid Mantle address format.',
  [ERROR_CODES.GAS_ESTIMATION_FAILED]: 'Unable to estimate gas. The transaction may fail.',
  [ERROR_CODES.TIMEOUT]: 'Transaction timed out. Please check the explorer.',
  [ERROR_CODES.UNKNOWN]: 'An unexpected error occurred.'
};

/**
 * Handle Mantle-specific errors and return user-friendly messages
 * @param {Error} error - Original error
 * @returns {MantleError} Processed error with user-friendly message
 */
export function handleMantleError(error) {
  if (error instanceof MantleError) {
    return error;
  }

  const errorMessage = error?.message?.toLowerCase() || '';
  const errorCode = error?.code;

  // User rejected transaction
  if (errorCode === 4001 || errorMessage.includes('user rejected') || errorMessage.includes('user denied')) {
    return new MantleError(ERROR_MESSAGES[ERROR_CODES.USER_REJECTED], ERROR_CODES.USER_REJECTED, error);
  }

  // Insufficient funds
  if (errorMessage.includes('insufficient funds') || errorMessage.includes('insufficient balance')) {
    return new MantleError(ERROR_MESSAGES[ERROR_CODES.INSUFFICIENT_FUNDS], ERROR_CODES.INSUFFICIENT_FUNDS, error);
  }

  // Network errors
  if (errorMessage.includes('network') || errorMessage.includes('connection') || errorMessage.includes('timeout')) {
    return new MantleError(ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR], ERROR_CODES.NETWORK_ERROR, error);
  }

  // Gas estimation errors
  if (errorMessage.includes('gas') || errorMessage.includes('estimation')) {
    return new MantleError(ERROR_MESSAGES[ERROR_CODES.GAS_ESTIMATION_FAILED], ERROR_CODES.GAS_ESTIMATION_FAILED, error);
  }

  // Contract errors
  if (errorMessage.includes('revert') || errorMessage.includes('execution reverted')) {
    return new MantleError(ERROR_MESSAGES[ERROR_CODES.CONTRACT_ERROR], ERROR_CODES.CONTRACT_ERROR, error);
  }

  // Transaction failed
  if (errorMessage.includes('transaction failed') || errorMessage.includes('tx failed')) {
    return new MantleError(ERROR_MESSAGES[ERROR_CODES.TRANSACTION_FAILED], ERROR_CODES.TRANSACTION_FAILED, error);
  }

  return new MantleError(ERROR_MESSAGES[ERROR_CODES.UNKNOWN], ERROR_CODES.UNKNOWN, error);
}

/**
 * Get fallback gas values for Mantle network
 * @returns {Object} Default gas configuration
 */
export function getFallbackGasValues() {
  return {
    gasLimit: 100000n,
    maxFeePerGas: 50000000n, // 0.05 gwei
    maxPriorityFeePerGas: 1000000n // 0.001 gwei
  };
}

export default {
  MantleError,
  ERROR_CODES,
  handleMantleError,
  getFallbackGasValues
};
