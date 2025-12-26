require('dotenv').config();
const generator = require('megalodon').default;

async function test() {
    const client = generator('mastodon', process.env.MASTODON_URL, process.env.MASTODON_ACCESS_TOKEN);
    try {
        // Correct Megalodon function name is getAccountCredentials
        const res = await client.getAccountCredentials();
        console.log(`✅ Success! Authenticated as: ${res.data.username}`);
        console.log("🚀 Connection verified. You are ready to launch.");
    } catch (e) {
        console.error("❌ Auth Failed:", e.message);
        console.log("Tip: Check if your token in .env matches the one in Mastodon Preferences.");
    }
}
test();
