'use client';
// pages/_app.js

// === 1. IMPORTS ===
// Next.js utilities
import dynamic from 'next/dynamic';

// AppKit Core components
import { AppKitProvider } from '@reown/appkit/react';

// Solana-specific components
import { SolanaAdapter } from '@reown/appkit-adapter-solana/react';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { solanaDevnet } from '@reown/appkit/networks';

// Read Project ID securely from the environment variables
const PROJECT_ID_STRING = process.env.NEXT_PUBLIC_PROJECT_ID; 


// === 2. WALLET AND ADAPTER CONFIGURATION ===
const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    // Add other Solana wallets here if needed
];

const solanaAdapter = new SolanaAdapter({ wallets });


// === 3. CLIENT-SIDE WRAPPER COMPONENT (SSR BYPASS LOGIC) ===
// This function contains code that MUST only run in the browser.
function ClientWrapper({ Component, pageProps }) {
    
    // Check if the browser environment and the createAppKit function are available
    if (typeof window === 'undefined' || !window.createAppKit) {
        console.warn("AppKit initialization skipped during SSR or environment is incomplete.");
        return <Component {...pageProps} />;
    }

    // Initialize the AppKit modal only when on the client side
    const modal = window.createAppKit({ 
        adapters: [solanaAdapter],
        networks: [solanaDevnet], 
        
        // Use the SECURE environment variable for the Project ID
        projectId: PROJECT_ID_STRING, 
        
        metadata: {
            name: 'Web3 Social Connect',
            description: 'Enterprise Web3 Social Network for Real Estate & Gaming',
            url: 'http://localhost:3000', // Update this for production
            icons: ['https://avatars.githubusercontent.com/u/179229932?s=200&v=4']
        },
        themeMode: 'dark',
    });

    return (
        // Provide the modal instance to the rest of the application
        <AppKitProvider modal={modal}>
            <Component {...pageProps} />
        </AppKitProvider>
    );
}


// === 4. DYNAMIC EXPORT (MAIN APP COMPONENT) ===

// Use next/dynamic with ssr: false to prevent ClientWrapper from running on the server
const DynamicClientWrapper = dynamic(
  () => Promise.resolve(ClientWrapper), 
  { ssr: false }
);


function MyApp({ Component, pageProps }) {
    // Render the dynamically loaded wrapper
    return <DynamicClientWrapper Component={Component} pageProps={pageProps} />;
}

export default MyApp;
