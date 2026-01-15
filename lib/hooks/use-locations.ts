import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Location } from '@/lib/types'
import { QUERY_KEYS, CACHE_DURATION } from '@/lib/cache/config'
import { toast } from 'sonner'

export function useLocations(options?: { includeInactive?: boolean }) {
  const includeInactive = options?.includeInactive ?? false
  return useQuery<Location[]>({
    queryKey: [...QUERY_KEYS.locations, { includeInactive }],
    queryFn: async () => {
      const queryParams = new URLSearchParams()
      queryParams.set('includeInactive', includeInactive.toString())
      queryParams.set('t', Date.now().toString()) // Anti-cache timestamp

      const response = await fetch(`/api/locations?${queryParams.toString()}`, {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      })
      if (!response.ok) {
        throw new Error('Failed to fetch locations')
      }
      return response.json()
    },
    staleTime: 5000, // 5 second stability window
    gcTime: CACHE_DURATION.LOCATIONS,
    refetchOnWindowFocus: true,
  })
}

export function useCreateLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (location: any) => {
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(location),
      })

      if (!response.ok) {
        const error = await response.json()
        if (error.error === 'Validation failed' && error.details) {
          const fieldErrors = error.details.map((d: any) => `${d.field}: ${d.message}`).join(', ')
          throw new Error(`Validation failed: ${fieldErrors}`)
        }
        throw new Error(error.error || error.message || 'Failed to create location')
      }

      return response.json()
    },
    onMutate: async (newLocation) => {
      // Cancel any outgoing refetches to prevent overwriting our optimistic data
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.locations })

      const previousQueries = queryClient.getQueriesData({ queryKey: QUERY_KEYS.locations })

      const optimisticLocation = {
        id: `temp-${Date.now()}`,
        ...newLocation,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Update ALL location queries (Active branch list and Admin management list)
      queryClient.setQueriesData(
        { queryKey: QUERY_KEYS.locations, exact: false },
        (old: Location[] | undefined) => old ? [...old, optimisticLocation] : [optimisticLocation]
      )

      return { previousQueries }
    },
    onError: (err, _newLocation, context) => {
      console.error('Creation failed:', err)
      toast.error(`Sync Error: ${err.message}`)
      context?.previousQueries?.forEach(([queryKey, previousData]) => {
        queryClient.setQueryData(queryKey, previousData)
      })
    },
    onSuccess: (realLocation) => {
      // PERMANENTLY update the cache with the real server data
      // This ensures the ID is updated from temp-xxx to the real CUID
      queryClient.setQueriesData(
        { queryKey: QUERY_KEYS.locations, exact: false },
        (old: Location[] | undefined) => {
          const filtered = old?.filter(loc => !loc.id.toString().startsWith('temp-')) || []
          // Check if this location should be in this specific query list (active filter)
          return [...filtered, realLocation].sort((a, b) => a.name.localeCompare(b.name))
        }
      )
    },
    onSettled: () => {
      // WAIT 5 seconds before allowing a server re-sync to avoid the "old-data" flicker
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.locations, exact: false })
      }, 5000)
    },
  })
}

export function useUpdateLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updateData }: any) => {
      const response = await fetch(`/api/locations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const error = await response.json()
        if (error.error === 'Validation failed' && error.details) {
          const fieldErrors = error.details.map((d: any) => `${d.field}: ${d.message}`).join(', ')
          throw new Error(`Validation failed: ${fieldErrors}`)
        }
        throw new Error(error.error || error.message || 'Failed to update location')
      }

      return response.json()
    },
    onMutate: async (updatedLocation) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.locations })
      const previousQueries = queryClient.getQueriesData({ queryKey: QUERY_KEYS.locations })

      queryClient.setQueriesData(
        { queryKey: QUERY_KEYS.locations, exact: false },
        (old: Location[] | undefined) =>
          old?.map(loc => loc.id === updatedLocation.id ? { ...loc, ...updatedLocation } : loc)
      )

      return { previousQueries }
    },
    onError: (err, _updatedLocation, context) => {
      console.error('Update failed:', err)
      toast.error(`Sync Error: ${err.message}`)
      context?.previousQueries?.forEach(([queryKey, previousData]) => {
        queryClient.setQueryData(queryKey, previousData)
      })
    },
    onSuccess: (realLocation) => {
      queryClient.setQueriesData(
        { queryKey: QUERY_KEYS.locations, exact: false },
        (old: Location[] | undefined) =>
          old?.map(loc => loc.id === realLocation.id ? realLocation : loc)
      )
    },
    onSettled: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.locations, exact: false })
      }, 5000)
    },
  })
}

export function useDeleteLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/locations/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete location')
      }
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.locations })
      const previousQueries = queryClient.getQueriesData({ queryKey: QUERY_KEYS.locations })

      queryClient.setQueriesData(
        { queryKey: QUERY_KEYS.locations, exact: false },
        (old: Location[] | undefined) => old?.filter(loc => loc.id !== id)
      )

      return { previousQueries }
    },
    onError: (err, _id, context) => {
      console.error('Deletion failed:', err)
      toast.error(`Sync Error: ${err.message}`)
      context?.previousQueries?.forEach(([queryKey, previousData]) => {
        queryClient.setQueryData(queryKey, previousData)
      })
    },
    onSuccess: (_, id) => {
      queryClient.setQueriesData(
        { queryKey: QUERY_KEYS.locations, exact: false },
        (old: Location[] | undefined) => old?.filter(loc => loc.id !== id)
      )
    },
    onSettled: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.locations, exact: false })
      }, 5000)
    },
  })
}
