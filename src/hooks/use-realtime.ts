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
  callbackRef.current = callback

  // Track the authentication token to ensure we only connect when authenticated
  // and properly resubscribe if the auth state changes.
  const [token, setToken] = useState(pb.authStore.token)

  useEffect(() => {
    // Listen for auth state changes (login, logout, refresh)
    return pb.authStore.onChange((newToken) => {
      setToken(newToken)
    })
  }, [])

  useEffect(() => {
    // Do not attempt to subscribe if explicitly disabled or if not authenticated.
    // This prevents the "current and previous request authorization don't match" error
    // caused by opening a public SSE stream and then trying to authenticate it.
    if (!enabled || !pb.authStore.isValid || !token) return

    let unsubscribeFn: (() => Promise<void>) | undefined
    let cancelled = false

    const subscribe = async () => {
      try {
        const fn = await pb.collection(collectionName).subscribe('*', (e) => {
          callbackRef.current(e)
        })
        if (cancelled) {
          await fn()
        } else {
          unsubscribeFn = fn
        }
      } catch (error) {
        console.error(`Failed to subscribe to real-time events for ${collectionName}:`, error)
      }
    }

    subscribe()

    return () => {
      cancelled = true
      if (unsubscribeFn) {
        unsubscribeFn().catch(() => {})
      }
    }
  }, [collectionName, enabled, token])
}

export default useRealtime
