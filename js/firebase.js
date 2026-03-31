console.log("firebase loaded");

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

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

window.db = db;
