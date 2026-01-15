'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Spinner } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      return
    }

    const verifyToken = async () => {
      try {
        const res = await fetch(`/api/auth/verify?token=${token}`)
        if (res.ok) {
          setStatus('success')
        } else {
          setStatus('error')
        }
      } catch (err) {
        setStatus('error')
      }
    }

    verifyToken()
  }, [token])

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4 text-white font-sans">
      <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-[2.5rem] p-12 text-center shadow-2xl backdrop-blur-xl">
        {status === 'loading' && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <Spinner className="animate-spin text-primary" size={64} weight="bold" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">Verifying Your Profile</h2>
            <p className="text-white/40 font-medium">Please wait while we secure your Broadway account...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-8 animate-in zoom-in duration-500">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20">
                <CheckCircle className="text-white" size={40} weight="fill" />
              </div>
            </div>
            <div>
                <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">Profile Verified!</h2>
                <p className="text-white/60 font-medium">Your Broadway profile is now activated. You can start placing orders and earning rewards.</p>
            </div>
            <Button 
                onClick={() => router.push('/')}
                className="w-full h-14 bg-primary text-black font-black uppercase rounded-2xl text-lg shadow-xl shadow-primary/20"
            >
                Start Ordering
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-8 animate-in zoom-in duration-500">
            <div className="flex justify-center">
                <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/20">
                    <XCircle className="text-white" size={40} weight="fill" />
                </div>
            </div>
            <div>
                <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">Verification Failed</h2>
                <p className="text-white/60 font-medium">The link is invalid or has expired. Please try registering again or contact support.</p>
            </div>
            <Button 
                onClick={() => router.push('/')}
                variant="outline"
                className="w-full h-14 border-white/10 text-white font-black uppercase rounded-2xl text-lg hover:bg-white/5"
            >
                Back to Home
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
