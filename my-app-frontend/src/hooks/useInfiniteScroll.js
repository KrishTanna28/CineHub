import { useEffect, useRef, useCallback } from 'react'

/**
 * Custom hook for infinite scroll functionality
 * @param {Function} callback - Function to call when reaching the end
 * @param {boolean} hasMore - Whether there's more content to load
 * @param {boolean} isLoading - Whether content is currently loading
 * @param {number} threshold - Distance from end to trigger load (default: 200px)
 */
export default function useInfiniteScroll(callback, hasMore, isLoading, threshold = 200) {
  const observerRef = useRef(null)
  const loadMoreRef = useRef(null)

  const handleObserver = useCallback(
    (entries) => {
      const [target] = entries
      if (target.isIntersecting && hasMore && !isLoading) {
        callback()
      }
    },
    [callback, hasMore, isLoading]
  )

  useEffect(() => {
    const element = loadMoreRef.current
    if (!element) return

    const option = {
      root: null,
      rootMargin: `${threshold}px`,
      threshold: 0,
    }

    observerRef.current = new IntersectionObserver(handleObserver, option)
    observerRef.current.observe(element)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [handleObserver, threshold])

  return loadMoreRef
}
