import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Category } from '@/lib/types'

export function useCategories(options?: { includeInactive?: boolean }) {
  const includeInactive = options?.includeInactive ?? false
  return useQuery<Category[]>({
    queryKey: ['categories', { includeInactive }],
    queryFn: async () => {
      const queryParams = new URLSearchParams()
      if (includeInactive) {
        queryParams.set('includeInactive', 'true')
      }
      queryParams.set('t', Date.now().toString()) // Anti-cache param

      const response = await fetch(`/api/categories?${queryParams.toString()}`, {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      })
      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }
      return response.json()
    },
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (category: Omit<Category, 'id'>) => {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category),
      })

      if (!response.ok) {
        throw new Error('Failed to create category')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (category: Category) => {
      // Extract id and send only the update fields (schema uses .strict())
      const { id, ...updateData } = category
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        throw new Error('Failed to update category')
      }

      return response.json()
    },
    onMutate: async (newCategory) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['categories'] })

      // Snapshot the previous value
      const previousCategories = queryClient.getQueriesData<Category[]>({ queryKey: ['categories'] })

      // Optimistically update to the new value
      queryClient.setQueriesData({ queryKey: ['categories'] }, (old: Category[] | undefined) => {
        if (!old) return undefined
        return old.map((cat) => (cat.id === newCategory.id ? { ...cat, ...newCategory } : cat))
      })

      // Return a context object with the snapshotted value
      return { previousCategories }
    },
    onError: (_err, _newCategory, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousCategories) {
        context.previousCategories.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete category')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useReorderCategories() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (categories: Array<{ id: string; displayOrder: number }>) => {
      const response = await fetch('/api/categories/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories }),
      })

      if (!response.ok) {
        throw new Error('Failed to reorder categories')
      }

      return response.json()
    },
    onMutate: async (newOrder) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['categories'] })

      // Snapshot the previous value
      const previousCategories = queryClient.getQueryData<Category[]>(['categories'])

      // Optimistically update to the new value
      if (previousCategories) {
        const updatedCategories = previousCategories.map((cat) => {
          const newOrderItem = newOrder.find((item) => item.id === cat.id)
          return newOrderItem ? { ...cat, displayOrder: newOrderItem.displayOrder } : cat
        })
        queryClient.setQueryData(['categories'], updatedCategories)
      }

      // Return a context object with the snapshotted value
      return { previousCategories }
    },
    onError: (_err, _newOrder, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousCategories) {
        queryClient.setQueryData(['categories'], context.previousCategories)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}
