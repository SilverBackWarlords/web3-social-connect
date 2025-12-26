require('dotenv').config();
const generator = require('megalodon').default;
const { MongoClient } = require('mongodb');

async function main() {
    console.log("🚀 Starting Sovereign Web3 Bridge...");
    const mongo = new MongoClient(process.env.MONGO_URI);
    
    try {
        await mongo.connect();
        const db = mongo.db('web3_social');
        console.log("✅ MongoDB Linked");

        // Use the URL from .env (which should be your instance IP or domain)
        const client = generator('mastodon', 'http://127.0.0.1:3000', process.env.MASTODON_ACCESS_TOKEN);
        
        // Correct Megalodon method: verifyAccountCredentials
        const account = await client.verifyAccountCredentials();
        console.log(`✅ Mastodon Authenticated: ${account.data.username}`);

        const stream = await client.userStreaming();
        console.log("📡 SOVEREIGN STATUS: ACTIVE (Listening for Wallets...)");

        stream.on('update', async (status) => {
            const cleanContent = status.content.replace(/<[^>]*>?/gm, '');
            const walletRegex = /0x[a-fA-F0-9]{40}/;
            const walletFound = cleanContent.match(walletRegex);

            if (walletFound) {
                console.log(`💎 Wallet Found: ${walletFound[0]} from ${status.account.acct}`);
                await db.collection('user_wallets').updateOne(
                    { mastodon_account: status.account.acct },
                    { $set: { wallet: walletFound[0], linked_at: new Date() } },
                    { upsert: true }
                );
                console.log("💾 Secured in MongoDB.");
            }
        });

        stream.on('error', (err) => console.error("Stream Notice:", err.message));

    } catch (e) {
        console.error("❌ Bridge Sync Failed:", e.message);
    }
}

main();