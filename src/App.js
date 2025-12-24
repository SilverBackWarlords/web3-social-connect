import React from 'react';
import SovereignFeed from './components/SovereignFeed';
import SovereignSettings from './components/SovereignSettings';
import WalletConnect from './components/WalletConnect';

function App() {
  return (
    <div className='min-h-screen bg-black text-cyan-500 p-4 md:p-8 font-mono'>
      <header className='border-b-2 border-cyan-900 pb-4 mb-8 flex justify-between items-center'>
        <div>
          <h1 className='text-2xl font-bold tracking-widest text-cyan-400'>GEMINI DAPP COMPANION</h1>
          <p className='text-xs text-slate-500 uppercase'>RCS DISTRIBUTION AND RETAIL, LLC</p>
        </div>
        <WalletConnect />
      </header>
      <main className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        <section className='lg:col-span-2 bg-slate-900/30 border border-cyan-900 p-4 rounded-lg'>
          <h2 className='text-sm font-bold mb-4 border-l-4 border-cyan-500 pl-2 text-cyan-300'>LOGISTICS TERMINAL</h2>
          <div className='h-96 overflow-y-auto'><SovereignFeed /></div>
        </section>
        <section className='space-y-8'>
          <SovereignSettings />
          <div className='bg-slate-900/50 border border-indigo-900 p-5 rounded-lg text-[11px]'>
            <h2 className='text-sm font-bold mb-3 text-indigo-400 underline'>GLOBAL ASSET STATUS</h2>
            <div className='flex justify-between'><span>REGION:</span><span>AFRICA / AMERICA</span></div>
            <div className='flex justify-between'><span>NODE:</span><span className='text-green-400 underline'>ACTIVE</span></div>
          </div>
        </section>
      </main>
      <footer className='mt-12 text-center text-[10px] text-slate-600 border-t border-slate-900 pt-4'>PROPERTY OF SILVERBACKWARLORDS ENTERPRISE. ALL RIGHTS RESERVED.</footer>
    </div>
  );
}
export default App;