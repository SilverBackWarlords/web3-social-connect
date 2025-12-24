import React from 'react';

const SovereignSettings=()=>(<div className='bg-slate-900 border border-cyan-900 p-4 rounded'>
  <h3 className='text-xs font-bold mb-3'>PRIVACY & DATA SOVEREIGNTY</h3>
  <div className='space-y-2'>
    <button className='w-full text-[10px] py-1 border border-cyan-600 text-cyan-400'>MASK GLOBAL LOCATION: ON</button>
    <button className='w-full text-[10px] py-1 border border-red-900 text-red-500'>ERASE CLOUD DATA</button>
  </div>
</div>);
export default SovereignSettings;