import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MenuItem } from '@/lib/types'
import { QUERY_KEYS, STALE_TIME, CACHE_DURATION } from '@/lib/cache/config'

export function useMenu(options?: { includeInactive?: boolean }) {
  const includeInactive = options?.includeInactive ?? false
  return useQuery<MenuItem[]>({
    queryKey: [...QUERY_KEYS.menu, { includeInactive }],
    queryFn: async () => {
      const queryParams = new URLSearchParams()
      if (includeInactive) {
        queryParams.set('includeInactive', 'true')
      }
      queryParams.set('t', Date.now().toString()) // Anti-cache param
      
      const response = await fetch(`/api/menu?${queryParams.toString()}`, {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      })
      if (!response.ok) {
        throw new Error('Failed to fetch menu')
      }
      return response.json()
    },
    staleTime: STALE_TIME.MENU,
    gcTime: CACHE_DURATION.MENU,
  })
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (menuItem: Omit<MenuItem, 'id'>) => {
      const response = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menuItem),
      })

      if (!response.ok) {
        throw new Error('Failed to create menu item')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.menu })
    },
  })
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (menuItem: MenuItem) => {
      // Extract id and send only the update fields (schema uses .strict())
      const { id, ...updateData } = menuItem
      const response = await fetch(`/api/menu/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        throw new Error('Failed to update menu item')
      }

      return response.json()
    },
    onMutate: async (newMenuItem) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.menu })

      // Snapshot the previous value
      const previousMenu = queryClient.getQueriesData<MenuItem[]>({ queryKey: QUERY_KEYS.menu })

      // Optimistically update to the new value
      queryClient.setQueriesData({ queryKey: QUERY_KEYS.menu }, (old: MenuItem[] | undefined) => {
        if (!old) return undefined
        return old.map((item) => (item.id === newMenuItem.id ? { ...item, ...newMenuItem } : item))
      })

      // Return a context object with the snapshotted value
      return { previousMenu }
    },
    onError: (_err, _newMenuItem, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousMenu) {
        context.previousMenu.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      // Invalidate both general and specific admin keys to be safe
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.menu })
    },
  })
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/menu/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete menu item')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.menu })
    },
  })
}
