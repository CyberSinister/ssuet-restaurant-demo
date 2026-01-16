'use client'

import { useState } from 'react'
import { useTerminals } from '@/lib/hooks/use-pos'
import { usePOSStore } from '@/lib/stores/pos-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ComputerDesktopIcon } from '@heroicons/react/24/outline'

export function TerminalSetup() {
    const { terminals, isLoading } = useTerminals()
    const setTerminal = usePOSStore((state) => state.setTerminal)
    const [selectedId, setSelectedId] = useState<string>('')

    const handleConfirm = () => {
        if (!selectedId) return
        const terminal = terminals.find((t: any) => t.id === selectedId)
        if (terminal) {
            setTerminal(terminal.id, terminal.name, terminal.locationId)
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="text-center">Loading terminals...</div>
            </div>
        )
    }

    return (
        <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <ComputerDesktopIcon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Terminal Setup</CardTitle>
                    <CardDescription>Select this device's terminal configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Select Terminal</label>
                        <Select value={selectedId} onValueChange={setSelectedId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose terminal..." />
                            </SelectTrigger>
                            <SelectContent>
                                {terminals.map((t: any) => (
                                    <SelectItem key={t.id} value={t.id}>
                                        {t.name} ({t.location?.name || 'Unknown Location'})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        className="w-full"
                        onClick={handleConfirm}
                        disabled={!selectedId}
                    >
                        Initialize Terminal
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
