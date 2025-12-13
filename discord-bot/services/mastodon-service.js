const axios = require('axios');

const MASTODON_API_BASE_URL = 'https://mastodon.social/api/v1/';

class MastodonService {
  constructor() {
    if (!process.env.MASTODON_API_KEY) {
      throw new Error("MASTODON_API_KEY must be set in the environment variables.");
    }
    this.api = axios.create({
      baseURL: MASTODON_API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${process.env.MASTODON_API_KEY}`
      }
    });
    this.accountId = null; // To be fetched lazily
  }

  /**
   * Fetches the Mastodon account ID for a given username.
   * @param {string} username The username to look up (e.g., 'silverbackgodx').
   * @returns {Promise<string>} The account ID.
   */
  async getAccountId(username = 'silverbackgodx') {
    if (this.accountId) {
      return this.accountId;
    }
    try {
      const response = await this.api.get(`accounts/lookup`, {
        params: { acct: username }
      });
      this.accountId = response.data.id;
      console.log(`Successfully fetched Mastodon account ID: ${this.accountId}`);
      return this.accountId;
    } catch (error) {
      console.error(`Error fetching Mastodon account ID for ${username}:`, error.response ? error.response.data : error.message);
      throw new Error('Could not fetch Mastodon account ID.');
    }
  }

  /**
   * Posts a status (toot) to Mastodon.
   * @param {string} status The text content of the status to post.
   * @returns {Promise<object>} The API response from Mastodon.
   */
  async postStatus(status) {
    try {
      const response = await this.api.post('statuses', { status });
      console.log(`Successfully posted to Mastodon: ${response.data.url}`);
      return response.data;
    } catch (error) {
      console.error('Error posting to Mastodon:', error.response ? error.response.data : error.message);
      throw new Error('Could not post status to Mastodon.');
    }
  }

  /**
   * Fetches the latest post for the configured user.
   * @returns {Promise<object>} The latest post object from Mastodon.
   */
  async getLatestPost() {
    const accountId = await this.getAccountId();
    if (!accountId) {
        throw new Error("Could not fetch latest post because account ID is unavailable.");
    }
    try {
      const response = await this.api.get(`accounts/${accountId}/statuses`, {
        params: { limit: 1 }
      });
      if (response.data.length > 0) {
        return response.data[0];
      }
      return null; // No posts found
    } catch (error) {
      console.error('Error fetching latest post from Mastodon:', error.response ? error.response.data : error.message);
      throw new Error('Could not fetch latest post from Mastodon.');
    }
  }
}

module.exports = { MastodonService };
