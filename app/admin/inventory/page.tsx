'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useInventoryItems, useStockAlerts, useSuppliers, usePurchaseOrders } from '@/lib/hooks/use-inventory'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import {
    ArchiveBoxIcon,
    ExclamationTriangleIcon,
    TruckIcon,
    DocumentTextIcon,
    MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'

export default function InventoryDashboardPage() {
    const [search, setSearch] = useState('')
    const { items, pagination, isLoading } = useInventoryItems({ search, limit: 20 })
    const { lowStock, expiring } = useStockAlerts()
    const { suppliers } = useSuppliers()
    const { orders: purchaseOrders } = usePurchaseOrders({ status: 'PENDING,APPROVED,ORDERED' })

    const pendingPOs = purchaseOrders.filter((po: { status: string }) =>
        ['PENDING', 'APPROVED', 'ORDERED'].includes(po.status)
    ).length

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Inventory Management</h1>
                    <p className="text-muted-foreground">Track stock levels, suppliers, and purchase orders</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Items</p>
                                <p className="text-2xl font-bold">{pagination?.total || 0}</p>
                            </div>
                            <ArchiveBoxIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>

                <Card className={lowStock.count > 0 ? 'border-red-500' : ''}>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Low Stock Alerts</p>
                                <p className="text-2xl font-bold text-red-600">{lowStock.count}</p>
                            </div>
                            <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className={expiring.count > 0 ? 'border-yellow-500' : ''}>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Expiring Soon</p>
                                <p className="text-2xl font-bold text-yellow-600">{expiring.count}</p>
                            </div>
                            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Pending POs</p>
                                <p className="text-2xl font-bold">{pendingPOs}</p>
                            </div>
                            <DocumentTextIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="items" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="items">
                        <ArchiveBoxIcon className="h-4 w-4 mr-2" />
                        Items
                    </TabsTrigger>
                    <TabsTrigger value="alerts">
                        <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                        Alerts ({lowStock.count + expiring.count})
                    </TabsTrigger>
                    <TabsTrigger value="suppliers">
                        <TruckIcon className="h-4 w-4 mr-2" />
                        Suppliers ({suppliers.length})
                    </TabsTrigger>
                    <TabsTrigger value="orders">
                        <DocumentTextIcon className="h-4 w-4 mr-2" />
                        Purchase Orders
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="items" className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search items by name, SKU..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button variant="outline">Export</Button>
                    </div>

                    {isLoading ? (
                        <div className="py-8 text-center">Loading...</div>
                    ) : (
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-muted">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium">SKU</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Category</th>
                                        <th className="px-4 py-3 text-right text-sm font-medium">Stock</th>
                                        <th className="px-4 py-3 text-right text-sm font-medium">Min</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item: { id: string; sku: string; name: string; category?: { name: string }; currentStock: number; minimumStock: number; unitOfMeasure: string }) => {
                                        const stock = Number(item.currentStock)
                                        const min = Number(item.minimumStock)
                                        const isLow = stock <= min
                                        return (
                                            <tr key={item.id} className="border-t hover:bg-muted/50">
                                                <td className="px-4 py-3 text-sm font-mono">{item.sku}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    <Link href={`/admin/inventory/items/${item.id}`} className="hover:underline">
                                                        {item.name}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                                    {item.category?.name || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right">
                                                    {stock} {item.unitOfMeasure}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right text-muted-foreground">{min}</td>
                                                <td className="px-4 py-3">
                                                    <Badge variant={isLow ? 'destructive' : 'secondary'}>
                                                        {isLow ? 'Low Stock' : 'OK'}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="alerts" className="space-y-4">
                    <div className="grid gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-red-600">Low Stock Items</CardTitle>
                                <CardDescription>Items at or below minimum stock level</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {lowStock.items.length === 0 ? (
                                    <p className="text-muted-foreground">No low stock alerts</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {lowStock.items.slice(0, 10).map((item: { id: string; name: string; currentStock: number; minimumStock: number }) => (
                                            <li key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                                                <span>{item.name}</span>
                                                <span className="text-red-600 font-medium">
                                                    {String(item.currentStock)} / {String(item.minimumStock)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-yellow-600">Expiring Soon</CardTitle>
                                <CardDescription>Lots expiring within 7 days</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {expiring.lots.length === 0 ? (
                                    <p className="text-muted-foreground">No expiring lots</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {expiring.lots.slice(0, 10).map((lot: { id: string; inventoryItem: { name: string }; lotNumber: string; daysUntilExpiry: number }) => (
                                            <li key={lot.id} className="flex items-center justify-between py-2 border-b last:border-0">
                                                <span>{lot.inventoryItem?.name} ({lot.lotNumber})</span>
                                                <Badge variant={lot.daysUntilExpiry <= 2 ? 'destructive' : 'secondary'}>
                                                    {lot.daysUntilExpiry} days
                                                </Badge>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="suppliers" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {suppliers.map((supplier: { id: string; name: string; code: string; contactName?: string; email?: string; phone?: string; _count: { items: number; purchaseOrders: number } }) => (
                            <Card key={supplier.id}>
                                <CardHeader>
                                    <CardTitle className="text-lg">{supplier.name}</CardTitle>
                                    <CardDescription>{supplier.code}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    {supplier.contactName && <p>Contact: {supplier.contactName}</p>}
                                    {supplier.email && <p>Email: {supplier.email}</p>}
                                    {supplier.phone && <p>Phone: {supplier.phone}</p>}
                                    <div className="flex gap-4 pt-2">
                                        <Badge variant="outline">{supplier._count?.items || 0} items</Badge>
                                        <Badge variant="outline">{supplier._count?.purchaseOrders || 0} POs</Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="orders" className="space-y-4">
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium">PO Number</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Supplier</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium">Total</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {purchaseOrders.map((po: { id: string; poNumber: string; supplier: { name: string }; status: string; total: number; createdAt: string }) => (
                                    <tr key={po.id} className="border-t hover:bg-muted/50">
                                        <td className="px-4 py-3 text-sm font-mono">{po.poNumber}</td>
                                        <td className="px-4 py-3 text-sm">{po.supplier?.name}</td>
                                        <td className="px-4 py-3">
                                            <Badge variant={po.status === 'RECEIVED' ? 'default' : 'secondary'}>
                                                {po.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right">Rs. {Number(po.total).toFixed(2)}</td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {new Date(po.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
