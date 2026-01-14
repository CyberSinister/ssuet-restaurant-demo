'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { FloppyDisk, Eye, EyeSlash } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useLandingPageStore } from '@/lib/stores/landing-page-store'
import type { LandingPageConfig } from '@/lib/types/landing-page'

interface SectionPreviewItem {
  key: keyof Pick<LandingPageConfig, 'showHero' | 'showPromotions' | 'showFeaturedItems' | 'showBanners'>
  label: string
  description: string
}

const sections: SectionPreviewItem[] = [
  {
    key: 'showHero',
    label: 'Hero Section',
    description: 'Main banner with background image and call-to-action',
  },
  {
    key: 'showPromotions',
    label: 'Promotions',
    description: 'Special offers and discount cards',
  },
  {
    key: 'showFeaturedItems',
    label: 'Featured Items',
    description: 'Highlighted menu items showcase',
  },
  {
    key: 'showBanners',
    label: 'Banners',
    description: 'Promotional banners throughout the page',
  },
]

export default function LandingPageSettings() {
  const { landingPageConfig, updateLandingPageConfig } = useLandingPageStore()
  const [formData, setFormData] = useState<LandingPageConfig>(landingPageConfig)

  useEffect(() => {
    setFormData(landingPageConfig)
  }, [landingPageConfig])

  const handleSave = () => {
    updateLandingPageConfig(formData)
    toast.success('Landing page settings saved successfully')
  }

  const toggleSection = (key: SectionPreviewItem['key']) => {
    setFormData({ ...formData, [key]: !formData[key] })
  }

  const enabledSectionsCount = sections.filter(
    (section) => formData[section.key]
  ).length

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold">Landing Page Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure which sections appear on your landing page
        </p>
      </div>

      {/* Visual Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Page Layout Preview</span>
            <span className="text-sm font-normal text-muted-foreground">
              {enabledSectionsCount} of {sections.length} sections enabled
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden bg-muted/30">
            {/* Header placeholder */}
            <div className="bg-primary/10 px-4 py-2 border-b">
              <div className="h-3 w-32 bg-primary/20 rounded" />
            </div>

            {/* Hero */}
            <div
              className={`h-24 border-b flex items-center justify-center transition-all ${
                formData.showHero
                  ? 'bg-gradient-to-r from-primary/20 to-primary/10'
                  : 'bg-muted/50'
              }`}
            >
              <span
                className={`text-sm ${
                  formData.showHero
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground line-through'
                }`}
              >
                Hero Section
              </span>
            </div>

            {/* Promotions */}
            <div
              className={`h-16 border-b flex items-center justify-center transition-all ${
                formData.showPromotions ? 'bg-orange-50' : 'bg-muted/50'
              }`}
            >
              <span
                className={`text-sm ${
                  formData.showPromotions
                    ? 'text-orange-700 font-medium'
                    : 'text-muted-foreground line-through'
                }`}
              >
                {formData.promotionsTitle || 'Promotions'}
              </span>
            </div>

            {/* Featured Items */}
            <div
              className={`h-20 border-b flex items-center justify-center transition-all ${
                formData.showFeaturedItems ? 'bg-green-50' : 'bg-muted/50'
              }`}
            >
              <span
                className={`text-sm ${
                  formData.showFeaturedItems
                    ? 'text-green-700 font-medium'
                    : 'text-muted-foreground line-through'
                }`}
              >
                {formData.featuredItemsTitle || 'Featured Items'}
              </span>
            </div>

            {/* Banners */}
            <div
              className={`h-12 flex items-center justify-center transition-all ${
                formData.showBanners ? 'bg-blue-50' : 'bg-muted/50'
              }`}
            >
              <span
                className={`text-sm ${
                  formData.showBanners
                    ? 'text-blue-700 font-medium'
                    : 'text-muted-foreground line-through'
                }`}
              >
                Banners
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Toggles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Section Visibility</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sections.map((section) => (
            <div
              key={section.key}
              className="flex items-center justify-between py-3 border-b last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    formData[section.key]
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {formData[section.key] ? (
                    <Eye className="w-5 h-5" />
                  ) : (
                    <EyeSlash className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <Label
                    htmlFor={section.key}
                    className="font-medium cursor-pointer"
                  >
                    {section.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {section.description}
                  </p>
                </div>
              </div>
              <Switch
                id={section.key}
                checked={formData[section.key]}
                onCheckedChange={() => toggleSection(section.key)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Section Titles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Section Titles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="promotionsTitle">Promotions Section Title</Label>
            <Input
              id="promotionsTitle"
              value={formData.promotionsTitle}
              onChange={(e) =>
                setFormData({ ...formData, promotionsTitle: e.target.value })
              }
              placeholder="Special Offers"
              disabled={!formData.showPromotions}
            />
            {!formData.showPromotions && (
              <p className="text-xs text-muted-foreground">
                Enable the promotions section to edit its title
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="featuredItemsTitle">Featured Items Section Title</Label>
            <Input
              id="featuredItemsTitle"
              value={formData.featuredItemsTitle}
              onChange={(e) =>
                setFormData({ ...formData, featuredItemsTitle: e.target.value })
              }
              placeholder="Featured Dishes"
              disabled={!formData.showFeaturedItems}
            />
            {!formData.showFeaturedItems && (
              <p className="text-xs text-muted-foreground">
                Enable the featured items section to edit its title
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <FloppyDisk className="mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  )
}
