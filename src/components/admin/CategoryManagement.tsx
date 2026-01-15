import { useState } from 'react'
import { Category, MenuItem } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Plus, PencilSimple, Trash, ArrowUp, ArrowDown } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface CategoryManagementProps {
  categories: Category[]
  setCategories: (categories: Category[] | ((prev: Category[]) => Category[])) => void
  menuItems: MenuItem[]
}

export default function CategoryManagement({ categories, setCategories, menuItems }: CategoryManagementProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    active: true,
  })

  const sortedCategories = [...categories].sort((a, b) => a.displayOrder - b.displayOrder)

  const openDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        name: category.name,
        description: category.description,
        active: category.active,
      })
    } else {
      setEditingCategory(null)
      setFormData({
        name: '',
        description: '',
        active: true,
      })
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newCategory: Category = {
      id: editingCategory?.id || `cat-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      displayOrder: editingCategory?.displayOrder || categories.length + 1,
      active: formData.active,
    }

    if (editingCategory) {
      setCategories((currentCategories) =>
        currentCategories.map(cat => (cat.id === editingCategory.id ? newCategory : cat))
      )
      toast.success('Category updated')
    } else {
      setCategories((currentCategories) => [...currentCategories, newCategory])
      toast.success('Category added')
    }

    setIsDialogOpen(false)
  }

  const deleteCategory = (id: string) => {
    const itemsInCategory = menuItems.filter(item => item.categoryId === id).length
    
    if (itemsInCategory > 0) {
      toast.error(`Cannot delete category with ${itemsInCategory} menu items`)
      return
    }

    setCategories((currentCategories) => currentCategories.filter(cat => cat.id !== id))
    toast.success('Category deleted')
  }

  const toggleActive = (id: string) => {
    setCategories((currentCategories) =>
      currentCategories.map(cat =>
        cat.id === id ? { ...cat, active: !cat.active } : cat
      )
    )
  }

  const moveCategory = (id: string, direction: 'up' | 'down') => {
    const currentIndex = sortedCategories.findIndex(cat => cat.id === id)
    if (currentIndex === -1) return
    if (direction === 'up' && currentIndex === 0) return
    if (direction === 'down' && currentIndex === sortedCategories.length - 1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    const newSortedCategories = [...sortedCategories]
    const [movedCategory] = newSortedCategories.splice(currentIndex, 1)
    newSortedCategories.splice(newIndex, 0, movedCategory)

    const updatedCategories = newSortedCategories.map((cat, index) => ({
      ...cat,
      displayOrder: index + 1,
    }))

    setCategories(updatedCategories)
    toast.success('Category order updated')
  }

  const getCategoryItemCount = (categoryId: string) => {
    return menuItems.filter(item => item.categoryId === categoryId).length
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Categories ({categories.length})</h3>
          <p className="text-sm text-muted-foreground">Organize your menu into categories</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={3}
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
                  {editingCategory ? 'Update' : 'Add'} Category
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedCategories.map((category, index) => (
          <Card key={category.id} className={!category.active ? 'opacity-60' : ''}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{category.name}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {getCategoryItemCount(category.id)} items
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={category.active}
                  onCheckedChange={() => toggleActive(category.id)}
                />
                <span className="text-xs text-muted-foreground">
                  {category.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex gap-2">
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => moveCategory(category.id, 'up')}
                    disabled={index === 0}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => moveCategory(category.id, 'down')}
                    disabled={index === sortedCategories.length - 1}
                  >
                    <ArrowDown />
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openDialog(category)}
                >
                  <PencilSimple className="mr-1" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteCategory(category.id)}
                >
                  <Trash />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
