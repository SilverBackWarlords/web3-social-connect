import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-functions.js";

// Enterprise Config - Secured via restricted API Keys
const firebaseConfig = { 
    projectId: "web3-social-connect",
    authDomain: "web3-social-connect.firebaseapp.com"
};

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);
const researchAgent = httpsCallable(functions, "researchAgent");

window.askAI = async () => {
    const queryInput = document.getElementById("query");
    const btn = document.getElementById("queryBtn");
    const responseDiv = document.getElementById("response");
    
    if (!queryInput.value) return;

    // UI Lockdown for Latency Management
    btn.disabled = true;
    queryInput.disabled = true;
    responseDiv.innerHTML = "<em>Consulting Sovereign Brain & AWS Bridge...</em>";

    try {
        const result = await researchAgent({ 
            query: queryInput.value,
            traceId: "RCS-" + Math.random().toString(36).substr(2, 9)
        });

        responseDiv.innerText = result.data.answer;
    } catch (error) {
        console.error("Sovereign Error:", error);
        responseDiv.innerHTML = "<span style='color: #f87171;'>Connection Error: Check Vertex AI and AWS Gateway.</span>";
    } finally {
        btn.disabled = false;
        queryInput.disabled = false;
    }
};
