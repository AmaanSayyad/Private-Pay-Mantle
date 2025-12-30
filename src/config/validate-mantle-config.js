/**
 * Mantle Configuration Validation
 * Validates Mantle network configuration objects
 */

/**
 * Validation error class for Mantle configuration
 */
export class MantleConfigValidationError extends Error {
  constructor(field, message) {
    super(`Invalid Mantle configuration: ${field} - ${message}`);
    this.field = field;
    this.name = 'MantleConfigValidationError';
  }
}

/**
 * Validate Mantle network configuration
 * @param {Object} config - Configuration object to validate
 * @returns {boolean} - Returns true if valid
 * @throws {MantleConfigValidationError} - Throws if validation fails
 */
export const validateMantleConfig = (config) => {
  if (!config || typeof config !== 'object') {
    throw new MantleConfigValidationError('config', 'Configuration must be a non-null object');
  }

  // Validate chainId
  if (typeof config.chainId !== 'number' || config.chainId <= 0) {
    throw new MantleConfigValidationError('chainId', 'Chain ID must be a positive number');
  }

  // Validate chainName
  if (typeof config.chainName !== 'string' || config.chainName.trim() === '') {
    throw new MantleConfigValidationError('chainName', 'Chain name must be a non-empty string');
  }

  // Validate nativeCurrency
  if (!config.nativeCurrency || typeof config.nativeCurrency !== 'object') {
    throw new MantleConfigValidationError('nativeCurrency', 'Native currency must be an object');
  }

  if (typeof config.nativeCurrency.name !== 'string' || config.nativeCurrency.name.trim() === '') {
    throw new MantleConfigValidationError('nativeCurrency.name', 'Currency name must be a non-empty string');
  }

  if (typeof config.nativeCurrency.symbol !== 'string' || config.nativeCurrency.symbol.trim() === '') {
    throw new MantleConfigValidationError('nativeCurrency.symbol', 'Currency symbol must be a non-empty string');
  }

  if (typeof config.nativeCurrency.decimals !== 'number' || config.nativeCurrency.decimals < 0 || config.nativeCurrency.decimals > 18) {
    throw new MantleConfigValidationError('nativeCurrency.decimals', 'Decimals must be a number between 0 and 18');
  }

  // Validate rpcUrls
  if (!Array.isArray(config.rpcUrls) || config.rpcUrls.length === 0) {
    throw new MantleConfigValidationError('rpcUrls', 'RPC URLs must be a non-empty array');
  }

  for (let i = 0; i < config.rpcUrls.length; i++) {
    const url = config.rpcUrls[i];
    if (typeof url !== 'string' || !isValidUrl(url)) {
      throw new MantleConfigValidationError(`rpcUrls[${i}]`, 'Each RPC URL must be a valid URL string');
    }
  }

  // Validate blockExplorerUrls
  if (!Array.isArray(config.blockExplorerUrls) || config.blockExplorerUrls.length === 0) {
    throw new MantleConfigValidationError('blockExplorerUrls', 'Block explorer URLs must be a non-empty array');
  }

  for (let i = 0; i < config.blockExplorerUrls.length; i++) {
    const url = config.blockExplorerUrls[i];
    if (typeof url !== 'string' || !isValidUrl(url)) {
      throw new MantleConfigValidationError(`blockExplorerUrls[${i}]`, 'Each block explorer URL must be a valid URL string');
    }
  }

  // Validate contracts (optional but if present must be valid)
  if (config.contracts) {
    if (typeof config.contracts !== 'object') {
      throw new MantleConfigValidationError('contracts', 'Contracts must be an object');
    }

    // Validate StealthAddressRegistry if present
    if (config.contracts.StealthAddressRegistry) {
      validateContractConfig(config.contracts.StealthAddressRegistry, 'contracts.StealthAddressRegistry');
    }

    // Validate PaymentManager if present
    if (config.contracts.PaymentManager) {
      validateContractConfig(config.contracts.PaymentManager, 'contracts.PaymentManager');
    }
  }

  // Validate gas configuration (optional)
  if (config.gas) {
    validateGasConfig(config.gas);
  }

  return true;
};

/**
 * Validate contract configuration
 * @param {Object} contractConfig - Contract configuration
 * @param {string} fieldName - Field name for error messages
 */
const validateContractConfig = (contractConfig, fieldName) => {
  if (typeof contractConfig !== 'object') {
    throw new MantleConfigValidationError(fieldName, 'Contract config must be an object');
  }

  // Address can be empty string (not deployed yet) or valid address
  if (contractConfig.address !== undefined && contractConfig.address !== '') {
    if (typeof contractConfig.address !== 'string' || !isValidAddress(contractConfig.address)) {
      throw new MantleConfigValidationError(`${fieldName}.address`, 'Contract address must be a valid Ethereum address');
    }
  }

  if (contractConfig.deploymentBlock !== undefined) {
    if (typeof contractConfig.deploymentBlock !== 'number' || contractConfig.deploymentBlock < 0) {
      throw new MantleConfigValidationError(`${fieldName}.deploymentBlock`, 'Deployment block must be a non-negative number');
    }
  }
};

/**
 * Validate gas configuration
 * @param {Object} gasConfig - Gas configuration
 */
const validateGasConfig = (gasConfig) => {
  if (typeof gasConfig !== 'object') {
    throw new MantleConfigValidationError('gas', 'Gas config must be an object');
  }

  if (gasConfig.limit !== undefined && (typeof gasConfig.limit !== 'number' || gasConfig.limit <= 0)) {
    throw new MantleConfigValidationError('gas.limit', 'Gas limit must be a positive number');
  }

  if (gasConfig.price !== undefined && (typeof gasConfig.price !== 'number' || gasConfig.price < 0)) {
    throw new MantleConfigValidationError('gas.price', 'Gas price must be a non-negative number');
  }

  if (gasConfig.maxFeePerGas !== undefined && (typeof gasConfig.maxFeePerGas !== 'number' || gasConfig.maxFeePerGas < 0)) {
    throw new MantleConfigValidationError('gas.maxFeePerGas', 'Max fee per gas must be a non-negative number');
  }

  if (gasConfig.maxPriorityFeePerGas !== undefined && (typeof gasConfig.maxPriorityFeePerGas !== 'number' || gasConfig.maxPriorityFeePerGas < 0)) {
    throw new MantleConfigValidationError('gas.maxPriorityFeePerGas', 'Max priority fee per gas must be a non-negative number');
  }
};

/**
 * Check if string is a valid URL
 * @param {string} str - String to check
 * @returns {boolean}
 */
const isValidUrl = (str) => {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
};

/**
 * Check if string is a valid Ethereum address
 * @param {string} address - Address to check
 * @returns {boolean}
 */
const isValidAddress = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Validate and return config or throw
 * @param {Object} config - Configuration to validate
 * @returns {Object} - Returns the config if valid
 */
export const validateAndReturnConfig = (config) => {
  validateMantleConfig(config);
  return config;
};

export default validateMantleConfig;
