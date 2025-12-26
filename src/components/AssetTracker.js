import React, { useState, useEffect } from "react";
import axios from "axios";

const AssetTracker = ({ onDataGenerated }) => {
  const [prices, setPrices] = useState({ gold: "4,522.80", sol: "0.00" });
  const [alert, setAlert] = useState("STABLE");

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const solRes = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd");
        const currentSol = solRes.data.solana.usd;
        if (currentSol < 150) setAlert("VOLATILITY_ALERT");
        setPrices(prev => ({ ...prev, sol: currentSol.toFixed(2) }));
      } catch (e) { console.warn("Market Sync Delayed"); }
    };
    fetchPrices();
  }, []);

  const generateReport = () => {
    const report = `LOGISTICS BRIEF [2025-12-24]\n- XAU/USD: $${prices.gold}\n- SOL/USD: $${prices.sol}\n- STATUS: ${alert}\n- RCS Terminal Secure.`;
    onDataGenerated(report);
  };

  return (
    <div className={`space-y-2 mt-2 border-t pt-2 font-mono ${alert === "VOLATILITY_ALERT" ? "border-red-500 animate-pulse" : "border-indigo-900"}`}>
      <div className="flex justify-between"><span>GOLD:</span><span className="text-yellow-500">${prices.gold}</span></div>
      <div className="flex justify-between"><span>SOL:</span><span className="text-purple-400">${prices.sol}</span></div>
      <button 
        onClick={generateReport}
        className="w-full mt-2 bg-indigo-600 text-[9px] py-1 hover:bg-indigo-400 text-white font-bold"
      >
        GENERATE INTEL REPORT
      </button>
    </div>
  );
};
export default AssetTracker;
