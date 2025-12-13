require('dotenv').config();
const { App, LogLevel } = require('@slack/bolt');
const Web3Service = require('./web3-service');
const DbService = require('./db-service'); // This 'require' is now fully compatible
const { analyzeWalletData } = require('./gemini-service'); // Still mocking this function

// Initialize Services
let web3Service;
let dbService;
try {
    web3Service = new Web3Service();
    dbService = new DbService(); // Initialize Firestore
} catch (e) {
    console.error(`FATAL ERROR: ${e.message}`);
    process.exit(1);
}

// Load required environment variables for Slack
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;
const SLACK_APP_TOKEN = process.env.SLACK_APP_TOKEN;

if (!SLACK_BOT_TOKEN || !SLACK_SIGNING_SECRET || !SLACK_APP_TOKEN) {
    console.error("Missing Slack environment variables. Please check SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET, and SLACK_APP_TOKEN.");
    process.exit(1);
}

const app = new App({
    token: SLACK_BOT_TOKEN,
    signingSecret: SLACK_SIGNING_SECRET,
    appToken: SLACK_APP_TOKEN,
    socketMode: true,
    logLevel: LogLevel.INFO
});

// --- Utility Functions ---

/**
 * Formats the comprehensive asset status report for Slack.
 */
function formatAssetReport(data, totalLsethSupply, gasPrice) {
    const addresses = web3Service.getWalletAddresses();
    let report = `*Enterprise Asset & Oracle Report*\nReporting on ${addresses.length} wallet(s) across EVM networks.\n\n`;

    // 1. Gas and Supply Metrics (Transaction Intelligence)
    report += `⛽️ *Gas Oracle (L1 ETH):* Max Fee: \`${gasPrice.maxFee} Gwei\` (Priority: \`${gasPrice.priorityFee} Gwei\`)\n`;
    report += `📈 *LSETH Circulating Supply:* ${totalLsethSupply}\n\n---\n\n`;

    let grandTotalUsd = 0;

    data.forEach(wallet => {
        const address = wallet.address;
        const shortAddress = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
        
        const ethData = wallet.network.eth;
        const polyData = wallet.network.polygon;
        const prices = wallet.prices;

        // Sum the USD values for the grand total calculation
        if (wallet.totalUsd !== 'N/A') {
            grandTotalUsd += parseFloat(wallet.totalUsd);
        }

        report += `*Wallet: ${shortAddress}* | *Total Value: \$${wallet.totalUsd} USD*\n`;
        report += `Address: ${address}\n\n`;
        
        // Ethereum Block (High-Cost Network)
        report += `  *💎 Ethereum Mainnet (L1)*\n`;
        report += `  - *Staked (LSETH):* \`${ethData.lseth.toFixed(4)}\` (\$${(ethData.lseth * prices.LSETH).toFixed(2)})\n`;
        report += `  - *Native Gas (ETH):* \`${ethData.native.toFixed(4)}\` (\$${(ethData.native * prices.ETH).toFixed(2)})\n`;
        report += `  - USDC Stablecoin: \`${ethData.usdc.toFixed(2)}\` (\$${(ethData.usdc * prices.USDC).toFixed(2)}) *<-- Fiat Off-Ramp Target*\n`;
        report += `  - DAI Stablecoin: \`${ethData.dai.toFixed(2)}\` (\$${(ethData.dai * prices.DAI).toFixed(2)})\n`;
        report += `  - WETH: \`${ethData.weth.toFixed(2)}\` (\$${(ethData.weth * prices.WETH).toFixed(2)})\n`;
        report += `  - OCEAN (AI): \`${ethData.ocean.toFixed(2)}\` (\$${(ethData.ocean * prices.OCEAN).toFixed(2)})\n\n`;

        // Polygon Block (Low-Cost Network)
        report += `  *🌐 Polygon PoS (L2)*\n`;
        report += `  - *Native Gas (MATIC):* \`${polyData.matic.toFixed(4)}\` (\$${(polyData.matic * prices.MATIC).toFixed(2)})\n`;
        report += `  - USDC Stablecoin: \`${polyData.usdc.toFixed(2)}\` (\$${(polyData.usdc * prices.USDC).toFixed(2)}) *<-- Low-Cost Off-Ramp*\n`;
        report += `  - QUIC (Meme): \`${polyData.memecoin.toFixed(2)}\` (\$${(polyData.memecoin * prices.QUIC).toFixed(2)})\n\n---\n\n`;
    });
    
    report = `*💰 Grand Total Portfolio Value: \$${grandTotalUsd.toFixed(2)} USD*\n\n` + report;

    return report;
}

