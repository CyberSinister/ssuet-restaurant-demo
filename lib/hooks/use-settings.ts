import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RestaurantSettings, SMTPConfig } from '@/lib/types'
import { STALE_TIME, CACHE_DURATION } from '@/lib/cache/config'

export function useSettings() {
  return useQuery<RestaurantSettings>({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await fetch('/api/settings')
      if (!response.ok) {
        throw new Error('Failed to fetch settings')
      }
      return response.json()
    },
    staleTime: STALE_TIME.SETTINGS,
    gcTime: CACHE_DURATION.SETTINGS,
    refetchOnMount: true, // Override default to ensure data is fetched on mount
    refetchOnWindowFocus: false,
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (settings: Partial<RestaurantSettings>) => {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error('Failed to update settings')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

export function useSMTPConfig() {
  return useQuery<SMTPConfig>({
    queryKey: ['smtp-config'],
    queryFn: async () => {
      const response = await fetch('/api/settings/smtp')
      if (!response.ok) {
        throw new Error('Failed to fetch SMTP config')
      }
      return response.json()
    },
  })
}

export function useUpdateSMTPConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (smtpConfig: Partial<SMTPConfig>) => {
      const response = await fetch('/api/settings/smtp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smtpConfig),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update SMTP settings')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smtp-config'] })
    },
  })
}

export function useTestSMTPEmail() {
  return useMutation({
    mutationFn: async (to: string) => {
      const response = await fetch('/api/settings/smtp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send test email')
      }

      return response.json()
    },
  })
}
