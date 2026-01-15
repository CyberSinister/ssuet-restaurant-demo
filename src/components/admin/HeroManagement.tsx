import { useState } from 'react'
import { HeroConfig } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { FloppyDisk } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface HeroManagementProps {
  heroConfig: HeroConfig
  setHeroConfig: (config: HeroConfig | ((prev: HeroConfig) => HeroConfig)) => void
}

export default function HeroManagement({ heroConfig, setHeroConfig }: HeroManagementProps) {
  const [formData, setFormData] = useState<HeroConfig>({ ...heroConfig })
  const [hasChanges, setHasChanges] = useState(false)

  const updateFormData = (updates: Partial<HeroConfig>) => {
    setFormData(prev => ({ ...prev, ...updates }))
    setHasChanges(true)
  }

  const handleSave = () => {
    setHeroConfig(formData)
    setHasChanges(false)
    toast.success('Hero section saved')
  }

  const getAlignmentClass = (alignment: 'left' | 'center' | 'right') => {
    switch (alignment) {
      case 'left': return 'text-left items-start'
      case 'center': return 'text-center items-center'
      case 'right': return 'text-right items-end'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Hero Section</h3>
          <p className="text-sm text-muted-foreground">Configure the main hero banner on your landing page</p>
        </div>
        <Button onClick={handleSave} disabled={!hasChanges}>
          <FloppyDisk className="mr-2" />
          Save Changes
        </Button>
      </div>

      {/* Live Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Live Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="relative rounded-lg overflow-hidden h-48 bg-cover bg-center"
            style={{ backgroundImage: formData.backgroundImage ? `url(${formData.backgroundImage})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            <div
              className="absolute inset-0 bg-black"
              style={{ opacity: formData.overlayOpacity / 100 }}
            />
            <div className={`relative h-full flex flex-col justify-center p-6 ${getAlignmentClass(formData.textAlignment)}`}>
              {formData.tagline && (
                <span className="text-xs uppercase tracking-wider text-white/80 mb-1">
                  {formData.tagline}
                </span>
              )}
              <h2 className="text-2xl font-bold text-white mb-1">
                {formData.title || 'Hero Title'}
              </h2>
              <p className="text-sm text-white/90 mb-3">
                {formData.subtitle || 'Hero subtitle goes here'}
              </p>
              {formData.ctaText && (
                <Button size="sm" variant="secondary" className="w-fit">
                  {formData.ctaText}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => updateFormData({ title: e.target.value })}
                  placeholder="Welcome to Our Restaurant"
                />
              </div>

              <div>
                <Label htmlFor="subtitle">Subtitle</Label>
                <Textarea
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => updateFormData({ subtitle: e.target.value })}
                  placeholder="Delicious food made with love"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={formData.tagline}
                  onChange={(e) => updateFormData({ tagline: e.target.value })}
                  placeholder="Since 1995"
                />
              </div>

              <div>
                <Label htmlFor="backgroundImage">Background Image URL</Label>
                <Input
                  id="backgroundImage"
                  value={formData.backgroundImage}
                  onChange={(e) => updateFormData({ backgroundImage: e.target.value })}
                  placeholder="https://example.com/hero-image.jpg"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="ctaText">Call to Action Text</Label>
                <Input
                  id="ctaText"
                  value={formData.ctaText}
                  onChange={(e) => updateFormData({ ctaText: e.target.value })}
                  placeholder="Order Now"
                />
              </div>

              <div>
                <Label htmlFor="ctaLink">Call to Action Link</Label>
                <Input
                  id="ctaLink"
                  value={formData.ctaLink}
                  onChange={(e) => updateFormData({ ctaLink: e.target.value })}
                  placeholder="menu or category:cat-1 or https://..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use "menu" for menu page, "category:id" for specific category, or full URL
                </p>
              </div>

              <div>
                <Label htmlFor="textAlignment">Text Alignment</Label>
                <Select
                  value={formData.textAlignment}
                  onValueChange={(value: 'left' | 'center' | 'right') => updateFormData({ textAlignment: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select alignment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="overlayOpacity">Overlay Opacity: {formData.overlayOpacity}%</Label>
                <Slider
                  id="overlayOpacity"
                  value={[formData.overlayOpacity]}
                  onValueChange={(value) => updateFormData({ overlayOpacity: value[0] })}
                  min={0}
                  max={100}
                  step={5}
                  className="mt-2"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => updateFormData({ active: checked })}
                />
                <Label htmlFor="active">Active</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
