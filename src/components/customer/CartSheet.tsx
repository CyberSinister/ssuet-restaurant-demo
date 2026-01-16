import { useState, useEffect } from 'react'
import { CartItem, Order, RestaurantSettings, OrderType } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Plus, Minus, Trash, ShoppingCart, User, MapPin, Notepad, Receipt } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface CartSheetProps {
  cart: CartItem[]
  setCart: (cart: CartItem[] | ((prev: CartItem[]) => CartItem[])) => void
  settings: RestaurantSettings
  orders: Order[]
  setOrders: (orders: Order[] | ((prev: Order[]) => Order[])) => void
  location: { type: string, country: string, city: string, area: string } | null
  onClose: () => void
  customer?: any
}

export default function CartSheet({
  cart,
  setCart,
  settings,
  orders: _orders,
  setOrders,
  location,
  onClose,
  customer,
}: CartSheetProps) {
  const [checkoutMode, setCheckoutMode] = useState(false)
  const [customerName, setCustomerName] = useState(customer?.name || '')
  const [customerEmail, setCustomerEmail] = useState(customer?.email || '')
  const [customerPhone, setCustomerPhone] = useState(customer?.phone || '')
  
  // Auto-fill form updates if customer logs in while cart is open
  useEffect(() => {
    if (customer) {
        if (customer.name) setCustomerName(customer.name)
        if (customer.email) setCustomerEmail(customer.email)
        if (customer.phone) setCustomerPhone(customer.phone)
        if (customer.address) setAddress(customer.address)
    }
  }, [customer])
  const [orderType, setOrderType] = useState<OrderType>(location ? 'DELIVERY' : 'TAKEAWAY')
  const [address, setAddress] = useState(customer?.address || '')
  const [notes, setNotes] = useState('')

  const subtotal = cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0)
  const deliveryFee = orderType === 'DELIVERY' ? settings.deliveryFee : 0
  const tax = (subtotal + deliveryFee) * settings.taxRate
  const total = subtotal + deliveryFee + tax

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((currentCart) => {
      return currentCart
        .map(item =>
          item.menuItem.id === itemId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter(item => item.quantity > 0)
    })
  }

  const removeItem = (itemId: string) => {
    setCart((currentCart) => currentCart.filter(item => item.menuItem.id !== itemId))
  }

  const handlePlaceOrder = async () => {
    if (!customerName || !customerEmail || !customerPhone) {
      toast.error('Please fill in all required fields')
      return
    }

    if (orderType === 'DELIVERY' && !address) {
      toast.error('Please provide a delivery address')
      return
    }

    if (subtotal < settings.minimumOrder) {
      toast.error(`Minimum order is $${settings.minimumOrder.toFixed(2)}`)
      return
    }

    const fullAddress = location
      ? (orderType === 'DELIVERY' 
          ? `${address}, ${location.area}, ${location.city}`
          : `${location.area}, ${location.city}`) // For pickup, just send the branch location
      : address

    const payload = {
      items: cart.map(item => ({
        menuItemId: item.menuItem.id,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions
      })),
      customerName,
      customerEmail,
      customerPhone,
      orderType,
      address: fullAddress, // Send address for both (Delivery Addr or Pickup Branch)
      notes: notes || undefined
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to place order')
      }

      const newOrder = await response.json()

      setOrders((currentOrders) => [newOrder, ...currentOrders])
      setCart([])
      setCheckoutMode(false)
      setCustomerName('')
      setCustomerEmail('')
      setCustomerPhone('')
      setAddress('')
      setNotes('')
      onClose()
      toast.success('Order placed successfully! 🎉')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-32 h-32 bg-primary/5 rounded-full flex items-center justify-center mb-6">
            <ShoppingCart size={64} className="text-primary opacity-20" weight="duotone" />
        </div>
        <h4 className="text-foreground font-black uppercase text-xl tracking-tight">Your cart is silent</h4>
        <p className="text-muted-foreground text-sm mt-2 max-w-[250px] font-medium leading-relaxed">Looks like you haven't added any Broadway treats yet.</p>
        <Button onClick={onClose} className="mt-8 bg-primary text-primary-foreground font-black uppercase rounded-2xl h-14 px-10">Start Exploring</Button>
      </div>
    )
  }

  if (checkoutMode) {
    return (
      <div className="py-8 space-y-10 animate-in slide-in-from-right duration-500">
        {/* Selected Location Display */}
        {location && (
          <div className="bg-primary/10 border border-primary/20 rounded-3xl p-6 flex items-start gap-4">
            <div className="bg-primary text-primary-foreground p-3 rounded-2xl shrink-0">
               <MapPin weight="fill" size={24} />
            </div>
            <div>
               <h5 className="font-black uppercase tracking-widest text-sm text-primary mb-1">Delivering To</h5>
               <p className="text-xl font-bold text-foreground uppercase tracking-tight">{location.area}, {location.city}</p>
               <p className="text-muted-foreground text-sm font-medium tracking-wide mt-1">{location.country}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Customer Details */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <User weight="fill" className="text-primary" size={24} />
                    <h5 className="font-black uppercase tracking-widest text-sm text-muted-foreground">Personal Details</h5>
                </div>
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                        <Input
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="e.g. John Broadway"
                            className="bg-muted border-border h-14 rounded-2xl focus:ring-primary text-foreground"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email</Label>
                           <Input
                             type="email"
                             value={customerEmail}
                             onChange={(e) => setCustomerEmail(e.target.value)}
                             placeholder="john@example.com"
                             className="bg-muted border-border h-14 rounded-2xl focus:ring-primary text-foreground"
                           />
                        </div>
                        <div className="space-y-1.5">
                           <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Phone Number</Label>
                           <Input
                             type="tel"
                             value={customerPhone}
                             onChange={(e) => setCustomerPhone(e.target.value)}
                             placeholder="+92 XXX XXXXXXX"
                             className="bg-muted border-border h-14 rounded-2xl focus:ring-primary text-foreground"
                           />
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Preference */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <MapPin weight="fill" className="text-primary" size={24} />
                    <h5 className="font-black uppercase tracking-widest text-sm text-muted-foreground">Order Preference</h5>
                </div>
                <RadioGroup value={orderType} onValueChange={(value) => setOrderType(value as OrderType)} className="grid grid-cols-2 gap-4">
                    <Label
                        htmlFor="pickup"
                        className={cn(
                            "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer",
                            orderType === 'TAKEAWAY' ? "border-primary bg-primary/10" : "border-border bg-muted/40 hover:border-primary/20"
                        )}
                    >
                        <RadioGroupItem value="pickup" id="pickup" className="sr-only" />
                        <span className="font-black text-xs uppercase tracking-widest">Self Pickup</span>
                    </Label>
                    <Label
                        htmlFor="delivery"
                        className={cn(
                            "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer",
                            orderType === 'DELIVERY' ? "border-primary bg-primary/10" : "border-border bg-muted/40 hover:border-primary/20"
                        )}
                    >
                        <RadioGroupItem value="delivery" id="delivery" className="sr-only" />
                        <span className="font-black text-xs uppercase tracking-widest">Delivery</span>
                    </Label>
                </RadioGroup>

                {orderType === 'DELIVERY' && (
                    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Complete Address (House / Flat / Block)</Label>
                        <Input
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="e.g. House 42, Street 11..."
                            className="bg-muted border-border h-14 rounded-2xl focus:ring-primary text-foreground"
                        />
                    </div>
                )}
            </div>
        </div>

        <div className="space-y-1.5">
            <div className="flex items-center gap-3 mb-2">
                <Notepad weight="fill" className="text-primary" size={24} />
                <h5 className="font-black uppercase tracking-widest text-sm text-muted-foreground">Special Instructions</h5>
            </div>
            <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Allergy notes, gate codes, or delivery preferences..."
                className="bg-muted border-border min-h-[100px] rounded-2xl focus:ring-primary text-foreground p-4"
            />
        </div>

        <div className="bg-card rounded-[2.5rem] p-8 md:p-12">
            <div className="flex items-center gap-3 mb-8">
                <Receipt weight="fill" className="text-primary" size={24} />
                <h5 className="font-black uppercase tracking-widest text-sm text-muted-foreground">Bill Summary</h5>
            </div>
            <div className="space-y-4">
                <div className="flex justify-between text-muted-foreground font-medium">
                    <span className="uppercase text-xs tracking-widest">Subtotal ({cart.length} items)</span>
                    <span className="font-mono tracking-tighter">Rs. {subtotal.toLocaleString()}</span>
                </div>
                {orderType === 'DELIVERY' && (
                    <div className="flex justify-between text-muted-foreground font-medium">
                        <span className="uppercase text-xs tracking-widest">Delivery Fee</span>
                        <span className="font-mono tracking-tighter">Rs. {deliveryFee.toLocaleString()}</span>
                    </div>
                )}
                <div className="flex justify-between text-muted-foreground font-medium">
                    <span className="uppercase text-xs tracking-widest">Tax ({ (settings.taxRate * 100).toFixed(0) }%)</span>
                    <span className="font-mono tracking-tighter">Rs. {tax.toLocaleString()}</span>
                </div>
                <Separator className="bg-border" />
                <div className="flex justify-between items-center pt-2">
                    <span className="text-2xl font-black text-foreground uppercase tracking-tighter italic">Grand Total</span>
                    <span className="text-4xl font-black text-primary font-mono tracking-tighter italic">Rs. {total.toLocaleString()}</span>
                </div>
            </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="ghost" onClick={() => setCheckoutMode(false)} className="h-16 flex-1 text-muted-foreground hover:text-foreground uppercase font-black tracking-widest">
                Back to Menu
            </Button>
            <Button onClick={handlePlaceOrder} className="h-16 flex-[2] bg-primary text-primary-foreground font-black uppercase text-xl tracking-wider rounded-2xl shadow-2xl shadow-primary/20 hover:scale-[1.01] transition-all">
                Confirm Order
            </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8 space-y-10 animate-in slide-in-from-bottom duration-500">
      <div className="space-y-6">
        {cart.map(item => (
          <div key={item.menuItem.id} className="flex items-center gap-6 p-4 rounded-[2rem] bg-card border border-border hover:border-border/80 transition-all group">
            <div className="relative w-24 h-24 overflow-hidden rounded-2xl shrink-0">
                <img
                    src={item.menuItem.image}
                    alt={item.menuItem.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                />
            </div>
            <div className="flex-1 min-w-0">
               <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-1 block">Selected Treat</span>
               <h4 className="font-black text-foreground text-lg uppercase tracking-tight leading-none mb-2">{item.menuItem.name}</h4>
               <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                 Rs. {item.menuItem.price.toLocaleString()}
               </p>
            </div>
            
            <div className="flex flex-col items-end gap-3">
                <div className="text-xl font-black text-foreground font-mono tracking-tighter italic">
                    Rs. {(item.menuItem.price * item.quantity).toLocaleString()}
                </div>
                <div className="flex items-center gap-3 bg-muted p-1.5 rounded-xl border border-border shadow-inner">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg hover:bg-background text-foreground"
                        onClick={() => updateQuantity(item.menuItem.id, -1)}
                    >
                        <Minus size={14} weight="bold" />
                    </Button>
                    <span className="text-sm font-black text-foreground w-6 text-center">{item.quantity}</span>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg hover:bg-primary hover:text-primary-foreground bg-primary/10 text-primary"
                        onClick={() => updateQuantity(item.menuItem.id, 1)}
                    >
                        <Plus size={14} weight="bold" />
                    </Button>
                </div>
            </div>
            
            <Button
                size="icon"
                variant="ghost"
                className="h-10 w-10 text-red-500/50 hover:text-red-500 hover:bg-red-500/5 transition-all"
                onClick={() => removeItem(item.menuItem.id)}
            >
                <Trash size={18} weight="bold" />
            </Button>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-[2.5rem] p-8 md:p-12 space-y-8">
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <span className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">Basket Subtotal</span>
                <span className="text-3xl font-black text-foreground font-mono tracking-tighter italic">Rs. {subtotal.toLocaleString()}</span>
            </div>
            {subtotal < settings.minimumOrder && (
                <div className="flex items-center gap-3 text-red-500 animate-pulse">
                    <Trash size={16} weight="fill" />
                    <p className="text-[10px] font-black uppercase tracking-widest">
                        Minimum Rs. {settings.minimumOrder.toLocaleString()} Required
                    </p>
                </div>
            )}
        </div>

        <Button
            onClick={() => setCheckoutMode(true)}
            disabled={subtotal < settings.minimumOrder}
            className="w-full h-20 bg-primary text-primary-foreground font-black uppercase text-xl lg:text-2xl tracking-[0.1em] rounded-3xl shadow-2xl shadow-primary/20 hover:scale-[1.01] transition-all disabled:opacity-20 disabled:grayscale"
        >
            Proceed to Checkout
        </Button>
        <p className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Taxes & Fees calculated on next step</p>
      </div>
    </div>
  )
}
