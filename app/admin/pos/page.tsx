'use client'

import { useState } from 'react'
import { useTerminals, useShifts, createTerminal, updateTerminal } from '@/lib/hooks/use-pos'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PlusIcon, ComputerDesktopIcon, CreditCardIcon, ClockIcon } from '@heroicons/react/24/outline'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function POSManagementPage() {
    const { terminals, isLoading, refresh } = useTerminals()
    const { shifts } = useShifts(undefined, 'OPEN')
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [newTerminal, setNewTerminal] = useState({ name: '', terminalType: 'COUNTER', locationId: '' })

    const handleCreate = async () => {
        try {
            await createTerminal(newTerminal)
            setIsCreateOpen(false)
            setNewTerminal({ name: '', terminalType: 'COUNTER', locationId: '' })
            refresh()
        } catch (error) {
            console.error('Failed to create terminal:', error)
        }
    }

    const handleToggleStatus = async (id: string, isActive: boolean) => {
        try {
            await updateTerminal(id, { isActive: !isActive })
            refresh()
        } catch (error) {
            console.error('Failed to update terminal:', error)
        }
    }

    if (isLoading) {
        return <div className="flex items-center justify-center h-64">Loading...</div>
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">POS Management</h1>
                    <p className="text-muted-foreground">Manage terminals, shifts, and payment settings</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Add Terminal
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Terminal</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Terminal Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g., Counter 1"
                                    value={newTerminal.name}
                                    onChange={(e) => setNewTerminal({ ...newTerminal, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="type">Terminal Type</Label>
                                <Select
                                    value={newTerminal.terminalType}
                                    onValueChange={(v) => setNewTerminal({ ...newTerminal, terminalType: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="COUNTER">Counter</SelectItem>
                                        <SelectItem value="MOBILE">Mobile</SelectItem>
                                        <SelectItem value="KIOSK">Kiosk</SelectItem>
                                        <SelectItem value="TABLET">Tablet</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location">Location ID</Label>
                                <Input
                                    id="location"
                                    placeholder="Location ID"
                                    value={newTerminal.locationId}
                                    onChange={(e) => setNewTerminal({ ...newTerminal, locationId: e.target.value })}
                                />
                            </div>
                            <Button className="w-full" onClick={handleCreate}>
                                Create Terminal
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Tabs defaultValue="terminals" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="terminals">
                        <ComputerDesktopIcon className="h-4 w-4 mr-2" />
                        Terminals
                    </TabsTrigger>
                    <TabsTrigger value="shifts">
                        <ClockIcon className="h-4 w-4 mr-2" />
                        Active Shifts
                    </TabsTrigger>
                    <TabsTrigger value="payments">
                        <CreditCardIcon className="h-4 w-4 mr-2" />
                        Payment Methods
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="terminals" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {terminals.map((terminal: { id: string; name: string; terminalType: string; isActive: boolean; location: { name: string }; _count: { orders: number; shifts: number } }) => (
                            <Card key={terminal.id}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">{terminal.name}</CardTitle>
                                        <Badge variant={terminal.isActive ? 'default' : 'secondary'}>
                                            {terminal.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                    <CardDescription>{terminal.location?.name}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Type</span>
                                        <span className="font-medium">{terminal.terminalType}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Orders</span>
                                        <span className="font-medium">{terminal._count?.orders || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Shifts</span>
                                        <span className="font-medium">{terminal._count?.shifts || 0}</span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => handleToggleStatus(terminal.id, terminal.isActive)}
                                    >
                                        {terminal.isActive ? 'Deactivate' : 'Activate'}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="shifts" className="space-y-4">
                    <div className="grid gap-4">
                        {shifts.length === 0 ? (
                            <Card>
                                <CardContent className="py-8 text-center text-muted-foreground">
                                    No active shifts
                                </CardContent>
                            </Card>
                        ) : (
                            shifts.map((shift: { id: string; terminal: { name: string }; user: { name: string }; startedAt: string; openingCash: number; ordersCount: number; totalSales: number }) => (
                                <Card key={shift.id}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">{shift.terminal?.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {shift.user?.name} • Started {new Date(shift.startedAt).toLocaleTimeString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm">Opening: Rs. {shift.openingCash}</p>
                                                <p className="text-sm font-medium">
                                                    Orders: {shift.ordersCount || 0} • Sales: Rs. {shift.totalSales || 0}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="payments" className="space-y-4">
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                            Payment method configuration coming soon.
                            <br />
                            Supports: Cash, Cards (Stripe), JazzCash, Easypaisa
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
