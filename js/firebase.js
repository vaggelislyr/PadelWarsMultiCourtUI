// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBi25BAc17Tsy2UjgX-RxY64SZzVtUJjGM",
  authDomain: "court-scoreboards.firebaseapp.com",
  databaseURL: "https://court-scoreboards-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "court-scoreboards",
  storageBucket: "court-scoreboards.firebasestorage.app",
  messagingSenderId: "286245156336",
  appId: "1:286245156336:web:0372376e2dda64aded5935",
  measurementId: "G-6KT557NW2Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
