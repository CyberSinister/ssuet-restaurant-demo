'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { usePOSStore } from '@/lib/stores/pos-store'
import { closeShift, processPayment } from '@/lib/hooks/use-pos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    MagnifyingGlassIcon,
    TrashIcon,
    MinusIcon,
    PlusIcon,
    XCircleIcon,
    BanknotesIcon,
    CreditCardIcon
} from '@heroicons/react/24/outline'

// Fetcher for SWR
const fetcher = (url: string) => fetch(url).then(res => res.json())

interface MenuItem {
    id: string
    name: string
    price: number
    image: string
    available: boolean
    categoryId: string
    dietaryTags?: string[]
}

interface Category {
    id: string
    name: string
    menuItems: MenuItem[]
}

export function POSInterface() {
    const store = usePOSStore()

    // UI State
    const [search, setSearch] = useState('')
    const [activeCategory, setActiveCategory] = useState<string>('all')
    const [isPaying, setIsPaying] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState<string>('CASH')
    const [amountTendered, setAmountTendered] = useState<string>('')

    // Fetch Menu
    const { data: menuData, isLoading: menuLoading } = useSWR<Category[]>('/api/menu?grouped=true', fetcher)
    const { data: payMethods } = useSWR('/api/payments/methods', fetcher)

    // Derived State
    const allItems = menuData?.flatMap(c => c.menuItems) || []
    const filteredItems = allItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase())
        const matchesCategory = activeCategory === 'all' || item.categoryId === activeCategory
        return matchesSearch && matchesCategory && item.available
    })

    const handleAddToCart = (item: MenuItem) => {
        store.addToCart({
            menuItemId: item.id,
            name: item.name,
            price: Number(item.price),
            quantity: 1,
            notes: ''
        })
    }

    // Creating order function
    const createOrder = async () => {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                locationId: store.locationId,
                items: store.cart.map(i => ({
                    menuItemId: i.menuItemId,
                    quantity: i.quantity,
                    specialInstructions: i.notes // Fixed mapping
                })),
                orderType: store.orderType,
                // Default customer for POS - In real app, prompt or select customer
                customerName: 'Walk-in Customer',
                customerEmail: `walkin-${Date.now()}@pos.local`, // Dummy email to satisfy schema
                customerPhone: '0000000000',
                address: 'In-store',
                notes: `POS Order - Terminal ${store.terminalId}`
            })
        })
        if (!res.ok) {
            const err = await res.json()
            throw new Error(err.message || 'Failed to create order')
        }
        return res.json()
    }

    const handlePay = async () => {
        if (!store.cart.length) return
        try {
            // 1. Create Order
            const { order } = await createOrder()

            // 2. Process Payment
            const method = payMethods?.methods?.find((m: any) => m.type === paymentMethod)

            // If cash, validate tendered
            if (paymentMethod === 'CASH') {
                const tendered = parseFloat(amountTendered)
                if (tendered < store.total) {
                    alert('Insufficient cash tendered')
                    return
                }
            }

            await processPayment({
                orderId: order.id,
                paymentMethodId: method?.id,
                amount: store.total,
                terminalId: store.terminalId!,
                shiftId: store.shiftId!,
                // tipAmount: 0 // Optional
            })

            // 3. Success
            store.clearCart()
            setIsPaying(false)
            setAmountTendered('')
            // Optionally print receipt here
        } catch (e) {
            console.error(e)
            alert('Transaction Failed')
        }
    }

    const handleCloseShift = async () => {
        if (confirm('Are you sure you want to close the shift?')) {
            await closeShift(store.shiftId!, { closingCash: 0 }) // TODO: Prompt for cash count
            store.clearShift()
        }
    }

    return (
        <div className="flex h-screen overflow-hidden bg-gray-100">
            {/* LEFT: Menu Grid */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm z-10">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative w-64">
                            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search menu..."
                                className="pl-9 bg-gray-50"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="flex-1">
                            <ScrollArea className="w-full whitespace-nowrap">
                                <TabsList className="bg-transparent p-0 h-auto gap-2">
                                    <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-full border px-4 py-2">All Items</TabsTrigger>
                                    {menuData?.map(cat => (
                                        <TabsTrigger
                                            key={cat.id}
                                            value={cat.id}
                                            className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-full border px-4 py-2"
                                        >
                                            {cat.name}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </ScrollArea>
                        </Tabs>
                    </div>
                </header>

                {/* Grid */}
                <main className="flex-1 overflow-y-auto p-4">
                    {menuLoading ? (
                        <div className="flex h-full items-center justify-center">Loading Menu...</div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => handleAddToCart(item)}
                                    className="flex flex-col bg-white rounded-xl shadow-sm border p-4 hover:border-primary hover:shadow-md transition-all text-left group"
                                >
                                    <div className="font-semibold text-gray-800 line-clamp-2 mb-1 group-hover:text-primary">{item.name}</div>
                                    <div className="mt-auto flex w-full items-center justify-between">
                                        <span className="font-bold text-gray-900">Rs. {Number(item.price).toFixed(0)}</span>
                                        {item.dietaryTags?.includes('VEG') && <span className="text-xs text-green-600 font-bold border border-green-200 px-1 rounded">V</span>}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </main>
            </div>

            {/* RIGHT: Cart & Checkout */}
            <div className="w-[400px] bg-white border-l shadow-xl flex flex-col z-20">
                {/* Header info */}
                <div className="p-3 bg-gray-50 border-b flex justify-between text-xs text-gray-500">
                    <span>Term: {store.terminalName}</span>
                    <span>Shift: #{store.shiftId?.slice(-4)}</span>
                    <button onClick={handleCloseShift} className="text-red-500 hover:underline">Close Shift</button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto">
                    {store.cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <div className="text-4xl mb-2">🛒</div>
                            <p>Cart is empty</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {store.cart.map(item => (
                                <div key={item.id} className="p-4 flex gap-3 hover:bg-gray-50 group">
                                    <div className="flex-1">
                                        <div className="font-medium flex justify-between">
                                            <span>{item.name}</span>
                                            <span>Rs. {(item.price * item.quantity).toFixed(0)}</span>
                                        </div>
                                        <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                            <span>Rs. {item.price} x {item.quantity}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1 items-end justify-center">
                                        <div className="flex items-center gap-1 bg-gray-100 rounded-md">
                                            <button onClick={() => store.updateCartItem(item.id, { quantity: Math.max(1, item.quantity - 1) })} className="p-1 hover:text-red-600"><MinusIcon className="w-3 h-3" /></button>
                                            <span className="text-sm min-w-[1.5rem] text-center">{item.quantity}</span>
                                            <button onClick={() => store.updateCartItem(item.id, { quantity: item.quantity + 1 })} className="p-1 hover:text-green-600"><PlusIcon className="w-3 h-3" /></button>
                                        </div>
                                    </div>
                                    <button onClick={() => store.removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 self-center ml-1">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Totals */}
                <div className="bg-gray-50 p-4 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Subtotal</span>
                        <span>Rs. {store.subtotal.toFixed(2)}</span>
                    </div>
                    {store.discountAmount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                            <span>Discount</span>
                            <span>-Rs. {store.discountAmount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Tax ({store.taxRate * 100}%)</span>
                        <span>Rs. {store.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold pt-2 border-t">
                        <span>Total</span>
                        <span>Rs. {store.total.toFixed(2)}</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="p-4 grid grid-cols-2 gap-3">
                    <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={store.clearCart}>
                        <TrashIcon className="w-4 h-4 mr-2" />
                        Clear
                    </Button>
                    <Button
                        size="lg"
                        className="bg-green-600 hover:bg-green-700 w-full col-span-1"
                        disabled={store.cart.length === 0}
                        onClick={() => setIsPaying(true)}
                    >
                        Checkout
                    </Button>
                </div>
            </div>

            {/* Payment Modal Overlay */}
            {isPaying && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg">Payment</h3>
                            <button onClick={() => setIsPaying(false)} className="text-gray-400 hover:text-gray-600">
                                <XCircleIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="text-center">
                                <div className="text-gray-500 text-sm">Total Amount</div>
                                <div className="text-4xl font-bold text-green-600">Rs. {store.total.toFixed(0)}</div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setPaymentMethod('CASH')}
                                    className={`p-4 border rounded-lg flex flex-col items-center gap-2 transition-all ${paymentMethod === 'CASH' ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'hover:bg-gray-50'}`}
                                >
                                    <BanknotesIcon className={`w-8 h-8 ${paymentMethod === 'CASH' ? 'text-primary' : 'text-gray-400'}`} />
                                    <span className="font-medium">Cash</span>
                                </button>
                                <button
                                    onClick={() => setPaymentMethod('CARD')}
                                    className={`p-4 border rounded-lg flex flex-col items-center gap-2 transition-all ${paymentMethod === 'CARD' ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20' : 'hover:bg-gray-50'}`}
                                >
                                    <CreditCardIcon className={`w-8 h-8 ${paymentMethod === 'CARD' ? 'text-blue-500' : 'text-gray-400'}`} />
                                    <span className="font-medium">Card</span>
                                </button>
                                {/* Add more methods dynamically if needed */}
                            </div>

                            {paymentMethod === 'CASH' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Cash Tendered</label>
                                    <Input
                                        type="number"
                                        placeholder="Enter amount..."
                                        className="text-lg"
                                        autoFocus
                                        value={amountTendered}
                                        onChange={e => setAmountTendered(e.target.value)}
                                    />
                                    {amountTendered && parseFloat(amountTendered) >= store.total && (
                                        <div className="text-center p-2 bg-green-50 rounded text-green-700 font-medium animate-in slide-in-from-top-2">
                                            Change: Rs. {(parseFloat(amountTendered) - store.total).toFixed(2)}
                                        </div>
                                    )}
                                </div>
                            )}

                            <Button
                                className="w-full h-12 text-lg"
                                size="lg"
                                onClick={handlePay}
                                disabled={paymentMethod === 'CASH' && (!amountTendered || parseFloat(amountTendered) < store.total)}
                            >
                                Confirm Payment
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
