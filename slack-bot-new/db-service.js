// FIX: Switched to CommonJS require() syntax for all Firebase modules to resolve ERR_REQUIRE_ESM.
const { initializeApp } = require("firebase/app");
const { getAuth, signInWithCustomToken, signInAnonymously } = require("firebase/auth");
const { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } = require("firebase/firestore");

// Global variables provided by the execution environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

class DbService {
    constructor() {
        this.app = initializeApp(firebaseConfig);
        this.auth = getAuth(this.app);
        this.db = getFirestore(this.app);
        this.userId = null;
        this.isAuthReady = this.initializeAuth();
    }

    /**
     * Initializes Firebase Authentication using the provided custom token or anonymously.
     * This is essential for accessing user-specific data (Watchlists).
     */
    async initializeAuth() {
        try {
            if (initialAuthToken) {
                await signInWithCustomToken(this.auth, initialAuthToken);
            } else {
                await signInAnonymously(this.auth);
            }
            this.userId = this.auth.currentUser.uid;
            console.log("Firebase Auth initialized successfully. User ID:", this.userId);
            return true;
        } catch (error) {
            console.error("Firebase Auth failed:", error);
            return false;
        }
    }

    /**
     * Gets the document reference for the user's private data (Watchlist).
     * Path: /artifacts/{appId}/users/{userId}/watchlist/tokens
     */
    getWatchlistDocRef() {
        if (!this.userId) throw new Error("Authentication not ready. Cannot access Firestore.");
        const path = `/artifacts/${appId}/users/${this.userId}/watchlist/tokens`;
        return doc(this.db, path);
    }

    /**
     * Retrieves the current watchlist for the user.
     * @returns {Promise<Array<string>>} List of token symbols (e.g., ['LSETH', 'USDC'])
     */
    async getWatchlist() {
        await this.isAuthReady;
        try {
            const docRef = this.getWatchlistDocRef();
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists() && docSnap.data().tokens) {
                return docSnap.data().tokens;
            } else {
                // Initialize with a few core assets if no list exists
                const initialList = ['LSETH', 'USDC', 'MATIC'];
                await setDoc(docRef, { tokens: initialList });
                return initialList;
            }
        } catch (error) {
            console.error("Error fetching watchlist:", error);
            return ['LSETH', 'USDC', 'MATIC']; // Fallback
        }
    }

    /**
     * Adds a token symbol to the user's watchlist.
     * @param {string} symbol - Token symbol (e.g., 'DAI').
     */
    async addToWatchlist(symbol) {
        await this.isAuthReady;
        const normalizedSymbol = symbol.toUpperCase();
        try {
            const docRef = this.getWatchlistDocRef();
            await updateDoc(docRef, {
                tokens: arrayUnion(normalizedSymbol)
            });
            return true;
        } catch (error) {
            console.error("Error adding to watchlist:", error);
            return false;
        }
    }

    /**
     * Removes a token symbol from the user's watchlist.
     * @param {string} symbol - Token symbol (e.g., 'DAI').
     */
    async removeFromWatchlist(symbol) {
        await this.isAuthReady;
        const normalizedSymbol = symbol.toUpperCase();
        try {
            const docRef = this.getWatchlistDocRef();
            await updateDoc(docRef, {
                tokens: arrayRemove(normalizedSymbol)
            });
            return true;
        } catch (error) {
            console.error("Error removing from watchlist:", error);
            return false;
        }
    }
}

module.exports = DbService; // Changed to module.exports
