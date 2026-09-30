import {
  addDoc,
  arrayRemove,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import type { BadgeInput } from '../domain/validation'
import { db } from '../firebase'

export interface Badge extends BadgeInput {
  readonly id: string
}

const badges = collection(db, 'badges')

/** All badges, alphabetically. Readable by anyone. */
export function watchBadges(onBadges: (list: Badge[]) => void, onError: (e: Error) => void): () => void {
  return onSnapshot(
    query(badges, orderBy('name')),
    (snapshot) =>
      onBadges(
        snapshot.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            name: String(data.name ?? ''),
            description: String(data.description ?? ''),
            emoji: String(data.emoji ?? ''),
            color: String(data.color ?? '#5b5bf0'),
          }
        }),
      ),
    onError,
  )
}

export async function createBadge(badge: BadgeInput): Promise<void> {
  await addDoc(badges, { ...badge, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
}

export async function updateBadge(id: string, badge: BadgeInput): Promise<void> {
  await updateDoc(doc(badges, id), { ...badge, updatedAt: serverTimestamp() })
}

/** Deletes a badge and removes it from every user who had it, in one atomic batch. */
export async function deleteBadge(id: string, holderIds: readonly string[]): Promise<void> {
  const batch = writeBatch(db)
  for (const userId of holderIds) {
    batch.update(doc(db, 'users', userId), { badgeIds: arrayRemove(id), updatedAt: serverTimestamp() })
  }
  batch.delete(doc(badges, id))
  await batch.commit()
}
