
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { User, Phone, Envelope, MapPin, LockKey, SignOut, Clock, Bag, ChartPieSlice, Spinner, CheckCircle, ArrowRight } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ProfileViewProps {
  customer: any
  setCustomer: (customer: any) => void
  sessionOrders?: any[]
}

export function ProfileView({ customer, setCustomer, sessionOrders = [] }: ProfileViewProps) {
  const [loading, setLoading] = useState(false)
  const [fetchedOrders, setFetchedOrders] = useState<any[]>([])
  const [fetchingOrders, setFetchingOrders] = useState(false)

  // Combined orders (Session + DB), deduplicated
  const allOrders = [
    ...sessionOrders,
    ...fetchedOrders.filter(fo => !sessionOrders.some(so => so.id === fo.id))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  // Registration State
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regAddress, setRegAddress] = useState('')

  // Login State
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    address: ''
  })

  // Initialize edit form when customer data is available
  useEffect(() => {
    if (customer) {
      setEditForm({
        name: customer.name || '',
        phone: customer.phone || '',
        address: customer.address || ''
      })
    }
  }, [customer])

  const fetchOrders = useCallback(async () => {
    if (!customer?.id) return
    setFetchingOrders(true)
    try {
      const res = await fetch(`/api/customer/orders/${customer.id}`)
      if (res.ok) {
        const data = await res.json()
        setFetchedOrders(data)
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    } finally {
      setFetchingOrders(false)
    }
  }, [customer?.id])

  useEffect(() => {
    if (customer?.id) {
      fetchOrders()
    }
  }, [customer?.id, fetchOrders])

  const handleRegister = async () => {
    if (!regName || !regEmail || !regPassword || !regPhone) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          phone: regPhone,
          address: regAddress
        })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message)
        // Clear inputs
        setRegName('')
        setRegEmail('')
        setRegPassword('')
        setRegPhone('')
      } else {
        toast.error(data.error)
      }
    } catch (err) {
      toast.error('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      toast.error('Please enter your credentials')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      })
      const data = await res.json()
      if (res.ok) {
        setCustomer(data.customer)
        toast.success('Welcome back to Broadway!')
      } else {
        toast.error(data.error)
      }
    } catch (err) {
      toast.error('Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setCustomer(null)
    toast.success('Logged out successfully')
  }

  const handleUpdateProfile = async () => {
    if (!customer?.id) return

    setLoading(true)
    try {
      const res = await fetch('/api/customer/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.id,
          ...editForm
        })
      })
      const data = await res.json()
      if (res.ok) {
        setCustomer({ ...customer, ...data.customer })
        setIsEditing(false)
        toast.success('Profile updated successfully!')
      } else {
        toast.error(data.error || 'Failed to update profile')
      }
    } catch (err) {
      toast.error('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  if (customer) {
    return (
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom duration-700">
        {/* Dashboard Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card border-border rounded-[2.5rem] p-8 md:col-span-2 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-10 opacity-10">
              <ChartPieSlice size={160} weight="duotone" className="text-primary" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center border-4 border-accent/20">
                <User size={48} weight="fill" className="text-accent" />
              </div>
              <div className="text-center md:text-left space-y-2">
                <div className="text-accent text-[10px] font-black uppercase tracking-[0.5em]">Active Broadway Member</div>
                <h2 className="text-4xl font-black text-foreground uppercase tracking-tighter italic">{customer.name}</h2>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                  <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
                    <Envelope size={14} weight="bold" /> {customer.email}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
                    <Phone size={14} weight="bold" /> {customer.phone}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-primary border-none rounded-[2.5rem] p-8 flex flex-col justify-between group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 transform rotate-12 opacity-20 group-hover:scale-110 transition-transform">
              <SignOut size={120} weight="bold" className="text-primary-foreground" />
            </div>
            <div className="relative z-10">
              <h3 className="text-primary-foreground font-black text-2xl uppercase tracking-tighter italic">Ready to Depart?</h3>
              <p className="text-primary-foreground/60 text-xs font-bold uppercase tracking-widest mt-2">Sign out of your session</p>
            </div>
            <Button
              onClick={handleLogout}
              className="relative z-10 w-full bg-primary-foreground text-primary h-14 rounded-2xl font-black uppercase tracking-widest hover:bg-primary-foreground/90 hover:text-primary mt-8 cursor-pointer border-none"
            >
              Logout
            </Button>
          </Card>
        </div>

        {/* Account Details & Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <Clock size={24} className="text-primary" weight="fill" />
                <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Order History</h3>
              </div>
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">All Time History</span>
            </div>

            {fetchingOrders ? (
              <div className="flex justify-center py-20">
                <Spinner className="animate-spin text-primary" size={40} weight="bold" />
              </div>
            ) : allOrders.length === 0 ? (
              <div className="bg-card rounded-[2.5rem] border border-border p-20 text-center space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full mx-auto flex items-center justify-center">
                  <Bag size={32} className="text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">No orders on record yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {allOrders.map((order) => (
                  <Card key={order.id} className="bg-card border-border hover:border-primary/50 transition-all rounded-[2rem] p-6 group cursor-pointer">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center shrink-0">
                          <Bag size={24} weight="fill" className="text-primary" />
                        </div>
                        <div>
                          <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">{order.id}</div>
                          <h4 className="text-foreground font-black text-lg uppercase tracking-tight italic">
                            {order.orderItems.length} {order.orderItems.length === 1 ? 'Item' : 'Items'} En Route
                          </h4>
                          <div className="text-muted-foreground text-[10px] font-medium tracking-wide first-letter:uppercase">
                            {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-8 w-full md:w-auto border-t md:border-t-0 border-border pt-4 md:pt-0">
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Bill</span>
                          <span className="text-2xl font-black text-foreground font-mono tracking-tighter italic">Rs. {order.total.toLocaleString()}</span>
                        </div>
                        <div className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest",
                          order.status === 'COMPLETED' || order.status === 'SERVED' ? "bg-green-500/10 text-green-500" :
                            order.status === 'PENDING' ? "bg-amber-500/10 text-amber-500" :
                              order.status === 'CANCELLED' ? "bg-red-500/10 text-red-500" :
                                "bg-primary/10 text-primary"
                        )}>
                          {order.status.replace(/_/g, ' ')}
                        </div>
                        <div className="p-3 bg-muted rounded-xl text-muted-foreground group-hover:text-primary transition-colors">
                          <ArrowRight size={20} weight="bold" />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3 px-4">
              <MapPin size={24} className="text-primary" weight="fill" />
              <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Saved Coordinates</h3>
            </div>
            <Card className="bg-card border-border rounded-[2.5rem] p-8 space-y-6">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-1">Default Delivery Address</Label>
                <div className="bg-muted border border-border p-5 rounded-2xl text-foreground font-medium text-sm italic">
                  {customer.address || 'No primary address configured.'}
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="w-full h-14 border-border text-foreground font-black uppercase rounded-2xl hover:bg-muted tracking-widest italic"
              >
                Update Details
              </Button>
            </Card>

            {/* Edit Profile Dialog */}
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
              <DialogContent className="bg-card border-border text-foreground rounded-[2rem]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Edit Profile</DialogTitle>
                  <DialogDescription className="text-muted-foreground font-medium tracking-wide">
                    Update your personal information and delivery preferences.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" weight="bold" />
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        className="h-12 pl-10 bg-muted border-border rounded-xl text-foreground font-medium"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" weight="bold" />
                      <Input
                        value={editForm.phone}
                        onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="h-12 pl-10 bg-muted border-border rounded-xl text-foreground font-medium"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Delivery Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" weight="bold" />
                      <Input
                        value={editForm.address}
                        onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                        className="h-12 pl-10 bg-muted border-border rounded-xl text-foreground font-medium"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsEditing(false)} className="text-muted-foreground hover:text-foreground hover:bg-muted">Cancel</Button>
                  <Button onClick={handleUpdateProfile} disabled={loading} className="bg-primary text-primary-foreground font-bold hover:bg-primary/90">
                    {loading ? <Spinner className="animate-spin" /> : 'Save Changes'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Card className="bg-gradient-to-br from-primary/20 to-transparent border-primary/20 rounded-[2.5rem] p-8 text-center relative overflow-hidden group">
              <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:scale-110 transition-transform">
                <CheckCircle size={120} weight="bold" className="text-accent" />
              </div>
              <div className="relative z-10 space-y-4">
                <h4 className="text-primary-foreground font-black text-lg uppercase tracking-tight">Loyalty Streak</h4>
                <div className="text-4xl font-black text-accent italic font-mono tracking-tighter">04 Orders</div>
                <p className="text-primary-foreground/40 text-[9px] font-bold uppercase tracking-[0.2em] leading-relaxed">
                  Complete 10 orders to unlock Broadway Gold benefits.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-top-4 duration-700">
      <Card className="border-none rounded-[3rem] shadow-2xl bg-card overflow-hidden">
        <CardHeader className="text-center pt-12 pb-8 px-10 space-y-2">
          <div className="text-accent text-[10px] font-black uppercase tracking-[0.6em] mb-4">Membership Access</div>
          <CardTitle className="text-5xl font-black text-foreground uppercase tracking-tighter italic">The Stage is Yours</CardTitle>
          <CardDescription className="text-muted-foreground font-medium tracking-wide">
            Sign in to your Broadway account to access chronicles and fast-track orders.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-10 pb-12">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-10 bg-muted p-1.5 rounded-2xl h-16">
              <TabsTrigger value="login" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black uppercase tracking-widest text-xs transition-all">Login</TabsTrigger>
              <TabsTrigger value="register" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black uppercase tracking-widest text-xs transition-all">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-6">
              <div className="space-y-2.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
                <div className="relative">
                  <Envelope className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" weight="bold" />
                  <Input
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="Broadway@example.com"
                    className="h-16 pl-14 bg-muted border-border rounded-2xl text-foreground font-medium focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Password</Label>
                <div className="relative">
                  <LockKey className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" weight="bold" />
                  <Input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="h-16 pl-14 bg-muted border-border rounded-2xl text-foreground font-medium focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
              </div>
              <Button
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-16 rounded-2xl text-xl font-black uppercase tracking-[0.1em] shadow-xl shadow-primary/10 hover:scale-[1.01] transition-all"
              >
                {loading ? <Spinner className="animate-spin" size={24} /> : 'Login'}
              </Button>
            </TabsContent>

            <TabsContent value="register" className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" weight="bold" />
                    <Input
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Your Full Name"
                      className="h-16 pl-14 bg-muted border-border rounded-2xl text-foreground font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
                  <div className="relative">
                    <Envelope className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" weight="bold" />
                    <Input
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      type="email"
                      placeholder="john@studio.com"
                      className="h-16 pl-14 bg-muted border-border rounded-2xl text-foreground font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" weight="bold" />
                    <Input
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+92 XXX XXXXXXX"
                      className="h-16 pl-14 bg-muted border-border rounded-2xl text-foreground font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Password</Label>
                  <div className="relative">
                    <LockKey className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" weight="bold" />
                    <Input
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      type="password"
                      className="h-16 pl-14 bg-muted border-border rounded-2xl text-foreground font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Address (Optional)</Label>
                <div className="relative">
                  <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" weight="bold" />
                  <Input
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    placeholder="Your primary delivery address"
                    className="h-16 pl-14 bg-muted border-border rounded-2xl text-foreground font-medium"
                  />
                </div>
              </div>

              <Button
                onClick={handleRegister}
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-16 rounded-2xl text-xl font-black uppercase tracking-[0.1em] shadow-xl shadow-primary/10 mt-4 transition-all"
              >
                {loading ? <Spinner className="animate-spin" size={24} /> : 'Register'}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
