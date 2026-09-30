import { useEffect, useState } from 'react'

type Watch<T> = (onData: (data: T) => void, onError: (e: Error) => void) => () => void

/** Subscribes to a live Firestore query; data is null while loading. */
export function useLive<T>(watch: Watch<T>): { data: T | null; error: string | null } {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(
    () =>
      watch(
        (next) => {
          setData(next)
          setError(null)
        },
        () => setError('Could not load data.'),
      ),
    [watch],
  )
  return { data, error }
}
