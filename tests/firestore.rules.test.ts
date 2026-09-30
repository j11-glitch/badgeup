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
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import { dayKey } from '../src/domain/progress'

let env: RulesTestEnvironment

const SUPER = 'boss@example.com'
const ADMIN = 'admin@example.com'
const TODAY = dayKey(new Date())
const LONG_AGO = '2020-01-01'

beforeAll(async () => {
  env = await initializeTestEnvironment({
    // Its own project: clearing test data must never wipe the app's data in `npm run local`.
    projectId: 'demo-badgeup-rules',
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
    await setDoc(doc(db, 'users/ada'), {
      name: 'Ada',
      tasks: [{ id: 't1', title: 'Les bok' }],
      manual: {},
      diamonds: 0,
      createdAt: new Date(0),
      updatedAt: new Date(0),
    })
    // Made by the first version of the app, before tasks and manual badges existed.
    await setDoc(doc(db, 'users/old'), { name: 'Old', badgeIds: ['gold'], createdAt: new Date(0), updatedAt: new Date(0) })
  })
})

const visitor = () => env.unauthenticatedContext().firestore()
const signedIn = (email: string, verified = true) =>
  env.authenticatedContext(email, { email, email_verified: verified }).firestore()
const superuser = () => signedIn(SUPER)
const admin = () => signedIn(ADMIN)
const stranger = () => signedIn('stranger@example.com')

const newUser = (overrides: Record<string, unknown> = {}) => ({
  name: 'Bo',
  tasks: [],
  manual: {},
  diamonds: 0,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  ...overrides,
})
const day = (overrides: Record<string, unknown> = {}) => ({
  required: ['t1', 't2'],
  done: ['t1'],
  updatedAt: serverTimestamp(),
  ...overrides,
})
const edit = (fields: Record<string, unknown>) => ({ ...fields, updatedAt: serverTimestamp() })

describe('visitors (no login)', () => {
  it('can read children and their days', async () => {
    await assertSucceeds(getDocs(collection(visitor(), 'users')))
    await assertSucceeds(getDocs(collection(visitor(), 'users/ada/days')))
  })

  it("can tick off today's tasks", async () => {
    await assertSucceeds(setDoc(doc(visitor(), `users/ada/days/${TODAY}`), day()))
    await assertSucceeds(setDoc(doc(visitor(), `users/ada/days/${TODAY}`), day({ done: ['t1', 't2'] })))
    // What the app sends: one task added or removed at a time.
    const tick = (done: unknown) => setDoc(doc(visitor(), `users/ada/days/${TODAY}`), day({ done }), { merge: true })
    await assertSucceeds(tick(arrayRemove('t2')))
    await assertSucceeds(tick(arrayUnion('t2')))
    await assertFails(tick(arrayUnion('t9')))
  })

  it('cannot fill in old days, bad days, or days of children that do not exist', async () => {
    await assertFails(setDoc(doc(visitor(), `users/ada/days/${LONG_AGO}`), day()))
    await assertFails(setDoc(doc(visitor(), 'users/ada/days/today'), day()))
    await assertFails(setDoc(doc(visitor(), `users/ada/days/${TODAY}`), day({ done: ['t9'] })))
    await assertFails(setDoc(doc(visitor(), `users/ada/days/${TODAY}`), day({ required: [] })))
    await assertFails(setDoc(doc(visitor(), `users/ada/days/${TODAY}`), day({ cheat: true })))
    await assertFails(setDoc(doc(visitor(), `users/nobody/days/${TODAY}`), day()))
  })

  it('cannot change children, delete days or read the staff list', async () => {
    await assertFails(getDocs(collection(visitor(), 'staff')))
    await assertFails(addDoc(collection(visitor(), 'users'), newUser()))
    await assertFails(updateDoc(doc(visitor(), 'users/ada'), edit({ diamonds: 5 })))
    await assertFails(deleteDoc(doc(visitor(), 'users/ada')))
    await assertFails(deleteDoc(doc(visitor(), `users/ada/days/${TODAY}`)))
  })
})

