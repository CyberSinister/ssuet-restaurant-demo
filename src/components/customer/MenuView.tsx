'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { Input } from '@/components/ui/input'
import { Plus, Minus, MagnifyingGlass, ForkKnife } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { MenuItem, Category, CartItem, RestaurantSettings } from '@/lib/types'

// Price formatter using Intl.NumberFormat
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price)
}

// Menu Card Skeleton Component
function MenuCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full" />
      <CardContent className="p-4 space-y-3">
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>
      </CardContent>
    </Card>
  )
}

// Loading Skeleton Grid
function MenuLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <MenuCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Empty State Component
function EmptyState({
  searchQuery,
  selectedCategory
}: {
  searchQuery: string
  selectedCategory: string
}) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
        <ForkKnife className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No items found</h3>
      <p className="text-muted-foreground max-w-md">
        {searchQuery ? (
          <>
            We could not find any items matching "<span className="font-medium">{searchQuery}</span>".
            Try a different search term or browse our categories.
          </>
        ) : selectedCategory !== 'all' ? (
          <>
            There are no items available in this category right now.
            Check back soon or explore other categories.
          </>
        ) : (
          <>
            Our menu is being updated. Please check back soon for delicious options.
          </>
        )}
      </p>
    </div>
  )
}

// Category Pills Component
function CategoryPills({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: {
  categories: Category[]
  selectedCategoryId: string
  onSelectCategory: (id: string) => void
}) {
  const activeCategories = categories
    .filter((cat) => cat.active)
    .sort((a, b) => a.displayOrder - b.displayOrder)

  return (
    <div className="relative -mx-4 px-4">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => onSelectCategory('all')}
          className={cn(
            'shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 active:scale-95',
            'border border-transparent',
            selectedCategoryId === 'all'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'bg-secondary/80 text-secondary-foreground hover:bg-secondary'
          )}
        >
          All Items
        </button>
        {activeCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={cn(
              'shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 active:scale-95',
              'border border-transparent',
              selectedCategoryId === category.id
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-secondary/80 text-secondary-foreground hover:bg-secondary'
            )}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  )
}

// Menu Item Card Component - Broadway Style
function MenuItemCard({
  item,
  quantity,
  onAdd,
  onRemove,
}: {
  item: MenuItem
  quantity: number
  onAdd: () => void
  onRemove: () => void
}) {
  return (
    <div
      className="h-full transform transition-all hover:-translate-y-1 duration-300"
    >
      <Card className="overflow-hidden h-full group flex flex-col border-2 border-transparent hover:border-primary transition-all duration-300 shadow-md hover:shadow-xl bg-white">
        {/* Image Container */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />

          {/* Price Tag - Broadway Style Badge */}
          <div className="absolute top-0 right-0 bg-yellow-400 text-black font-black text-lg px-3 py-1 rounded-bl-lg shadow-sm z-10">
            {formatPrice(item.price)}
          </div>

          {/* Discount Badge (Mock) */}
          <div className="absolute top-0 left-0 bg-primary text-white font-bold text-xs uppercase px-2 py-1 rounded-br-lg z-10">
            HOT DEAL
          </div>

          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
        </div>

        {/* Content */}
        <CardContent className="p-4 flex flex-col flex-grow space-y-3">
          <div className="space-y-1 flex-grow">
            <h3 className="font-bold text-xl uppercase tracking-tight text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
              {item.name}
            </h3>
            <p className="text-sm text-gray-500 line-clamp-3 font-medium">
              {item.description}
            </p>
          </div>

          <div className="pt-2">
            {/* Add to Cart / Quantity Controls */}
            {quantity > 0 ? (
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-1 border border-gray-200">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 rounded-md text-black hover:bg-gray-200"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove()
                  }}
                >
                  <Minus className="h-4 w-4" weight="bold" />
                </Button>
                <span className="flex-1 text-center font-bold text-lg text-black">
                  {quantity}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 rounded-md text-black hover:bg-gray-200"
                  onClick={(e) => {
                    e.stopPropagation()
                    onAdd()
                  }}
                >
                  <Plus className="h-4 w-4" weight="bold" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  onAdd()
                }}
                disabled={!item.available}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-wider py-6 rounded-md shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <Plus className="h-5 w-5" weight="bold" />
                  Add to Cart
                </div>
              </Button>
            )}
          </div>

          {!item.available && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
              <span className="bg-red-600 text-white font-bold px-4 py-2 transform -rotate-12 border-2 border-white shadow-lg uppercase text-lg">
                Sold Out
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface MenuViewProps {
  menuItems?: MenuItem[]
  categories?: Category[]
  cart?: CartItem[]
  setCart?: (cart: CartItem[] | ((prev: CartItem[]) => CartItem[])) => void
  settings?: RestaurantSettings
  onRequireLocation?: () => void
  isLocationSet?: boolean
}

// Main MenuView Component
export default function MenuView({
  menuItems = [],
  categories = [],
  cart,
  setCart,
  settings: _settings,
  onRequireLocation,
  isLocationSet
}: MenuViewProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Get quantity for a specific item
  const getItemQuantity = (itemId: string): number => {
    const cartItem = cart.find((item) => item.menuItem.id === itemId)
    return cartItem?.quantity ?? 0
  }

  // Get category name by ID
  const getCategoryName = (categoryId: string): string => {
    return categories.find((cat) => cat.id === categoryId)?.name ?? 'Menu Item'
  }

  // Filter items based on category and search
  const filteredItems = useMemo(() => {
    let items = menuItems.filter((item) => item.available)

    // Filter by category
    if (selectedCategoryId !== 'all') {
      items = items.filter((item) => item.categoryId === selectedCategoryId)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.dietaryTags.some((tag) => tag.toLowerCase().includes(query))
      )
    }

    return items
  }, [menuItems, selectedCategoryId, searchQuery])

  // Handle quantity update
  const handleUpdateQuantity = (itemId: string, diff: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.menuItem.id === itemId) {
          const newQty = item.quantity + diff
          return { ...item, quantity: newQty }
        }
        return item
      }).filter(item => item.quantity > 0)
    })
  }

  // Handle add to cart
  const handleAddItem = (item: MenuItem) => {
    if (!isLocationSet) {
      onRequireLocation()
      return
    }

    setCart(prev => {
      const existing = prev.find(i => i.menuItem.id === item.id)
      if (existing) {
        return prev.map(i => i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      // If item needs to be converted to CartItem structure
      const cartItem: CartItem = {
        menuItem: item,
        quantity: 1,
      }
      return [...prev, cartItem]
    })

    toast.success(`${item.name} added to cart`, {
      position: 'bottom-center',
      duration: 2000,
    })
  }

  // Handle remove from cart
  const handleRemoveItem = (item: MenuItem) => {
    handleUpdateQuantity(item.id, -1)
  }

  const isLoadingCategories = false
  const isLoading = false


  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Our Menu
        </h1>
        <p className="text-muted-foreground text-lg">
          Fresh ingredients, crafted with passion. Discover your next favorite dish.
        </p>
      </div>

      {/* Search & Filter Section */}
      <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500 delay-150">
        {/* Search Input */}
        <div className="relative max-w-md">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search for dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 rounded-full border-2 bg-background/50 backdrop-blur-sm"
          />
        </div>

        {/* Category Pills */}
        {!isLoadingCategories && categories.length > 0 && (
          <CategoryPills
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
          />
        )}
      </div>

      {/* Menu Grid */}
      {isLoading ? (
        <MenuLoadingSkeleton />
      ) : filteredItems.length === 0 ? (
        <EmptyState searchQuery={searchQuery} selectedCategory={selectedCategoryId} />
      ) : (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500 delay-300"
        >
          {filteredItems.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              quantity={getItemQuantity(item.id)}
              onAdd={() => handleAddItem(item)}
              onRemove={() => handleRemoveItem(item)}
            />
          ))}
        </div>
      )}

      {/* Results count */}
      {!isLoading && filteredItems.length > 0 && (
        <p className="text-sm text-muted-foreground text-center pt-4 animate-in fade-in duration-500 delay-500">
          Showing {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
          {selectedCategoryId !== 'all' && ` in ${getCategoryName(selectedCategoryId)}`}
          {searchQuery && ` matching "${searchQuery}"`}
        </p>
      )}
    </div>
  )
}
