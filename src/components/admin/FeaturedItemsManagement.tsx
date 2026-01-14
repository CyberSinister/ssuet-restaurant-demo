import { useState } from 'react'
import { FeaturedItem, MenuItem } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, PencilSimple, Trash, ArrowUp, ArrowDown } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface FeaturedItemsManagementProps {
  featuredItems: FeaturedItem[]
  setFeaturedItems: (items: FeaturedItem[] | ((prev: FeaturedItem[]) => FeaturedItem[])) => void
  menuItems: MenuItem[]
}

interface FeaturedItemFormData {
  menuItemId: string
  customTitle: string
  customDescription: string
  badgeText: string
  active: boolean
}

export default function FeaturedItemsManagement({ featuredItems, setFeaturedItems, menuItems }: FeaturedItemsManagementProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<FeaturedItem | null>(null)
  const [formData, setFormData] = useState<FeaturedItemFormData>({
    menuItemId: '',
    customTitle: '',
    customDescription: '',
    badgeText: '',
    active: true,
  })

  const sortedFeaturedItems = [...featuredItems].sort((a, b) => a.displayOrder - b.displayOrder)

  const getMenuItem = (menuItemId: string): MenuItem | undefined => {
    return menuItems.find(item => item.id === menuItemId)
  }

  const openDialog = (featuredItem?: FeaturedItem) => {
    if (featuredItem) {
      setEditingItem(featuredItem)
      setFormData({
        menuItemId: featuredItem.menuItemId,
        customTitle: featuredItem.customTitle || '',
        customDescription: featuredItem.customDescription || '',
        badgeText: featuredItem.badgeText || '',
        active: featuredItem.active,
      })
    } else {
      setEditingItem(null)
      setFormData({
        menuItemId: '',
        customTitle: '',
        customDescription: '',
        badgeText: '',
        active: true,
      })
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.menuItemId) {
      toast.error('Please select a menu item')
      return
    }

    const newFeaturedItem: FeaturedItem = {
      id: editingItem?.id || `featured-${Date.now()}`,
      menuItemId: formData.menuItemId,
      customTitle: formData.customTitle || undefined,
      customDescription: formData.customDescription || undefined,
      badgeText: formData.badgeText || undefined,
      displayOrder: editingItem?.displayOrder || featuredItems.length + 1,
      active: formData.active,
    }

    if (editingItem) {
      setFeaturedItems((currentItems) =>
        currentItems.map(item => (item.id === editingItem.id ? newFeaturedItem : item))
      )
      toast.success('Featured item updated')
    } else {
      // Check if menu item is already featured
      const alreadyFeatured = featuredItems.some(item => item.menuItemId === formData.menuItemId)
      if (alreadyFeatured) {
        toast.error('This menu item is already featured')
        return
      }
      setFeaturedItems((currentItems) => [...currentItems, newFeaturedItem])
      toast.success('Featured item added')
    }

    setIsDialogOpen(false)
  }

  const deleteFeaturedItem = (id: string) => {
    setFeaturedItems((currentItems) => currentItems.filter(item => item.id !== id))
    toast.success('Featured item removed')
  }

  const toggleActive = (id: string) => {
    setFeaturedItems((currentItems) =>
      currentItems.map(item =>
        item.id === id ? { ...item, active: !item.active } : item
      )
    )
  }

  const moveFeaturedItem = (id: string, direction: 'up' | 'down') => {
    const currentIndex = sortedFeaturedItems.findIndex(item => item.id === id)
    if (currentIndex === -1) return
    if (direction === 'up' && currentIndex === 0) return
    if (direction === 'down' && currentIndex === sortedFeaturedItems.length - 1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    const newSortedItems = [...sortedFeaturedItems]
    const [movedItem] = newSortedItems.splice(currentIndex, 1)
    newSortedItems.splice(newIndex, 0, movedItem)

    const updatedItems = newSortedItems.map((item, index) => ({
      ...item,
      displayOrder: index + 1,
    }))

    setFeaturedItems(updatedItems)
    toast.success('Featured item order updated')
  }

  const selectedMenuItem = formData.menuItemId ? getMenuItem(formData.menuItemId) : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Featured Items ({featuredItems.length})</h3>
          <p className="text-sm text-muted-foreground">Highlight special menu items on your landing page</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2" />
              Add Featured Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Featured Item' : 'Add Featured Item'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="menuItemId">Menu Item *</Label>
                <Select
                  value={formData.menuItemId}
                  onValueChange={(value) => setFormData({ ...formData, menuItemId: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a menu item" />
                  </SelectTrigger>
                  <SelectContent>
                    {menuItems.filter(item => item.available).map(item => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} - ${item.price.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Preview of selected menu item */}
              {selectedMenuItem && (
                <Card className="bg-muted/50">
                  <CardContent className="p-3">
                    <div className="flex gap-3">
                      {selectedMenuItem.image && (
                        <img
                          src={selectedMenuItem.image}
                          alt={selectedMenuItem.name}
                          className="w-16 h-16 rounded object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=No+Image'
                          }}
                        />
                      )}
                      <div>
                        <h5 className="font-medium">{selectedMenuItem.name}</h5>
                        <p className="text-sm text-muted-foreground line-clamp-2">{selectedMenuItem.description}</p>
                        <p className="text-sm font-medium mt-1">${selectedMenuItem.price.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div>
                <Label htmlFor="customTitle">Custom Title (Optional)</Label>
                <Input
                  id="customTitle"
                  value={formData.customTitle}
                  onChange={(e) => setFormData({ ...formData, customTitle: e.target.value })}
                  placeholder="Override the menu item name"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty to use the original menu item name
                </p>
              </div>

              <div>
                <Label htmlFor="customDescription">Custom Description (Optional)</Label>
                <Textarea
                  id="customDescription"
                  value={formData.customDescription}
                  onChange={(e) => setFormData({ ...formData, customDescription: e.target.value })}
                  rows={2}
                  placeholder="Override the menu item description"
                />
              </div>

              <div>
                <Label htmlFor="badgeText">Badge Text (Optional)</Label>
                <Input
                  id="badgeText"
                  value={formData.badgeText}
                  onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
                  placeholder="Chef's Special, Popular, etc."
                />
              </div>

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
                  {editingItem ? 'Update' : 'Add'} Featured Item
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedFeaturedItems.map((featuredItem, index) => {
          const menuItem = getMenuItem(featuredItem.menuItemId)
          if (!menuItem) return null

          return (
            <Card key={featuredItem.id} className={!featuredItem.active ? 'opacity-60' : ''}>
              <CardContent className="p-4 space-y-3">
                <div className="relative rounded-md overflow-hidden h-32 bg-muted">
                  {menuItem.image ? (
                    <img
                      src={menuItem.image}
                      alt={menuItem.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=No+Image'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No Image
                    </div>
                  )}
                  {featuredItem.badgeText && (
                    <Badge className="absolute top-2 left-2" variant="secondary">
                      {featuredItem.badgeText}
                    </Badge>
                  )}
                </div>

                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold">
                      {featuredItem.customTitle || menuItem.name}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {featuredItem.customDescription || menuItem.description}
                    </p>
                    <p className="text-sm font-medium mt-1">${menuItem.price.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={featuredItem.active}
                    onCheckedChange={() => toggleActive(featuredItem.id)}
                  />
                  <span className="text-xs text-muted-foreground">
                    {featuredItem.active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="flex gap-2">
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveFeaturedItem(featuredItem.id, 'up')}
                      disabled={index === 0}
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveFeaturedItem(featuredItem.id, 'down')}
                      disabled={index === sortedFeaturedItems.length - 1}
                    >
                      <ArrowDown />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openDialog(featuredItem)}
                  >
                    <PencilSimple className="mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteFeaturedItem(featuredItem.id)}
                  >
                    <Trash />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {featuredItems.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p>No featured items yet. Click "Add Featured Item" to highlight your best menu items.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
