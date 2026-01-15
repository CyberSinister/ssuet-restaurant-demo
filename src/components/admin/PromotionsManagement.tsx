import { useState } from 'react'
import { Promotion, PromotionDiscountType, Category } from '@/lib/types'
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

interface PromotionsManagementProps {
  promotions: Promotion[]
  setPromotions: (promotions: Promotion[] | ((prev: Promotion[]) => Promotion[])) => void
  categories: Category[]
}

interface PromotionFormData {
  title: string
  description: string
  discountType: PromotionDiscountType
  discountValue: number
  image: string
  badgeText: string
  linkedCategoryId: string
  active: boolean
}

export default function PromotionsManagement({ promotions, setPromotions, categories }: PromotionsManagementProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)
  const [formData, setFormData] = useState<PromotionFormData>({
    title: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    image: '',
    badgeText: '',
    linkedCategoryId: '',
    active: true,
  })

  const sortedPromotions = [...promotions].sort((a, b) => a.displayOrder - b.displayOrder)

  const openDialog = (promotion?: Promotion) => {
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
      })
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newPromotion: Promotion = {
      id: editingPromotion?.id || `promo-${Date.now()}`,
      title: formData.title,
      description: formData.description,
      discountType: formData.discountType,
      discountValue: formData.discountValue,
      image: formData.image,
      badgeText: formData.badgeText || undefined,
      linkedCategoryId: formData.linkedCategoryId || undefined,
      displayOrder: editingPromotion?.displayOrder || promotions.length + 1,
      active: formData.active,
    }

    if (editingPromotion) {
      setPromotions((currentPromotions) =>
        currentPromotions.map(promo => (promo.id === editingPromotion.id ? newPromotion : promo))
      )
      toast.success('Promotion updated')
    } else {
      setPromotions((currentPromotions) => [...currentPromotions, newPromotion])
      toast.success('Promotion added')
    }

    setIsDialogOpen(false)
  }

  const deletePromotion = (id: string) => {
    setPromotions((currentPromotions) => currentPromotions.filter(promo => promo.id !== id))
    toast.success('Promotion deleted')
  }

  const toggleActive = (id: string) => {
    setPromotions((currentPromotions) =>
      currentPromotions.map(promo =>
        promo.id === id ? { ...promo, active: !promo.active } : promo
      )
    )
  }

  const movePromotion = (id: string, direction: 'up' | 'down') => {
    const currentIndex = sortedPromotions.findIndex(promo => promo.id === id)
    if (currentIndex === -1) return
    if (direction === 'up' && currentIndex === 0) return
    if (direction === 'down' && currentIndex === sortedPromotions.length - 1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    const newSortedPromotions = [...sortedPromotions]
    const [movedPromotion] = newSortedPromotions.splice(currentIndex, 1)
    newSortedPromotions.splice(newIndex, 0, movedPromotion)

    const updatedPromotions = newSortedPromotions.map((promo, index) => ({
      ...promo,
      displayOrder: index + 1,
    }))

    setPromotions(updatedPromotions)
    toast.success('Promotion order updated')
  }

  const getDiscountLabel = (type: PromotionDiscountType) => {
    switch (type) {
      case 'percentage': return 'Percentage Off'
      case 'fixed': return 'Fixed Amount Off'
      case 'bogo': return 'Buy One Get One'
      case 'freeItem': return 'Free Item'
    }
  }

  const formatDiscount = (promo: Promotion) => {
    switch (promo.discountType) {
      case 'percentage': return `${promo.discountValue}% OFF`
      case 'fixed': return `$${promo.discountValue} OFF`
      case 'bogo': return 'BOGO'
      case 'freeItem': return 'FREE ITEM'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Promotions ({promotions.length})</h3>
          <p className="text-sm text-muted-foreground">Manage special offers and discounts</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2" />
              Add Promotion
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPromotion ? 'Edit Promotion' : 'Add Promotion'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Summer Special"
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
                  placeholder="Get amazing discounts on selected items"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discountType">Discount Type *</Label>
                  <Select
                    value={formData.discountType}
                    onValueChange={(value: PromotionDiscountType) => setFormData({ ...formData, discountType: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage Off</SelectItem>
                      <SelectItem value="fixed">Fixed Amount Off</SelectItem>
                      <SelectItem value="bogo">Buy One Get One</SelectItem>
                      <SelectItem value="freeItem">Free Item</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="discountValue">
                    {formData.discountType === 'percentage' ? 'Discount %' : 'Discount Value'}
                  </Label>
                  <Input
                    id="discountValue"
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                    min={0}
                    max={formData.discountType === 'percentage' ? 100 : undefined}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="image">Image URL</Label>
                <Input
                  id="image"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://example.com/promo-image.jpg"
                />
              </div>

              <div>
                <Label htmlFor="badgeText">Badge Text</Label>
                <Input
                  id="badgeText"
                  value={formData.badgeText}
                  onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
                  placeholder="LIMITED TIME"
                />
              </div>

              <div>
                <Label htmlFor="linkedCategoryId">Link to Category (Optional)</Label>
                <Select
                  value={formData.linkedCategoryId}
                  onValueChange={(value) => setFormData({ ...formData, linkedCategoryId: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {categories.map(category => (
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
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
                <Label htmlFor="active">Active</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedPromotions.map((promotion, index) => (
          <Card key={promotion.id} className={!promotion.active ? 'opacity-60' : ''}>
            <CardContent className="p-4 space-y-3">
              {promotion.image && (
                <div className="relative rounded-md overflow-hidden h-32 bg-muted">
                  <img
                    src={promotion.image}
                    alt={promotion.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=No+Image'
                    }}
                  />
                  {promotion.badgeText && (
                    <Badge className="absolute top-2 left-2" variant="destructive">
                      {promotion.badgeText}
                    </Badge>
                  )}
                </div>
              )}

              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{promotion.title}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {formatDiscount(promotion)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{promotion.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Type: {getDiscountLabel(promotion.discountType)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={promotion.active}
                  onCheckedChange={() => toggleActive(promotion.id)}
                />
                <span className="text-xs text-muted-foreground">
                  {promotion.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex gap-2">
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => movePromotion(promotion.id, 'up')}
                    disabled={index === 0}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => movePromotion(promotion.id, 'down')}
                    disabled={index === sortedPromotions.length - 1}
                  >
                    <ArrowDown />
                  </Button>
                </div>
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
                  onClick={() => deletePromotion(promotion.id)}
                >
                  <Trash />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {promotions.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p>No promotions yet. Click "Add Promotion" to create your first promotion.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
