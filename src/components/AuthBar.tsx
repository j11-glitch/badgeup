import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut, type User } from 'firebase/auth'
import { useState } from 'react'
import { auth } from '../firebase'

export function AuthBar({ user }: { user: User | null | undefined }) {
  const [error, setError] = useState<string | null>(null)

  async function signIn() {
    setError(null)
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
    } catch (e) {
      const code = (e as { code?: string }).code
      if (code === 'auth/popup-blocked') await signInWithRedirect(auth, provider)
      else if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        setError('Sign-in failed. Please try again.')
      }
    }
  }

  if (user === undefined) return <div className="auth-bar" aria-busy="true" />

  return (
    <div className="auth-bar">
      {user ? (
        <>
          <span className="auth-bar__who">
            Signed in as <strong>{user.displayName ?? user.email ?? 'you'}</strong>
          </span>
          <button type="button" className="button button--ghost" onClick={() => signOut(auth)}>
            Sign out
          </button>
        </>
      ) : (
        <>
          <span className="auth-bar__who">Sign in to add items.</span>
          <button type="button" className="button" onClick={signIn}>
            Sign in with Google
          </button>
        </>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
