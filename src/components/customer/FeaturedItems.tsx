'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { FeaturedItem, MenuItem, CartItem } from '@/lib/types'

interface FeaturedItemsProps {
  featuredItems: FeaturedItem[]
  menuItems: MenuItem[]
  title: string
  setCart: (cart: CartItem[] | ((prev: CartItem[]) => CartItem[])) => void
}

export function FeaturedItems({
  featuredItems,
  menuItems,
  title,
  setCart,
}: FeaturedItemsProps) {
  // Filter active featured items, join with menu items, and sort by displayOrder
  const activeFeaturedItems = featuredItems
    .filter((item) => item.active)
    .map((featured) => {
      const menuItem = menuItems.find((mi) => mi.id === featured.menuItemId)
      return menuItem ? { featured, menuItem } : null
    })
    .filter(
      (item): item is { featured: FeaturedItem; menuItem: MenuItem } =>
        item !== null && item.menuItem.available
    )
    .sort((a, b) => a.featured.displayOrder - b.featured.displayOrder)

  if (activeFeaturedItems.length === 0) {
    return null
  }

  const handleAddToCart = (menuItem: MenuItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.menuItem.id === menuItem.id
      )

      if (existingItem) {
        return prevCart.map((item) =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: existingItem.quantity + 1 }
            : item
        )
      }

      return [...prevCart, { menuItem, quantity: 1 }]
    })

    toast.success(`${menuItem.name} added to cart`)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  return (
    <section className="w-full px-4 md:px-6 lg:px-8 py-8 md:py-12">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">{title}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {activeFeaturedItems.map(({ featured, menuItem }) => (
            <div key={featured.id}>
              <Card className="overflow-hidden h-full flex flex-col group transition-transform duration-300 hover:-translate-y-1">
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={menuItem.image}
                    alt={featured.customTitle || menuItem.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {featured.badgeText && (
                    <Badge variant="secondary" className="absolute top-3 left-3 shadow-sm">
                      {featured.badgeText}
                    </Badge>
                  )}
                </div>

                <CardContent className="p-4 flex flex-col flex-1">
                  <h3 className="text-lg font-semibold mb-1">
                    {featured.customTitle || menuItem.name}
                  </h3>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">
                    {featured.customDescription || menuItem.description}
                  </p>

                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-lg font-bold text-primary">
                      {formatPrice(menuItem.price)}
                    </span>

                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleAddToCart(menuItem)}
                      className="gap-1"
                    >
                      <Plus weight="bold" className="size-4" />
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
