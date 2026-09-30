import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'

/** `npm run local` sets this: everything runs against local emulators, never the real project. */
export const USING_EMULATORS = import.meta.env.VITE_USE_EMULATORS === '1'

// Public identifiers of the "BadgeUp" web app in Firebase project badgeup-2d0ee.
// They are not secrets: access to data is controlled by firestore.rules.
const firebaseConfig = {
  apiKey: 'AIzaSyC_5YD9Z4KsiGGlR2x2pNH8E6J_1o3QvoQ',
  authDomain: 'badgeup-2d0ee.firebaseapp.com',
  // "demo-" projects only exist in the emulators, so a local run can never reach real data.
  projectId: USING_EMULATORS ? 'demo-badgeup' : 'badgeup-2d0ee',
  storageBucket: 'badgeup-2d0ee.firebasestorage.app',
  messagingSenderId: '929030708904',
  appId: '1:929030708904:web:0c28fcb852b5258dbcac9d',
}

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)

if (USING_EMULATORS) {
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
}
