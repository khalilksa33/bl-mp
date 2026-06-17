import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  projectId: "my-test-project-505",
  appId: "1:715398703431:web:1d356e677155b713a44462",
  storageBucket: "my-test-project-505.firebasestorage.app",
  apiKey: "AIzaSyDd7mK2G-_ch_KUKyjLkoNir2qmmaSL_J8",
  authDomain: "my-test-project-505.firebaseapp.com",
  messagingSenderId: "715398703431",
  projectNumber: "715398703431"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Analytics conditionally (only works in browser/client-side)
let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, analytics };
