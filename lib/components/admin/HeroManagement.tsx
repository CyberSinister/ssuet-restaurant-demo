'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { FloppyDisk } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useLandingPageStore } from '@/lib/stores/landing-page-store'
import type { HeroConfig } from '@/lib/types/landing-page'

export default function HeroManagement() {
  const { heroConfig, updateHeroConfig } = useLandingPageStore()
  const [formData, setFormData] = useState<HeroConfig>(heroConfig)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    setFormData(heroConfig)
  }, [heroConfig])

  const handleSave = async () => {
    let imageUrl = formData.backgroundImage

    if (selectedFile) {
      const uploadFormData = new FormData()
      uploadFormData.append('file', selectedFile)

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        })
        
        if (!response.ok) throw new Error('Upload failed')
        
        const data = await response.json()
        imageUrl = data.url
      } catch (error) {
        toast.error('Failed to upload image')
        return
      }
    }

    updateHeroConfig({ ...formData, backgroundImage: imageUrl })
    toast.success('Hero section updated successfully')
    setSelectedFile(null)
  }

  const getTextAlignmentClass = (alignment: HeroConfig['textAlignment']) => {
    switch (alignment) {
      case 'left':
        return 'text-left items-start'
      case 'right':
        return 'text-right items-end'
      default:
        return 'text-center items-center'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold">Hero Section</h3>
        <p className="text-sm text-muted-foreground">
          Configure the hero banner that appears at the top of your landing page
        </p>
      </div>

      {/* Live Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="relative w-full h-48 rounded-lg overflow-hidden"
            style={{
              backgroundImage: selectedFile 
                ? `url(${URL.createObjectURL(selectedFile)})`
                : formData.backgroundImage
                  ? `url(${formData.backgroundImage})`
                  : 'linear-gradient(to right, #4f46e5, #7c3aed)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Overlay */}
            <div
              className="absolute inset-0 bg-black"
              style={{ opacity: formData.overlayOpacity }}
            />
            {/* Content */}
            <div
              className={`relative h-full flex flex-col justify-center px-6 ${getTextAlignmentClass(
                formData.textAlignment
              )} ${formData.textAlignment === 'left' ? 'pl-8' : formData.textAlignment === 'right' ? 'pr-8' : ''}`}
            >
              {formData.tagline && (
                <span className="text-xs text-white/80 uppercase tracking-wider mb-1">
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
                <Button size="sm" className="w-fit">
                  {formData.ctaText}
                </Button>
              )}
            </div>
            {/* Active indicator */}
            {!formData.active && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  Hero Section Disabled
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Welcome to Our Restaurant"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={formData.tagline}
                onChange={(e) =>
                  setFormData({ ...formData, tagline: e.target.value })
                }
                placeholder="Fresh ingredients, timeless recipes"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtitle</Label>
            <Textarea
              id="subtitle"
              value={formData.subtitle}
              onChange={(e) =>
                setFormData({ ...formData, subtitle: e.target.value })
              }
              placeholder="Experience culinary excellence with every bite"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="backgroundImage">Background Image</Label>
            <div className="flex flex-col gap-3 mt-1">
                {(selectedFile || formData.backgroundImage) && (
                    <div className="relative w-full h-48 rounded-md overflow-hidden border">
                         <img 
                            src={selectedFile ? URL.createObjectURL(selectedFile) : formData.backgroundImage} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}
                <div className="flex flex-col gap-1">
                    <Input
                        id="backgroundImage"
                        type="file"
                        accept="image/*"
                         onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) setSelectedFile(file)
                          }}
                    />
                     <p className="text-xs text-muted-foreground break-all">
                         {selectedFile 
                            ? `Selected: ${selectedFile.name}` 
                            : formData.backgroundImage 
                                ? `Current: ...${formData.backgroundImage.split('/').pop()?.slice(-20)}` 
                                : 'No image selected'}
                     </p>
                </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ctaText">CTA Button Text</Label>
              <Input
                id="ctaText"
                value={formData.ctaText}
                onChange={(e) =>
                  setFormData({ ...formData, ctaText: e.target.value })
                }
                placeholder="View Our Menu"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ctaLink">CTA Button Link</Label>
              <Input
                id="ctaLink"
                value={formData.ctaLink}
                onChange={(e) =>
                  setFormData({ ...formData, ctaLink: e.target.value })
                }
                placeholder="/menu"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                Overlay Opacity: {Math.round(formData.overlayOpacity * 100)}%
              </Label>
              <Slider
                value={[formData.overlayOpacity * 100]}
                onValueChange={(value) =>
                  setFormData({ ...formData, overlayOpacity: value[0] / 100 })
                }
                min={0}
                max={100}
                step={5}
              />
              <p className="text-xs text-muted-foreground">
                Adjust the darkness of the overlay to improve text readability
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="textAlignment">Text Alignment</Label>
            <Select
              value={formData.textAlignment}
              onValueChange={(value: HeroConfig['textAlignment']) =>
                setFormData({ ...formData, textAlignment: value })
              }
            >
              <SelectTrigger id="textAlignment">
                <SelectValue placeholder="Select alignment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, active: checked })
              }
            />
            <Label htmlFor="active">Hero Section Active</Label>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave}>
              <FloppyDisk className="mr-2" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
