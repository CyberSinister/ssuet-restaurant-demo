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
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, PencilSimple, Trash, DotsSixVertical } from '@phosphor-icons/react'
import { toast } from 'sonner'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useReorderCategories,
} from '@/lib/hooks/use-categories'
import { useMenu } from '@/lib/hooks/use-menu'
import { Category } from '@/lib/types'
import { categorySchema } from '@/lib/validations/schemas'
import { z } from 'zod'

interface SortableCategoryCardProps {
  category: Category
  itemCount: number
  onEdit: (category: Category) => void
  onDelete: (id: string) => void
  onToggleActive: (id: string) => void
}

function SortableCategoryCard({
  category,
  itemCount,
  onEdit,
  onDelete,
  onToggleActive,
}: SortableCategoryCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={!category.active ? 'opacity-60' : ''}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <button
              className="mt-1 cursor-grab active:cursor-grabbing touch-none"
              {...attributes}
              {...listeners}
            >
              <DotsSixVertical className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">{category.name}</h4>
                <Badge variant="secondary" className="text-xs">
                  {itemCount} items
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={category.active} onCheckedChange={() => onToggleActive(category.id)} />
            <span className="text-xs text-muted-foreground">
              {category.active ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(category)}>
              <PencilSimple className="mr-1" />
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={() => onDelete(category.id)}>
              <Trash />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function CategoryManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    active: true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: categories, isLoading: categoriesLoading } = useCategories({ includeInactive: true })
  const { data: menuItems } = useMenu({ includeInactive: true })
  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const deleteMutation = useDeleteCategory()
  const reorderMutation = useReorderCategories()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const sortedCategories = categories ? [...categories].sort((a, b) => a.displayOrder - b.displayOrder) : []

  const getCategoryItemCount = (categoryId: string) => {
    return menuItems?.filter((item) => item.categoryId === categoryId).length || 0
  }

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
    setErrors({})
    setIsDialogOpen(true)
  }

  const validateForm = () => {
    try {
      const displayOrder = editingCategory?.displayOrder || (categories?.length || 0) + 1
      categorySchema.parse({
        name: formData.name,
        description: formData.description,
        displayOrder,
        active: formData.active,
      })
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message
          }
        })
        setErrors(newErrors)
      }
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const categoryData = {
      name: formData.name,
      description: formData.description,
      displayOrder: editingCategory?.displayOrder || (categories?.length || 0) + 1,
      active: formData.active,
    }

    try {
      if (editingCategory) {
        await updateMutation.mutateAsync({
          id: editingCategory.id,
          ...categoryData,
        })
        toast.success('Category updated successfully')
      } else {
        await createMutation.mutateAsync(categoryData)
        toast.success('Category added successfully')
      }
      setIsDialogOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save category')
    }
  }

  const handleDelete = async (id: string) => {
    const itemCount = getCategoryItemCount(id)

    if (itemCount > 0) {
      toast.error(`Cannot delete category with ${itemCount} menu items`)
      return
    }

    try {
      await deleteMutation.mutateAsync(id)
      toast.success('Category deleted successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete category')
    }
  }

  const handleToggleActive = async (id: string) => {
    const category = categories?.find((cat) => cat.id === id)
    if (!category) return

    try {
      await updateMutation.mutateAsync({
        id: category.id,
        name: category.name,
        description: category.description,
        active: !category.active,
        displayOrder: category.displayOrder,
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update category')
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = sortedCategories.findIndex((cat) => cat.id === active.id)
    const newIndex = sortedCategories.findIndex((cat) => cat.id === over.id)

    const newOrder = arrayMove(sortedCategories, oldIndex, newIndex)
    const reorderedCategories = newOrder.map((cat, index) => ({
      id: cat.id,
      displayOrder: index + 1,
    }))

    try {
      await reorderMutation.mutateAsync(reorderedCategories)
      toast.success('Category order updated')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reorder categories')
    }
  }

  if (categoriesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Categories ({categories?.length || 0})</h3>
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
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && (
                  <p className="text-sm text-red-500 mt-1">{errors.description}</p>
                )}
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
                    : editingCategory
                    ? 'Update Category'
                    : 'Add Category'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortedCategories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedCategories.map((category) => (
              <SortableCategoryCard
                key={category.id}
                category={category}
                itemCount={getCategoryItemCount(category.id)}
                onEdit={openDialog}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {sortedCategories.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No categories yet. Add your first category to get started.</p>
        </div>
      )}
    </div>
  )
}
