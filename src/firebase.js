import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "",
  authDomain: "web3-social-connect.firebaseapp.com",
  projectId: "web3-social-connect",
  storageBucket: "web3-social-connect.appspot.com",
  messagingSenderId: "778855443322",
  appId: "1:778855443322:web:abc123def456"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);