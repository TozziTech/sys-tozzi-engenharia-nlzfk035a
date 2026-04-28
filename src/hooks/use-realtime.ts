import { useEffect, useRef } from 'react'
import pb from '@/lib/pocketbase/client'
import type { RecordSubscription } from 'pocketbase'
import { useAuth } from '@/hooks/use-auth'

/**
 * Hook for real-time subscriptions to a PocketBase collection.
 * ALWAYS use this hook instead of subscribing inline.
 * Uses the per-listener UnsubscribeFunc so multiple components
 * can safely subscribe to the same collection without conflicts.
 */
export function useRealtime(
  collectionName: string,
  callback: (data: RecordSubscription<any>) => void,
  enabled: boolean = true,
) {
  let loading = false
  let userId: string | undefined = undefined

  try {
    const auth = useAuth()
    loading = auth.loading
    userId = auth.user?.id
  } catch (e) {
    // Fallback if used outside AuthProvider
  }

  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!enabled || loading) return

    let unsubscribeFn: (() => Promise<void>) | undefined
    let cancelled = false

    pb.collection(collectionName)
      .subscribe('*', (e) => {
        callbackRef.current(e)
      })
      .then((fn) => {
        if (cancelled) {
          fn().catch(() => {})
        } else {
          unsubscribeFn = fn
        }
      })
      .catch((err) => {
        console.error(`Realtime subscription error for ${collectionName}:`, err)
      })

    return () => {
      cancelled = true
      if (unsubscribeFn) {
        unsubscribeFn().catch(() => {})
      }
    }
  }, [collectionName, enabled, loading, userId])
}

export default useRealtime
