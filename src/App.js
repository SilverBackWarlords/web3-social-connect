import React, { useState } from 'react';
import './styles/App.css';
import Gaming from './pages/Gaming';
import Streaming from './pages/Streaming';
import Blog from './pages/Blog';
import WalletConnect from './components/WalletConnect';

// ENTERPRISE SOVEREIGN TERMINAL - PHASE 3 (Foundation)
function App() {
  const [activeTab, setActiveTab] = useState('terminal'); // terminal, liquidity, gaming, streaming, blog
  const [assistantActive, setAssistantActive] = useState(false);
  const [isLoggedOut, setIsLoggedOut] = useState(true);

  const marketTicker = [
    { pair: "XAU/USD", price: "$2,654.10", trend: "+0.4%" },
    { pair: "BTC/USD", price: "$98,400.00", trend: "+1.2%" },
    { pair: "XRP/USD", price: "$2.45", trend: "+5.6%" },
    { pair: "SOL/USD", price: "$195.10", trend: "-0.2%" }
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'gaming':
        return <Gaming />;
      case 'streaming':
        return <Streaming />;
      case 'blog':
        return <Blog />;
      case 'terminal':
      default:
        return (
          <>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-inner">
              <h3 className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-2">Net Worth Potential</h3>
              <div className="text-5xl font-black text-white mb-6">$0.00 <span className="text-lg text-slate-600 font-normal">XAU/BTC Collateral</span></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <button className="bg-green-500/10 border border-green-500/20 text-green-400 font-bold py-4 rounded-xl hover:bg-green-500/20 transition-all">BUY</button>
                <button className="bg-red-500/10 border border-red-500/20 text-red-400 font-bold py-4 rounded-xl hover:bg-red-500/20 transition-all">SELL</button>
                <button className="bg-sky-500/10 border border-sky-500/20 text-sky-400 font-bold py-4 rounded-xl hover:bg-sky-500/20 transition-all">SEND</button>
                <button className="bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold py-4 rounded-xl hover:bg-amber-500/20 transition-all">RECEIVE</button>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 p-3 rounded-xl text-center flex justify-between items-center">
                  <div className="flex items-center gap-3">
                      <span className="font-bold text-indigo-400">AI SECURITY</span>
                      <span className="text-xs bg-slate-700 text-slate-400 px-2 py-1 rounded-full">KYC Required</span>
                  </div>
                  <div className="w-12 h-6 bg-slate-700 rounded-full p-1 flex items-center cursor-not-allowed">
                      <div className="w-4 h-4 bg-slate-500 rounded-full"></div>
                  </div>
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-1 h-96 overflow-hidden relative">
              <div className="absolute top-4 left-6 z-10 bg-slate-900/80 px-3 py-1 rounded-full text-xs border border-indigo-500 text-indigo-400">LIVE FEED: @silverbackgodx</div>
              <iframe src="https://mastodon.social/@silverbackgodx/embed" className="w-full h-full border-0 rounded-3xl opacity-80 hover:opacity-100 transition-opacity" title="Mastodon Feed"></iframe>
            </div>
          </>
        );
    }
  };

  return (
    <div className="enterprise-container bg-slate-950 text-slate-200 min-h-screen font-sans">
      <div className="bg-black border-b border-slate-800 py-1 overflow-hidden whitespace-nowrap">
        <div className="flex animate-marquee gap-8">
          {marketTicker.map((item, i) => (
            <span key={i} className="text-xs font-mono"><span className="text-slate-500">{item.pair}:</span> <span className="text-cyan-400">{item.price}</span></span>
          ))}
        </div>
      </div>
      <header className="p-6 flex justify-between items-center bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold tracking-widest text-white">SOVEREIGN <span className="text-cyan-500">DAPP</span></h1>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-400">
            <button onClick={() => setActiveTab('terminal')} className={activeTab === 'terminal' ? 'text-cyan-400' : ''}>TERMINAL</button>
            <button onClick={() => setActiveTab('gaming')} className={activeTab === 'gaming' ? 'text-cyan-400' : ''}>GAMING</button>
            <button onClick={() => setActiveTab('streaming')} className={activeTab === 'streaming' ? 'text-cyan-400' : ''}>STREAMING</button>
            <button onClick={() => setActiveTab('blog')} className={activeTab === 'blog' ? 'text-cyan-400' : ''}>BLOG</button>
            <button onClick={() => window.open('https://geminidappcompanion.blogspot.com', '_blank')}>KNOWLEDGE BASE</button>
          </nav>
        </div>
        <div className="flex gap-3">
          <button className="border border-slate-700 p-2 rounded-lg">⚙️</button>
        </div>
      </header>
      {isLoggedOut && !assistantActive && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-cyan-500/30 p-8 rounded-2xl max-w-lg text-center shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-4">Gemini Assistant</h2>
            <p className="text-slate-400 mb-8">Ready to analyze trade paths, legal frameworks, and digital asset sovereignty. How would you like to proceed?</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => {setAssistantActive(true); setIsLoggedOut(false)}} className="bg-cyan-500 text-black font-bold py-3 rounded-xl hover:bg-cyan-400">ACTIVATE GEMINI ASSISTANT</button>
              <button onClick={() => setIsLoggedOut(false)} className="text-slate-500 hover:text-white transition-colors">ENTER DASHBOARD ONLY</button>
            </div>
          </div>
        </div>
      )}
      <main className="max-w-7xl mx-auto p-6 grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {renderActiveTab()}
        </div>
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-3xl p-6 h-auto sticky top-28 backdrop-blur-xl">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <h4 className="font-bold text-indigo-300">GEMINI ASSISTANT ACTIVE</h4>
             </div>
             <div className="space-y-4 text-sm text-slate-300 mb-6">
                <p className="bg-slate-800/50 p-3 rounded-lg border-l-2 border-cyan-500">"I can help you bridge XRP liquidity to physical gold assets or map your trade via Google Maps Logistics."</p>
             </div>
             <WalletConnect />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;