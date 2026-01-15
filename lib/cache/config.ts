/**
 * Caching configuration for TanStack Query and Next.js ISR
 */

// Query keys for TanStack Query
export const QUERY_KEYS = {
  menu: ['menu'] as const,
  menuItem: (id: string) => ['menu', id] as const,
  categories: ['categories'] as const,
  category: (id: string) => ['categories', id] as const,
  orders: (params?: Record<string, unknown>) => ['orders', params] as const,
  order: (id: string) => ['orders', id] as const,
  settings: ['settings'] as const,
  smtp: ['smtp'] as const,
  locations: ['locations'] as const,
  stats: (params?: Record<string, unknown>) => ['stats', params] as const,
}

// Cache durations in milliseconds
export const CACHE_DURATION = {
  // Menu items change infrequently - cache for 5 minutes
  MENU: 5 * 60 * 1000, // 5 minutes

  // Categories change even less frequently - cache for 10 minutes
  CATEGORIES: 10 * 60 * 1000, // 10 minutes

  // Orders should be relatively fresh - cache for 1 minute
  ORDERS: 60 * 1000, // 1 minute

  // Settings rarely change - cache for 15 minutes
  SETTINGS: 15 * 60 * 1000, // 15 minutes

  // Locations - cache for 5 minutes
  LOCATIONS: 5 * 60 * 1000,

  // Stats can be cached for longer - 5 minutes
  STATS: 5 * 60 * 1000, // 5 minutes
} as const

// Stale time - how long until data is considered stale
export const STALE_TIME = {
  MENU: 0, // Immediately stale to ensure fresh data
  CATEGORIES: 0, // Immediately stale
  ORDERS: 30 * 1000, // 30 seconds
  SETTINGS: 0, // Immediately stale
  STATS: 2 * 60 * 1000, // 2 minutes
} as const

// Next.js revalidation times (ISR)
export const REVALIDATE = {
  MENU: 60, // 1 minute
  CATEGORIES: 300, // 5 minutes
  SETTINGS: 600, // 10 minutes
  STATIC: 3600, // 1 hour for static pages
} as const

// TanStack Query default options
export const DEFAULT_QUERY_OPTIONS = {
  staleTime: 0,
  gcTime: CACHE_DURATION.MENU, // previously cacheTime
  refetchOnWindowFocus: true,
  refetchOnMount: true, // Changed to true to ensure data is fetched on mount
  retry: 1,
}

// Query client configuration
export const QUERY_CLIENT_CONFIG = {
  defaultOptions: {
    queries: DEFAULT_QUERY_OPTIONS,
    mutations: {
      retry: 1,
    },
  },
}
