// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBS9ByC0V7Rl-lDcmbMvtTTD1VewEtzAyI",
  authDomain: "amnplus-83809.firebaseapp.com",
  projectId: "amnplus-83809",
  storageBucket: "amnplus-83809.firebasestorage.app",
  messagingSenderId: "512622427316",
  appId: "1:512622427316:web:97801b450d5a4a6778ebe1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export { auth, app};