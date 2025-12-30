/**
 * Mantle Payment Link Generation Utilities
 * 
 * This module provides utilities for generating payment links with Mantle stealth addresses.
 * It integrates with the stealth cryptography module to create secure, private payment links.
 */

import { generateMetaAddress, generateStealthAddress } from './stealth-crypto.js';
import { MANTLE_CONFIG } from '../config/mantle-config.js';
import { ethers } from 'ethers';

/**
 * Generate a Mantle payment link with stealth address
 * @param {string} recipientAddress - Mantle wallet address of recipient
 * @param {string} alias - Payment link alias
 * @param {Object} options - Additional options
 * @param {string} options.amount - Optional amount in MNT
 * @param {string} options.message - Optional message
 * @param {Object} options.metaAddress - Optional existing meta address
 * @returns {Object} Payment link data
 */
export function generateMantlePaymentLink(recipientAddress, alias, options = {}) {
  const { amount, message, metaAddress } = options;
  
  // Generate or use existing meta address
  const recipientMetaAddress = metaAddress || generateMetaAddress();
  
  // Generate stealth address for this payment link
  const stealthData = generateStealthAddress(
    recipientMetaAddress.spendPublicKey,
    recipientMetaAddress.viewingPublicKey
  );
  
  // Create payment link URL
  const baseUrl = MANTLE_CONFIG.paymentLinks?.baseUrl || 'https://privatepay.me';
  const paymentUrl = `${baseUrl}/${alias}`;
  
  // Generate QR code data
  const qrData = generateQRCodeData({
    url: paymentUrl,
    stealthAddress: stealthData.stealthAddress,
    amount,
    message,
    chainId: MANTLE_CONFIG.chainId
  });
  
  return {
    alias,
    paymentUrl,
    recipientAddress,
    metaAddress: recipientMetaAddress,
    stealthData,
    qrData,
    amount,
    message,
    createdAt: new Date().toISOString(),
    chainId: MANTLE_CONFIG.chainId,
    network: MANTLE_CONFIG.chainName
  };
}

/**
 * Generate QR code data for Mantle payment
 * @param {Object} params - QR code parameters
 * @returns {Object} QR code data
 */
export function generateQRCodeData(params) {
  const { url, stealthAddress, amount, message, chainId } = params;
  
  // Create EIP-681 compatible payment URI for Mantle
  let paymentUri = `ethereum:${stealthAddress}`;
  
  const queryParams = [];
  
  if (chainId) {
    queryParams.push(`chainId=${chainId}`);
  }
  
  if (amount) {
    try {
      const weiAmount = ethers.parseEther(amount.toString());
      queryParams.push(`value=${weiAmount.toString()}`);
    } catch (error) {
      console.warn('Invalid amount for QR code:', amount);
    }
  }
  
  if (message) {
    queryParams.push(`data=${encodeURIComponent(message)}`);
  }
  
  if (queryParams.length > 0) {
    paymentUri += `?${queryParams.join('&')}`;
  }
  
  return {
    uri: paymentUri,
    url,
    stealthAddress,
    amount,
    message,
    chainId,
    displayText: `Pay to ${stealthAddress.slice(0, 6)}...${stealthAddress.slice(-4)}`
  };
}

/**
 * Parse Mantle payment link to extract stealth address and payment info
 * @param {string} paymentUrl - Payment URL or URI
 * @returns {Object} Parsed payment data
 */
export function parseMantlePaymentLink(paymentUrl) {
  try {
    if (paymentUrl.startsWith('ethereum:')) {
      return parseEIP681URI(paymentUrl);
    }
    
    const url = new URL(paymentUrl);
    const alias = url.pathname.split('/').pop();
    
    return {
      alias,
      url: paymentUrl,
      type: 'payment_link'
    };
  } catch (error) {
    console.error('Error parsing payment link:', error);
    return null;
  }
}

function parseEIP681URI(uri) {
  const match = uri.match(/^ethereum:([^?]+)(\?(.+))?$/);
  if (!match) {
    throw new Error('Invalid EIP-681 URI format');
  }
  
  const address = match[1];
  const queryString = match[3] || '';
  
  const params = new URLSearchParams(queryString);
  const chainId = params.get('chainId');
  const value = params.get('value');
  const data = params.get('data');
  
  return {
    address,
    chainId: chainId ? parseInt(chainId) : null,
    amount: value ? ethers.formatEther(value) : null,
    message: data ? decodeURIComponent(data) : null,
    type: 'eip681_uri'
  };
}

