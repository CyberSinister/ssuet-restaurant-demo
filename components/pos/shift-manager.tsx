'use client'

import { useState } from 'react'
import { useCurrentShift, openShift } from '@/lib/hooks/use-pos'
import { usePOSStore } from '@/lib/stores/pos-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ClockIcon, CurrencyDollarIcon, UserIcon } from '@heroicons/react/24/outline'

// Mock current user - in real app, get from auth context
const MOCK_USER_ID = 'user-1' // You should replace this with actual session user ID

export function ShiftManager() {
    const terminalId = usePOSStore((state) => state.terminalId)
    const setShift = usePOSStore((state) => state.setShift)

    // Check for open shift
    const { shift, isLoading, error } = useCurrentShift(terminalId!)
    const [openingCash, setOpeningCash] = useState('0')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleOpenShift = async () => {
        if (!terminalId) return
        setIsSubmitting(true)
        try {
            const newShift = await openShift({
                terminalId,
                userId: MOCK_USER_ID, // TODO: Replace with auth.user.id
                openingCash: parseFloat(openingCash) || 0
            })
            setShift(newShift.shift.id, MOCK_USER_ID)
        } catch (err) {
            console.error('Failed to open shift:', err)
        } finally {
            setIsSubmitting(false)
        }
    }

    // If we have an open shift in the API but not in store, sync it
    if (shift && !isLoading) {
        setShift(shift.id, shift.userId)
        return null // Will trigger parent to render POS Interface
    }

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="text-center">Checking shift status...</div>
            </div>
        )
    }

    return (
        <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                        <ClockIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle>Open Shift</CardTitle>
                    <CardDescription>Start a new shift for this terminal</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="cashier">Cashier</Label>
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input id="cashier" value="Current User (Staff)" disabled className="pl-9" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="opening-cash">Opening Cash Amount</Label>
                        <div className="relative">
                            <CurrencyDollarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="opening-cash"
                                type="number"
                                min="0"
                                step="0.01"
                                value={openingCash}
                                onChange={(e) => setOpeningCash(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <Button
                        className="w-full"
                        onClick={handleOpenShift}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Opening Shift...' : 'Open Shift'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
