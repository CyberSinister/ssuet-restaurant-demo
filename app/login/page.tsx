'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { ForkKnife, Eye, EyeSlash, ArrowLeft } from '@phosphor-icons/react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error('Invalid email or password')
      } else {
        toast.success('Welcome back!')
        // Redirect to admin dashboard (role check happens server-side)
        router.push('/admin')
        router.refresh()
      }
    } catch (error) {
      toast.error('An error occurred during login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary/10 via-[#121212] to-[#121212] pointer-events-none" />

      {/* Header */}
      <header className="p-8 relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-3 text-white/40 hover:text-white transition-all group"
        >
          <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
            <ArrowLeft size={20} weight="bold" />
          </div>
          <span className="font-bold uppercase tracking-widest text-xs">Back to Menu</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10 -mt-20">
        <div className="w-full max-w-md space-y-10">
          {/* Logo and Branding */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary to-primary/80 text-black shadow-2xl shadow-primary/20 mb-4 animate-in zoom-in duration-500">
              <ForkKnife size={48} weight="fill" />
            </div>
            <div className="space-y-1">
                <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">Bistro Bay</h1>
                <p className="text-primary font-bold tracking-[0.2em] uppercase text-xs">Management Access</p>
            </div>
          </div>

          {/* Login Card */}
          <Card className="border border-white/10 bg-[#1a1a1a]/50 backdrop-blur-xl shadow-2xl">
            <CardHeader className="space-y-1 pb-8 text-center">
              <CardTitle className="text-xl text-white font-black uppercase tracking-wide">Identify Yourself</CardTitle>
              <CardDescription className="text-white/40 font-medium">
                Secure gateway for authorized personnel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">Email Coordinates</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@bistrobay.com"
                    required
                    disabled={isLoading}
                    autoComplete="email"
                    className="h-14 bg-black/40 border-white/5 rounded-xl focus:ring-primary focus:border-primary/50 text-white placeholder:text-white/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">Security Key</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                      autoComplete="current-password"
                      className="h-14 bg-black/40 border-white/5 rounded-xl focus:ring-primary focus:border-primary/50 text-white placeholder:text-white/20 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors p-1"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeSlash size={24} /> : <Eye size={24} />}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-14 bg-primary text-black font-black uppercase tracking-widest text-sm rounded-xl hover:bg-white hover:scale-[1.02] transition-all shadow-lg shadow-primary/10 mt-4"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                      Authenticating...
                    </span>
                  ) : (
                    'Enter Dashboard'
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pt-2 pb-8">
              <Separator className="bg-white/5" />
              <div className="text-center space-y-2">
                 <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Authorized Access Only</p>
                 <div className="inline-block px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                    <p className="text-[10px] font-mono text-white/30 tracking-tight">admin@bistrobay.com / admin123</p>
                 </div>
              </div>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  )
}
