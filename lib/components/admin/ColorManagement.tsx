'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ArrowCounterClockwise, Warning } from '@phosphor-icons/react'
import { useBrandingStore, getContrastRatio, isValidHexColor } from '@/lib/stores/branding-store'
import { colorPresets, defaultBrandingConfig } from '@/lib/types/branding'
import type { BrandingColorKeys, BrandingColors } from '@/lib/types/branding'

interface ColorInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  description?: string
}

function ColorInput({ id, label, value, onChange, description }: ColorInputProps) {
  const [localValue, setLocalValue] = useState(value)
  const [isValid, setIsValid] = useState(true)

  useEffect(() => {
    setLocalValue(value)
    setIsValid(isValidHexColor(value))
  }, [value])

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)
    setIsValid(true)
    onChange(newValue)
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value
    // Auto-prepend # if missing
    if (newValue && !newValue.startsWith('#')) {
      newValue = '#' + newValue
    }
    setLocalValue(newValue)

    if (isValidHexColor(newValue)) {
      setIsValid(true)
      onChange(newValue)
    } else {
      setIsValid(false)
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <div className="relative">
          <input
            type="color"
            id={`${id}-picker`}
            value={isValidHexColor(localValue) ? localValue : '#000000'}
            onChange={handleColorPickerChange}
            className="w-12 h-10 p-1 rounded border cursor-pointer bg-transparent"
          />
        </div>
        <Input
          id={id}
          type="text"
          value={localValue}
          onChange={handleTextChange}
          placeholder="#000000"
          className={`flex-1 font-mono ${!isValid ? 'border-red-500' : ''}`}
          maxLength={7}
        />
        <div
          className="w-10 h-10 rounded border shrink-0"
          style={{ backgroundColor: isValidHexColor(localValue) ? localValue : '#ffffff' }}
          title="Color preview"
        />
      </div>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {!isValid && (
        <p className="text-sm text-red-500">Please enter a valid hex color (e.g., #2563eb)</p>
      )}
    </div>
  )
}

interface ContrastWarningProps {
  foreground: string
  background: string
  label: string
}

function ContrastWarning({ foreground, background, label }: ContrastWarningProps) {
  if (!isValidHexColor(foreground) || !isValidHexColor(background)) {
    return null
  }

  const ratio = getContrastRatio(foreground, background)
  const isGood = ratio >= 4.5
  const isAcceptable = ratio >= 3

  if (isGood) return null

  return (
    <div className={`flex items-center gap-2 p-2 rounded text-sm ${isAcceptable ? 'bg-yellow-50 text-yellow-800' : 'bg-red-50 text-red-800'}`}>
      <Warning className="w-4 h-4 shrink-0" />
      <span>
        {label}: Contrast ratio {ratio.toFixed(2)}:1.
        {isAcceptable
          ? ' Acceptable for large text, but may be hard to read for body text.'
          : ' Text may be difficult to read. WCAG AA requires 4.5:1 for normal text.'}
      </span>
    </div>
  )
}

