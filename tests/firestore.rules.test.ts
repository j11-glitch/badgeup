// Security-rule tests. Run with `npm run test:rules` (starts the Firestore emulator).
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { readFileSync } from 'node:fs'
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

let env: RulesTestEnvironment

const SUPER = 'boss@example.com'
const ADMIN = 'admin@example.com'

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-badgeup',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  })
})

afterAll(async () => {
  await env.cleanup()
})

beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    await setDoc(doc(db, `staff/${SUPER}`), { role: 'superuser' })
    await setDoc(doc(db, `staff/${ADMIN}`), { role: 'admin', addedBy: SUPER, addedAt: new Date() })
    await setDoc(doc(db, 'badges/gold'), {
      name: 'Gold',
      description: '',
      emoji: '🥇',
      color: '#ffcc00',
      createdAt: new Date(0),
      updatedAt: new Date(0),
    })
    await setDoc(doc(db, 'users/ada'), { name: 'Ada', badgeIds: [], createdAt: new Date(0), updatedAt: new Date(0) })
  })
})

const visitor = () => env.unauthenticatedContext().firestore()
const signedIn = (email: string, verified = true) =>
  env.authenticatedContext(email, { email, email_verified: verified }).firestore()
const superuser = () => signedIn(SUPER)
const admin = () => signedIn(ADMIN)
const stranger = () => signedIn('stranger@example.com')

const newBadge = (overrides: Record<string, unknown> = {}) => ({
  name: 'Star',
  description: 'Great work',
  emoji: '⭐',
  color: '#5b5bf0',
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  ...overrides,
})
const newUser = (name = 'Bo') => ({ name, badgeIds: [], createdAt: serverTimestamp(), updatedAt: serverTimestamp() })

describe('visitors (no login)', () => {
  it('can read badges and users', async () => {
    await assertSucceeds(getDocs(collection(visitor(), 'badges')))
    await assertSucceeds(getDocs(collection(visitor(), 'users')))
  })

  it('cannot read the staff list or write anything', async () => {
    await assertFails(getDocs(collection(visitor(), 'staff')))
    await assertFails(addDoc(collection(visitor(), 'badges'), newBadge()))
    await assertFails(addDoc(collection(visitor(), 'users'), newUser()))
    await assertFails(deleteDoc(doc(visitor(), 'users/ada')))
  })
})

describe('signed in but not staff', () => {
  it('has no admin powers', async () => {
    await assertFails(getDoc(doc(stranger(), `staff/${ADMIN}`)))
    await assertFails(addDoc(collection(stranger(), 'badges'), newBadge()))
    await assertFails(updateDoc(doc(stranger(), 'users/ada'), { badgeIds: ['gold'], updatedAt: serverTimestamp() }))
    await assertFails(setDoc(doc(stranger(), 'staff/stranger@example.com'), { role: 'admin', addedBy: 'x', addedAt: serverTimestamp() }))
  })

  it('an admin email without verification gets nothing', async () => {
    await assertFails(addDoc(collection(signedIn(ADMIN, false), 'badges'), newBadge()))
  })
})

describe('admins', () => {
  it('create, edit and delete badges', async () => {
    await assertSucceeds(addDoc(collection(admin(), 'badges'), newBadge()))
    await assertSucceeds(
      updateDoc(doc(admin(), 'badges/gold'), { name: 'Gold medal', updatedAt: serverTimestamp() }),
    )
    await assertSucceeds(deleteDoc(doc(admin(), 'badges/gold')))
  })

  it('cannot save invalid badges', async () => {
    await assertFails(addDoc(collection(admin(), 'badges'), newBadge({ name: '' })))
    await assertFails(addDoc(collection(admin(), 'badges'), newBadge({ name: 'x'.repeat(41) })))
    await assertFails(addDoc(collection(admin(), 'badges'), newBadge({ color: 'red' })))
    await assertFails(addDoc(collection(admin(), 'badges'), newBadge({ secret: true })))
    await assertFails(updateDoc(doc(admin(), 'badges/gold'), { createdAt: serverTimestamp(), updatedAt: serverTimestamp() }))
  })

  it('add, rename and delete users, and award badges', async () => {
    await assertSucceeds(addDoc(collection(admin(), 'users'), newUser()))
    await assertSucceeds(updateDoc(doc(admin(), 'users/ada'), { name: 'Ada L.', updatedAt: serverTimestamp() }))
    await assertSucceeds(
      updateDoc(doc(admin(), 'users/ada'), { badgeIds: arrayUnion('gold'), updatedAt: serverTimestamp() }),
    )
    await assertSucceeds(deleteDoc(doc(admin(), 'users/ada')))
  })

  it('cannot create users with badges or bad names', async () => {
    await assertFails(addDoc(collection(admin(), 'users'), { ...newUser(), badgeIds: ['gold'] }))
    await assertFails(addDoc(collection(admin(), 'users'), newUser('')))
    await assertFails(addDoc(collection(admin(), 'users'), newUser('x'.repeat(61))))
  })

  it('can read the staff list but not change it', async () => {
    await assertSucceeds(getDocs(collection(admin(), 'staff')))
    await assertFails(setDoc(doc(admin(), 'staff/new@example.com'), { role: 'admin', addedBy: ADMIN, addedAt: serverTimestamp() }))
    await assertFails(deleteDoc(doc(admin(), `staff/${ADMIN}`)))
  })
})

describe('the superuser', () => {
  it('adds and removes admins', async () => {
    await assertSucceeds(
      setDoc(doc(superuser(), 'staff/new@example.com'), { role: 'admin', addedBy: SUPER, addedAt: serverTimestamp() }),
    )
    await assertSucceeds(deleteDoc(doc(superuser(), `staff/${ADMIN}`)))
  })

  it('cannot create another superuser, fake the author or use upper-case ids', async () => {
    await assertFails(
      setDoc(doc(superuser(), 'staff/x@example.com'), { role: 'superuser', addedBy: SUPER, addedAt: serverTimestamp() }),
    )
    await assertFails(
      setDoc(doc(superuser(), 'staff/x@example.com'), { role: 'admin', addedBy: ADMIN, addedAt: serverTimestamp() }),
    )
    await assertFails(
      setDoc(doc(superuser(), 'staff/X@Example.com'), { role: 'admin', addedBy: SUPER, addedAt: serverTimestamp() }),
    )
  })

  it('cannot remove or change the superuser', async () => {
    await assertFails(deleteDoc(doc(superuser(), `staff/${SUPER}`)))
    await assertFails(updateDoc(doc(superuser(), `staff/${ADMIN}`), { role: 'superuser' }))
  })

  it('can do everything an admin can', async () => {
    await assertSucceeds(addDoc(collection(superuser(), 'badges'), newBadge()))
    await assertSucceeds(addDoc(collection(superuser(), 'users'), newUser()))
  })
})

describe('other data', () => {
  it('stays locked', async () => {
    await assertFails(getDocs(collection(admin(), 'testItems')))
    await assertFails(setDoc(doc(superuser(), 'settings/site'), { open: true }))
  })
})
