'use client'
import { useState, useEffect, useMemo } from 'react'
import { Order, OrderStatus } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface OrdersViewProps {
  orders?: Order[]
  customer?: any
}

const statusConfig: Record<OrderStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING: { label: 'Pending', variant: 'secondary' },
  CONFIRMED: { label: 'Confirmed', variant: 'default' },
  PREPARING: { label: 'Preparing', variant: 'default' },
  READY: { label: 'Ready', variant: 'default' },
  SERVED: { label: 'Served', variant: 'default' },
  COMPLETED: { label: 'Completed', variant: 'outline' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
}

export default function OrdersView({ orders = [], customer }: OrdersViewProps) {
  const [lookupEmail, setLookupEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [foundOrders, setFoundOrders] = useState<Order[]>([])

  // Auto-fetch orders if customer is logged in
  useEffect(() => {
    if (customer?.email) {
      const fetchAuto = async () => {
        setIsLoading(true)
        try {
          const res = await fetch(`/api/orders?email=${encodeURIComponent(customer.email)}`)
          if (res.ok) {
            const data = await res.json()
            setFoundOrders(data.data)
          }
        } catch (err) {
          console.error("Failed to auto-fetch orders", err)
        } finally {
          setIsLoading(false)
        }
      }
      fetchAuto()
    }
  }, [customer])

  const fetchOrdersByEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lookupEmail) return

    setIsLoading(true)
    try {
      const res = await fetch(`/api/orders?email=${encodeURIComponent(lookupEmail)}`)
      if (res.ok) {
        const data = await res.json()
        setFoundOrders(data.data)
        if (data.data.length === 0) {
          toast.error('No orders found for this email')
        }
      } else {
        toast.error('Failed to fetch orders')
      }
    } catch (error) {
      toast.error('Error fetching orders')
    } finally {
      setIsLoading(false)
    }
  }

  const displayOrders = useMemo(() => {
    // Merge session orders (props) and fetched history (foundOrders)
    // Create a map to deduplicate by ID
    const orderMap = new Map<string, Order>()

    // Add history first
    foundOrders.forEach(o => orderMap.set(o.id, o))

    // Add/Overwrite with session orders (newer)
    orders.forEach(o => orderMap.set(o.id, o))

    // Convert to array and sort by date desc
    return Array.from(orderMap.values()).sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [orders, foundOrders])

  if (displayOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground">Track Your Order</h2>
          <p className="text-muted-foreground">Enter your email address to view your order history</p>
        </div>

        <Card className="w-full max-w-md bg-card border-border">
          <CardContent className="pt-6">
            <form onSubmit={fetchOrdersByEmail} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Email Address</Label>
                <div className="flex gap-2">
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={lookupEmail}
                    onChange={(e) => setLookupEmail(e.target.value)}
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10"
                  />
                  <Button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground font-bold h-10">
                    {isLoading ? 'Searching...' : 'Track'}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground">Your Orders</h2>
        <p className="text-muted-foreground">History of your culinary adventures</p>
      </div>

      <div className="space-y-4">
        {displayOrders.map(order => (
          <Card key={order.id} className="bg-card border-border overflow-hidden">
            <CardHeader className="bg-muted/50 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg text-foreground font-bold tracking-tight">Order #{order.id.slice(-6).toUpperCase()}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-medium">
                    {format(new Date(order.createdAt), 'MMM d, yyyy • h:mm a')}
                  </p>
                </div>
                <Badge variant={statusConfig[order.status].variant as any} className="uppercase tracking-widest font-black text-[10px]">
                  {statusConfig[order.status].label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-3">
                {/* Handle both Prisma 'orderItems' and local 'items' */}
                {(order.items || (order as any).orderItems || []).map((item: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm text-foreground/80">
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-accent font-bold">{item.quantity}x</span>
                      <span className="uppercase tracking-wide text-xs font-bold">{item.menuItem.name}</span>
                    </span>
                    <span className="font-mono text-muted-foreground">
                      Rs. {(item.menuItem.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <Separator className="bg-border" />

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground uppercase tracking-widest text-[10px] font-bold">
                  <span>Subtotal</span>
                  <span className="font-mono">Rs. {order.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground uppercase tracking-widest text-[10px] font-bold">
                  <span>Tax</span>
                  <span className="font-mono">Rs. {order.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-foreground font-black uppercase tracking-widest text-sm">Total</span>
                  <span className="text-accent font-black font-mono text-xl italic tracking-tighter">Rs. {order.total.toLocaleString()}</span>
                </div>
              </div>

              {/* Order Context Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 bg-muted/30 -mx-6 -mb-6 p-6 border-t border-border">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Order Type</p>
                  <p className="text-foreground font-bold uppercase text-xs tracking-wide">{order.orderType}</p>
                </div>
                {order.address && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Location</p>
                    <p className="text-foreground font-bold uppercase text-xs tracking-wide">{order.address}</p>
                  </div>
                )}
                {order.notes && (
                  <div className="col-span-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Notes</p>
                    <p className="text-muted-foreground text-xs italic">"{order.notes}"</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
