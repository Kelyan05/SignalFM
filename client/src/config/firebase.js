// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getAuth} from 'firebase/auth'
import {getFirestore} from 'firebase/firestore'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);

//Authentication
export const auth = getAuth(app);

//Firestore database
export const db = getFirestore(app);