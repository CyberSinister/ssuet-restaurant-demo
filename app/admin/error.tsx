'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { WarningCircle, ArrowClockwise, ArrowLeft, SignOut } from '@phosphor-icons/react'
import { signOut } from 'next-auth/react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AdminError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Admin dashboard error:', error)
  }, [error])

  const handleLogout = async () => {
    await signOut({ redirect: false })
    window.location.href = '/admin/login'
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <WarningCircle className="w-16 h-16 text-destructive" />
          </div>
          <CardTitle>Admin Dashboard Error</CardTitle>
          <CardDescription>
            We encountered an unexpected error in the admin dashboard. Please try one of the
            options below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-muted p-4 rounded-md">
              <p className="text-sm font-mono text-muted-foreground break-words">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs font-mono text-muted-foreground mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Button onClick={reset} className="w-full">
              <ArrowClockwise className="mr-2" />
              Try Again
            </Button>
            <Button variant="outline" onClick={() => (window.location.href = '/')} className="w-full">
              <ArrowLeft className="mr-2" />
              Back to Customer Portal
            </Button>
            <Button variant="outline" onClick={handleLogout} className="w-full">
              <SignOut className="mr-2" />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
