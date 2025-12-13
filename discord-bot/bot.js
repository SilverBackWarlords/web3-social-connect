const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { Web3Service } = require('./services/web3-service');
const fs = require('fs').promises; // Node's file system for wallet storage
require('dotenv').config();

// --- Configuration ---
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_APP_ID = process.env.DISCORD_APP_ID;
const MASTODON_LINK = "https://mastodon.social/@silverbackgodx"; // Replaced hardcoded key with a link

const WALLETS_FILE = 'userWallets.json';
const COMMANDS_TO_REGISTER = [
    new SlashCommandBuilder().setName('ping').setDescription('Tests bot responsiveness.'),
    new SlashCommandBuilder().setName('wallet').setDescription('Shows your connected wallet and status.'),
    new SlashCommandBuilder()
        .setName('connect')
        .setDescription('Connects your Discord account to your Web3 wallet.')
        .addStringOption(option =>
            option.setName('address')
                .setDescription('Your Sepolia wallet address (0x...)')
                .setRequired(true)),
    new SlashCommandBuilder()
        .setName('mint')
        .setDescription('Mints tokens to your connected wallet.')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('The amount of tokens to mint (e.g., 100)')
                .setRequired(true)),
    new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Checks the ETH balance of your connected wallet or a specified address.')
        .addStringOption(option =>
            option.setName('address')
                .setDescription('Optional: Wallet address to check (defaults to connected wallet)'))
].map(command => command.toJSON());

// --- Service Initialization ---
let web3Service;
try {
    web3Service = new Web3Service();
} catch (e) {
    console.error("❌ FATAL ERROR: Web3Service failed during initialization. Web3 commands will be disabled.");
    console.error("Error Details:", e.message);
    web3Service = { getWalletAddress: () => "❌ Service Failed: Check Console Log", mintToken: () => Promise.resolve("❌ Web3 Service is disabled."), checkBalance: () => Promise.resolve("❌ Web3 Service is disabled.") };
}

// --- Helper Functions ---
async function readWallets() {
    try {
        const data = await fs.readFile(WALLETS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') return {}; // File not found, return empty object
        console.error("Error reading wallets file:", error);
        return {};
    }
}

async function writeWallets(wallets) {
    await fs.writeFile(WALLETS_FILE, JSON.stringify(wallets, null, 2));
}

async function registerCommands() {
    const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
    try {
        console.log('Started refreshing application (/) commands.');
        // Registers commands globally (can take up to an hour for Discord to fully sync)
        await rest.put(
            Routes.applicationCommands(DISCORD_APP_ID),
            { body: COMMANDS_TO_REGISTER },
        );
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
}

// --- Bot Events ---
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.once('ready', async () => {
    console.log(`Bot is ready! Logged in as ${client.user.tag}!`);
    
    // Log the Web3 status
    console.log("\n--- Web3 Service Status ---");
    console.log(`Service Wallet Address: ${web3Service.getWalletAddress()}`);
    console.log("---------------------------\n");

    // Re-register commands every time the bot starts
    await registerCommands();
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;
    const userId = interaction.user.id;
    const wallets = await readWallets();

    // Defer the reply for commands that take time (like minting)
    if (commandName === 'mint' || commandName === 'balance') {
        await interaction.deferReply({ ephemeral: false });
    }

    // --- Command Handlers ---
    if (commandName === 'ping') {
        await interaction.reply({ content: 'Pong!', ephemeral: true });

    } else if (commandName === 'connect') {
        const address = interaction.options.getString('address').toLowerCase();
        
        // Basic Address Validation (a real check would be more robust)
        if (!address.startsWith('0x') || address.length !== 42) {
            return await interaction.reply({ content: 'Invalid Ethereum address format. Must be 42 characters and start with 0x.', ephemeral: true });
        }

        wallets[userId] = address;
        await writeWallets(wallets);

        await interaction.reply({ 
            content: `✅ Successfully connected your account to wallet address: \`${address}\``,
            ephemeral: true 
        });

    } else if (commandName === 'wallet') {
        const connectedAddress = wallets[userId] || 'None';

        // Mastodon Button Integration
        const mastodonButton = new ButtonBuilder()
            .setLabel('Follow SilverbackGods on Mastodon')
            .setURL(MASTODON_LINK)
            .setStyle(ButtonStyle.Link);

        const row = new ActionRowBuilder().addComponents(mastodonButton);

        await interaction.reply({
            content: `Your connected wallet is: \`${connectedAddress}\`\n\n**Service Wallet Address:** \`${web3Service.getWalletAddress()}\``,
            components: [row]
        });

    } else if (commandName === 'balance') {
        const addressOption = interaction.options.getString('address');
        const addressToCheck = addressOption || wallets[userId];

        if (!addressToCheck || addressToCheck === 'None') {
            return await interaction.editReply({ content: '❌ No wallet connected. Use `/connect <address>` first, or provide an address to check.' });
        }

        try {
            const balance = await web3Service.checkBalance(addressToCheck);
            await interaction.editReply(`💰 **Wallet Balance** for \`${addressToCheck}\`:\n**${balance}** ETH (Sepolia Testnet)`);
        } catch (error) {
            await interaction.editReply(`❌ Could not fetch balance for \`${addressToCheck}\`. Check RPC connection.`);
        }

    } else if (commandName === 'mint') {
        const amount = interaction.options.getInteger('amount');
        const recipientEthAddress = wallets[userId]; // Use the user's CONNECTED wallet address

        if (!recipientEthAddress || recipientEthAddress === 'None') {
            return await interaction.editReply({ content: '❌ Minting failed: You must connect a wallet first! Use `/connect <address>`.' });
        }
        
        await interaction.editReply(`Processing mint request for **${amount}** tokens to your connected wallet: \`${recipientEthAddress}\`...`);
        
        try {
            const receipt = await web3Service.mintToken(recipientEthAddress, amount.toString());
            const successMsg = `✅ **Transaction Successful!** Minted **${amount}** tokens to your wallet.\n🔗 View on Sepolia Etherscan: \`https://sepolia.etherscan.io/tx/${receipt.hash}\``;
            await interaction.followUp({ content: successMsg });
        } catch (error) {
            console.error('Minting command error:', error);
            await interaction.editReply(`❌ **Transaction Failed!** Could not execute minting request. Check console for gas errors.`);
        }
    }
});

client.login(DISCORD_TOKEN);
