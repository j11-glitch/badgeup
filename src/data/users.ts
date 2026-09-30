import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase'

/** A person who receives badges. Users do not log in. */
export interface BadgeUser {
  readonly id: string
  readonly name: string
  readonly badgeIds: readonly string[]
}

const users = collection(db, 'users')

/** All users, alphabetically. Readable by anyone. */
export function watchUsers(onUsers: (list: BadgeUser[]) => void, onError: (e: Error) => void): () => void {
  return onSnapshot(
    query(users, orderBy('name')),
    (snapshot) =>
      onUsers(
        snapshot.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            name: String(data.name ?? ''),
            badgeIds: Array.isArray(data.badgeIds) ? data.badgeIds.map(String) : [],
          }
        }),
      ),
    onError,
  )
}

export async function createUser(name: string): Promise<void> {
  await addDoc(users, { name, badgeIds: [], createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
}

export async function renameUser(id: string, name: string): Promise<void> {
  await updateDoc(doc(users, id), { name, updatedAt: serverTimestamp() })
}

export async function deleteUser(id: string): Promise<void> {
  await deleteDoc(doc(users, id))
}

export async function setBadge(userId: string, badgeId: string, awarded: boolean): Promise<void> {
  await updateDoc(doc(users, userId), {
    badgeIds: awarded ? arrayUnion(badgeId) : arrayRemove(badgeId),
    updatedAt: serverTimestamp(),
  })
}
