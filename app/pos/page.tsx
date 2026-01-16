'use client'

import { useEffect, useState } from 'react'
import { usePOSStore } from '@/lib/stores/pos-store'
import { TerminalSetup } from '@/components/pos/terminal-setup'
import { ShiftManager } from '@/components/pos/shift-manager'
import { POSInterface } from '@/components/pos/pos-interface'

export default function POSPage() {
    // We use a mounting check to avoid hydration mismatch with local storage
    const [mounted, setMounted] = useState(false)
    const terminalId = usePOSStore((state) => state.terminalId)
    const shiftId = usePOSStore((state) => state.shiftId)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return <div className="h-screen bg-gray-50" />

    // 1. If no terminal selected, show setup
    if (!terminalId) {
        return <TerminalSetup />
    }

    // 2. If no shift active, show shift manager
    if (!shiftId) {
        return <ShiftManager />
    }

    // 3. Main POS Interface
    return <POSInterface />
}
