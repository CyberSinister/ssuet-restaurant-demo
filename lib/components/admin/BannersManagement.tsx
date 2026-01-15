'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, PencilSimple, Trash, ArrowUp, ArrowDown } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useLandingPageStore } from '@/lib/stores/landing-page-store'
import { useCategories } from '@/lib/hooks/use-categories'
import type { Banner } from '@/lib/types/landing-page'

const linkTypeLabels: Record<Banner['linkType'], string> = {
  category: 'Category',
  external: 'External URL',
  menu: 'Menu Page',
  none: 'No Link',
}

const positionLabels: Record<Banner['position'], string> = {
  top: 'Top',
  middle: 'Middle',
  bottom: 'Bottom',
}

const sizeLabels: Record<Banner['size'], string> = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
  full: 'Full Width',
}

export default function BannersManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [formData, setFormData] = useState<Omit<Banner, 'id'>>({
    title: '',
    subtitle: '',
    image: '',
    linkType: 'none',
    linkValue: '',
    backgroundColor: '#1a1a2e',
    textColor: 'light',
    position: 'middle',
    size: 'medium',
    active: true,
    displayOrder: 0,
  })

  const {
    banners,
    addBanner,
    updateBanner,
    removeBanner,
    setBanners,
  } = useLandingPageStore()
  const { data: categories } = useCategories()

  const sortedBanners = [...banners].sort(
    (a, b) => a.displayOrder - b.displayOrder
  )

  const openDialog = (banner?: Banner) => {
    setSelectedFile(null)
    if (banner) {
      setEditingBanner(banner)
      setFormData({
        title: banner.title,
        subtitle: banner.subtitle || '',
        image: banner.image,
        linkType: banner.linkType,
        linkValue: banner.linkValue,
        backgroundColor: banner.backgroundColor || '#1a1a2e',
        textColor: banner.textColor || 'light',
        position: banner.position,
        size: banner.size,
        active: banner.active,
        displayOrder: banner.displayOrder,
      })
    } else {
      setEditingBanner(null)
      setFormData({
        title: '',
        subtitle: '',
        image: '',
        linkType: 'none',
        linkValue: '',
        backgroundColor: '#1a1a2e',
        textColor: 'light',
        position: 'middle',
        size: 'medium',
        active: true,
        displayOrder: sortedBanners.length + 1,
      })
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error('Title is required')
      return
    }

    let imageUrl = formData.image

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
        console.error(error)
        toast.error('Failed to upload image')
        return
      }
    }

    if (!imageUrl.trim()) {
      toast.error('Image is required')
      return
    }

    if (formData.linkType === 'category' && !formData.linkValue) {
      toast.error('Please select a category')
      return
    }

    if (formData.linkType === 'external' && !formData.linkValue.trim()) {
      toast.error('Please enter an external URL')
      return
    }

    const bannerData: Banner = {
      id: editingBanner?.id || `banner-${Date.now()}`,
      title: formData.title.trim(),
      subtitle: formData.subtitle?.trim() || undefined,
      image: imageUrl.trim(),
      linkType: formData.linkType,
      linkValue: formData.linkType === 'none' ? '' : formData.linkValue,
      backgroundColor: formData.backgroundColor || undefined,
      textColor: formData.textColor,
      position: formData.position,
      size: formData.size,
      active: formData.active,
      displayOrder: formData.displayOrder,
    }

    if (editingBanner) {
      updateBanner(editingBanner.id, bannerData)
      toast.success('Banner updated successfully')
    } else {
      addBanner(bannerData)
      toast.success('Banner added successfully')
    }
    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this banner?')) {
      removeBanner(id)
      toast.success('Banner deleted successfully')
    }
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const newBanners = [...sortedBanners]
    const temp = newBanners[index - 1].displayOrder
    newBanners[index - 1].displayOrder = newBanners[index].displayOrder
    newBanners[index].displayOrder = temp
    setBanners(newBanners)
    toast.success('Banner order updated')
  }

  const handleMoveDown = (index: number) => {
    if (index === sortedBanners.length - 1) return
    const newBanners = [...sortedBanners]
    const temp = newBanners[index + 1].displayOrder
    newBanners[index + 1].displayOrder = newBanners[index].displayOrder
    newBanners[index].displayOrder = temp
    setBanners(newBanners)
    toast.success('Banner order updated')
  }

  const toggleActive = (banner: Banner) => {
    updateBanner(banner.id, { active: !banner.active })
  }

  const getCategoryName = (categoryId: string) => {
    return categories?.find((cat) => cat.id === categoryId)?.name || categoryId
  }

  const getLinkDisplay = (banner: Banner) => {
    switch (banner.linkType) {
      case 'category':
        return `Category: ${getCategoryName(banner.linkValue)}`
      case 'external':
        return `URL: ${banner.linkValue}`
      case 'menu':
        return 'Menu Page'
      default:
        return 'No Link'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Banners ({banners.length})</h3>
          <p className="text-sm text-muted-foreground">
            Manage promotional banners across your landing page
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2" />
              Add Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingBanner ? 'Edit Banner' : 'Add Banner'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Order Online for Pickup"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Input
                    id="subtitle"
                    value={formData.subtitle}
                    onChange={(e) =>
                      setFormData({ ...formData, subtitle: e.target.value })
                    }
                    placeholder="Skip the wait"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Image</Label>
                <div className="flex flex-col gap-3 mt-1">
                    {(selectedFile || formData.image) && (
                        <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                             <img 
                                src={selectedFile ? URL.createObjectURL(selectedFile) : formData.image} 
                                alt="Preview" 
                                className="w-full h-full object-cover"
                            />
                            {/* Overlay Text Preview */}
                            <div
                                className={`absolute inset-0 flex flex-col justify-center px-6 ${
                                formData.textColor === 'light' ? 'text-white' : 'text-gray-900'
                                }`}
                                style={{
                                    backgroundColor: formData.image ? 'transparent' : formData.backgroundColor,
                                }}
                            >
                                <h4 className="text-lg font-bold">
                                {formData.title || 'Banner Title'}
                                </h4>
                                {formData.subtitle && (
                                <p className="text-sm opacity-90">{formData.subtitle}</p>
                                )}
                            </div>
                        </div>
                    )}
                    <div className="flex flex-col gap-1">
                         <Input
                            id="image"
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
                                : formData.image 
                                    ? `Current: ...${formData.image.split('/').pop()?.slice(-20)}` 
                                    : 'No image selected'}
                         </p>
                    </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linkType">Link Type</Label>
                  <Select
                    value={formData.linkType}
                    onValueChange={(value: Banner['linkType']) =>
                      setFormData({
                        ...formData,
                        linkType: value,
                        linkValue: value === 'menu' ? '/menu' : '',
                      })
                    }
                  >
                    <SelectTrigger id="linkType">
                      <SelectValue placeholder="Select link type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(linkTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkValue">
                    {formData.linkType === 'category'
                      ? 'Select Category'
                      : formData.linkType === 'external'
                      ? 'URL'
                      : 'Link Value'}
                  </Label>
                  {formData.linkType === 'category' ? (
                    <Select
                      value={formData.linkValue}
                      onValueChange={(value) =>
                        setFormData({ ...formData, linkValue: value })
                      }
                    >
                      <SelectTrigger id="linkValue">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="linkValue"
                      value={formData.linkValue}
                      onChange={(e) =>
                        setFormData({ ...formData, linkValue: e.target.value })
                      }
                      placeholder={
                        formData.linkType === 'external'
                          ? 'https://example.com'
                          : '/menu'
                      }
                      disabled={formData.linkType === 'none'}
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Select
                    value={formData.position}
                    onValueChange={(value: Banner['position']) =>
                      setFormData({ ...formData, position: value })
                    }
                  >
                    <SelectTrigger id="position">
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(positionLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size">Size</Label>
                  <Select
                    value={formData.size}
                    onValueChange={(value: Banner['size']) =>
                      setFormData({ ...formData, size: value })
                    }
                  >
                    <SelectTrigger id="size">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(sizeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="textColor">Text Color</Label>
                  <Select
                    value={formData.textColor}
                    onValueChange={(value: 'light' | 'dark') =>
                      setFormData({ ...formData, textColor: value })
                    }
                  >
                    <SelectTrigger id="textColor">
                      <SelectValue placeholder="Select text color" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light (White)</SelectItem>
                      <SelectItem value="dark">Dark (Black)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="backgroundColor">Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="backgroundColor"
                    type="color"
                    value={formData.backgroundColor}
                    onChange={(e) =>
                      setFormData({ ...formData, backgroundColor: e.target.value })
                    }
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={formData.backgroundColor}
                    onChange={(e) =>
                      setFormData({ ...formData, backgroundColor: e.target.value })
                    }
                    placeholder="#1a1a2e"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Used as fallback when image is loading or unavailable
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, active: checked })
                  }
                />
                <Label htmlFor="active">Active</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  {editingBanner ? 'Update' : 'Add'} Banner
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedBanners.map((banner, index) => (
          <Card
            key={banner.id}
            className={!banner.active ? 'opacity-60' : ''}
          >
            <div
              className="aspect-[21/9] w-full overflow-hidden bg-muted relative"
              style={{ backgroundColor: banner.backgroundColor }}
            >
              <img
                src={banner.image}
                alt={banner.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 flex gap-1">
                <Badge variant="secondary">{positionLabels[banner.position]}</Badge>
                <Badge variant="outline">{sizeLabels[banner.size]}</Badge>
              </div>
            </div>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold">{banner.title}</h4>
                  {banner.subtitle && (
                    <p className="text-sm text-muted-foreground">
                      {banner.subtitle}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                {getLinkDisplay(banner)}
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={banner.active}
                  onCheckedChange={() => toggleActive(banner)}
                />
                <span className="text-xs text-muted-foreground">
                  {banner.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                >
                  <ArrowUp />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === sortedBanners.length - 1}
                >
                  <ArrowDown />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openDialog(banner)}
                >
                  <PencilSimple className="mr-1" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(banner.id)}
                >
                  <Trash />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {banners.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No banners yet. Add your first banner to get started.
          </p>
        </div>
      )}
    </div>
  )
}
