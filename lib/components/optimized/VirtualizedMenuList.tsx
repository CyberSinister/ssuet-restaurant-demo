'use client'

import React, { useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { MemoizedMenuItem } from './MemoizedMenuItem'
import type { MenuItem } from '@/lib/types'

interface VirtualizedMenuListProps {
  items: MenuItem[]
  categories: Array<{ id: string; name: string }>
  onAddToCart: (item: MenuItem) => void
  containerRef: React.RefObject<HTMLDivElement>
}

export function VirtualizedMenuList({
  items,
  categories,
  onAddToCart,
  containerRef,
}: VirtualizedMenuListProps) {
  const categoryMap = useMemo(() => {
    return categories.reduce(
      (acc, cat) => {
        acc[cat.id] = cat.name
        return acc
      },
      {} as Record<string, string>
    )
  }, [categories])

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 400, // Estimated height of each menu item card
    overscan: 5, // Number of items to render outside visible area
  })

  return (
    <div
      style={{
        height: `${rowVirtualizer.getTotalSize()}px`,
        width: '100%',
        position: 'relative',
      }}
    >
      {rowVirtualizer.getVirtualItems().map((virtualItem) => {
        const item = items[virtualItem.index]
        if (!item) return null

        return (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <MemoizedMenuItem
              item={item}
              categoryName={categoryMap[item.categoryId] || 'Unknown'}
              onAddToCart={onAddToCart}
            />
          </div>
        )
      })}
    </div>
  )
}
