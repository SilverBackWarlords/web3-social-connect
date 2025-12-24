import React, { useState } from 'react';
import { uploadBytes, ref } from 'firebase/storage';
import { storage } from '../firebase';

const ResearchAgentCard = () => {
    const [uploading, setUploading] = useState(false);

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const storageRef = ref(storage, 'research/' + file.name);
        await uploadBytes(storageRef, file);
        setUploading(false);
        alert('Intel Ingested: ' + file.name);
    };

    return (
        <div className="card p-4 shadow-lg bg-dark text-light border-primary" style={{marginTop: '20px'}}>
            <h3 className="text-primary">Sovereign Research Agent</h3>
            <p className="text-muted small">Upload institutional docs or research PDFs.</p>
            <input type="file" onChange={handleUpload} className="form-control mb-2 bg-secondary text-white" />
            {uploading && <div className="spinner-border text-primary" role="status"></div>}
        </div>
    );
};

export default ResearchAgentCard;