export default function ColorManagement() {
  const { brandingConfig, saveBrandingConfig } = useBrandingStore()

  const [colors, setColors] = useState<BrandingColors>({
    primaryColor: brandingConfig.primaryColor,
    secondaryColor: brandingConfig.secondaryColor,
    accentColor: brandingConfig.accentColor,
    backgroundColor: brandingConfig.backgroundColor,
    foregroundColor: brandingConfig.foregroundColor,
    mutedColor: brandingConfig.mutedColor,
    cardColor: brandingConfig.cardColor,
  })

  useEffect(() => {
    setColors({
      primaryColor: brandingConfig.primaryColor,
      secondaryColor: brandingConfig.secondaryColor,
      accentColor: brandingConfig.accentColor,
      backgroundColor: brandingConfig.backgroundColor,
      foregroundColor: brandingConfig.foregroundColor,
      mutedColor: brandingConfig.mutedColor,
      cardColor: brandingConfig.cardColor,
    })
  }, [
    brandingConfig.primaryColor,
    brandingConfig.secondaryColor,
    brandingConfig.accentColor,
    brandingConfig.backgroundColor,
    brandingConfig.foregroundColor,
    brandingConfig.mutedColor,
    brandingConfig.cardColor,
  ])

  const handleColorChange = useCallback((key: BrandingColorKeys, value: string) => {
    setColors((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleSave = async () => {
    // Validate all colors before saving
    const invalidColors = Object.entries(colors).filter(
      ([, value]) => !isValidHexColor(value)
    )

    if (invalidColors.length > 0) {
      toast.error('Please fix invalid color values before saving')
      return
    }

    try {
        await saveBrandingConfig({
            ...brandingConfig,
            ...colors
        })
        toast.success('Colors saved to database')
    } catch (error) {
        console.error('Save failed:', error)
        toast.error('Saved locally, but database sync failed. Please restart your server.')
    }
  }

  const handleResetToDefaults = async () => {
    const defaultColors: BrandingColors = {
      primaryColor: defaultBrandingConfig.primaryColor,
      secondaryColor: defaultBrandingConfig.secondaryColor,
      accentColor: defaultBrandingConfig.accentColor,
      backgroundColor: defaultBrandingConfig.backgroundColor,
      foregroundColor: defaultBrandingConfig.foregroundColor,
      mutedColor: defaultBrandingConfig.mutedColor,
      cardColor: defaultBrandingConfig.cardColor,
    }
    setColors(defaultColors)
    await saveBrandingConfig({
        ...brandingConfig,
        ...defaultColors
    })
    toast.success('Colors reset to defaults')
  }

  const applyPreset = async (presetId: string) => {
    const preset = colorPresets.find((p) => p.id === presetId)
    if (preset) {
      const updatedColors = { ...colors, ...preset.colors }
      setColors(updatedColors)
      await saveBrandingConfig({
          ...brandingConfig,
          ...updatedColors
      })
      toast.success(`Applied "${preset.name}" color scheme`)
    }
  }

  const hasChanges =
    colors.primaryColor !== brandingConfig.primaryColor ||
    colors.secondaryColor !== brandingConfig.secondaryColor ||
    colors.accentColor !== brandingConfig.accentColor ||
    colors.backgroundColor !== brandingConfig.backgroundColor ||
    colors.foregroundColor !== brandingConfig.foregroundColor ||
    colors.mutedColor !== brandingConfig.mutedColor ||
    colors.cardColor !== brandingConfig.cardColor

  return (
    <div className="space-y-6">
      {/* Color Presets */}
      <Card>
        <CardHeader>
          <CardTitle>Color Presets</CardTitle>
          <CardDescription>
            Quickly apply a predefined color scheme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {colorPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset.id)}
                className="flex flex-col items-center gap-2 p-3 rounded-lg border hover:border-primary transition-colors"
              >
                <div className="flex gap-1">
                  {preset.colors.primaryColor && (
                    <div
                      className="w-6 h-6 rounded-full border"
                      style={{ backgroundColor: preset.colors.primaryColor }}
                    />
                  )}
                  {preset.colors.secondaryColor && (
                    <div
                      className="w-6 h-6 rounded-full border"
                      style={{ backgroundColor: preset.colors.secondaryColor }}
                    />
                  )}
                  {preset.colors.accentColor && (
                    <div
                      className="w-6 h-6 rounded-full border"
                      style={{ backgroundColor: preset.colors.accentColor }}
                    />
                  )}
                </div>
                <span className="text-xs font-medium text-center">{preset.name}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Primary Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Brand Colors</CardTitle>
          <CardDescription>
            Main colors used throughout your site
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ColorInput
              id="primary-color"
              label="Primary Color"
              value={colors.primaryColor}
              onChange={(v) => handleColorChange('primaryColor', v)}
              description="Main brand color for buttons, links, and accents"
            />
            <ColorInput
              id="secondary-color"
              label="Secondary Color"
              value={colors.secondaryColor}
              onChange={(v) => handleColorChange('secondaryColor', v)}
              description="Secondary accent color"
            />
            <ColorInput
              id="accent-color"
              label="Accent Color"
              value={colors.accentColor}
              onChange={(v) => handleColorChange('accentColor', v)}
              description="Highlights, badges, and special elements"
            />
          </div>
        </CardContent>
      </Card>

      {/* Background Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Background & Text Colors</CardTitle>
          <CardDescription>
            Colors for backgrounds, cards, and text
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ColorInput
              id="background-color"
              label="Background Color"
              value={colors.backgroundColor}
              onChange={(v) => handleColorChange('backgroundColor', v)}
              description="Main page background"
            />
            <ColorInput
              id="foreground-color"
              label="Text Color"
              value={colors.foregroundColor}
              onChange={(v) => handleColorChange('foregroundColor', v)}
              description="Primary text color"
            />
            <ColorInput
              id="muted-color"
              label="Muted Color"
              value={colors.mutedColor}
              onChange={(v) => handleColorChange('mutedColor', v)}
              description="Secondary text and borders"
            />
            <ColorInput
              id="card-color"
              label="Card Color"
              value={colors.cardColor}
              onChange={(v) => handleColorChange('cardColor', v)}
              description="Card and surface backgrounds"
            />
          </div>

          {/* Contrast Warnings */}
          <div className="space-y-2 mt-4">
            <ContrastWarning
              foreground={colors.foregroundColor}
              background={colors.backgroundColor}
              label="Text on Background"
            />
            <ContrastWarning
              foreground={colors.foregroundColor}
              background={colors.cardColor}
              label="Text on Card"
            />
            <ContrastWarning
              foreground={colors.mutedColor}
              background={colors.backgroundColor}
              label="Muted Text on Background"
            />
          </div>
        </CardContent>
      </Card>

      {/* Live Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Color Preview</CardTitle>
          <CardDescription>
            See how your colors look together
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="p-6 rounded-lg border"
            style={{ backgroundColor: colors.backgroundColor }}
          >
            <div
              className="p-4 rounded-lg mb-4"
              style={{ backgroundColor: colors.cardColor }}
            >
              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: colors.foregroundColor }}
              >
                Sample Card Title
              </h3>
              <p
                className="text-sm mb-3"
                style={{ color: colors.mutedColor }}
              >
                This is some muted text that describes the content.
              </p>
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 rounded text-white text-sm font-medium"
                  style={{ backgroundColor: colors.primaryColor }}
                >
                  Primary Button
                </button>
                <button
                  className="px-4 py-2 rounded text-white text-sm font-medium"
                  style={{ backgroundColor: colors.secondaryColor }}
                >
                  Secondary
                </button>
                <span
                  className="px-2 py-1 rounded text-xs font-medium text-white"
                  style={{ backgroundColor: colors.accentColor }}
                >
                  Badge
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={!hasChanges} className="flex-1">
          Save Colors
        </Button>
        <Button variant="outline" onClick={handleResetToDefaults}>
          <ArrowCounterClockwise className="mr-2" />
          Reset to Defaults
        </Button>
      </div>
    </div>
  )
}
