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
import { Plus, PencilSimple, Trash, ArrowUp, ArrowDown } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useLandingPageStore } from '@/lib/stores/landing-page-store'
import { useCategories } from '@/lib/hooks/use-categories'
import type { Promotion } from '@/lib/types/landing-page'

const discountTypeLabels: Record<Promotion['discountType'], string> = {
  percentage: 'Percentage Off',
  fixed: 'Fixed Amount Off',
  bogo: 'Buy One Get One',
  freeItem: 'Free Item',
}

export default function PromotionsManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [formData, setFormData] = useState<Omit<Promotion, 'id'>>({
    title: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    image: '',
    badgeText: '',
    linkedCategoryId: '',
    active: true,
    displayOrder: 0,
  })

  const {
    promotions,
    addPromotion,
    updatePromotion,
    removePromotion,
    setPromotions,
  } = useLandingPageStore()
  const { data: categories } = useCategories()

  const sortedPromotions = [...promotions].sort(
    (a, b) => a.displayOrder - b.displayOrder
  )

  const openDialog = (promotion?: Promotion) => {
    setSelectedFile(null)
    if (promotion) {
      setEditingPromotion(promotion)
      setFormData({
        title: promotion.title,
        description: promotion.description,
        discountType: promotion.discountType,
        discountValue: promotion.discountValue,
        image: promotion.image,
        badgeText: promotion.badgeText || '',
        linkedCategoryId: promotion.linkedCategoryId || '',
        active: promotion.active,
        displayOrder: promotion.displayOrder,
      })
    } else {
      setEditingPromotion(null)
      setFormData({
        title: '',
        description: '',
        discountType: 'percentage',
        discountValue: 0,
        image: '',
        badgeText: '',
        linkedCategoryId: '',
        active: true,
        displayOrder: sortedPromotions.length + 1,
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

    const promotionData: Promotion = {
      id: editingPromotion?.id || `promo-${Date.now()}`,
      title: formData.title.trim(),
      description: formData.description.trim(),
      discountType: formData.discountType,
      discountValue: formData.discountValue,
      image: imageUrl.trim(),
      badgeText: formData.badgeText?.trim() || undefined,
      linkedCategoryId: formData.linkedCategoryId || undefined,
      active: formData.active,
      displayOrder: formData.displayOrder,
    }

    if (editingPromotion) {
      updatePromotion(editingPromotion.id, promotionData)
      toast.success('Promotion updated successfully')
    } else {
      addPromotion(promotionData)
      toast.success('Promotion added successfully')
    }
    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this promotion?')) {
      removePromotion(id)
      toast.success('Promotion deleted successfully')
    }
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const newPromotions = [...sortedPromotions]
    const temp = newPromotions[index - 1].displayOrder
    newPromotions[index - 1].displayOrder = newPromotions[index].displayOrder
    newPromotions[index].displayOrder = temp
    setPromotions(newPromotions)
    toast.success('Promotion order updated')
  }

  const handleMoveDown = (index: number) => {
    if (index === sortedPromotions.length - 1) return
    const newPromotions = [...sortedPromotions]
    const temp = newPromotions[index + 1].displayOrder
    newPromotions[index + 1].displayOrder = newPromotions[index].displayOrder
    newPromotions[index].displayOrder = temp
    setPromotions(newPromotions)
    toast.success('Promotion order updated')
  }

  const toggleActive = (promotion: Promotion) => {
    updatePromotion(promotion.id, { active: !promotion.active })
  }

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return null
    return categories?.find((cat) => cat.id === categoryId)?.name
  }

  const getDiscountDisplay = (promotion: Promotion) => {
    switch (promotion.discountType) {
      case 'percentage':
        return `${promotion.discountValue}% Off`
      case 'fixed':
        return `$${promotion.discountValue} Off`
      case 'bogo':
        return 'Buy One Get One'
      case 'freeItem':
        return 'Free Item'
      default:
        return ''
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">
            Promotions ({promotions.length})
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage special offers and promotions
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2" />
              Add Promotion
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPromotion ? 'Edit Promotion' : 'Add Promotion'}
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
                    placeholder="Weekend Special"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="badgeText">Badge Text</Label>
                  <Input
                    id="badgeText"
                    value={formData.badgeText}
                    onChange={(e) =>
                      setFormData({ ...formData, badgeText: e.target.value })
                    }
                    placeholder="20% OFF"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enjoy special discounts every weekend"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discountType">Discount Type *</Label>
                  <Select
                    value={formData.discountType}
                    onValueChange={(value: Promotion['discountType']) =>
                      setFormData({ ...formData, discountType: value })
                    }
                  >
                    <SelectTrigger id="discountType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(discountTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountValue">
                    Discount Value{' '}
                    {formData.discountType === 'percentage'
                      ? '(%)'
                      : formData.discountType === 'fixed'
                      ? '($)'
                      : ''}
                  </Label>
                  <Input
                    id="discountValue"
                    type="number"
                    min="0"
                    step={formData.discountType === 'fixed' ? '0.01' : '1'}
                    value={formData.discountValue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountValue: parseFloat(e.target.value) || 0,
                      })
                    }
                    disabled={
                      formData.discountType === 'bogo' ||
                      formData.discountType === 'freeItem'
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
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

              <div className="space-y-2">
                <Label htmlFor="linkedCategory">Linked Category (optional)</Label>
                <Select
                  value={formData.linkedCategoryId || 'none'}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      linkedCategoryId: value === 'none' ? '' : value,
                    })
                  }
                >
                  <SelectTrigger id="linkedCategory">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No linked category</SelectItem>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
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
                  {editingPromotion ? 'Update' : 'Add'} Promotion
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedPromotions.map((promotion, index) => (
          <Card
            key={promotion.id}
            className={!promotion.active ? 'opacity-60' : ''}
          >
            {promotion.image && (
              <div className="aspect-video w-full overflow-hidden bg-muted relative">
                <img
                  src={promotion.image}
                  alt={promotion.title}
                  className="w-full h-full object-cover"
                />
                {promotion.badgeText && (
                  <Badge className="absolute top-2 right-2 bg-primary">
                    {promotion.badgeText}
                  </Badge>
                )}
              </div>
            )}
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold">{promotion.title}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {promotion.description}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary">{getDiscountDisplay(promotion)}</Badge>
                {getCategoryName(promotion.linkedCategoryId) && (
                  <Badge variant="outline">
                    {getCategoryName(promotion.linkedCategoryId)}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={promotion.active}
                  onCheckedChange={() => toggleActive(promotion)}
                />
                <span className="text-xs text-muted-foreground">
                  {promotion.active ? 'Active' : 'Inactive'}
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
                  disabled={index === sortedPromotions.length - 1}
                >
                  <ArrowDown />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openDialog(promotion)}
                >
                  <PencilSimple className="mr-1" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(promotion.id)}
                >
                  <Trash />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {promotions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No promotions yet. Add your first promotion to get started.
          </p>
        </div>
      )}
    </div>
  )
}
