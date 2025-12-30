import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface DeploymentResult {
  network: string;
  chainId: number;
  contracts: {
    StealthAddressRegistry: {
      address: string;
      deploymentBlock: number;
    };
    PaymentManager: {
      address: string;
      deploymentBlock: number;
    };
  };
  deployer: string;
  timestamp: number;
}

async function main() {
  console.log("🚀 Starting Mantle Network deployment...\n");

  // Get network info
  const networkName = network.name;
  const chainId = (await ethers.provider.getNetwork()).chainId;
  
  console.log(`📡 Network: ${networkName}`);
  console.log(`🔗 Chain ID: ${chainId}`);

  // Validate network
  if (chainId !== 5003n && chainId !== 5000n) {
    throw new Error(`Invalid network. Expected Mantle Sepolia (5003) or Mantle Mainnet (5000), got ${chainId}`);
  }

  // Get deployer
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  console.log(`👤 Deployer: ${deployerAddress}`);

  // Check balance
  const balance = await ethers.provider.getBalance(deployerAddress);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} MNT\n`);

  if (balance === 0n) {
    throw new Error("Deployer has no MNT balance. Please fund the account first.");
  }

  // Deploy StealthAddressRegistry
  console.log("📦 Deploying StealthAddressRegistry...");
  const StealthAddressRegistry = await ethers.getContractFactory("StealthAddressRegistry");
  const registry = await StealthAddressRegistry.deploy();
  await registry.waitForDeployment();
  
  const registryAddress = await registry.getAddress();
  const registryDeployTx = registry.deploymentTransaction();
  const registryBlock = registryDeployTx?.blockNumber || 0;
  
  console.log(`✅ StealthAddressRegistry deployed to: ${registryAddress}`);
  console.log(`   Block: ${registryBlock}\n`);

  // Deploy PaymentManager
  console.log("📦 Deploying PaymentManager...");
  const PaymentManager = await ethers.getContractFactory("PaymentManager");
  const paymentManager = await PaymentManager.deploy(registryAddress);
  await paymentManager.waitForDeployment();
  
  const paymentManagerAddress = await paymentManager.getAddress();
  const paymentManagerDeployTx = paymentManager.deploymentTransaction();
  const paymentManagerBlock = paymentManagerDeployTx?.blockNumber || 0;
  
  console.log(`✅ PaymentManager deployed to: ${paymentManagerAddress}`);
  console.log(`   Block: ${paymentManagerBlock}\n`);

  // Create deployment result
  const deploymentResult: DeploymentResult = {
    network: networkName,
    chainId: Number(chainId),
    contracts: {
      StealthAddressRegistry: {
        address: registryAddress,
        deploymentBlock: registryBlock,
      },
      PaymentManager: {
        address: paymentManagerAddress,
        deploymentBlock: paymentManagerBlock,
      },
    },
    deployer: deployerAddress,
    timestamp: Date.now(),
  };

  // Save deployment result
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `${networkName}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentResult, null, 2));
  console.log(`💾 Deployment saved to: ${deploymentFile}\n`);

  // Print summary
  console.log("═══════════════════════════════════════════════════════════");
  console.log("                    DEPLOYMENT SUMMARY                      ");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`Network:                  ${networkName} (${chainId})`);
  console.log(`StealthAddressRegistry:   ${registryAddress}`);
  console.log(`PaymentManager:           ${paymentManagerAddress}`);
  console.log(`Deployer:                 ${deployerAddress}`);
  console.log("═══════════════════════════════════════════════════════════\n");

  // Verification instructions
  console.log("📝 To verify contracts on Mantlescan, run:");
  console.log(`   npx hardhat verify --network ${networkName} ${registryAddress}`);
  console.log(`   npx hardhat verify --network ${networkName} ${paymentManagerAddress} ${registryAddress}`);

  return deploymentResult;
}

main()
  .then((result) => {
    console.log("\n✨ Deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error.message);
    if (error.reason) {
      console.error("   Reason:", error.reason);
    }
    if (error.code) {
      console.error("   Error code:", error.code);
    }
    process.exit(1);
  });
