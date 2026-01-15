import { useState, useEffect } from 'react'
import { LandingPageConfig } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { FloppyDisk } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface LandingPageSettingsProps {
  config: LandingPageConfig
  setConfig: (config: LandingPageConfig | ((prev: LandingPageConfig) => LandingPageConfig)) => void
}

export default function LandingPageSettings({ config, setConfig }: LandingPageSettingsProps) {
  const [formData, setFormData] = useState<LandingPageConfig>({ ...config })
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setFormData({ ...config })
    setHasChanges(false)
  }, [config])

  const updateFormData = (updates: Partial<LandingPageConfig>) => {
    setFormData(prev => ({ ...prev, ...updates }))
    setHasChanges(true)
  }

  const handleSave = () => {
    setConfig(formData)
    setHasChanges(false)
    toast.success('Landing page settings saved')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Landing Page Settings</h3>
          <p className="text-sm text-muted-foreground">Configure which sections appear on your landing page</p>
        </div>
        <Button onClick={handleSave} disabled={!hasChanges}>
          <FloppyDisk className="mr-2" />
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section Visibility */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Section Visibility</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="showHero" className="font-medium">Hero Section</Label>
                <p className="text-sm text-muted-foreground">Main banner at the top of the page</p>
              </div>
              <Switch
                id="showHero"
                checked={formData.showHero}
                onCheckedChange={(checked) => updateFormData({ showHero: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="showPromotions" className="font-medium">Promotions Section</Label>
                <p className="text-sm text-muted-foreground">Display active promotions and offers</p>
              </div>
              <Switch
                id="showPromotions"
                checked={formData.showPromotions}
                onCheckedChange={(checked) => updateFormData({ showPromotions: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="showFeaturedItems" className="font-medium">Featured Items Section</Label>
                <p className="text-sm text-muted-foreground">Highlight special menu items</p>
              </div>
              <Switch
                id="showFeaturedItems"
                checked={formData.showFeaturedItems}
                onCheckedChange={(checked) => updateFormData({ showFeaturedItems: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="showBanners" className="font-medium">Banners</Label>
                <p className="text-sm text-muted-foreground">Show promotional banners</p>
              </div>
              <Switch
                id="showBanners"
                checked={formData.showBanners}
                onCheckedChange={(checked) => updateFormData({ showBanners: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section Titles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Section Titles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="promotionsTitle">Promotions Section Title</Label>
              <Input
                id="promotionsTitle"
                value={formData.promotionsTitle}
                onChange={(e) => updateFormData({ promotionsTitle: e.target.value })}
                placeholder="Special Offers"
                disabled={!formData.showPromotions}
              />
            </div>

            <div>
              <Label htmlFor="featuredItemsTitle">Featured Items Section Title</Label>
              <Input
                id="featuredItemsTitle"
                value={formData.featuredItemsTitle}
                onChange={(e) => updateFormData({ featuredItemsTitle: e.target.value })}
                placeholder="Featured Items"
                disabled={!formData.showFeaturedItems}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Page Structure Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {formData.showHero && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium">Hero Section</span>
              </div>
            )}
            {formData.showPromotions && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium">{formData.promotionsTitle || 'Promotions'}</span>
              </div>
            )}
            {formData.showFeaturedItems && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium">{formData.featuredItemsTitle || 'Featured Items'}</span>
              </div>
            )}
            {formData.showBanners && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium">Promotional Banners</span>
              </div>
            )}
            {!formData.showHero && !formData.showPromotions && !formData.showFeaturedItems && !formData.showBanners && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="text-sm text-muted-foreground">No sections enabled - landing page will show menu directly</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
