import { useState } from 'react'
import { Banner, BannerLinkType, BannerPosition, BannerSize, Category } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, PencilSimple, Trash, ArrowUp, ArrowDown } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface BannersManagementProps {
  banners: Banner[]
  setBanners: (banners: Banner[] | ((prev: Banner[]) => Banner[])) => void
  categories: Category[]
}

interface BannerFormData {
  title: string
  subtitle: string
  image: string
  linkType: BannerLinkType
  linkValue: string
  backgroundColor: string
  textColor: 'light' | 'dark'
  position: BannerPosition
  size: BannerSize
  active: boolean
}

export default function BannersManagement({ banners, setBanners, categories }: BannersManagementProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [formData, setFormData] = useState<BannerFormData>({
    title: '',
    subtitle: '',
    image: '',
    linkType: 'none',
    linkValue: '',
    backgroundColor: '#f3f4f6',
    textColor: 'dark',
    position: 'middle',
    size: 'medium',
    active: true,
  })

  const sortedBanners = [...banners].sort((a, b) => a.displayOrder - b.displayOrder)

  const openDialog = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner)
      setFormData({
        title: banner.title,
        subtitle: banner.subtitle || '',
        image: banner.image,
        linkType: banner.linkType,
        linkValue: banner.linkValue,
        backgroundColor: banner.backgroundColor || '#f3f4f6',
        textColor: banner.textColor || 'dark',
        position: banner.position,
        size: banner.size,
        active: banner.active,
      })
    } else {
      setEditingBanner(null)
      setFormData({
        title: '',
        subtitle: '',
        image: '',
        linkType: 'none',
        linkValue: '',
        backgroundColor: '#f3f4f6',
        textColor: 'dark',
        position: 'middle',
        size: 'medium',
        active: true,
      })
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newBanner: Banner = {
      id: editingBanner?.id || `banner-${Date.now()}`,
      title: formData.title,
      subtitle: formData.subtitle || undefined,
      image: formData.image,
      linkType: formData.linkType,
      linkValue: formData.linkValue,
      backgroundColor: formData.backgroundColor || undefined,
      textColor: formData.textColor,
      position: formData.position,
      size: formData.size,
      displayOrder: editingBanner?.displayOrder || banners.length + 1,
      active: formData.active,
    }

    if (editingBanner) {
      setBanners((currentBanners) =>
        currentBanners.map(banner => (banner.id === editingBanner.id ? newBanner : banner))
      )
      toast.success('Banner updated')
    } else {
      setBanners((currentBanners) => [...currentBanners, newBanner])
      toast.success('Banner added')
    }

    setIsDialogOpen(false)
  }

  const deleteBanner = (id: string) => {
    setBanners((currentBanners) => currentBanners.filter(banner => banner.id !== id))
    toast.success('Banner deleted')
  }

  const toggleActive = (id: string) => {
    setBanners((currentBanners) =>
      currentBanners.map(banner =>
        banner.id === id ? { ...banner, active: !banner.active } : banner
      )
    )
  }

  const moveBanner = (id: string, direction: 'up' | 'down') => {
    const currentIndex = sortedBanners.findIndex(banner => banner.id === id)
    if (currentIndex === -1) return
    if (direction === 'up' && currentIndex === 0) return
    if (direction === 'down' && currentIndex === sortedBanners.length - 1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    const newSortedBanners = [...sortedBanners]
    const [movedBanner] = newSortedBanners.splice(currentIndex, 1)
    newSortedBanners.splice(newIndex, 0, movedBanner)

    const updatedBanners = newSortedBanners.map((banner, index) => ({
      ...banner,
      displayOrder: index + 1,
    }))

    setBanners(updatedBanners)
    toast.success('Banner order updated')
  }

  const getSizeLabel = (size: BannerSize) => {
    switch (size) {
      case 'small': return 'Small'
      case 'medium': return 'Medium'
      case 'large': return 'Large'
      case 'full': return 'Full Width'
    }
  }

  const getPositionLabel = (position: BannerPosition) => {
    switch (position) {
      case 'top': return 'Top'
      case 'middle': return 'Middle'
      case 'bottom': return 'Bottom'
    }
  }

  const getLinkTypeLabel = (linkType: BannerLinkType) => {
    switch (linkType) {
      case 'category': return 'Category'
      case 'external': return 'External URL'
      case 'menu': return 'Menu'
      case 'none': return 'No Link'
    }
  }

  const getSizeHeight = (size: BannerSize) => {
    switch (size) {
      case 'small': return 'h-16'
      case 'medium': return 'h-24'
      case 'large': return 'h-32'
      case 'full': return 'h-40'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Banners ({banners.length})</h3>
          <p className="text-sm text-muted-foreground">Manage promotional banners across your landing page</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2" />
              Add Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBanner ? 'Edit Banner' : 'Add Banner'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Free Delivery This Weekend!"
                />
              </div>

              <div>
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="On orders over $30"
                />
              </div>

              <div>
                <Label htmlFor="image">Image URL *</Label>
                <Input
                  id="image"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  required
                  placeholder="https://example.com/banner-image.jpg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="backgroundColor">Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="backgroundColor"
                      type="color"
                      value={formData.backgroundColor}
                      onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                      className="w-12 h-9 p-1"
                    />
                    <Input
                      value={formData.backgroundColor}
                      onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                      placeholder="#f3f4f6"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="textColor">Text Color</Label>
                  <Select
                    value={formData.textColor}
                    onValueChange={(value: 'light' | 'dark') => setFormData({ ...formData, textColor: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select text color" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light (White)</SelectItem>
                      <SelectItem value="dark">Dark (Black)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="position">Position</Label>
                  <Select
                    value={formData.position}
                    onValueChange={(value: BannerPosition) => setFormData({ ...formData, position: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top">Top</SelectItem>
                      <SelectItem value="middle">Middle</SelectItem>
                      <SelectItem value="bottom">Bottom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="size">Size</Label>
                  <Select
                    value={formData.size}
                    onValueChange={(value: BannerSize) => setFormData({ ...formData, size: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                      <SelectItem value="full">Full Width</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="linkType">Link Type</Label>
                <Select
                  value={formData.linkType}
                  onValueChange={(value: BannerLinkType) => setFormData({ ...formData, linkType: value, linkValue: '' })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select link type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Link</SelectItem>
                    <SelectItem value="menu">Menu Page</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                    <SelectItem value="external">External URL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.linkType === 'category' && (
                <div>
                  <Label htmlFor="linkValue">Select Category</Label>
                  <Select
                    value={formData.linkValue}
                    onValueChange={(value) => setFormData({ ...formData, linkValue: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.linkType === 'external' && (
                <div>
                  <Label htmlFor="linkValue">External URL</Label>
                  <Input
                    id="linkValue"
                    value={formData.linkValue}
                    onChange={(e) => setFormData({ ...formData, linkValue: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
                <Label htmlFor="active">Active</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
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
          <Card key={banner.id} className={!banner.active ? 'opacity-60' : ''}>
            <CardContent className="p-4 space-y-3">
              <div
                className={`relative rounded-md overflow-hidden ${getSizeHeight(banner.size)} bg-cover bg-center`}
                style={{
                  backgroundImage: banner.image ? `url(${banner.image})` : undefined,
                  backgroundColor: banner.backgroundColor || '#f3f4f6',
                }}
              >
                <div className={`absolute inset-0 flex flex-col justify-center p-4 ${banner.textColor === 'light' ? 'text-white' : 'text-gray-900'}`}>
                  <h4 className="font-semibold text-lg">{banner.title}</h4>
                  {banner.subtitle && (
                    <p className="text-sm opacity-90">{banner.subtitle}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  {getSizeLabel(banner.size)}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {getPositionLabel(banner.position)}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {getLinkTypeLabel(banner.linkType)}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={banner.active}
                  onCheckedChange={() => toggleActive(banner.id)}
                />
                <span className="text-xs text-muted-foreground">
                  {banner.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex gap-2">
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => moveBanner(banner.id, 'up')}
                    disabled={index === 0}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => moveBanner(banner.id, 'down')}
                    disabled={index === sortedBanners.length - 1}
                  >
                    <ArrowDown />
                  </Button>
                </div>
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
                  onClick={() => deleteBanner(banner.id)}
                >
                  <Trash />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {banners.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p>No banners yet. Click "Add Banner" to create your first promotional banner.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
