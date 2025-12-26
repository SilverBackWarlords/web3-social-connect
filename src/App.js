import React, { useState } from "react";
import { ThirdwebProvider, ConnectWallet, ChainId } from "@thirdweb-dev/react";
import SovereignFeed from "./components/SovereignFeed";
import SovereignSettings from "./components/SovereignSettings";
import AssetTracker from "./components/AssetTracker";
import SupplyChainHub from "./components/SupplyChainHub";

function App() {
  const [intel, setIntel] = useState("");

  return (
    <ThirdwebProvider activeChain={ChainId.Mainnet}>
      <div className="min-h-screen bg-black text-cyan-500 p-4 font-mono text-[12px]">
        <header className="border-b border-cyan-900 pb-4 mb-4 flex justify-between items-center">
          <div>
            <h1 className="font-bold text-xl uppercase text-cyan-400 tracking-tighter">RCS Sentinel v1.3</h1>
            <p className="text-[9px] text-slate-500 uppercase">Secure Logistics Node</p>
          </div>
          <div className="flex items-center space-x-2">
            <ConnectWallet 
              theme="dark" 
              btnTitle="CONNECT_UPLINK" 
              className="!bg-transparent !border !border-cyan-900 !text-cyan-500 !text-[10px] !rounded-none hover:!bg-cyan-900"
            />
          </div>
        </header>
        
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 bg-slate-900/10 border border-cyan-900 p-4">
            <SovereignFeed />
          </section>
          
          <section className="space-y-4">
            <SupplyChainHub prefill={intel} />
            <div className="bg-slate-900/30 border border-indigo-900 p-4">
              <h2 className="text-center text-indigo-400 mb-2 uppercase text-[10px] font-bold">Intelligence Node</h2>
              <AssetTracker onDataGenerated={(data) => setIntel(data)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
               <a href="https://commerce.coinbase.com/checkout/52107d07-2c95-4907-9880-6b3c221a0ee6" target="_blank" rel="noreferrer" className="bg-indigo-900/50 border border-indigo-500 text-center py-2 text-[10px] font-bold hover:bg-indigo-600 transition-all">MINT $1</a>
               <a href="https://etherscan.io/address/0x90c322E257f7C719fbCAB6329684abFe50F348eD" target="_blank" rel="noreferrer" className="bg-slate-800 border border-slate-700 text-center py-2 text-[10px] font-bold uppercase hover:bg-slate-700">Audit</a>
            </div>
            <SovereignSettings />
          </section>
        </main>
      </div>
    </ThirdwebProvider>
  );
}
export default App;
