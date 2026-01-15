'use client'

import React from 'react'
import { Sun, Moon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { useBrandingStore, selectIsDarkMode } from '@/lib/stores/branding-store'

export function ThemeSwitcher() {
  const isDark = useBrandingStore(selectIsDarkMode)
  const toggleDarkMode = useBrandingStore((state) => state.toggleDarkMode)

  return (
    <Button
      variant="ghost" 
      size="icon"
      onClick={toggleDarkMode}
      className={`rounded-full w-9 h-9 transition-colors ${
        isDark 
          ? 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10' 
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
      }`}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun weight="fill" className="h-5 w-5" />
      ) : (
        <Moon weight="bold" className="h-5 w-5" />
      )}
    </Button>
  )
}
