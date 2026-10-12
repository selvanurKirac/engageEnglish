// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth";
import {getFirestore} from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDbExKxz7Cwn1qrTzoqkNt5TIYkuk-Rw9A",
  authDomain: "gpi2project.firebaseapp.com",
  databaseURL: "https://gpi2project-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "gpi2project",
  storageBucket: "gpi2project.firebasestorage.app",
  messagingSenderId: "1057979959503",
  appId: "1:1057979959503:web:860d4b352537e3764e4fba"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth=getAuth();
export const db=getFirestore(app);
export default app;