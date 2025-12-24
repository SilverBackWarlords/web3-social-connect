import React,{useEffect,useState} from 'react';
import {db} from '../firebase';
import {collection,query,orderBy,onSnapshot,limit} from 'firebase/firestore';

const SovereignFeed=()=>{
  const [posts,setPosts]=useState([]);
  useEffect(()=>{
    const q=query(collection(db,'sovereign_feed'),orderBy('createdAt','desc'),limit(10));
    return onSnapshot(q,(s)=>setPosts(s.docs.map(d=>({id:d.id,...d.data()}))));
  },[]);
  return(<div className='space-y-4'>
    {posts.map(p=>(<div key={p.id} className='border-l-2 border-cyan-800 pl-4 py-2'>
      <div className='text-[10px] text-cyan-600 uppercase'>Logistics Node: Active</div>
      <div className='text-sm text-slate-300' dangerouslySetInnerHTML={{__html:p.content}}/>
    </div>))}
  </div>);
};
export default SovereignFeed;