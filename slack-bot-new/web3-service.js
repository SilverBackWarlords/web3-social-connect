require('dotenv').config();

// FIX: Use strict CommonJS 'require' for Ethers.
const ethers = require('ethers'); 

// Since the environment seems to be using an older version (v5), we access 
// constructors and utilities via the v5 paths (providers and utils).
const JsonRpcProvider = ethers.providers.JsonRpcProvider;
const Contract = ethers.Contract;
// Ethers v5 utility functions are under the 'utils' namespace
const getAddress = ethers.utils.getAddress; 
const formatUnits = ethers.utils.formatUnits;
const formatEther = ethers.utils.formatEther;

// --- Enterprise Assets Configuration ---
// Note: Tokens like USDC have 6 decimals; most others have 18.
const ETH_CONTRACTS = {
    // High-Value / Staking
    LSETH: { address: '0xae7ab96523deA1BC97a3D3BC5aaCccf230330DD2', decimals: 18, symbol: 'LSETH' },
    // Liquidity / Trading
    WETH: { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18, symbol: 'WETH' },
    // Stablecoins / Fiat Off-Ramp Targets
    DAI: { address: '0x6b175474e89094c44da98b954eedeac495271d0f', decimals: 18, symbol: 'DAI' },
    USDC: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6, symbol: 'USDC' },
    // AI / High-Growth Sector
    OCEAN: { address: '0x960b236a07cf122663c4303350609a66a7b288cd', decimals: 18, symbol: 'OCEAN' }, // Ocean Protocol
};

const POLYGON_CONTRACTS = {
    // Stablecoins / Low-Cost Fiat Off-Ramp Targets
    USDC: { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimals: 6, symbol: 'USDC' },
    // Meme Coin / Risk Exposure
    MEMECOIN: { address: '0x1Ff8cc6F8f3F33a571E3A562B28d447f2B29b3B1', decimals: 18, symbol: 'QUIC' }, // QuickSwap Token
};

// --- Environment Variables ---
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const WALLET_ADDRESSES = process.env.ETHEREUM_WALLET_ADDRESS ? process.env.ETHEREUM_WALLET_ADDRESS.split(',').map(addr => addr.trim()) : [];

// --- Contract ABIs (Minimal for balance and supply functions) ---
const ERC20_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function totalSupply() view returns (uint256)',
];

class Web3Service {
    constructor() {
        if (!INFURA_PROJECT_ID) {
            throw new Error("INFURA_PROJECT_ID is not set. Cannot connect to any RPC.");
        }
        if (WALLET_ADDRESSES.length === 0) {
            throw new Error("ETHEREUM_WALLET_ADDRESS is not set or is empty.");
        }

        // Use Ethers v5 style provider constructor
        this.ethProvider = new JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`);
        this.polyProvider = new JsonRpcProvider(`https://polygon-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`);

        this.addresses = WALLET_ADDRESSES;

        // Initialize Contracts
        this.ethContracts = this.initializeContracts(ETH_CONTRACTS, this.ethProvider);
        this.polygonContracts = this.initializeContracts(POLYGON_CONTRACTS, this.polyProvider);
    }
    
    /**
     * Helper to instantiate contracts.
     */
    initializeContracts(config, provider) {
        const contracts = {};
        for (const [key, { address }] of Object.entries(config)) {
            // FIX: Force address to lowercase before passing it to getAddress 
            // to bypass strict checksum validation errors.
            const checkedAddress = getAddress(address.toLowerCase());
            contracts[key.toLowerCase()] = new Contract(checkedAddress, ERC20_ABI, provider);
        }
        return contracts;
    }
    
    /**
     * MOCK: Fetches current USD prices for all tracked assets.
     */
    async getAssetPrices() {
        // Return a mock map of { SYMBOL: Price }
        return {
            ETH: 3500.00,
            MATIC: 0.75,
            LSETH: 3495.50, 
            WETH: 3500.00,
            DAI: 1.00,
            USDC: 1.00,
            OCEAN: 0.85,
            QUIC: 0.20,
        };
    }
    
    /**
     * Gas Price Oracle: Retrieves the current base and priority gas fee (EIP-1559).
     */
    async getGasPrice() {
        try {
            const feeData = await this.ethProvider.getFeeData();
            
            // Use Ethers v5 style formatUnits (from ethers.utils.formatUnits)
            const maxFee = formatUnits(feeData.maxFeePerGas, 'gwei');
            const priorityFee = formatUnits(feeData.maxPriorityFeePerGas, 'gwei');

            return {
                maxFee: parseFloat(maxFee).toFixed(2),
                priorityFee: parseFloat(priorityFee).toFixed(2),
                unit: 'Gwei'
            };
        } catch (error) {
            console.error("Error fetching gas price:", error.message);
            return { maxFee: 'N/A', priorityFee: 'N/A', unit: 'Gwei' };
        }
    }


