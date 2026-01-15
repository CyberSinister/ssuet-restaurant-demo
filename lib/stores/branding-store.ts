import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
  BrandingConfig,
  defaultBrandingConfig,
  BrandingColors,
} from '@/lib/types/branding'

/**
 * Branding store state interface
 */
interface BrandingState {
  brandingConfig: BrandingConfig
}

/**
 * Branding store actions interface
 */
interface BrandingActions {
  /**
   * Replace the entire branding configuration
   */
  setBrandingConfig: (config: BrandingConfig) => void

  /**
   * Partially update the branding configuration
   */
  updateBrandingConfig: (partial: Partial<BrandingConfig>) => void

  /**
   * Reset all branding settings to defaults
   */
  resetToDefaults: () => void

  /**
   * Set the logo URL and optionally the alt text
   */
  setLogo: (url: string, alt?: string) => void

  /**
   * Update one or more color values
   */
  setColors: (colors: Partial<Pick<BrandingConfig, 'primaryColor' | 'secondaryColor' | 'accentColor' | 'backgroundColor' | 'foregroundColor' | 'mutedColor' | 'cardColor'>>) => void

  /**
   * Update font family and/or heading font
   */
  setFonts: (fonts: { fontFamily?: string; headingFont?: string }) => void

  /**
   * Set the border radius preset
   */
  setBorderRadius: (radius: BrandingConfig['borderRadius']) => void

  /**
   * Toggle dark mode on/off
   */
  toggleDarkMode: () => void

  /**
   * Fetch branding config from the server
   */
  fetchBrandingConfig: () => Promise<void>

  /**
   * Save branding config to the server
   */
  saveBrandingConfig: (config: BrandingConfig) => Promise<void>
}

/**
 * Combined store type
 */
type BrandingStore = BrandingState & BrandingActions

/**
 * Zustand store for managing branding and theme configuration.
 * Persists to localStorage under the key 'branding-config'.
 */
export const useBrandingStore = create<BrandingStore>()(
  persist(
    (set) => ({
      // Initial state
      brandingConfig: defaultBrandingConfig,

      // Actions
      setBrandingConfig: (config) =>
        set({ brandingConfig: config }),

      updateBrandingConfig: (partial) =>
        set((state) => ({
          brandingConfig: {
            ...state.brandingConfig,
            ...partial,
          },
        })),

      resetToDefaults: () =>
        set({ brandingConfig: defaultBrandingConfig }),

      setLogo: (url, alt) =>
        set((state) => ({
          brandingConfig: {
            ...state.brandingConfig,
            logoUrl: url,
            ...(alt !== undefined && { logoAlt: alt }),
          },
        })),

      setColors: (colors) =>
        set((state) => ({
          brandingConfig: {
            ...state.brandingConfig,
            ...colors,
          },
        })),

      setFonts: (fonts) =>
        set((state) => ({
          brandingConfig: {
            ...state.brandingConfig,
            ...(fonts.fontFamily !== undefined && { fontFamily: fonts.fontFamily }),
            ...(fonts.headingFont !== undefined && { headingFont: fonts.headingFont }),
          },
        })),

      setBorderRadius: (radius) =>
        set((state) => ({
          brandingConfig: {
            ...state.brandingConfig,
            borderRadius: radius,
          },
        })),

      toggleDarkMode: () =>
        set((state) => ({
          brandingConfig: {
            ...state.brandingConfig,
            darkMode: !state.brandingConfig.darkMode,
          },
        })),

      fetchBrandingConfig: async () => {
        try {
            const res = await fetch('/api/branding')
            if (res.ok) {
                const config = await res.json()
                if (config && config.id) {
                    set({ brandingConfig: config })
                }
            }
        } catch (err) {
            console.error('Failed to fetch branding config from server', err)
        }
      },

      saveBrandingConfig: async (config) => {
        // Opt: update local immediately
        set({ brandingConfig: config })
        
        try {
            const res = await fetch('/api/branding', {
                method: 'PUT',
                body: JSON.stringify(config)
            })
            if (!res.ok) {
                 console.error('Failed to save branding to server')
            }
        } catch (err) {
            console.error('Failed to save branding config to server', err)
        }
      },
    }),
    {
      name: 'branding-config',
      storage: createJSONStorage(() => localStorage),
      // Merge persisted state with defaults to handle schema changes gracefully
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<BrandingStore> | undefined
        const persistedConfig = persisted?.brandingConfig
        
        // If we have saved data in localStorage, trust it 100% to prevent "resetting" on refresh.
        if (persistedConfig) {
             return {
                 ...currentState,
                 brandingConfig: {
                     ...defaultBrandingConfig, // Safety net for missing keys
                     ...persistedConfig // Use the saved data
                 }
             }
        }
        
        // Otherwise use default
        return currentState
      },
    }
  )
)

export type { BrandingStore, BrandingState, BrandingActions }

/**
 * Selector for getting only the branding config (for memoization)
 */
export const selectBrandingConfig = (state: BrandingStore): BrandingConfig =>
  state.brandingConfig

/**
 * Selector for checking if dark mode is enabled
 */
export const selectIsDarkMode = (state: BrandingStore): boolean =>
  state.brandingConfig.darkMode

/**
 * Selector for getting colors only
 */
export const selectColors = (state: BrandingStore): BrandingColors => ({
  primaryColor: state.brandingConfig.primaryColor,
  secondaryColor: state.brandingConfig.secondaryColor,
  accentColor: state.brandingConfig.accentColor,
  backgroundColor: state.brandingConfig.backgroundColor,
  foregroundColor: state.brandingConfig.foregroundColor,
  mutedColor: state.brandingConfig.mutedColor,
  cardColor: state.brandingConfig.cardColor,
})

// Utility function to calculate contrast ratio between two colors
export function getContrastRatio(foreground: string, background: string): number {
  const getLuminance = (hex: string): number => {
    const rgb = hexToRgb(hex)
    if (!rgb) return 0

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
      const sRGB = c / 255
      return sRGB <= 0.03928
        ? sRGB / 12.92
        : Math.pow((sRGB + 0.055) / 1.055, 2.4)
    })

    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  const l1 = getLuminance(foreground)
  const l2 = getLuminance(background)

  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  return (lighter + 0.05) / (darker + 0.05)
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

export function isValidHexColor(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex)
}

// WCAG AA requires a contrast ratio of at least 4.5:1 for normal text
export function hasAdequateContrast(foreground: string, background: string): boolean {
  return getContrastRatio(foreground, background) >= 4.5
}