/**
 * Generate stealth address for existing payment link
 * @param {Object} paymentLinkData - Existing payment link data
 * @param {string} senderAddress - Sender's address (optional)
 * @returns {Object} Updated payment link with new stealth address
 */
export function generateStealthForPaymentLink(paymentLinkData, senderAddress = null) {
  const { metaAddress } = paymentLinkData;
  
  if (!metaAddress) {
    throw new Error('Payment link must have meta address data');
  }
  
  const stealthData = generateStealthAddress(
    metaAddress.spendPublicKey,
    metaAddress.viewingPublicKey
  );
  
  const qrData = generateQRCodeData({
    url: paymentLinkData.paymentUrl,
    stealthAddress: stealthData.stealthAddress,
    amount: paymentLinkData.amount,
    message: paymentLinkData.message,
    chainId: paymentLinkData.chainId
  });
  
  return {
    ...paymentLinkData,
    stealthData,
    qrData,
    senderAddress,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Validate Mantle payment link data
 * @param {Object} paymentLinkData - Payment link data to validate
 * @returns {Object} Validation result
 */
export function validateMantlePaymentLink(paymentLinkData) {
  const errors = [];
  
  if (!paymentLinkData.alias) {
    errors.push('Payment link must have an alias');
  }
  
  if (!paymentLinkData.recipientAddress || !/^0x[a-fA-F0-9]{40}$/.test(paymentLinkData.recipientAddress)) {
    errors.push('Invalid recipient address');
  }
  
  if (!paymentLinkData.metaAddress) {
    errors.push('Payment link must have meta address data');
  } else {
    const { spendPublicKey, viewingPublicKey } = paymentLinkData.metaAddress;
    if (!spendPublicKey || !viewingPublicKey) {
      errors.push('Meta address must have spend and viewing public keys');
    }
  }
  
  if (paymentLinkData.amount) {
    try {
      const numAmount = parseFloat(paymentLinkData.amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        errors.push('Invalid amount format');
      }
    } catch (error) {
      errors.push('Invalid amount format');
    }
  }
  
  if (paymentLinkData.chainId && paymentLinkData.chainId !== MANTLE_CONFIG.chainId) {
    errors.push(`Invalid chain ID. Expected ${MANTLE_CONFIG.chainId}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Format payment link for display
 * @param {Object} paymentLinkData - Payment link data
 * @returns {Object} Formatted display data
 */
export function formatPaymentLinkDisplay(paymentLinkData) {
  const { alias, amount, message, stealthData, chainId } = paymentLinkData;
  
  return {
    title: `${alias}.privatepay.me`,
    subtitle: message || 'Mantle Payment Link',
    amount: amount ? `${amount} MNT` : 'No amount specified',
    stealthAddress: stealthData?.stealthAddress,
    shortAddress: stealthData?.stealthAddress 
      ? `${stealthData.stealthAddress.slice(0, 6)}...${stealthData.stealthAddress.slice(-4)}`
      : null,
    network: MANTLE_CONFIG.chainName,
    chainId
  };
}

/**
 * Create shareable payment link text
 * @param {Object} paymentLinkData - Payment link data
 * @returns {string} Shareable text
 */
export function createShareableText(paymentLinkData) {
  const display = formatPaymentLinkDisplay(paymentLinkData);
  
  let text = `💰 ${display.title}\n`;
  
  if (display.amount !== 'No amount specified') {
    text += `Amount: ${display.amount}\n`;
  }
  
  if (paymentLinkData.message) {
    text += `Message: ${paymentLinkData.message}\n`;
  }
  
  text += `Network: ${display.network}\n`;
  text += `\nPay securely with stealth addresses on Mantle blockchain.`;
  
  return text;
}

export default {
  generateMantlePaymentLink,
  generateQRCodeData,
  parseMantlePaymentLink,
  generateStealthForPaymentLink,
  validateMantlePaymentLink,
  formatPaymentLinkDisplay,
  createShareableText
};
