import React from 'react';

export default function Index() {
  const connectWallet = () => {
    console.log("Wallet connection initiated...");
    alert("Wallet connection initiated (Implement Web3 logic here)");
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Web3 Social Connect</h1>
      <p>The secure, geographically optimized platform for social networking.</p>

      <button 
        onClick={connectWallet} 
        style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px' }}
      >
        Connect Wallet
      </button>

      <hr style={{ margin: '30px 0' }} />

      <h2>User Feed (Ready for Firestore)</h2>
      <p>Data will be fetched from the **africa-south1** region for low latency.</p>
    </div>
  );
}
