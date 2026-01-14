'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * A custom hook that provides localStorage persistence with React state.
 * This replaces @github/spark's useKV hook which has React 18 compatibility issues.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Helper to validate and get stored value
  const getStoredValue = (): T => {
    if (typeof window === 'undefined') {
      return initialValue
    }
    try {
      const item = window.localStorage.getItem(key)
      if (item === null) {
        return initialValue
      }
      const parsed = JSON.parse(item)
      // Validate that the parsed value matches the expected type
      // If initialValue is an array, ensure parsed is also an array
      if (Array.isArray(initialValue) && !Array.isArray(parsed)) {
        console.warn(`localStorage key "${key}" has invalid data, resetting to initial value`)
        window.localStorage.removeItem(key)
        return initialValue
      }
      return parsed as T
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      // Clear corrupted data
      try {
        window.localStorage.removeItem(key)
      } catch {}
      return initialValue
    }
  }

  // Initialize state with a function to avoid SSR issues
  const [storedValue, setStoredValue] = useState<T>(getStoredValue)

  // Update localStorage whenever the state changes
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue))
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  // Memoized setter that handles both direct values and updater functions
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const currentValue = prev ?? initialValue
        const newValue = typeof value === 'function' ? (value as (prev: T) => T)(currentValue) : value
        return newValue
      })
    },
    [initialValue]
  )

  return [storedValue ?? initialValue, setValue]
}
