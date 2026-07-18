import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDOHDiRIwehXD683PRogvXhvqACAj2AZy0",
  authDomain: "stolowka-menu.firebaseapp.com",
  projectId: "stolowka-menu",
  storageBucket: "stolowka-menu.firebasestorage.app",
  messagingSenderId: "30753709444",
  appId: "1:30753709444:web:4cabc8fb1bda3b2dce51d1",
};

const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];

export const db = getFirestore(app);
export const auth = getAuth(app);
