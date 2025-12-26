import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SupplyChainHub = ({ prefill }) => {
  const [status, setStatus] = useState('');

  // Only update if prefill actually changes and isn't empty
  useEffect(() => { 
    if (prefill) { setStatus(prefill); }
  }, [prefill]);

  const broadcastUpdate = async () => {
    // Safety Check: Prevent crash if ENV is missing
    const instance = process.env.REACT_APP_MASTODON_INSTANCE || 'https://mastodon.social';
    const token = process.env.REACT_APP_MASTODON_TOKEN;

    if (!token) {
      alert("Error: No Token Detected. Check ENV settings.");
      return;
    }

    try {
      await axios.post(`${instance}/api/v1/statuses`, 
        { status }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStatus('');
      alert("Broadcast Successful.");
    } catch (e) { 
      alert("Transmission Failed."); 
    }
  };

  return (
    <div className='bg-slate-900/40 border border-cyan-900 p-4 rounded'>
      <h2 className="text-[10px] text-cyan-400 mb-2 font-bold uppercase">Broadcast Hub</h2>
      <textarea 
        className='w-full bg-black border border-cyan-900 p-2 text-cyan-100 text-[11px] focus:border-cyan-400 outline-none'
        rows='4'
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      />
      <button 
        onClick={broadcastUpdate} 
        className='w-full bg-cyan-900 hover:bg-cyan-700 py-2 mt-2 font-bold uppercase text-[10px] transition-colors'
      >
        Transmit Broadcast
      </button>
    </div>
  );
};
export default SupplyChainHub;
