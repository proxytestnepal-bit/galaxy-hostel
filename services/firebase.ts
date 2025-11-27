
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBNw_NPWWMRuD4vVQlKCyT_yxQpw9LZt48",
  authDomain: "galaxy-hotel-tourism.firebaseapp.com",
  projectId: "galaxy-hotel-tourism",
  storageBucket: "galaxy-hotel-tourism.firebasestorage.app",
  messagingSenderId: "767481983596",
  appId: "1:767481983596:web:06106d26006c218f199e49"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
