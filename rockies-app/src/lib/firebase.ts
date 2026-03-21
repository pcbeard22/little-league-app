import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, signInAnonymously } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyD8L0KG4UKPaJbInm5A4iO4VcH6ov02ejw",
  authDomain: "little-league-app-a9452.firebaseapp.com",
  projectId: "little-league-app-a9452",
  storageBucket: "little-league-app-a9452.firebasestorage.app",
  messagingSenderId: "268991389439",
  appId: "1:268991389439:web:d4acc88a14e30f596d36ca"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)

export const TEAM_ID = 'covington_rockies_aaa'

export async function initAuth() {
  try {
    await signInAnonymously(auth)
  } catch (error) {
    console.error('Auth failed:', error)
  }
}
