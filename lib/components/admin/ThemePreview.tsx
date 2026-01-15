'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ShoppingCart, Star, MapPin } from '@phosphor-icons/react'
import { useBrandingStore } from '@/lib/stores/branding-store'
import { fontFamilyOptions, headingFontOptions, borderRadiusMap } from '@/lib/types/branding'

export default function ThemePreview() {
  const { brandingConfig } = useBrandingStore()

  const bodyFontCss =
    fontFamilyOptions.find((f) => f.value === brandingConfig.fontFamily)?.cssValue ||
    'system-ui, sans-serif'

  const headingFontCss =
    headingFontOptions.find((f) => f.value === brandingConfig.headingFont)?.cssValue ||
    'system-ui, sans-serif'

  const borderRadius = borderRadiusMap[brandingConfig.borderRadius]

  // Derive text color for buttons based on background luminance
  const getButtonTextColor = (bgColor: string): string => {
    const hex = bgColor.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5 ? '#000000' : '#ffffff'
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Live Theme Preview</CardTitle>
          <CardDescription>
            See how your branding choices look in a real-world context
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Preview Container */}
          <div
            className="border rounded-lg overflow-hidden"
            style={{
              backgroundColor: brandingConfig.backgroundColor,
              fontFamily: bodyFontCss,
            }}
          >
            {/* Header Preview */}
            <header
              className="px-4 py-3 border-b flex items-center justify-between"
              style={{
                backgroundColor: brandingConfig.cardColor,
                borderColor: brandingConfig.mutedColor + '40',
              }}
            >
              <div className="flex items-center gap-3">
                {brandingConfig.logoUrl ? (
                  <img
                    src={brandingConfig.logoUrl}
                    alt={brandingConfig.logoAlt}
                    className="h-8 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <span
                    className="text-xl font-bold"
                    style={{
                      fontFamily: headingFontCss,
                      color: brandingConfig.primaryColor,
                    }}
                  >
                    Restaurant
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="p-2 relative"
                  style={{ color: brandingConfig.foregroundColor }}
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span
                    className="absolute -top-1 -right-1 w-4 h-4 text-xs flex items-center justify-center"
                    style={{
                      backgroundColor: brandingConfig.accentColor,
                      color: getButtonTextColor(brandingConfig.accentColor),
                      borderRadius: '9999px',
                    }}
                  >
                    3
                  </span>
                </button>
              </div>
            </header>

            {/* Content Preview */}
            <div className="p-4 space-y-4">
              {/* Hero Section */}
              <div
                className="p-6 text-center"
                style={{
                  backgroundColor: brandingConfig.primaryColor + '10',
                  borderRadius,
                }}
              >
                <h1
                  className="text-2xl font-bold mb-2"
                  style={{
                    fontFamily: headingFontCss,
                    color: brandingConfig.foregroundColor,
                  }}
                >
                  Welcome to Our Restaurant
                </h1>
                <p style={{ color: brandingConfig.mutedColor }}>
                  Delicious food delivered to your door
                </p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <MapPin
                    className="w-4 h-4"
                    style={{ color: brandingConfig.primaryColor }}
                  />
                  <span
                    className="text-sm"
                    style={{ color: brandingConfig.mutedColor }}
                  >
                    123 Food Street, Cuisine City
                  </span>
                </div>
              </div>

              {/* Menu Item Card */}
              <div
                className="p-4 border"
                style={{
                  backgroundColor: brandingConfig.cardColor,
                  borderColor: brandingConfig.mutedColor + '30',
                  borderRadius,
                }}
              >
                <div className="flex gap-4">
                  <div
                    className="w-24 h-24 bg-cover bg-center shrink-0"
                    style={{
                      backgroundImage:
                        'url(https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&q=80)',
                      borderRadius,
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className="font-semibold"
                        style={{
                          fontFamily: headingFontCss,
                          color: brandingConfig.foregroundColor,
                        }}
                      >
                        Margherita Pizza
                      </h3>
                      <span
                        className="px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: brandingConfig.accentColor,
                          color: getButtonTextColor(brandingConfig.accentColor),
                          borderRadius,
                        }}
                      >
                        Popular
                      </span>
                    </div>
                    <p
                      className="text-sm mt-1 line-clamp-2"
                      style={{ color: brandingConfig.mutedColor }}
                    >
                      Classic Italian pizza with fresh mozzarella, tomatoes, and basil
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className="w-3 h-3"
                          weight={star <= 4 ? 'fill' : 'regular'}
                          style={{
                            color:
                              star <= 4
                                ? brandingConfig.accentColor
                                : brandingConfig.mutedColor,
                          }}
                        />
                      ))}
                      <span
                        className="text-xs ml-1"
                        style={{ color: brandingConfig.mutedColor }}
                      >
                        4.0 (128)
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span
                        className="font-semibold"
                        style={{ color: brandingConfig.primaryColor }}
                      >
                        $14.99
                      </span>
                      <button
                        className="px-4 py-1.5 text-sm font-medium"
                        style={{
                          backgroundColor: brandingConfig.primaryColor,
                          color: getButtonTextColor(brandingConfig.primaryColor),
                          borderRadius,
                        }}
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Buttons Row */}
              <div className="flex flex-wrap gap-2">
                <button
                  className="px-4 py-2 text-sm font-medium"
                  style={{
                    backgroundColor: brandingConfig.primaryColor,
                    color: getButtonTextColor(brandingConfig.primaryColor),
                    borderRadius,
                  }}
                >
                  Primary Button
                </button>
                <button
                  className="px-4 py-2 text-sm font-medium"
                  style={{
                    backgroundColor: brandingConfig.secondaryColor,
                    color: getButtonTextColor(brandingConfig.secondaryColor),
                    borderRadius,
                  }}
                >
                  Secondary
                </button>
                <button
                  className="px-4 py-2 text-sm font-medium border"
                  style={{
                    backgroundColor: 'transparent',
                    borderColor: brandingConfig.primaryColor,
                    color: brandingConfig.primaryColor,
                    borderRadius,
                  }}
                >
                  Outline
                </button>
                <span
                  className="px-3 py-2 text-sm font-medium"
                  style={{
                    backgroundColor: brandingConfig.accentColor,
                    color: getButtonTextColor(brandingConfig.accentColor),
                    borderRadius,
                  }}
                >
                  Accent Badge
                </span>
              </div>

              {/* Categories */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {['All', 'Pizza', 'Pasta', 'Salads', 'Drinks'].map((cat, i) => (
                  <button
                    key={cat}
                    className="px-4 py-2 text-sm font-medium whitespace-nowrap"
                    style={{
                      backgroundColor: i === 0 ? brandingConfig.primaryColor : 'transparent',
                      color:
                        i === 0
                          ? getButtonTextColor(brandingConfig.primaryColor)
                          : brandingConfig.foregroundColor,
                      border: i !== 0 ? `1px solid ${brandingConfig.mutedColor}40` : 'none',
                      borderRadius,
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Typography Sample */}
              <div
                className="p-4 border"
                style={{
                  backgroundColor: brandingConfig.cardColor,
                  borderColor: brandingConfig.mutedColor + '30',
                  borderRadius,
                }}
              >
                <h2
                  className="text-lg font-semibold mb-2"
                  style={{
                    fontFamily: headingFontCss,
                    color: brandingConfig.foregroundColor,
                  }}
                >
                  Typography Sample
                </h2>
                <p style={{ color: brandingConfig.foregroundColor }}>
                  This is body text in your selected font. It should be easy to read and
                  complement your headings.
                </p>
                <p
                  className="text-sm mt-2"
                  style={{ color: brandingConfig.mutedColor }}
                >
                  This is muted text for secondary information, descriptions, and metadata.
                </p>
                <a
                  href="#"
                  className="text-sm mt-2 inline-block"
                  style={{ color: brandingConfig.primaryColor }}
                  onClick={(e) => e.preventDefault()}
                >
                  This is a link
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Settings Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Current Settings</CardTitle>
          <CardDescription>Summary of your branding configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Primary</p>
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded border"
                  style={{ backgroundColor: brandingConfig.primaryColor }}
                />
                <code className="text-xs">{brandingConfig.primaryColor}</code>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Secondary</p>
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded border"
                  style={{ backgroundColor: brandingConfig.secondaryColor }}
                />
                <code className="text-xs">{brandingConfig.secondaryColor}</code>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Accent</p>
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded border"
                  style={{ backgroundColor: brandingConfig.accentColor }}
                />
                <code className="text-xs">{brandingConfig.accentColor}</code>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Background</p>
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded border"
                  style={{ backgroundColor: brandingConfig.backgroundColor }}
                />
                <code className="text-xs">{brandingConfig.backgroundColor}</code>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Body Font</p>
              <p className="font-medium">{brandingConfig.fontFamily}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Heading Font</p>
              <p className="font-medium">{brandingConfig.headingFont}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Border Radius</p>
              <p className="font-medium capitalize">{brandingConfig.borderRadius}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Dark Mode</p>
              <p className="font-medium">{brandingConfig.darkMode ? 'Enabled' : 'Disabled'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
