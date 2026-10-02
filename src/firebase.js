import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyAvMP0JAQpzyVkHkIETVjPMkR1F-v5kCDQ",
  authDomain: "futa-nav.firebaseapp.com",
  projectId: "futa-nav",
  storageBucket: "futa-nav.firebasestorage.app",
  messagingSenderId: "836529973955",
  appId: "1:836529973955:web:84e1161cf8d7902b4dd076",
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)