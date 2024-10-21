import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";

var initialized = false;

export default function firebase() {
  if (initialized) return;
  initialized = true;

  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyBBwbpV7vb8U-4xKsViCZZ3MVoiUOLrlkw",
    authDomain: "nflstream.firebaseapp.com",
    databaseURL: "https://nflstream-default-rtdb.firebaseio.com",
    projectId: "nflstream",
    storageBucket: "nflstream.appspot.com",
    messagingSenderId: "240735247504",
    appId: "1:240735247504:web:ba802c87e43087169f0c15",
    measurementId: "G-KTTBDNJXF3",
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  console.log("firebase", analytics);
}
