'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Trash, ImageSquare, Info, DeviceMobile } from '@phosphor-icons/react'
import { useBrandingStore } from '@/lib/stores/branding-store'

interface LogoFormData {
  logoUrl: string
  mobileLogoUrl: string
  faviconUrl: string
  logoAlt: string
}

export default function LogoManagement() {
  const { brandingConfig, updateBrandingConfig } = useBrandingStore()

  const [formData, setFormData] = useState<LogoFormData>({
    logoUrl: brandingConfig.logoUrl,
    mobileLogoUrl: brandingConfig.mobileLogoUrl,
    faviconUrl: brandingConfig.faviconUrl,
    logoAlt: brandingConfig.logoAlt,
  })
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null)
  const [selectedMobileLogoFile, setSelectedMobileLogoFile] = useState<File | null>(null)
  const [selectedFaviconFile, setSelectedFaviconFile] = useState<File | null>(null)

  const [logoError, setLogoError] = useState(false)
  const [mobileLogoError, setMobileLogoError] = useState(false)
  const [faviconError, setFaviconError] = useState(false)

  useEffect(() => {
    setFormData({
      logoUrl: brandingConfig.logoUrl,
      mobileLogoUrl: brandingConfig.mobileLogoUrl,
      faviconUrl: brandingConfig.faviconUrl,
      logoAlt: brandingConfig.logoAlt,
    })
  }, [brandingConfig.logoUrl, brandingConfig.mobileLogoUrl, brandingConfig.faviconUrl, brandingConfig.logoAlt])

  const handleSave = async () => {
    let logoUrl = formData.logoUrl
    let mobileLogoUrl = formData.mobileLogoUrl
    let faviconUrl = formData.faviconUrl

    // Upload Main Logo
    if (selectedLogoFile) {
      const uploadFormData = new FormData()
      uploadFormData.append('file', selectedLogoFile)
      try {
        const response = await fetch('/api/upload', {
           method: 'POST',
           body: uploadFormData
        })
        if (!response.ok) throw new Error('Upload failed')
        const data = await response.json()
        logoUrl = data.url
      } catch (error) {
        toast.error('Failed to upload logo')
        return
      }
    }

    // Upload Mobile Logo
    if (selectedMobileLogoFile) {
      const uploadFormData = new FormData()
      uploadFormData.append('file', selectedMobileLogoFile)
      try {
        const response = await fetch('/api/upload', {
           method: 'POST',
           body: uploadFormData
        })
        if (!response.ok) throw new Error('Upload failed')
        const data = await response.json()
        mobileLogoUrl = data.url
      } catch (error) {
        toast.error('Failed to upload mobile logo')
        return
      }
    }

    // Upload Favicon
    if (selectedFaviconFile) {
      const uploadFormData = new FormData()
      uploadFormData.append('file', selectedFaviconFile)
      try {
        const response = await fetch('/api/upload', {
           method: 'POST',
           body: uploadFormData
        })
        if (!response.ok) throw new Error('Upload failed')
        const data = await response.json()
        faviconUrl = data.url
      } catch (error) {
        toast.error('Failed to upload favicon')
        return
      }
    }

    updateBrandingConfig({
      logoUrl: logoUrl,
      mobileLogoUrl: mobileLogoUrl,
      faviconUrl: faviconUrl,
      logoAlt: formData.logoAlt,
    })
    toast.success('Logo settings saved successfully')
    setSelectedLogoFile(null)
    setSelectedMobileLogoFile(null)
    setSelectedFaviconFile(null)
  }

  const handleRemoveLogo = () => {
    updateBrandingConfig({
      logoUrl: '',
      mobileLogoUrl: '',
      faviconUrl: '',
      logoAlt: 'Restaurant Logo',
    })
    setFormData({
      logoUrl: '',
      mobileLogoUrl: '',
      faviconUrl: '',
      logoAlt: 'Restaurant Logo',
    })
    setLogoError(false)
    setMobileLogoError(false)
    setFaviconError(false)
    toast.success('Logo removed')
  }

  return (
    <div className="space-y-6">
      {/* Logos Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Logo Previews</CardTitle>
          <CardDescription>
            Your logos as they will appear on different devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Desktop Preview */}
            <div className="space-y-3">
              <Label>Desktop View</Label>
              <div className="flex items-center justify-center p-8 bg-muted rounded-lg min-h-[160px] border">
                {(formData.logoUrl || selectedLogoFile) && !logoError ? (
                  <img
                    src={selectedLogoFile ? URL.createObjectURL(selectedLogoFile) : formData.logoUrl}
                    alt={formData.logoAlt || 'Logo preview'}
                    className="max-h-24 max-w-full object-contain"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ImageSquare className="w-12 h-12 opacity-50" />
                    <span className="text-xs">No Desktop Logo</span>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Preview */}
            <div className="space-y-3">
              <Label>Mobile View</Label>
              <div className="flex items-center justify-center p-8 bg-muted rounded-lg min-h-[160px] max-w-[300px] border relative mx-auto md:mx-0">
                  <div className="absolute top-2 right-2">
                      <DeviceMobile className="w-5 h-5 text-muted-foreground" />
                  </div>
                {(formData.mobileLogoUrl || selectedMobileLogoFile) && !mobileLogoError ? (
                  <img
                    src={selectedMobileLogoFile ? URL.createObjectURL(selectedMobileLogoFile) : formData.mobileLogoUrl}
                    alt={formData.logoAlt || 'Mobile Logo preview'}
                    className="max-h-16 max-w-full object-contain"
                    onError={() => setMobileLogoError(true)}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ImageSquare className="w-10 h-10 opacity-50" />
                    <span className="text-xs">No Mobile Logo</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logo Settings form */}
      <Card>
        <CardHeader>
          <CardTitle>Logo Uploads</CardTitle>
          <CardDescription>
            Configure your restaurant&apos;s branding images
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Logo */}
          <div className="space-y-2">
            <Label htmlFor="logo-url">Desktop Logo (Main)</Label>
            <div className="flex flex-col gap-1">
                <Input
                  id="logo-url"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) setSelectedLogoFile(file)
                  }}
                  className={logoError ? 'border-red-500' : ''}
                />
                 <p className="text-xs text-muted-foreground break-all">
                     {selectedLogoFile 
                        ? `Selected: ${selectedLogoFile.name}` 
                        : formData.logoUrl 
                            ? `Current: ...${formData.logoUrl.split('/').pop()?.slice(-20)}` 
                            : 'No logo selected'}
                 </p>
            </div>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              <span>Recommended: 200x60px PNG/SVG with transparent background</span>
            </div>
          </div>

          {/* Mobile Logo */}
          <div className="space-y-2">
            <Label htmlFor="mobile-logo-url">Mobile Logo (Optional)</Label>
            <div className="flex flex-col gap-1">
                <Input
                  id="mobile-logo-url"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) setSelectedMobileLogoFile(file)
                  }}
                  className={mobileLogoError ? 'border-red-500' : ''}
                />
                 <p className="text-xs text-muted-foreground break-all">
                     {selectedMobileLogoFile 
                        ? `Selected: ${selectedMobileLogoFile.name}` 
                        : formData.mobileLogoUrl 
                            ? `Current: ...${formData.mobileLogoUrl.split('/').pop()?.slice(-20)}` 
                            : 'Same as desktop logo'}
                 </p>
            </div>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              <span>Recommended: Square or compact logo (e.g. 40x40px). If not set, desktop logo will be used.</span>
            </div>
          </div>

          <div className="border-t pt-4" />

          {/* Favicon */}
          <div className="space-y-2">
            <Label htmlFor="favicon-url">Favicon</Label>
            <div className="flex gap-3 items-start">
              <div className="flex-1 flex flex-col gap-1">
                  <Input
                    id="favicon-url"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) setSelectedFaviconFile(file)
                      }}
                    className={faviconError ? 'border-red-500' : ''}
                  />
                   <p className="text-xs text-muted-foreground break-all">
                     {selectedFaviconFile 
                        ? `Selected: ${selectedFaviconFile.name}` 
                        : formData.faviconUrl 
                            ? `Current: ...${formData.faviconUrl.split('/').pop()?.slice(-20)}` 
                            : 'No favicon selected'}
                   </p>
              </div>
              {(formData.faviconUrl || selectedFaviconFile) && !faviconError && (
                <div className="flex items-center justify-center w-10 h-10 bg-muted rounded border shrink-0">
                  <img
                    src={selectedFaviconFile ? URL.createObjectURL(selectedFaviconFile) : formData.faviconUrl}
                    alt="Favicon preview"
                    className="w-6 h-6 object-contain"
                    onError={() => setFaviconError(true)}
                  />
                </div>
              )}
            </div>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              <span>Recommended: 32x32px ICO/PNG.</span>
            </div>
          </div>

          {/* Logo Alt Text */}
          <div className="space-y-2">
            <Label htmlFor="logo-alt">Logo Alt Text</Label>
            <Input
              id="logo-alt"
              type="text"
              value={formData.logoAlt}
              onChange={(e) => setFormData({ ...formData, logoAlt: e.target.value })}
              placeholder="Restaurant Logo"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={handleSave} className="flex-1">
              Save Changes
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveLogo}
              disabled={!formData.logoUrl && !formData.mobileLogoUrl && !formData.faviconUrl}
            >
              <Trash className="mr-2" />
              Reset All Logos
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
