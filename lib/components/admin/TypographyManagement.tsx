'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Moon, Sun } from '@phosphor-icons/react'
import { useBrandingStore } from '@/lib/stores/branding-store'
import {
  fontFamilyOptions,
  headingFontOptions,
  borderRadiusMap,
} from '@/lib/types/branding'
import type { BrandingConfig } from '@/lib/types/branding'

const borderRadiusOptions: { value: BrandingConfig['borderRadius']; label: string }[] = [
  { value: 'none', label: 'None (0px)' },
  { value: 'small', label: 'Small (4px)' },
  { value: 'medium', label: 'Medium (8px)' },
  { value: 'large', label: 'Large (16px)' },
  { value: 'full', label: 'Full (Pill)' },
]

export default function TypographyManagement() {
  const { brandingConfig, setFonts, setBorderRadius, toggleDarkMode } =
    useBrandingStore()

  const [formData, setFormData] = useState({
    fontFamily: brandingConfig.fontFamily,
    headingFont: brandingConfig.headingFont,
    borderRadius: brandingConfig.borderRadius,
    darkMode: brandingConfig.darkMode,
  })

  useEffect(() => {
    setFormData({
      fontFamily: brandingConfig.fontFamily,
      headingFont: brandingConfig.headingFont,
      borderRadius: brandingConfig.borderRadius,
      darkMode: brandingConfig.darkMode,
    })
  }, [
    brandingConfig.fontFamily,
    brandingConfig.headingFont,
    brandingConfig.borderRadius,
    brandingConfig.darkMode,
  ])

  const handleFontFamilyChange = (value: string) => {
    setFormData((prev) => ({ ...prev, fontFamily: value }))
    setFonts({ fontFamily: value })
    toast.success('Font family updated')
  }

  const handleHeadingFontChange = (value: string) => {
    setFormData((prev) => ({ ...prev, headingFont: value }))
    setFonts({ headingFont: value })
    toast.success('Heading font updated')
  }

  const handleBorderRadiusChange = (value: BrandingConfig['borderRadius']) => {
    setFormData((prev) => ({ ...prev, borderRadius: value }))
    setBorderRadius(value)
    toast.success('Border radius updated')
  }

  const handleDarkModeChange = (enabled: boolean) => {
    setFormData((prev) => ({ ...prev, darkMode: enabled }))
    toggleDarkMode()
    toast.success(enabled ? 'Dark mode enabled' : 'Dark mode disabled')
  }

  const getFontFamilyCss = (fontValue: string): string => {
    const font = fontFamilyOptions.find((f) => f.value === fontValue)
    return font?.cssValue || 'system-ui, sans-serif'
  }

  const getHeadingFontCss = (fontValue: string): string => {
    const font = headingFontOptions.find((f) => f.value === fontValue)
    return font?.cssValue || 'system-ui, sans-serif'
  }

  return (
    <div className="space-y-6">
      {/* Font Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Typography</CardTitle>
          <CardDescription>
            Choose fonts for your restaurant&apos;s branding
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Body Font */}
          <div className="space-y-2">
            <Label htmlFor="font-family">Body Font</Label>
            <Select value={formData.fontFamily} onValueChange={handleFontFamilyChange}>
              <SelectTrigger id="font-family">
                <SelectValue placeholder="Select a font" />
              </SelectTrigger>
              <SelectContent>
                {fontFamilyOptions.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    <span style={{ fontFamily: font.cssValue }}>{font.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Used for paragraphs, descriptions, and general text
            </p>
          </div>

          {/* Heading Font */}
          <div className="space-y-2">
            <Label htmlFor="heading-font">Heading Font</Label>
            <Select value={formData.headingFont} onValueChange={handleHeadingFontChange}>
              <SelectTrigger id="heading-font">
                <SelectValue placeholder="Select a font" />
              </SelectTrigger>
              <SelectContent>
                {headingFontOptions.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    <span style={{ fontFamily: font.cssValue }}>{font.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Used for titles, headings, and menu item names
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Font Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Font Preview</CardTitle>
          <CardDescription>
            See how your selected fonts look together
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 bg-muted rounded-lg space-y-4">
            <h1
              className="text-3xl font-bold"
              style={{ fontFamily: getHeadingFontCss(formData.headingFont) }}
            >
              Restaurant Name
            </h1>
            <h2
              className="text-xl font-semibold"
              style={{ fontFamily: getHeadingFontCss(formData.headingFont) }}
            >
              Menu Category Title
            </h2>
            <h3
              className="text-lg font-medium"
              style={{ fontFamily: getHeadingFontCss(formData.headingFont) }}
            >
              Delicious Pasta Dish
            </h3>
            <p
              className="text-base"
              style={{ fontFamily: getFontFamilyCss(formData.fontFamily) }}
            >
              Fresh homemade pasta with our signature tomato sauce, topped with parmesan cheese
              and fresh basil. A classic Italian favorite that will transport you to the
              streets of Rome.
            </p>
            <p
              className="text-sm text-muted-foreground"
              style={{ fontFamily: getFontFamilyCss(formData.fontFamily) }}
            >
              Contains: Gluten, Dairy | Prep time: 25 minutes
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Border Radius */}
      <Card>
        <CardHeader>
          <CardTitle>Border Radius</CardTitle>
          <CardDescription>
            Control the roundness of buttons, cards, and inputs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="border-radius">Border Radius Style</Label>
            <Select
              value={formData.borderRadius}
              onValueChange={(v) => handleBorderRadiusChange(v as BrandingConfig['borderRadius'])}
            >
              <SelectTrigger id="border-radius">
                <SelectValue placeholder="Select border radius" />
              </SelectTrigger>
              <SelectContent>
                {borderRadiusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Border Radius Preview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Button</p>
              <button
                className="w-full px-4 py-2 bg-primary text-primary-foreground font-medium"
                style={{ borderRadius: borderRadiusMap[formData.borderRadius] }}
              >
                Button
              </button>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Input</p>
              <input
                type="text"
                className="w-full px-3 py-2 border bg-background"
                style={{ borderRadius: borderRadiusMap[formData.borderRadius] }}
                placeholder="Input field"
                readOnly
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Card</p>
              <div
                className="w-full h-16 bg-card border flex items-center justify-center text-sm text-muted-foreground"
                style={{ borderRadius: borderRadiusMap[formData.borderRadius] }}
              >
                Card
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Badge</p>
              <span
                className="inline-block px-3 py-1 bg-accent text-accent-foreground text-sm font-medium"
                style={{ borderRadius: borderRadiusMap[formData.borderRadius] }}
              >
                Badge
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dark Mode */}
      <Card>
        <CardHeader>
          <CardTitle>Dark Mode</CardTitle>
          <CardDescription>
            Enable or disable dark mode for your site
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {formData.darkMode ? (
                <Moon className="w-6 h-6 text-primary" />
              ) : (
                <Sun className="w-6 h-6 text-amber-500" />
              )}
              <div>
                <p className="font-medium">
                  {formData.darkMode ? 'Dark Mode Enabled' : 'Light Mode Enabled'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formData.darkMode
                    ? 'Your site uses a dark color scheme'
                    : 'Your site uses a light color scheme'}
                </p>
              </div>
            </div>
            <Switch
              checked={formData.darkMode}
              onCheckedChange={handleDarkModeChange}
              aria-label="Toggle dark mode"
            />
          </div>

          {/* Dark Mode Preview */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: formData.darkMode ? '#0f172a' : '#ffffff',
                borderColor: formData.darkMode ? '#1e293b' : '#e2e8f0',
              }}
            >
              <p
                className="text-sm font-medium mb-2"
                style={{ color: formData.darkMode ? '#f8fafc' : '#0f172a' }}
              >
                Preview Card
              </p>
              <p
                className="text-xs"
                style={{ color: formData.darkMode ? '#94a3b8' : '#64748b' }}
              >
                This is how cards will appear
              </p>
            </div>
            <div
              className="p-4 rounded-lg"
              style={{
                backgroundColor: formData.darkMode ? '#1e293b' : '#f1f5f9',
              }}
            >
              <p
                className="text-sm font-medium mb-2"
                style={{ color: formData.darkMode ? '#f8fafc' : '#0f172a' }}
              >
                Muted Background
              </p>
              <p
                className="text-xs"
                style={{ color: formData.darkMode ? '#94a3b8' : '#64748b' }}
              >
                Secondary surfaces
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
