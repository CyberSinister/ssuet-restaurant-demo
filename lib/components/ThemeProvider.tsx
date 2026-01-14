'use client'

import { useEffect, type ReactNode } from 'react'
import { useBrandingStore, hasAdequateContrast } from '@/lib/stores/branding-store'
import {
  fontFamilyOptions,
  headingFontOptions,
} from '@/lib/types/branding'

/**
 * CSS custom property mappings for border radius presets
 */
const radiusMap = {
  none: '0px',
  small: '0.25rem',
  medium: '0.5rem',
  large: '1rem',
  full: '9999px',
} as const

/**
 * Get CSS font-family value from font key
 */
function getFontFamilyValue(fontKey: string): string {
  const font = fontFamilyOptions.find((f) => f.value === fontKey)
  return font?.cssValue ?? 'system-ui, -apple-system, sans-serif'
}

/**
 * Get CSS font-family value for headings from font key
 */
function getHeadingFontValue(fontKey: string): string {
  const font = headingFontOptions.find((f) => f.value === fontKey)
  return font?.cssValue ?? 'system-ui, -apple-system, sans-serif'
}

/**
 * Convert hex color to HSL values for CSS custom properties
 */
function hexToHsl(hex: string): string {
  // Remove # if present
  const cleanHex = hex.replace('#', '')

  // Parse hex to RGB
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

interface ThemeProviderProps {
  children: ReactNode
}

/**
 * ThemeProvider component that applies branding configuration as CSS custom properties.
 * This enables dynamic theming throughout the application based on the admin's settings.
 *
 * Applies the following CSS variables to :root:
 * - --primary, --secondary, --accent (brand colors)
 * - --background, --foreground (page colors)
 * - --muted, --card (UI element colors)
 * - --radius (border radius)
 * - --font-sans, --font-heading (typography)
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const brandingConfig = useBrandingStore((state) => state.brandingConfig)
  // const fetchBrandingConfig = useBrandingStore((state) => state.fetchBrandingConfig)

  // Temporarily disable server fetch to prevent override on refresh if DB is failing.
  // Reliance on persist middleware (localStorage) is safer for now.
  /*
  useEffect(() => {
    fetchBrandingConfig()
  }, [])
  */

  useEffect(() => {
    // We'll create a style tag to inject variables so they can be overridden by .dark class
    // but still take precedence over default :root values
    const styleId = 'branding-styles'
    let styleEl = document.getElementById(styleId) as HTMLStyleElement
    
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = styleId
      document.head.appendChild(styleEl)
    }

    const cssVariables = [
      `--color-background: hsl(${hexToHsl(brandingConfig.backgroundColor)});`,
      `--background: ${hexToHsl(brandingConfig.backgroundColor)};`,
      
      `--color-foreground: hsl(${hexToHsl(brandingConfig.foregroundColor)});`,
      `--color-foreground: ${hexToHsl(brandingConfig.foregroundColor)};`,

      `--color-primary: hsl(${hexToHsl(brandingConfig.primaryColor)});`,
      `--primary: ${hexToHsl(brandingConfig.primaryColor)};`,
      `--color-primary-foreground: #ffffff;`,

      `--color-secondary: hsl(${hexToHsl(brandingConfig.secondaryColor)});`,
      `--secondary: ${hexToHsl(brandingConfig.secondaryColor)};`,
      `--color-secondary-foreground: hsl(${hexToHsl(brandingConfig.foregroundColor)});`,

      `--color-accent: hsl(${hexToHsl(brandingConfig.accentColor)});`,
      `--accent: ${hexToHsl(brandingConfig.accentColor)};`,
      `--color-accent-foreground: ${hasAdequateContrast('#ffffff', brandingConfig.accentColor) ? '#ffffff' : '#000000'};`,

      `--color-muted: hsl(${hexToHsl(brandingConfig.mutedColor)});`,
      `--muted: ${hexToHsl(brandingConfig.mutedColor)};`,

      `--color-card: hsl(${hexToHsl(brandingConfig.cardColor)});`,
      `--card: ${hexToHsl(brandingConfig.cardColor)};`,
      `--color-card-foreground: hsl(${hexToHsl(brandingConfig.foregroundColor)});`,

      `--radius: ${radiusMap[brandingConfig.borderRadius] ?? radiusMap.medium};`,
      `--font-sans: ${getFontFamilyValue(brandingConfig.fontFamily)};`,
      `--font-heading: ${getHeadingFontValue(brandingConfig.headingFont)};`
    ].join('\n')

    // Inject styles targeting :root (or specific selectors if needed)
    // We add !important to these ONLY for the light theme context or default base
    // However, since we want them to generally apply but NOT override .dark,
    // we define them on :root. 
    // Base styles (applied to :root)
    styleEl.innerHTML = `
      :root {
        ${cssVariables}
      }

      /* Dark Mode Surface Overrides */
      .dark {
        --color-background: oklch(0.12 0 0);
        --color-foreground: oklch(0.98 0 0);
        
        --color-card: oklch(0.17 0 0);
        --color-card-foreground: oklch(0.98 0 0);
        
        --color-popover: oklch(0.15 0 0);
        --color-popover-foreground: oklch(0.98 0 0);
        
        --color-muted: oklch(0.25 0 0);
        --color-muted-foreground: oklch(0.7 0 0);
        
        --color-border: oklch(0.25 0 0);
        --color-input: oklch(0.25 0 0);
      }
    `

    // Apply dark mode
    const root = document.documentElement
    if (brandingConfig.darkMode) {
      root.classList.add('dark')
      root.setAttribute('data-appearance', 'dark')
    } else {
      root.classList.remove('dark')
      root.removeAttribute('data-appearance')
    }

    // Update favicon if provided
    if (brandingConfig.faviconUrl) {
      const existingFavicon = document.querySelector('link[rel="icon"]')
      if (existingFavicon) {
        existingFavicon.setAttribute('href', brandingConfig.faviconUrl)
      } else {
        const favicon = document.createElement('link')
        favicon.rel = 'icon'
        favicon.href = brandingConfig.faviconUrl
        document.head.appendChild(favicon)
      }
    }
  }, [brandingConfig])

  return <>{children}</>
}

export default ThemeProvider