    /**
     * Retrieves the total circulating supply of the LSETH (stETH) token (via Etherscan).
     */
    async getTotalLsethSupply() {
        if (!ETHERSCAN_API_KEY) return "API Key Missing";
        const contractAddress = ETH_CONTRACTS.LSETH.address;
        const url = `https://api.etherscan.io/api?module=stats&action=tokensupply&contractaddress=${contractAddress}&apikey=${ETHERSCAN_API_KEY}`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            if (data.status === '1' && data.result) {
                const rawSupply = BigInt(data.result);
                // Use Ethers v5 style formatUnits
                const formattedSupply = formatUnits(rawSupply, 18);
                return `${parseFloat(formattedSupply).toLocaleString(undefined, { maximumFractionDigits: 0 })} LSETH`;
            } else {
                return "Error Fetching Supply";
            }
        } catch (error) {
            return "Network Error";
        }
    }


    /**
     * Fetches balances across both Ethereum and Polygon networks and calculates USD value.
     */
    async getAssetStatus() {
        const prices = await this.getAssetPrices();
        const results = [];
        const ethConfig = ETH_CONTRACTS;
        const polyConfig = POLYGON_CONTRACTS;

        for (const address of this.addresses) {
            try {
                // ... ethPromises and polyPromises unchanged ...
                const ethPromises = [
                    this.ethProvider.getBalance(address), // Native ETH
                    this.ethContracts.lseth.balanceOf(address),
                    this.ethContracts.weth.balanceOf(address),
                    this.ethContracts.dai.balanceOf(address),
                    this.ethContracts.usdc.balanceOf(address),
                    this.ethContracts.ocean.balanceOf(address),
                ];

                const [ethWei, lsethWei, wethWei, daiWei, usdcEthWei, oceanWei] = await Promise.all(ethPromises);

                const polyPromises = [
                    this.polyProvider.getBalance(address), // Native MATIC
                    this.polygonContracts.usdc.balanceOf(address),
                    this.polygonContracts.memecoin.balanceOf(address),
                ];

                const [maticWei, usdcPolyWei, memecoinWei] = await Promise.all(polyPromises);

                // --- Format and Calculate USD Value ---
                // Use Ethers v5 style formatEther/formatUnits
                const eth = {
                    native: parseFloat(formatEther(ethWei)),
                    lseth: parseFloat(formatUnits(lsethWei, ethConfig.LSETH.decimals)),
                    weth: parseFloat(formatUnits(wethWei, ethConfig.WETH.decimals)),
                    dai: parseFloat(formatUnits(daiWei, ethConfig.DAI.decimals)),
                    usdc: parseFloat(formatUnits(usdcEthWei, ethConfig.USDC.decimals)),
                    ocean: parseFloat(formatUnits(oceanWei, ethConfig.OCEAN.decimals)),
                };
                
                const polygon = {
                    native: parseFloat(formatEther(maticWei)), // MATIC is formatted like ETH
                    matic: parseFloat(formatEther(maticWei)),
                    usdc: parseFloat(formatUnits(usdcPolyWei, polyConfig.USDC.decimals)),
                    memecoin: parseFloat(formatUnits(memecoinWei, polyConfig.MEMECOIN.decimals)),
                };

                // Calculate Total USD Value for each network
                const totalEthUsd = eth.native * prices.ETH + eth.lseth * prices.LSETH + eth.weth * prices.WETH + eth.dai * prices.DAI + eth.usdc * prices.USDC + eth.ocean * prices.OCEAN;
                const totalPolyUsd = polygon.matic * prices.MATIC + polygon.usdc * prices.USDC + polygon.memecoin * prices.QUIC;

                results.push({
                    address: address,
                    totalUsd: (totalEthUsd + totalPolyUsd).toFixed(2),
                    network: {
                        eth,
                        polygon
                    },
                    prices
                });

            } catch (error) {
                console.error(`Error fetching data for address ${address}:`, error.message);
                results.push({ address: address, totalUsd: 'N/A', network: { eth: {}, polygon: {} }, prices: {} });
            }
        }
        return results;
    }

    /**
     * Returns the list of configured wallet addresses.
     */
    getWalletAddresses() {
        return this.addresses;
    }

    // Mock market status data - unchanged
    getMarketStatusUpdate() {
        const statuses = ["Bullish", "Neutral", "Bearish", "Consolidation"];
        const trends = ["DeFi", "Stablecoins", "AI Tokens", "Layer-2s"];

        return {
            timestamp: Date.now(),
            market_status: statuses[Math.floor(Math.random() * statuses.length)],
            market_sentiment_score: Math.floor(Math.random() * 100),
            main_index: (Math.random() * 3500 + 1500).toFixed(2),
            trend_sector: trends[Math.floor(Math.random() * trends.length)],
            total_volume: (Math.random() * 50).toFixed(1)
        };
    }
}

module.exports = Web3Service;
