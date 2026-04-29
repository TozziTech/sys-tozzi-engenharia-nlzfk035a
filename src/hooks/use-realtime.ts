import { useEffect, useRef, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import type { RecordSubscription } from 'pocketbase'

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
  const callbackRef = useRef(callback)

  // Ensure the latest callback is always used without re-triggering subscriptions
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // Track the authentication token to properly handle connection drops and re-authentication
  const [token, setToken] = useState(pb.authStore.token)

  useEffect(() => {
    return pb.authStore.onChange((newToken) => {
      setToken(newToken)
    })
  }, [])

  useEffect(() => {
    // Only proceed if subscriptions are enabled and there is a valid auth context
    if (!enabled || !pb.authStore.isValid) return

    let unsubscribeFn: (() => Promise<void>) | undefined
    let cancelled = false

    const subscribe = async () => {
      try {
        const fn = await pb.collection(collectionName).subscribe('*', (e) => {
          if (callbackRef.current) {
            callbackRef.current(e)
          }
        })
        if (cancelled) {
          fn().catch(() => {})
        } else {
          unsubscribeFn = fn
        }
      } catch (err) {
        console.warn(`Failed to subscribe to realtime for ${collectionName}:`, err)
      }
    }

    subscribe()

    return () => {
      cancelled = true
      if (unsubscribeFn) {
        unsubscribeFn().catch(() => {})
      }
    }
  }, [collectionName, enabled, token]) // Restart subscription if the auth token changes
}

export default useRealtime
