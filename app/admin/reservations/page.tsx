'use client'

import { useState } from 'react'
import { useReservations, useWaitlist, confirmReservation, seatReservation, cancelReservation, notifyWaitlistEntry, seatWaitlistEntry } from '@/lib/hooks/use-reservations'
import { useTables } from '@/lib/hooks/use-tables'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
    CalendarDaysIcon,
    ClockIcon,
    UsersIcon,
    CheckIcon,
    XMarkIcon,
    BellIcon,
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'

// Define proper types
interface Reservation {
    id: string
    guestName: string
    guestPhone?: string
    partySize: number
    startTime: string
    status: string
    tableId?: string
    table?: { tableNumber: string }
    specialRequests?: string
}

interface WaitlistEntry {
    id: string
    guestName: string
    guestPhone: string
    partySize: number
    estimatedWait: number
    status: string
    position: number
}

interface Table {
    id: string
    tableNumber: string
    status: string
    maxSeats: number
}

export default function ReservationsPage() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const dateStr = format(selectedDate, 'yyyy-MM-dd')

    const { reservations, isLoading, refresh } = useReservations({ date: dateStr })
    const { entries: waitlist, refresh: refreshWaitlist } = useWaitlist('default-location', 'WAITING,NOTIFIED')
    const { tables } = useTables({ status: 'AVAILABLE' })

    const [seatTableId, setSeatTableId] = useState('')
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    const handleConfirm = async (id: string) => {
        setActionLoading(id)
        try {
            await confirmReservation(id)
            refresh()
        } catch (error) {
            console.error('Failed to confirm:', error)
        }
        setActionLoading(null)
    }

    const handleSeat = async (id: string, tableId?: string) => {
        setActionLoading(id)
        try {
            await seatReservation(id, tableId)
            refresh()
        } catch (error) {
            console.error('Failed to seat:', error)
        }
        setActionLoading(null)
    }

    const handleCancel = async (id: string) => {
        setActionLoading(id)
        try {
            await cancelReservation(id, 'Cancelled by staff')
            refresh()
        } catch (error) {
            console.error('Failed to cancel:', error)
        }
        setActionLoading(null)
    }

    const handleNotifyWaitlist = async (id: string) => {
        setActionLoading(id)
        try {
            await notifyWaitlistEntry(id, 'SMS')
            refreshWaitlist()
        } catch (error) {
            console.error('Failed to notify:', error)
        }
        setActionLoading(null)
    }

    const handleSeatWaitlist = async (id: string, tableId: string) => {
        setActionLoading(id)
        try {
            await seatWaitlistEntry(id, tableId)
            refreshWaitlist()
        } catch (error) {
            console.error('Failed to seat:', error)
        }
        setActionLoading(null)
    }

    const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
        switch (status) {
            case 'CONFIRMED': return 'default'
            case 'SEATED': return 'default'
            case 'PENDING': return 'secondary'
            case 'CANCELLED': return 'destructive'
            case 'NO_SHOW': return 'destructive'
            default: return 'outline'
        }
    }

    // Group reservations by time
    const groupedReservations = reservations.reduce((acc: Record<string, Reservation[]>, res: Reservation) => {
        const hour = new Date(res.startTime).getHours()
        const timeSlot = `${hour.toString().padStart(2, '0')}:00`
        if (!acc[timeSlot]) acc[timeSlot] = []
        acc[timeSlot].push(res)
        return acc
    }, {} as Record<string, Reservation[]>)

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Reservations</h1>
                    <p className="text-muted-foreground">Manage reservations and walk-in waitlist</p>
                </div>
                <Button>New Reservation</Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <CalendarDaysIcon className="h-8 w-8 text-blue-500" />
                            <div>
                                <p className="text-sm text-muted-foreground">Today's Reservations</p>
                                <p className="text-2xl font-bold">{reservations.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <ClockIcon className="h-8 w-8 text-yellow-500" />
                            <div>
                                <p className="text-sm text-muted-foreground">Pending</p>
                                <p className="text-2xl font-bold">
                                    {reservations.filter((r: Reservation) => r.status === 'PENDING').length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <UsersIcon className="h-8 w-8 text-orange-500" />
                            <div>
                                <p className="text-sm text-muted-foreground">Waitlist</p>
                                <p className="text-2xl font-bold">{waitlist.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <CheckIcon className="h-8 w-8 text-green-500" />
                            <div>
                                <p className="text-sm text-muted-foreground">Seated</p>
                                <p className="text-2xl font-bold">
                                    {reservations.filter((r: Reservation) => r.status === 'SEATED').length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="reservations" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="reservations">
                        <CalendarDaysIcon className="h-4 w-4 mr-2" />
                        Reservations
                    </TabsTrigger>
                    <TabsTrigger value="waitlist">
                        <ClockIcon className="h-4 w-4 mr-2" />
                        Waitlist ({waitlist.length})
                    </TabsTrigger>
                    <TabsTrigger value="calendar">
                        <CalendarDaysIcon className="h-4 w-4 mr-2" />
                        Calendar View
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="reservations" className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline">
                                    <CalendarDaysIcon className="h-4 w-4 mr-2" />
                                    {format(selectedDate, 'PPP')}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={(date) => date && setSelectedDate(date)}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {isLoading ? (
                        <div className="py-8 text-center">Loading...</div>
                    ) : reservations.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center text-muted-foreground">
                                No reservations for this date
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(groupedReservations as Record<string, Reservation[]>).sort().map(([timeSlot, slotReservations]) => (
                                <div key={timeSlot}>
                                    <h3 className="text-lg font-semibold mb-3">{timeSlot}</h3>
                                    <div className="grid gap-3">
                                        {slotReservations.map((res: Reservation) => (
                                            <Card key={res.id}>
                                                <CardContent className="p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div>
                                                                <p className="font-medium">{res.guestName}</p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {res.partySize} guests • {format(new Date(res.startTime), 'h:mm a')}
                                                                </p>
                                                                {res.table && (
                                                                    <p className="text-sm">Table: {res.table.tableNumber}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant={getStatusBadgeVariant(res.status)}>
                                                                {res.status}
                                                            </Badge>
                                                            {res.status === 'PENDING' && (
                                                                <>
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => handleConfirm(res.id)}
                                                                        disabled={actionLoading === res.id}
                                                                    >
                                                                        <CheckIcon className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        onClick={() => handleCancel(res.id)}
                                                                        disabled={actionLoading === res.id}
                                                                    >
                                                                        <XMarkIcon className="h-4 w-4" />
                                                                    </Button>
                                                                </>
                                                            )}
                                                            {res.status === 'CONFIRMED' && (
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => handleSeat(res.id, res.tableId)}
                                                                    disabled={actionLoading === res.id}
                                                                >
                                                                    Seat
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="waitlist" className="space-y-4">
                    <div className="flex items-center gap-4 mb-4">
                        <Input placeholder="Guest name" className="max-w-xs" />
                        <Input placeholder="Phone" className="max-w-xs" />
                        <Input placeholder="Party size" type="number" className="max-w-[100px]" />
                        <Button>Add to Waitlist</Button>
                    </div>

                    {waitlist.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center text-muted-foreground">
                                No guests on waitlist
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {waitlist.map((entry: WaitlistEntry, index: number) => (
                                <Card key={entry.id}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{entry.guestName}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {entry.partySize} guests • Est. {entry.estimatedWait} min
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={entry.status === 'NOTIFIED' ? 'default' : 'secondary'}>
                                                    {entry.status}
                                                </Badge>
                                                {entry.status === 'WAITING' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleNotifyWaitlist(entry.id)}
                                                        disabled={actionLoading === entry.id}
                                                    >
                                                        <BellIcon className="h-4 w-4 mr-1" />
                                                        Notify
                                                    </Button>
                                                )}
                                                <select
                                                    className="h-9 rounded-md border px-3"
                                                    value={seatTableId}
                                                    onChange={(e) => setSeatTableId(e.target.value)}
                                                >
                                                    <option value="">Select table</option>
                                                    {tables.filter((t: Table) => t.maxSeats >= entry.partySize).map((t: Table) => (
                                                        <option key={t.id} value={t.id}>
                                                            {t.tableNumber} ({t.maxSeats} seats)
                                                        </option>
                                                    ))}
                                                </select>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleSeatWaitlist(entry.id, seatTableId)}
                                                    disabled={!seatTableId || actionLoading === entry.id}
                                                >
                                                    Seat
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="calendar" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Calendar View</CardTitle>
                            <CardDescription>Weekly reservation overview</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center text-muted-foreground py-12">
                                Calendar view with time slots coming soon.
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
