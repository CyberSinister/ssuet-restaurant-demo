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
import { Plus, PencilSimple, Trash } from '@phosphor-icons/react'
import { toast } from 'sonner'
import {
  useMenu,
  useCreateMenuItem,
  useUpdateMenuItem,
  useDeleteMenuItem,
} from '@/lib/hooks/use-menu'
import { useCategories } from '@/lib/hooks/use-categories'
import { MenuItem } from '@/lib/types'

export default function MenuManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    image: '',
    dietaryTags: '',
    available: true,
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const { data: menuItems, isLoading: menuLoading } = useMenu({ includeInactive: true })
  const { data: categories, isLoading: categoriesLoading } = useCategories({ includeInactive: true })
  const createMutation = useCreateMenuItem()
  const updateMutation = useUpdateMenuItem()
  const deleteMutation = useDeleteMenuItem()

  const getCategoryName = (categoryId: string) => {
    return categories?.find((cat) => cat.id === categoryId)?.name || 'Unknown'
  }

  const openDialog = (item?: MenuItem) => {
    setSelectedFile(null)
    if (item) {
      setEditingItem(item)
      setFormData({
        name: item.name,
        description: item.description,
        price: item.price.toString(),
        categoryId: item.categoryId,
        image: item.image,
        dietaryTags: item.dietaryTags.join(', '),
        available: item.available,
      })
    } else {
      setEditingItem(null)
      setFormData({
        name: '',
        description: '',
        price: '',
        categoryId: categories?.[0]?.id || '',
        image: '',
        dietaryTags: '',
        available: true,
      })
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    let imageUrl = formData.image

    if (selectedFile) {
      const uploadFormData = new FormData()
      uploadFormData.append('file', selectedFile)
      try {
        const response = await fetch('/api/upload', {
           method: 'POST',
           body: uploadFormData
        })
        if (!response.ok) throw new Error('Upload failed')
        const data = await response.json()
        imageUrl = data.url
      } catch (error) {
        toast.error('Failed to upload image')
        return
      }
    }

    const menuItemData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      categoryId: formData.categoryId,
      image: imageUrl,
      dietaryTags: formData.dietaryTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      available: formData.available,
    }

    try {
      if (editingItem) {
        await updateMutation.mutateAsync({
          ...menuItemData,
          id: editingItem.id,
        })
        toast.success('Menu item updated')
      } else {
        await createMutation.mutateAsync(menuItemData)
        toast.success('Menu item added')
      }
      setIsDialogOpen(false)
    } catch (error) {
      toast.error('Failed to save menu item')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this menu item?')) {
      try {
        await deleteMutation.mutateAsync(id)
        toast.success('Menu item deleted')
      } catch (error) {
        toast.error('Failed to delete menu item')
      }
    }
  }

  const toggleAvailability = async (item: MenuItem) => {
    try {
      await updateMutation.mutateAsync({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        categoryId: item.categoryId,
        image: item.image,
        dietaryTags: item.dietaryTags,
        available: !item.available,
      })
    } catch (error) {
      toast.error('Failed to update availability')
    }
  }

  if (menuLoading || categoriesLoading) {
    return <MenuManagementSkeleton />
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold mb-2">No Categories</h3>
        <p className="text-muted-foreground">
          Please create categories first before adding menu items
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">
            Menu Items ({menuItems?.length || 0})
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage your restaurant menu
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price ($) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, categoryId: value })
                  }
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="image">Image</Label>
                <div className="flex flex-col gap-3 mt-1">
                    {(selectedFile || formData.image) && (
                        <div className="relative w-24 h-24 rounded-md overflow-hidden border">
                            <img 
                                src={selectedFile ? URL.createObjectURL(selectedFile) : formData.image} 
                                alt="Preview" 
                                className="w-full h-full object-cover"
                            />
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

              <div>
                <Label htmlFor="tags">
                  Dietary Tags (comma-separated)
                </Label>
                <Input
                  id="tags"
                  value={formData.dietaryTags}
                  onChange={(e) =>
                    setFormData({ ...formData, dietaryTags: e.target.value })
                  }
                  placeholder="Vegetarian, Gluten-Free, Vegan"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="available"
                  checked={formData.available}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, available: checked })
                  }
                />
                <Label htmlFor="available">Available</Label>
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
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingItem
                    ? 'Update'
                    : 'Add'}{' '}
                  Item
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {menuItems?.map((item) => (
          <Card
            key={item.id}
            className={!item.available ? 'opacity-60' : ''}
          >
            <div className="aspect-video w-full overflow-hidden bg-muted">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold">{item.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {getCategoryName(item.categoryId)}
                  </p>
                </div>
                <span className="text-lg font-semibold text-primary shrink-0">
                  ${item.price.toFixed(2)}
                </span>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2">
                {item.description}
              </p>

              {item.dietaryTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.dietaryTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <Switch
                  checked={item.available}
                  onCheckedChange={() => toggleAvailability(item)}
                />
                <span className="text-xs text-muted-foreground">
                  {item.available ? 'Available' : 'Unavailable'}
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openDialog(item)}
                >
                  <PencilSimple className="mr-1" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(item.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {menuItems && menuItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No menu items yet. Add your first item to get started.
          </p>
        </div>
      )}
    </div>
  )
}

function MenuManagementSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <Skeleton className="aspect-video w-full" />
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
