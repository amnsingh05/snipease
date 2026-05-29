import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAkeXna81kuQiGF5klSwl3tR8M7cyV5Is0",
  authDomain: "snipease-00.firebaseapp.com",
  projectId: "snipease-00",
  storageBucket: "snipease-00.firebasestorage.app",
  messagingSenderId: "450053396521",
  appId: "1:450053396521:web:7759b92c338e39babfe438",
  measurementId: "G-E54YLZKWWZ"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export {
  db,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy
};