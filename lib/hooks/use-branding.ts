import { useBrandingStore } from '@/lib/stores/branding-store'
import { borderRadiusMap, fontFamilyOptions, headingFontOptions } from '@/lib/types/branding'

/**
 * Default fallback logo path when no custom logo is set
 */
const DEFAULT_LOGO_PATH = '/default-logo.svg'

/**
 * Hook for accessing branding configuration with derived values.
 * Provides easy access to the current theme settings and commonly needed computed values.
 *
 * @example
 * ```tsx
 * function Header() {
 *   const { logoOrFallback, logoAlt, primaryColor, hasLogo } = useBranding()
 *
 *   return (
 *     <header style={{ backgroundColor: primaryColor }}>
 *       <img src={logoOrFallback} alt={logoAlt} />
 *     </header>
 *   )
 * }
 * ```
 */
export function useBranding() {
  const brandingConfig = useBrandingStore((state) => state.brandingConfig)

  // Get CSS value for border radius
  const radiusCssValue = borderRadiusMap[brandingConfig.borderRadius] ?? borderRadiusMap.medium

  // Get CSS font-family values
  const fontFamilyCssValue =
    fontFamilyOptions.find((f) => f.value === brandingConfig.fontFamily)?.cssValue ??
    'system-ui, -apple-system, sans-serif'

  const headingFontCssValue =
    headingFontOptions.find((f) => f.value === brandingConfig.headingFont)?.cssValue ??
    'system-ui, -apple-system, sans-serif'

  return {
    // Spread all config values for direct access
    ...brandingConfig,

    // Derived values
    /**
     * Whether a custom logo has been set
     */
    hasLogo: !!brandingConfig.logoUrl,

    /**
     * Whether a custom favicon has been set
     */
    hasFavicon: !!brandingConfig.faviconUrl,

    /**
     * Logo URL with fallback to default logo
     */
    logoOrFallback: brandingConfig.logoUrl || DEFAULT_LOGO_PATH,

    /**
     * CSS value for the current border radius setting
     */
    radiusCssValue,

    /**
     * CSS font-family value for body text
     */
    fontFamilyCssValue,

    /**
     * CSS font-family value for headings
     */
    headingFontCssValue,

    /**
     * Whether the theme is in light mode
     */
    isLightMode: !brandingConfig.darkMode,
  }
}

/**
 * Hook for accessing only color-related branding values.
 * Use this when you only need colors for better performance.
 */
export function useBrandingColors() {
  const brandingConfig = useBrandingStore((state) => state.brandingConfig)

  return {
    primaryColor: brandingConfig.primaryColor,
    secondaryColor: brandingConfig.secondaryColor,
    accentColor: brandingConfig.accentColor,
    backgroundColor: brandingConfig.backgroundColor,
    foregroundColor: brandingConfig.foregroundColor,
    mutedColor: brandingConfig.mutedColor,
    cardColor: brandingConfig.cardColor,
  }
}

/**
 * Hook for accessing only typography-related branding values.
 * Use this when you only need font settings for better performance.
 */
export function useBrandingTypography() {
  const brandingConfig = useBrandingStore((state) => state.brandingConfig)

  const fontFamilyCssValue =
    fontFamilyOptions.find((f) => f.value === brandingConfig.fontFamily)?.cssValue ??
    'system-ui, -apple-system, sans-serif'

  const headingFontCssValue =
    headingFontOptions.find((f) => f.value === brandingConfig.headingFont)?.cssValue ??
    'system-ui, -apple-system, sans-serif'

  return {
    fontFamily: brandingConfig.fontFamily,
    headingFont: brandingConfig.headingFont,
    borderRadius: brandingConfig.borderRadius,
    fontFamilyCssValue,
    headingFontCssValue,
    radiusCssValue: borderRadiusMap[brandingConfig.borderRadius] ?? borderRadiusMap.medium,
  }
}

/**
 * Hook for accessing branding store actions.
 * Use this when you need to update branding configuration.
 */
export function useBrandingActions() {
  const setBrandingConfig = useBrandingStore((state) => state.setBrandingConfig)
  const updateBrandingConfig = useBrandingStore((state) => state.updateBrandingConfig)
  const resetToDefaults = useBrandingStore((state) => state.resetToDefaults)
  const setLogo = useBrandingStore((state) => state.setLogo)
  const setColors = useBrandingStore((state) => state.setColors)
  const setFonts = useBrandingStore((state) => state.setFonts)
  const setBorderRadius = useBrandingStore((state) => state.setBorderRadius)
  const toggleDarkMode = useBrandingStore((state) => state.toggleDarkMode)

  return {
    setBrandingConfig,
    updateBrandingConfig,
    resetToDefaults,
    setLogo,
    setColors,
    setFonts,
    setBorderRadius,
    toggleDarkMode,
  }
}

export default useBranding
