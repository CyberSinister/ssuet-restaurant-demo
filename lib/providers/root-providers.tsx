'use client'

import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallback } from '@/src/ErrorFallback'
import { QueryProvider } from './query-provider'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/lib/components/ThemeProvider'

export function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <SessionProvider>
        <QueryProvider>
          <ThemeProvider>
            {children}
            <Toaster />
          </ThemeProvider>
        </QueryProvider>
      </SessionProvider>
    </ErrorBoundary>
  )
}
