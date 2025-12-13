const { ethers } = require('ethers');

// ERC-20 token ABI, specifically for the mint and balance functions.
const TOKEN_ABI = [
  "function mint(address to, uint256 amount)",
  "function balanceOf(address owner) view returns (uint256)"
];

class Web3Service {
  constructor() {
    // --- 1. Robust Environment Variable Check ---
    if (!process.env.GCLOUD_RPC_ENDPOINT || !process.env.SEPOLIA_PRIVATE_KEY || !process.env.TOKEN_CONTRACT_ADDRESS) {
      const missingVars = [];
      if (!process.env.GCLOUD_RPC_ENDPOINT) missingVars.push('GCLOUD_RPC_ENDPOINT');
      if (!process.env.SEPOLIA_PRIVATE_KEY) missingVars.push('SEPOLIA_PRIVATE_KEY');
      if (!process.env.TOKEN_CONTRACT_ADDRESS) missingVars.push('TOKEN_CONTRACT_ADDRESS');
      
      throw new Error(`CRITICAL ERROR: The following environment variables are missing or null: ${missingVars.join(', ')}. Please check your .env file.`);
    }

    // --- 2. Initialize Provider and Wallet ---
    this.provider = new ethers.JsonRpcProvider(process.env.GCLOUD_RPC_ENDPOINT);
    this.wallet = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY, this.provider);
    
    // --- 3. Initialize Contract (FIXED SCOPE ERROR) ---
    // The contract address is now correctly read from the environment inside the constructor.
    this.tokenContract = new ethers.Contract(
      process.env.TOKEN_CONTRACT_ADDRESS, // Reads the address you set in .env
      TOKEN_ABI, 
      this.wallet
    );

    console.log(`Web3 Service Initialized: Wallet address is ${this.wallet.address}`);
  }

  /**
   * Checks the balance of a given Ethereum address.
   * @param {string} address The Ethereum address to check.
   * @returns {Promise<string>} The balance in ETH.
   */
  async checkBalance(address) {
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error(`Error checking balance for ${address}:`, error);
      throw new Error("Could not fetch balance.");
    }
  }

  /**
   * Mints a specified amount of tokens to a recipient address.
   * @param {string} recipientAddress The address to receive the tokens.
   * @param {number|string} amount The human-readable amount of tokens to mint.
   * @returns {Promise<ethers.TransactionReceipt>} The transaction receipt.
   */
  async mintToken(recipientAddress, amount) {
    // Assuming 18 decimals for the token
    const amountWei = ethers.parseUnits(amount.toString(), 18);
    
    try {
      const tx = await this.tokenContract.mint(recipientAddress, amountWei);
      console.log(`Minting transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`Minting transaction confirmed in block: ${receipt.blockNumber}`);
      return receipt;
    } catch (error) {
      console.error('Error during token minting:', error);
      throw new Error('Token minting failed.');
    }
  }

  /**
   * Gets the address of the service's wallet.
   * @returns {string} The wallet address.
   */
  getWalletAddress() {
    return this.wallet.address;
  }
}

module.exports = { Web3Service };
