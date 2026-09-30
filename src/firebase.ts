import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'

/** `npm run local` sets this: everything runs against local emulators, never the real project. */
export const USING_EMULATORS = import.meta.env.VITE_USE_EMULATORS === '1'

/**
 * The API key and app id come from the build environment: `.env.local` on a developer machine,
 * GitHub repository secrets in the deploy workflows. The emulators accept any value.
 */
function fromEnv(value: string | undefined, name: string): string {
  if (value) return value
  if (USING_EMULATORS) return `demo-${name}`
  throw new Error(`Missing ${name}: set it in .env.local (see .env.example) or as a GitHub secret.`)
}

const firebaseConfig = {
  apiKey: fromEnv(import.meta.env.VITE_FIREBASE_API_KEY, 'VITE_FIREBASE_API_KEY'),
  appId: fromEnv(import.meta.env.VITE_FIREBASE_APP_ID, 'VITE_FIREBASE_APP_ID'),
  authDomain: 'badgeup-2d0ee.firebaseapp.com',
  // "demo-" projects only exist in the emulators, so a local run can never reach real data.
  projectId: USING_EMULATORS ? 'demo-badgeup' : 'badgeup-2d0ee',
  storageBucket: 'badgeup-2d0ee.firebasestorage.app',
  messagingSenderId: '929030708904',
}

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)

if (USING_EMULATORS) {
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
}
