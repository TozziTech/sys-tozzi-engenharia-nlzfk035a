import { useEffect, useRef } from 'react'
import pb from '@/lib/pocketbase/client'
import type { RecordSubscription } from 'pocketbase'

/**
 * Hook for real-time subscriptions to a PocketBase collection.
 * ALWAYS use this hook instead of subscribing inline.
 * Uses the per-listener UnsubscribeFunc so multiple components
 * can safely subscribe to the same collection without conflicts.
 * Includes an exponential backoff strategy for connection errors
 * (like HTTP2 protocol errors) to prevent UI flickering or crashing.
 */
export function useRealtime(
  collectionName: string,
  callback: (data: RecordSubscription<any>) => void,
  enabled: boolean = true,
) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!enabled) return

    let unsubscribeFn: (() => Promise<void>) | undefined
    let cancelled = false
    let retryTimeoutId: ReturnType<typeof setTimeout> | undefined

    const connect = async (retryCount = 0) => {
      if (cancelled) return

      try {
        const fn = await pb.collection(collectionName).subscribe('*', (e) => {
          if (!cancelled) {
            callbackRef.current(e)
          }
        })

        if (cancelled) {
          fn().catch(() => {})
        } else {
          unsubscribeFn = fn
        }
      } catch (err) {
        if (cancelled) return

        // Exponential backoff strategy for reconnections: 2s, 4s, 8s, up to 30s
        const backoffDelay = Math.min(1000 * Math.pow(2, retryCount + 1), 30000)

        retryTimeoutId = setTimeout(() => {
          connect(retryCount + 1)
        }, backoffDelay)
      }
    }

    connect()

    return () => {
      cancelled = true
      if (retryTimeoutId) {
        clearTimeout(retryTimeoutId)
      }
      if (unsubscribeFn) {
        unsubscribeFn().catch(() => {})
      }
    }
  }, [collectionName, enabled])
}

export default useRealtime
