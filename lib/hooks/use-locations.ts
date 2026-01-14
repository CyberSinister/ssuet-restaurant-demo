import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Location } from '@/lib/types'
import { QUERY_KEYS, CACHE_DURATION } from '@/lib/cache/config'

export function useLocations(options?: { includeInactive?: boolean }) {
  const includeInactive = options?.includeInactive ?? false
  return useQuery<Location[]>({
    queryKey: [...QUERY_KEYS.locations, { includeInactive }],
    queryFn: async () => {
      const queryParams = new URLSearchParams()
      if (includeInactive) {
        queryParams.set('includeInactive', 'true')
      }
      
      const response = await fetch(`/api/locations?${queryParams.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch locations')
      }
      return response.json()
    },
    staleTime: 30 * 1000,
    gcTime: CACHE_DURATION.LOCATIONS,
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
        throw new Error(error.message || 'Failed to create location')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.locations })
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
        throw new Error(error.message || 'Failed to update location')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.locations })
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.locations })
    },
  })
}
