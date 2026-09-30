import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  FieldPath,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { MANUAL_BADGE_IDS, type ManualBadgeId } from '../domain/catalog'
import type { ManualAwards } from '../domain/progress'
import { db } from '../firebase'

export interface Task {
  readonly id: string
  readonly title: string
}

/** A child who earns badges. Children do not log in. */
export interface Child {
  readonly id: string
  readonly name: string
  /** The daily tasks, in order. */
  readonly tasks: readonly Task[]
  /** Manual badges the child has now, with the time each was given. */
  readonly manual: ManualAwards
  /** Founder diamonds. */
  readonly diamonds: number
}

const users = collection(db, 'users')

function parseTasks(value: unknown): Task[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((t): t is { id: unknown; title: unknown } => typeof t === 'object' && t !== null)
    .map((t) => ({ id: String(t.id), title: String(t.title) }))
}

function parseManual(value: unknown): ManualAwards {
  const awards: ManualAwards = {}
  if (typeof value !== 'object' || value === null) return awards
  for (const id of MANUAL_BADGE_IDS) {
    const given = (value as Record<string, unknown>)[id]
    if (given instanceof Timestamp) awards[id] = given.toDate()
  }
  return awards
}

/** All children, alphabetically. Readable by anyone. */
export function watchUsers(onUsers: (list: Child[]) => void, onError: (e: Error) => void): () => void {
  return onSnapshot(
    query(users, orderBy('name')),
    (snapshot) =>
      onUsers(
        snapshot.docs.map((d) => {
          // A badge given a moment ago has no server time yet; use the local estimate.
          const data = d.data({ serverTimestamps: 'estimate' })
          return {
            id: d.id,
            name: String(data.name ?? ''),
            tasks: parseTasks(data.tasks),
            manual: parseManual(data.manual),
            diamonds: typeof data.diamonds === 'number' ? data.diamonds : 0,
          }
        }),
      ),
    onError,
  )
}

export async function createUser(name: string): Promise<void> {
  await addDoc(users, {
    name,
    tasks: [],
    manual: {},
    diamonds: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

/** Deletes a child together with their task history. */
export async function deleteUser(id: string): Promise<void> {
  const days = await getDocs(collection(db, 'users', id, 'days'))
  // A batch holds at most 500 writes.
  for (let i = 0; i < days.docs.length; i += 500) {
    const batch = writeBatch(db)
    for (const day of days.docs.slice(i, i + 500)) batch.delete(day.ref)
    await batch.commit()
  }
  await deleteDoc(doc(users, id))
}

export async function setTasks(userId: string, tasks: readonly Task[]): Promise<void> {
  await updateDoc(doc(users, userId), { tasks, updatedAt: serverTimestamp() })
}

/** Gives a manual badge (from now) or takes it away. */
export async function setManualBadge(userId: string, badge: ManualBadgeId, given: boolean): Promise<void> {
  await updateDoc(
    doc(users, userId),
    new FieldPath('manual', badge),
    given ? serverTimestamp() : deleteField(),
    'updatedAt',
    serverTimestamp(),
  )
}

export async function changeDiamonds(userId: string, by: 1 | -1): Promise<void> {
  await updateDoc(doc(users, userId), { diamonds: increment(by), updatedAt: serverTimestamp() })
}

/** Sets the number of diamonds (a whole number from 0 to LIMITS.diamonds). */
export async function setDiamonds(userId: string, count: number): Promise<void> {
  await updateDoc(doc(users, userId), { diamonds: count, updatedAt: serverTimestamp() })
}
