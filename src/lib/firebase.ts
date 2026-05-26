import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDOHDiRIwehXD683PRogvXhvqACAj2AZy0",
  authDomain: "stolowka-menu.firebaseapp.com",
  projectId: "stolowka-menu",
  storageBucket: "stolowka-menu.firebasestorage.app",
  messagingSenderId: "30753709444",
  appId: "1:30753709444:web:4cabc8fb1bda3b2dce51d1",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);