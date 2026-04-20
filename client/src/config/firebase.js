import { initializeApp } from "firebase/app";
import {getAuth} from 'firebase/auth'
import {getFirestore} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAcaAYGNEMq4iTpmWStSgNVCe6Qyxwz3qs",
  authDomain: "signalfm-3b3e8.firebaseapp.com",
  projectId: "signalfm-3b3e8",
  storageBucket: "signalfm-3b3e8.firebasestorage.app",
  messagingSenderId: "120381272430",
  appId: "1:120381272430:web:03e5f8652484002cce117f",
  measurementId: "G-0PW4GHWBMJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//Authentication
export const auth = getAuth(app);

//Firestore database
export const db = getFirestore(app);