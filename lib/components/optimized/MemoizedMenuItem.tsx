'use client'

import React, { memo, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus } from '@phosphor-icons/react'
import { OptimizedImage } from './OptimizedImage'
import type { MenuItem } from '@/lib/types'

interface MemoizedMenuItemProps {
  item: MenuItem
  categoryName: string
  onAddToCart: (item: MenuItem) => void
}

const MemoizedMenuItem = memo<MemoizedMenuItemProps>(
  ({ item, categoryName, onAddToCart }) => {
    const handleAddToCart = useCallback(() => {
      onAddToCart(item)
    }, [onAddToCart, item])

    const formattedPrice = item.price.toFixed(2)

    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="aspect-video w-full overflow-hidden bg-muted">
          <OptimizedImage
            src={item.image}
            alt={item.name}
            width={400}
            height={300}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            priority={false}
          />
        </div>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg leading-tight">
                {item.name}
              </h3>
              <p className="text-xs text-muted-foreground">{categoryName}</p>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {item.description}
              </p>
            </div>
            <span className="text-lg font-semibold text-primary shrink-0">
              ${formattedPrice}
            </span>
          </div>

          {item.dietaryTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.dietaryTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <Button
            onClick={handleAddToCart}
            disabled={!item.available}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            <Plus className="mr-2" />
            {item.available ? 'Add to Cart' : 'Unavailable'}
          </Button>
        </CardContent>
      </Card>
    )
  },
  (prevProps, nextProps) => {
    // Custom comparison function for better performance
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.available === nextProps.item.available &&
      prevProps.item.price === nextProps.item.price &&
      prevProps.categoryName === nextProps.categoryName
    )
  }
)

MemoizedMenuItem.displayName = 'MemoizedMenuItem'

export { MemoizedMenuItem }
