/**
 * Branding and theme configuration types for the restaurant ordering app.
 * Allows admins to customize logo, colors, and overall theme.
 */

export interface BrandingConfig {
  // Logo
  logoUrl: string
  mobileLogoUrl: string
  logoAlt: string
  faviconUrl: string

  // Colors (hex values)
  primaryColor: string      // Main brand color (buttons, links, accents)
  secondaryColor: string    // Secondary accent
  accentColor: string       // Highlights, badges
  backgroundColor: string   // Page background
  foregroundColor: string   // Text color
  mutedColor: string        // Muted text, borders
  cardColor: string         // Card backgrounds

  // Typography
  fontFamily: string        // 'inter' | 'poppins' | 'roboto' | 'system'
  headingFont: string       // 'poppins' | 'inter' | 'playfair' | 'system'

  // Border radius preset
  borderRadius: 'none' | 'small' | 'medium' | 'large' | 'full'

  // Dark mode
  darkMode: boolean
}

export const defaultBrandingConfig: BrandingConfig = {
  logoUrl: '',
  mobileLogoUrl: '',
  logoAlt: 'Broadway Pizza',
  faviconUrl: '',
  primaryColor: '#16a34a',      // Primary Green
  secondaryColor: '#0d9488',    // Secondary Teal
  accentColor: '#eab308',       // Accent Yellow
  backgroundColor: '#ffffff',   // Light background default
  foregroundColor: '#0f172a',   // Dark text default
  mutedColor: '#f1f5f9',        // Light muted gray
  cardColor: '#ffffff',         // White card background
  fontFamily: 'inter',
  headingFont: 'poppins',
  borderRadius: 'medium',
  darkMode: false,              // Default to Light mode
}

/**
 * Type for color-related properties in BrandingConfig
 */
export type BrandingColorKeys =
  | 'primaryColor'
  | 'secondaryColor'
  | 'accentColor'
  | 'backgroundColor'
  | 'foregroundColor'
  | 'mutedColor'
  | 'cardColor'

/**
 * Partial type for updating only color properties
 */
export type BrandingColors = Pick<BrandingConfig, BrandingColorKeys>

/**
 * Font configuration type
 */
export interface FontConfig {
  fontFamily?: string
  headingFont?: string
}

/**
 * Border radius options with CSS values
 */
export const borderRadiusMap: Record<BrandingConfig['borderRadius'], string> = {
  none: '0px',
  small: '0.25rem',
  medium: '0.5rem',
  large: '1rem',
  full: '9999px',
}

/**
 * Available font family options
 */
export const fontFamilyOptions = [
  { value: 'inter', label: 'Inter', cssValue: 'var(--font-inter), sans-serif' },
  { value: 'poppins', label: 'Poppins', cssValue: 'var(--font-poppins), sans-serif' },
  { value: 'roboto', label: 'Roboto', cssValue: 'var(--font-roboto), sans-serif' },
  { value: 'system', label: 'System Default', cssValue: 'system-ui, -apple-system, sans-serif' },
] as const

/**
 * Available heading font options
 */
export const headingFontOptions = [
  { value: 'poppins', label: 'Poppins', cssValue: 'var(--font-poppins), sans-serif' },
  { value: 'inter', label: 'Inter', cssValue: 'var(--font-inter), sans-serif' },
  { value: 'playfair', label: 'Playfair Display', cssValue: 'var(--font-playfair), serif' },
  { value: 'system', label: 'System Default', cssValue: 'system-ui, -apple-system, sans-serif' },
] as const

/**
 * Color preset for quick theme selection
 */
export interface ColorPreset {
  id: string
  name: string
  colors: Partial<BrandingColors>
}

/**
 * Predefined color presets
 */
export const colorPresets: ColorPreset[] = [
  {
    id: 'blue-default',
    name: 'Blue (Default)',
    colors: {
      primaryColor: '#2563eb',
      secondaryColor: '#7c3aed',
      accentColor: '#f59e0b',
    },
  },
  {
    id: 'green-fresh',
    name: 'Fresh Green',
    colors: {
      primaryColor: '#16a34a',
      secondaryColor: '#0d9488',
      accentColor: '#eab308',
    },
  },
  {
    id: 'orange-warm',
    name: 'Warm Orange',
    colors: {
      primaryColor: '#ea580c',
      secondaryColor: '#dc2626',
      accentColor: '#fbbf24',
    },
  },
  {
    id: 'purple-royal',
    name: 'Royal Purple',
    colors: {
      primaryColor: '#7c3aed',
      secondaryColor: '#ec4899',
      accentColor: '#06b6d4',
    },
  },
  {
    id: 'slate-modern',
    name: 'Modern Slate',
    colors: {
      primaryColor: '#475569',
      secondaryColor: '#64748b',
      accentColor: '#f43f5e',
    },
  },
]