// --- Slack Command Handlers ---

app.command('/nexus', async ({ ack, body, respond }) => {
    await ack();

    try {
        const commandParts = body.text.trim().split(/\s+/);
        const command = commandParts[0];
        const arg1 = commandParts[1];
        const arg2 = commandParts[2];
        
        if (command === 'status') {
            await respond({ text: "Fetching enterprise multi-chain status (Balances, USD Prices, Gas Oracle)..." });
            
            // Enterprise Parallel Data Fetching
            const [data, totalLsethSupply, gasPrice] = await Promise.all([
                web3Service.getAssetStatus(),
                web3Service.getTotalLsethSupply(),
                web3Service.getGasPrice()
            ]);

            const report = formatAssetReport(data, totalLsethSupply, gasPrice);
            await respond({ text: report });
            
        } else if (command === 'watchlist') {
            if (arg1 === 'add' && arg2) {
                const success = await dbService.addToWatchlist(arg2);
                const message = success ? `✅ Added *${arg2.toUpperCase()}* to your watchlist.` : `❌ Failed to add *${arg2.toUpperCase()}*.`;
                await respond({ text: message });
                
            } else if (arg1 === 'remove' && arg2) {
                const success = await dbService.removeFromWatchlist(arg2);
                const message = success ? `🗑️ Removed *${arg2.toUpperCase()}* from your watchlist.` : `❌ Failed to remove *${arg2.toUpperCase()}*.`;
                await respond({ text: message });
                
            } else if (arg1 === 'view') {
                const watchlist = await dbService.getWatchlist();
                const report = watchlist.length > 0 
                    ? `👀 Your current Watchlist:\n${watchlist.map(t => `- *${t}*`).join('\n')}`
                    : `Your watchlist is empty. Add a token using \`/nexus watchlist add [TOKEN]\`.`;
                await respond({ text: report });

            } else {
                await respond({ text: "*Watchlist Commands:*\n`/nexus watchlist view`\n`/nexus watchlist add [SYMBOL]`\n`/nexus watchlist remove [SYMBOL]`" });
            }

        } else if (command === 'stream') {
            // Unchanged mock functionality
            const update = web3Service.getMarketStatusUpdate();
            const streamBlocks = [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": `*Market Update Stream: ${new Date(update.timestamp).toLocaleTimeString()}*\n> _Sentiment: ${update.market_status} (${update.market_sentiment_score} / 100)_\n> *Main Index:* ${update.main_index}\n> *Trending Sector:* ${update.trend_sector}\n> *24h Volume:* ${update.total_volume}B`
                    }
                }
            ];
            await respond({ blocks: streamBlocks });
            
        } else {
            // Help text reflecting available commands
            const helpText = `*Nexus Dapp Companion Commands:*\n`
                           + `\`/nexus status\` - Get multi-chain asset balances, USD values, and Gas Oracle data.\n`
                           + `\`/nexus watchlist [view|add|remove] ...\` - Manage your personal asset watchlist (saved to Firestore).\n`
                           + `\`/nexus stream\` - Get a mock market status update.`;
            await respond({ text: helpText });
        }

    } catch (error) {
        console.error("Error handling /nexus command:", error);
        await respond({ text: `An error occurred while processing the command: ${error.message}` });
    }
});


// --- Start App ---
(async () => {
    try {
        await app.start();
        console.log('⚡️ Slack Dapp Companion App is running in Socket Mode! (Enterprise Core Active)');
    } catch (error) {
        console.error('Failed to start the app:', error);
        process.exit(1);
    }
})();