describe('signed in but not staff', () => {
  it('has no admin powers', async () => {
    await assertFails(getDoc(doc(stranger(), `staff/${ADMIN}`)))
    await assertFails(addDoc(collection(stranger(), 'users'), newUser()))
    await assertFails(updateDoc(doc(stranger(), 'users/ada'), edit({ 'manual.helpful': serverTimestamp() })))
    await assertFails(setDoc(doc(stranger(), `users/ada/days/${LONG_AGO}`), day()))
    await assertFails(setDoc(doc(stranger(), 'staff/stranger@example.com'), { role: 'admin', addedBy: 'x', addedAt: serverTimestamp() }))
  })

  it('an admin email without verification gets nothing', async () => {
    await assertFails(addDoc(collection(signedIn(ADMIN, false), 'users'), newUser()))
  })
})

describe('admins', () => {
  it('add and delete children', async () => {
    await assertSucceeds(addDoc(collection(admin(), 'users'), newUser()))
    await assertSucceeds(deleteDoc(doc(admin(), 'users/ada')))
  })

  it('cannot create children with badges, tasks or bad names', async () => {
    await assertFails(addDoc(collection(admin(), 'users'), newUser({ diamonds: 3 })))
    await assertFails(addDoc(collection(admin(), 'users'), newUser({ tasks: [{ id: 'x', title: 'x' }] })))
    await assertFails(addDoc(collection(admin(), 'users'), newUser({ name: '' })))
    await assertFails(addDoc(collection(admin(), 'users'), newUser({ name: 'x'.repeat(61) })))
    await assertFails(addDoc(collection(admin(), 'users'), newUser({ badgeIds: [] })))
  })

  it('edit tasks, give and take manual badges, and change diamonds', async () => {
    const tasks = [
      { id: 't1', title: 'Les bok' },
      { id: 't2', title: 'Matte' },
    ]
    await assertSucceeds(updateDoc(doc(admin(), 'users/ada'), edit({ tasks })))
    await assertSucceeds(updateDoc(doc(admin(), 'users/ada'), edit({ 'manual.helpful': serverTimestamp() })))
    await assertSucceeds(updateDoc(doc(admin(), 'users/ada'), edit({ 'manual.helpful': deleteField() })))
    await assertSucceeds(updateDoc(doc(admin(), 'users/ada'), edit({ 'manual.screenSmart': serverTimestamp() })))
    await assertSucceeds(updateDoc(doc(admin(), 'users/ada'), edit({ diamonds: increment(1) })))
  })

  it('cannot save unknown badges, too many tasks or negative diamonds', async () => {
    await assertFails(updateDoc(doc(admin(), 'users/ada'), edit({ 'manual.superStar': serverTimestamp() })))
    const tooMany = Array.from({ length: 13 }, (_, i) => ({ id: `t${i}`, title: 'x' }))
    await assertFails(updateDoc(doc(admin(), 'users/ada'), edit({ tasks: tooMany })))
    await assertFails(updateDoc(doc(admin(), 'users/ada'), edit({ diamonds: -1 })))
    await assertFails(updateDoc(doc(admin(), 'users/ada'), edit({ diamonds: 1.5 })))
    await assertFails(updateDoc(doc(admin(), 'users/ada'), { diamonds: 1 }))
    await assertFails(updateDoc(doc(admin(), 'users/ada'), edit({ createdAt: serverTimestamp() })))
  })

  it('can update children made by the first version', async () => {
    await assertSucceeds(updateDoc(doc(admin(), 'users/old'), edit({ tasks: [{ id: 't1', title: 'Matte' }] })))
    await assertSucceeds(updateDoc(doc(admin(), 'users/old'), edit({ 'manual.creator': serverTimestamp() })))
  })

  it('can fix and delete any day', async () => {
    await assertSucceeds(setDoc(doc(admin(), `users/ada/days/${LONG_AGO}`), day({ done: ['t1', 't2'] })))
    await assertSucceeds(deleteDoc(doc(admin(), `users/ada/days/${LONG_AGO}`)))
    await assertFails(setDoc(doc(admin(), `users/ada/days/${LONG_AGO}`), day({ done: ['t9'] })))
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
    await assertSucceeds(addDoc(collection(superuser(), 'users'), newUser()))
    await assertSucceeds(updateDoc(doc(superuser(), 'users/ada'), edit({ diamonds: increment(1) })))
  })
})

describe('other data', () => {
  it('stays locked, including the old badges collection', async () => {
    await assertFails(getDocs(collection(visitor(), 'badges')))
    await assertFails(addDoc(collection(admin(), 'badges'), { name: 'Star' }))
    await assertFails(getDocs(collection(admin(), 'testItems')))
    await assertFails(setDoc(doc(superuser(), 'settings/site'), { open: true }))
  })
})
