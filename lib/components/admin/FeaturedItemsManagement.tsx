'use client'

import { useState, useMemo } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, PencilSimple, Trash, ArrowUp, ArrowDown } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useLandingPageStore } from '@/lib/stores/landing-page-store'
import { useMenu } from '@/lib/hooks/use-menu'
import type { FeaturedItem } from '@/lib/types/landing-page'

export default function FeaturedItemsManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<FeaturedItem | null>(null)
  const [formData, setFormData] = useState<Omit<FeaturedItem, 'id'>>({
    menuItemId: '',
    customTitle: '',
    customDescription: '',
    badgeText: '',
    displayOrder: 0,
    active: true,
  })

  const {
    featuredItems,
    addFeaturedItem,
    updateFeaturedItem,
    removeFeaturedItem,
    setFeaturedItems,
  } = useLandingPageStore()
  const { data: menuItems, isLoading: menuLoading } = useMenu()

  const sortedFeaturedItems = [...featuredItems].sort(
    (a, b) => a.displayOrder - b.displayOrder
  )

  const availableMenuItems = useMemo(() => {
    if (!menuItems) return []
    const featuredMenuItemIds = featuredItems
      .filter((item) => item.id !== editingItem?.id)
      .map((item) => item.menuItemId)
    return menuItems.filter((item) => !featuredMenuItemIds.includes(item.id))
  }, [menuItems, featuredItems, editingItem])

  const getMenuItem = (menuItemId: string) => {
    return menuItems?.find((item) => item.id === menuItemId)
  }

  const selectedMenuItem = formData.menuItemId
    ? getMenuItem(formData.menuItemId)
    : null

  const openDialog = (featuredItem?: FeaturedItem) => {
    if (featuredItem) {
      setEditingItem(featuredItem)
      setFormData({
        menuItemId: featuredItem.menuItemId,
        customTitle: featuredItem.customTitle || '',
        customDescription: featuredItem.customDescription || '',
        badgeText: featuredItem.badgeText || '',
        displayOrder: featuredItem.displayOrder,
        active: featuredItem.active,
      })
    } else {
      setEditingItem(null)
      setFormData({
        menuItemId: '',
        customTitle: '',
        customDescription: '',
        badgeText: '',
        displayOrder: sortedFeaturedItems.length + 1,
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

    // Check for duplicates (excluding current item when editing)
    const isDuplicate = featuredItems.some(
      (item) =>
        item.menuItemId === formData.menuItemId && item.id !== editingItem?.id
    )

    if (isDuplicate) {
      toast.error('This menu item is already featured')
      return
    }

    const featuredItemData: FeaturedItem = {
      id: editingItem?.id || `featured-${Date.now()}`,
      menuItemId: formData.menuItemId,
      customTitle: formData.customTitle?.trim() || undefined,
      customDescription: formData.customDescription?.trim() || undefined,
      badgeText: formData.badgeText?.trim() || undefined,
      displayOrder: formData.displayOrder,
      active: formData.active,
    }

    if (editingItem) {
      updateFeaturedItem(editingItem.id, featuredItemData)
      toast.success('Featured item updated successfully')
    } else {
      addFeaturedItem(featuredItemData)
      toast.success('Featured item added successfully')
    }
    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this featured item?')) {
      removeFeaturedItem(id)
      toast.success('Featured item removed successfully')
    }
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const newItems = [...sortedFeaturedItems]
    const temp = newItems[index - 1].displayOrder
    newItems[index - 1].displayOrder = newItems[index].displayOrder
    newItems[index].displayOrder = temp
    setFeaturedItems(newItems)
    toast.success('Item order updated')
  }

  const handleMoveDown = (index: number) => {
    if (index === sortedFeaturedItems.length - 1) return
    const newItems = [...sortedFeaturedItems]
    const temp = newItems[index + 1].displayOrder
    newItems[index + 1].displayOrder = newItems[index].displayOrder
    newItems[index].displayOrder = temp
    setFeaturedItems(newItems)
    toast.success('Item order updated')
  }

  const toggleActive = (featuredItem: FeaturedItem) => {
    updateFeaturedItem(featuredItem.id, { active: !featuredItem.active })
  }

  if (menuLoading) {
    return <FeaturedItemsSkeleton />
  }

  if (!menuItems || menuItems.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold mb-2">No Menu Items</h3>
        <p className="text-muted-foreground">
          Please create menu items first before adding featured items
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">
            Featured Items ({featuredItems.length})
          </h3>
          <p className="text-sm text-muted-foreground">
            Highlight menu items on your landing page
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => openDialog()}
              disabled={availableMenuItems.length === 0}
            >
              <Plus className="mr-2" />
              Add Featured Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit Featured Item' : 'Add Featured Item'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="menuItem">Menu Item *</Label>
                <Select
                  value={formData.menuItemId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, menuItemId: value })
                  }
                >
                  <SelectTrigger id="menuItem">
                    <SelectValue placeholder="Select a menu item" />
                  </SelectTrigger>
                  <SelectContent>
                    {(editingItem
                      ? menuItems
                      : availableMenuItems
                    )?.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} - ${item.price.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Menu Item Preview */}
              {selectedMenuItem && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {selectedMenuItem.image && (
                        <img
                          src={selectedMenuItem.image}
                          alt={selectedMenuItem.name}
                          className="w-20 h-20 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold">{selectedMenuItem.name}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {selectedMenuItem.description}
                        </p>
                        <p className="text-sm font-semibold text-primary mt-1">
                          ${selectedMenuItem.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <Label htmlFor="customTitle">Custom Title (optional)</Label>
                <Input
                  id="customTitle"
                  value={formData.customTitle}
                  onChange={(e) =>
                    setFormData({ ...formData, customTitle: e.target.value })
                  }
                  placeholder="Override the menu item name"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to use the original menu item name
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customDescription">
                  Custom Description (optional)
                </Label>
                <Textarea
                  id="customDescription"
                  value={formData.customDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customDescription: e.target.value,
                    })
                  }
                  placeholder="Override the menu item description"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to use the original menu item description
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="badgeText">Badge Text (optional)</Label>
                <Input
                  id="badgeText"
                  value={formData.badgeText}
                  onChange={(e) =>
                    setFormData({ ...formData, badgeText: e.target.value })
                  }
                  placeholder="Chef's Choice, Popular, New, etc."
                />
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
            <Card
              key={featuredItem.id}
              className={!featuredItem.active ? 'opacity-60' : ''}
            >
              <div className="aspect-video w-full overflow-hidden bg-muted relative">
                <img
                  src={menuItem.image}
                  alt={menuItem.name}
                  className="w-full h-full object-cover"
                />
                {featuredItem.badgeText && (
                  <Badge className="absolute top-2 right-2 bg-primary">
                    {featuredItem.badgeText}
                  </Badge>
                )}
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold">
                      {featuredItem.customTitle || menuItem.name}
                    </h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {featuredItem.customDescription || menuItem.description}
                    </p>
                  </div>
                  <span className="text-lg font-semibold text-primary shrink-0">
                    ${menuItem.price.toFixed(2)}
                  </span>
                </div>

                {(featuredItem.customTitle || featuredItem.customDescription) && (
                  <Badge variant="outline" className="text-xs">
                    Custom content
                  </Badge>
                )}

                <div className="flex items-center gap-2">
                  <Switch
                    checked={featuredItem.active}
                    onCheckedChange={() => toggleActive(featuredItem)}
                  />
                  <span className="text-xs text-muted-foreground">
                    {featuredItem.active ? 'Active' : 'Inactive'}
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
                    disabled={index === sortedFeaturedItems.length - 1}
                  >
                    <ArrowDown />
                  </Button>
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
                    onClick={() => handleDelete(featuredItem.id)}
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
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No featured items yet. Add your first featured item to get started.
          </p>
        </div>
      )}
    </div>
  )
}

function FeaturedItemsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <Skeleton className="aspect-video w-full" />
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
