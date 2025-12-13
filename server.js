const { Client, GatewayIntentBits } = require('discord.js');
const { Web3Service } = require('./services/web3-service');
const { MintingService } = require('./services/minting-service');
require('dotenv').config();

// Discord Client Setup
const client = new Client({ intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
]});

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// --- Service Initialization ---
const web3Service = new Web3Service();

// VITAL: START: Wallet Crash Guard Block
let mintingService; 
try {
    // This is the line that was crashing (the new MintingService() call)
    mintingService = new MintingService();
} catch (e) {
    console.error("❌ FATAL ERROR: MintingService failed during initialization (Likely invalid Private Key or Ethers side effect). The bot will continue, but minting commands will be disabled.");
    console.error("Ethers Error Details:", e.shortMessage || e.message);
    
    // Assign a mock object so the bot doesn't crash when commands try to call mintingService methods
    mintingService = { 
        getWalletAddress: () => "❌ Service Failed: Check Console Log",
        mintToken: () => "❌ Minting Service is disabled due to a critical initialization error."
    };
}
// VITAL: END: Wallet Crash Guard Block

// --- Bot Events ---

client.once('ready', () => {
    console.log(`Bot is ready! Logged in as ${client.user.tag}!`);
    
    // Log the Web3 status
    console.log("\n--- Web3 Service Status ---");
    console.log(web3Service.getStatusReport());
    console.log(`Minting Wallet Status: ${mintingService.getWalletAddress()}`);
    console.log("---------------------------\n");
});

client.on('messageCreate', async message => {
    // Ignore messages from the bot itself
    if (message.author.bot) return;

    // Command: !status (Simple command to check bot health)
    if (message.content.toLowerCase() === '!status') {
        let statusMessage = "🤖 **Bot Health Report:**\n";
        statusMessage += web3Service.getStatusReport();
        statusMessage += `Minting Wallet: ${mintingService.getWalletAddress()}\n`;
        message.channel.send(statusMessage);
    }
    
    // Command: !mint @user [amount] (Placeholder for reward command)
    if (message.content.toLowerCase().startsWith('!mint')) {
        // Simple command parsing: !mint <@user> <amount>
        const parts = message.content.split(/\s+/);
        if (parts.length === 3) {
            const recipientTag = parts[1];
            const amount = parseFloat(parts[2]);
            
            // Extract Discord User ID from mention string (e.g., <@12345>)
            const recipientMatch = recipientTag.match(/<@!?(\d+)>/);
            
            if (recipientMatch && !isNaN(amount) && amount > 0) {
                const recipientId = recipientMatch[1];
                
                // Placeholder ETH address for the minting transaction.
                const recipientEthAddress = '0x000000000000000000000000000000000000dEaD'; 
                
                // Call the minting service
                const result = await mintingService.mintToken(recipientEthAddress, amount);
                message.channel.send(`Mint Request for ${recipientTag}: ${result}`);
            } else {
                message.channel.send("Invalid usage. Use format: \`!mint @user <amount>\` (amount must be a number).");
            }
        }
    }

    // Add other command handlers here...
});

client.login(DISCORD_TOKEN);
