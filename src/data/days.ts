import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  documentId,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { dayKey, type DayKey, type DayRecord } from '../domain/progress'
import { db } from '../firebase'

// Enough history for the longest level (Legend, 365 days in a row).
const HISTORY_DAYS = 400

const strings = (value: unknown): string[] => (Array.isArray(value) ? value.map(String) : [])

/** The child's days from the last HISTORY_DAYS days, keyed by date. Readable by anyone. */
export function watchDays(
  userId: string,
  today: DayKey,
  onDays: (days: Map<DayKey, DayRecord>) => void,
  onError: (e: Error) => void,
): () => void {
  const [y, m, d] = today.split('-').map(Number)
  // Day ids sort as text in date order, so a range on the id selects the recent days.
  const oldest = dayKey(new Date(y, m - 1, d - HISTORY_DAYS))
  return onSnapshot(
    query(collection(db, 'users', userId, 'days'), where(documentId(), '>=', oldest)),
    (snapshot) =>
      onDays(
        new Map(
          snapshot.docs.map((d) => {
            const data = d.data()
            return [d.id, { required: strings(data.required), done: strings(data.done) }]
          }),
        ),
      ),
    onError,
  )
}

/**
 * Ticks a task on or off for `day`. Anyone may do this for today (children tick off their own
 * tasks without logging in); the rules allow only a day or so around the date.
 *
 * `required` is the child's current task list. The change is sent as an add/remove on the list,
 * so quick taps in a row cannot overwrite each other.
 */
export async function setTaskDone(
  userId: string,
  day: DayKey,
  required: readonly string[],
  current: DayRecord | undefined,
  taskId: string,
  done: boolean,
): Promise<void> {
  const ref = doc(db, 'users', userId, 'days', day)
  const stale = current?.done.some((id) => !required.includes(id)) ?? false
  if (stale) {
    // A task was removed since it was ticked; rewrite the list without it.
    const kept = current!.done.filter((id) => required.includes(id) && id !== taskId)
    await setDoc(ref, { required, done: done ? [...kept, taskId] : kept, updatedAt: serverTimestamp() })
    return
  }
  await setDoc(
    ref,
    { required, done: done ? arrayUnion(taskId) : arrayRemove(taskId), updatedAt: serverTimestamp() },
    { merge: true },
  )
}
