import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBnpEzd6fJ6uEIeDcJimbvJPwBbZlA5f3c",
  authDomain: "project-web2024-fbe30.firebaseapp.com",
  projectId: "project-web2024-fbe30",
  storageBucket: "project-web2024-fbe30.appspot.com",
  messagingSenderId: "127320570395",
  appId: "1:127320570395:web:71def823b01021587996be",
  measurementId: "G-VEGVYKFW8Y"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const provider = new GoogleAuthProvider();
export { signOut };
