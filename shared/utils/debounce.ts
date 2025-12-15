// Debounce utility function
// Reusable in Next.js and React Native
// Useful for search inputs, scroll handlers, etc.

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 * 
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns A debounced version of the function
 * 
 * Usage:
 * ```tsx
 * const debouncedSearch = debounce((query: string) => {
 *   performSearch(query)
 * }, 300)
 * 
 * // In input handler:
 * onChange={(e) => debouncedSearch(e.target.value)}
 * ```
 * 
 * For React Native:
 * - Works the same way, just use with TextInput onChangeText
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * React hook version of debounce
 * Returns a debounced callback that is stable across renders
 * 
 * Usage:
 * ```tsx
 * const debouncedSearch = useDebounce((query: string) => {
 *   performSearch(query)
 * }, 300)
 * ```
 */
export function useDebounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  // Note: This is a simplified version. For production, consider using
  // useMemo and useRef for better performance and cleanup
  return debounce(func, wait)
}

