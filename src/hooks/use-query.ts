import { useState, useEffect, useCallback, useRef } from 'react'

interface CacheEntry {
  data: any
  timestamp: number
  promise?: Promise<any>
}

const queryCache = new Map<string, CacheEntry>()
const queryListeners = new Map<string, Set<(data: any) => void>>()

export function queryClient() {
  return {
    getQueryData: (key: string) => queryCache.get(key)?.data,
    setQueryData: (key: string, data: any) => {
      queryCache.set(key, { data, timestamp: Date.now() })
      queryListeners.get(key)?.forEach((fn) => fn(data))
    },
    invalidateQueries: (keyOrPattern: string | RegExp) => {
      const keys = Array.from(queryCache.keys())
      keys.forEach((k) => {
        if (
          typeof keyOrPattern === 'string'
            ? k === keyOrPattern || k.startsWith(keyOrPattern)
            : keyOrPattern.test(k)
        ) {
          const entry = queryCache.get(k)
          if (entry) {
            entry.timestamp = 0 // Expire the cache
            queryListeners.get(k)?.forEach((fn) => fn(entry.data)) // Trigger a refetch indirectly if listeners check stale
          }
        }
      })
    },
  }
}

export function useQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options = { staleTime: 10000, enabled: true },
) {
  const [data, setData] = useState<T | undefined>(() => queryCache.get(key)?.data)
  const [isLoading, setIsLoading] = useState(!queryCache.has(key) && options.enabled)
  const [error, setError] = useState<any>(null)
  const fetcherRef = useRef(fetcher)

  useEffect(() => {
    fetcherRef.current = fetcher
  }, [fetcher])

  const executeFetch = useCallback(
    async (force = false) => {
      const currentEntry = queryCache.get(key)

      if (currentEntry?.promise && !force) {
        setIsLoading(true)
        try {
          const res = await currentEntry.promise
          setData(res)
        } catch (err) {
          setError(err)
        } finally {
          setIsLoading(false)
        }
        return
      }

      setIsLoading(true)
      const promise = fetcherRef.current()
      queryCache.set(key, {
        data: currentEntry?.data,
        timestamp: currentEntry?.timestamp || 0,
        promise,
      })

      try {
        const res = await promise
        queryCache.set(key, { data: res, timestamp: Date.now() })
        queryListeners.get(key)?.forEach((fn) => fn(res))
      } catch (err) {
        setError(err)
      } finally {
        setIsLoading(false)
        const entry = queryCache.get(key)
        if (entry && entry.promise === promise) {
          entry.promise = undefined
          queryCache.set(key, entry)
        }
      }
    },
    [key],
  )

  useEffect(() => {
    if (!options.enabled) return

    let mounted = true
    const checkAndFetch = () => {
      const entry = queryCache.get(key)
      const isStale = !entry || Date.now() - entry.timestamp > options.staleTime

      if (isStale) {
        executeFetch()
      }
    }

    checkAndFetch()

    const handler = (newData: any) => {
      if (mounted) {
        setData(newData)
        // If the cache was invalidated (timestamp 0), we should refetch
        const entry = queryCache.get(key)
        if (entry && entry.timestamp === 0) {
          executeFetch(true)
        }
      }
    }

    if (!queryListeners.has(key)) queryListeners.set(key, new Set())
    queryListeners.get(key)?.add(handler)

    return () => {
      mounted = false
      queryListeners.get(key)?.delete(handler)
    }
  }, [key, options.enabled, options.staleTime, executeFetch])

  return { data, isLoading, error, refetch: () => executeFetch(true) }
}

export function useMutation<TVariables, TData>(
  mutationFn: (vars: TVariables) => Promise<TData>,
  options?: {
    onMutate?: (vars: TVariables) => any | Promise<any>
    onSuccess?: (data: TData, vars: TVariables, context: any) => void
    onError?: (error: any, vars: TVariables, context: any) => void
    onSettled?: (data: TData | undefined, error: any, vars: TVariables, context: any) => void
  },
) {
  const [isLoading, setIsLoading] = useState(false)

  const mutate = async (vars: TVariables) => {
    setIsLoading(true)
    let context: any
    try {
      if (options?.onMutate) {
        context = await options.onMutate(vars)
      }
      const data = await mutationFn(vars)
      if (options?.onSuccess) {
        options.onSuccess(data, vars, context)
      }
      if (options?.onSettled) {
        options.onSettled(data, null, vars, context)
      }
    } catch (error) {
      if (options?.onError) {
        options.onError(error, vars, context)
      }
      if (options?.onSettled) {
        options.onSettled(undefined, error, vars, context)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return { mutate, isLoading }
}
