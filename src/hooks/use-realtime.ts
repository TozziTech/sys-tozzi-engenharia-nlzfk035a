import { useEffect, useRef } from 'react'
import pb from '@/lib/pocketbase/client'
import type { RecordSubscription } from 'pocketbase'

type Listener = (data: RecordSubscription<any>) => void

// Global registry to manage a single PocketBase subscription per collection
const listeners: Record<string, Set<Listener>> = {}
const unsubscribeTimers: Record<string, ReturnType<typeof setTimeout>> = {}
const subscriptions: Record<string, Promise<() => Promise<void>> | null> = {}

/**
 * Hook for real-time subscriptions to a PocketBase collection.
 * ALWAYS use this hook instead of subscribing inline.
 *
 * Optimization: Uses a global registry to ensure only ONE PocketBase subscription
 * is active per collection, regardless of how many components use this hook.
 * It also debounces unsubscriptions to prevent 429 Too Many Requests errors
 * when navigating between tabs or during rapid remounts.
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

    const listener = (data: RecordSubscription<any>) => {
      callbackRef.current(data)
    }

    if (!listeners[collectionName]) {
      listeners[collectionName] = new Set()
    }

    listeners[collectionName].add(listener)

    // Clear any pending unsubscription since we have a new listener
    if (unsubscribeTimers[collectionName]) {
      clearTimeout(unsubscribeTimers[collectionName])
      delete unsubscribeTimers[collectionName]
    }

    // Subscribe to PocketBase if not already subscribed
    if (!subscriptions[collectionName]) {
      subscriptions[collectionName] = pb.collection(collectionName).subscribe('*', (e) => {
        if (listeners[collectionName]) {
          listeners[collectionName].forEach((cb) => cb(e))
        }
      })
    }

    return () => {
      if (listeners[collectionName]) {
        listeners[collectionName].delete(listener)

        // If no more listeners, schedule an unsubscription to cleanup
        if (listeners[collectionName].size === 0) {
          unsubscribeTimers[collectionName] = setTimeout(() => {
            const subPromise = subscriptions[collectionName]
            subscriptions[collectionName] = null
            delete listeners[collectionName]

            if (subPromise) {
              subPromise
                .then((unsubscribeFn) => {
                  unsubscribeFn().catch(() => {})
                })
                .catch(() => {})
            }
          }, 3000) // 3 second debounce prevents rapid sub/unsub cycles
        }
      }
    }
  }, [collectionName, enabled])
}
