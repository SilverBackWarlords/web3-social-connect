const { Web3Service } = require('../services/web3-service.js');
const { MastodonService } = require('../services/mastodon-service.js');

/**
 * Controller function to handle the minting of a token and posting a confirmation to Mastodon.
 */
const mintAndPost = async (req, res) => {
  // In a real application, you would get these from the request body or other sources.
  const recipientAddress = '0x426ca4a1D4b739D7825Adb9f8db67e37795d8BEa'; // Example address
  const mintAmount = '1'; // Example amount

  try {
    // 1. Initialize services
    const web3Service = new Web3Service();
    const mastodonService = new MastodonService();

    // 2. Trigger the token minting transaction
    console.log(`Attempting to mint ${mintAmount} token(s) to ${recipientAddress}...`);
    const txReceipt = await web3Service.mintToken(recipientAddress, mintAmount);
    console.log('Minting successful. Transaction hash:', txReceipt.hash);

    // 3. Upon successful transaction, post a confirmation to Mastodon
    const mastodonMessage = `A new token was just minted! Tx: ${txReceipt.hash}`;
    console.log('Posting confirmation to Mastodon...');
    const mastodonPost = await mastodonService.postStatus(mastodonMessage);
    console.log('Successfully posted to Mastodon:', mastodonPost.url);

    // 4. Send a success response
    res.status(200).json({
      success: true,
      message: 'Token minted and notification posted successfully.',
      transactionHash: txReceipt.hash,
      mastodonPostUrl: mastodonPost.url,
    });

  } catch (error) {
    console.error('mintAndPost controller error:', error.message);
    // Send an error response
    res.status(500).json({
      success: false,
      message: 'An error occurred during the mint and post process.',
      error: error.message,
    });
  }
};

module.exports = {
  mintAndPost,
};
