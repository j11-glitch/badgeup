import { collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

export type StaffRole = 'superuser' | 'admin'

/** Someone who can log in to the admin side. The document id is their email (lower case). */
export interface StaffMember {
  readonly email: string
  readonly role: StaffRole
}

const staff = collection(db, 'staff')

/**
 * Role of the signed-in email, or null if the email is not staff. Only staff can read the
 * staff list, so for anyone else the read is refused, which also means "no access".
 */
export function watchRole(email: string, onRole: (role: StaffRole | null) => void): () => void {
  return onSnapshot(
    doc(staff, email),
    (snapshot) => {
      const role = snapshot.data()?.role
      onRole(role === 'superuser' || role === 'admin' ? role : null)
    },
    () => onRole(null),
  )
}

export function watchStaff(onStaff: (list: StaffMember[]) => void, onError: (e: Error) => void): () => void {
  return onSnapshot(
    query(staff, orderBy('role', 'desc')),
    (snapshot) =>
      onStaff(
        snapshot.docs
          .map((d) => ({ email: d.id, role: d.data().role === 'superuser' ? 'superuser' : 'admin' }) as StaffMember)
          .sort((a, b) => (a.role === b.role ? a.email.localeCompare(b.email) : a.role === 'superuser' ? -1 : 1)),
      ),
    onError,
  )
}

/** Superuser only (enforced by the rules). New staff are always plain admins. */
export async function addAdmin(email: string, addedBy: string): Promise<void> {
  await setDoc(doc(staff, email), { role: 'admin', addedBy, addedAt: serverTimestamp() })
}

export async function removeAdmin(email: string): Promise<void> {
  await deleteDoc(doc(staff, email))
}
