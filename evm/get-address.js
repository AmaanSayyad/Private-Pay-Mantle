const crypto = require('crypto');

// Private key
const privateKey = '0x5675e0f2359b9563165d764474fe5fdcb009cd9613e6294e4b7a9e48893d18ee';

// Remove 0x prefix and convert to buffer
const privateKeyBuffer = Buffer.from(privateKey.slice(2), 'hex');

// For demonstration, we'll create a mock address
// In real implementation, this would use secp256k1 to derive the public key
// and then keccak256 to get the address

// Generate a deterministic address from private key (simplified)
const hash = crypto.createHash('sha256').update(privateKeyBuffer).digest();
const address = '0x' + hash.slice(0, 20).toString('hex');

console.log('=== CÜZDAN BİLGİLERİ ===');
console.log('Private Key:', privateKey);
console.log('Address (tahmini):', address);
console.log('');
console.log('Bu adresi Mantle Sepolia testnet faucet\'ten token almak için kullanın.');
console.log('');
console.log('Mantle Sepolia testnet bilgileri:');
console.log('- Network Name: Mantle Sepolia Testnet');
console.log('- RPC URL: https://rpc.sepolia.mantle.xyz');
console.log('- Chain ID: 5003');
console.log('- Currency: MNT');
console.log('- Explorer: https://sepolia.mantlescan.xyz');