import React, { useState, useEffect } from "react";
import axios from "axios";

const SovereignFeed = () => {
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState("INITIALIZING...");

  useEffect(() => {
    const fetchFeed = async () => {
      setStatus("SCANNING MASTODON NODE...");
      try {
        const instance = process.env.REACT_APP_MASTODON_INSTANCE;
        const userId = process.env.REACT_APP_MASTODON_USER_ID;

        if (!instance || !userId) {
          setStatus("CONFIG_MISSING");
          return;
        }

        const res = await axios.get(`${instance}/api/v1/accounts/${userId}/statuses`);
        
        // Safety Check: Ensure data is an array before setting state
        if (res.data && Array.isArray(res.data)) {
          setPosts(res.data);
          setStatus("ONLINE");
        } else {
          setStatus("INVALID_DATA_FORMAT");
        }
      } catch (e) {
        console.error(e);
        setStatus("NODE_OFFLINE");
      }
    };
    fetchFeed();
  }, []);

  return (
    <div className="font-mono">
      <div className="text-[10px] mb-4 text-cyan-700 uppercase tracking-widest border-b border-cyan-900 pb-1">
        Status: <span className={status === "ONLINE" ? "text-green-500" : "text-red-500"}>{status}</span>
      </div>
      
      <div className="space-y-4">
        {posts && posts.length > 0 ? (
          posts.map((post) => (
            <div key={post.id || Math.random()} className="border-b border-cyan-900/30 pb-3">
              <p className="text-[9px] text-slate-500">[{post.created_at ? new Date(post.created_at).toLocaleDateString() : 'UNKNOWN_TIME'}]</p>
              <div 
                className="text-cyan-100 text-xs leading-relaxed overflow-hidden" 
                dangerouslySetInnerHTML={{ __html: post.content || "" }} 
              />
            </div>
          ))
        ) : (
          <div className="text-slate-600 text-[10px] py-10 text-center border border-dashed border-slate-800">
            NO ACTIVE TRANSMISSIONS FOUND IN THIS SECTOR
          </div>
        )}
      </div>
    </div>
  );
};

export default SovereignFeed;
