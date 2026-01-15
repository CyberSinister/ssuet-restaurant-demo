'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { MenuItem, Category, CartItem, Banner } from '@/lib/types'

interface BroadwayLayoutProps {
  menuItems: MenuItem[]
  categories: Category[]
  banners: Banner[]
  cart: CartItem[]
  setCart: (cart: CartItem[] | ((prev: CartItem[]) => CartItem[])) => void
  isLocationSet: boolean
  onRequireLocation: () => void
}

// Hero Slider Component
function HeroSlider({ banners }: { banners: Banner[] }) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const activeBanners = banners.filter(b => b.active)

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % activeBanners.length)
  }, [activeBanners.length])

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + activeBanners.length) % activeBanners.length)
  }

  useEffect(() => {
    if (activeBanners.length <= 1) return
    const timer = setInterval(nextSlide, 5000)
    return () => clearInterval(timer)
  }, [activeBanners.length, nextSlide])

  if (activeBanners.length === 0) {
    return (
      <div className="relative w-full h-[200px] md:h-[300px] lg:h-[400px] bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center">
        <h2 className="text-2xl md:text-4xl font-black text-primary uppercase tracking-wider">
          Welcome to Our Restaurant
        </h2>
      </div>
    )
  }

  return (
    <div className="relative w-full h-[200px] md:h-[300px] lg:h-[400px] overflow-hidden group">
      {/* Slides */}
      <div
        className="flex h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {activeBanners.map((banner, _index) => (
          <div
            key={banner.id}
            className="min-w-full h-full relative flex-shrink-0"
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${banner.image})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
            <div className="relative z-10 h-full flex flex-col justify-center px-6 md:px-12 lg:px-20">
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white uppercase tracking-tight max-w-xl">
                {banner.title}
              </h2>
              {banner.subtitle && (
                <p className="text-sm md:text-lg text-gray-200 mt-2 max-w-md">
                  {banner.subtitle}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {activeBanners.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 md:p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 md:p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {activeBanners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {activeBanners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={cn(
                "w-2 h-2 md:w-3 md:h-3 rounded-full transition-all",
                index === currentSlide ? "bg-accent w-6 md:w-8" : "bg-white/50 hover:bg-white/80"
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Category Navigation Bar
function CategoryBar({
  categories,
  activeCategory,
  onCategoryClick
}: {
  categories: Category[]
  activeCategory: string | null
  onCategoryClick: (categoryId: string) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  useEffect(() => {
    if (activeCategory && scrollRef.current && buttonRefs.current[activeCategory]) {
      const activeBtn = buttonRefs.current[activeCategory]
      const container = scrollRef.current
      if (activeBtn) {
        const scrollLeft = activeBtn.offsetLeft - (container.clientWidth / 2) + (activeBtn.clientWidth / 2)
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' })
      }
    }
  }, [activeCategory])

  return (
    <div className="sticky top-[44px] z-30 bg-background/95 backdrop-blur-sm border-b border-border w-full">
      <div
        ref={scrollRef}
        className="overflow-x-auto scrollbar-hide"
      >
        <div className="flex gap-1 p-2 md:p-3 px-4">
          {categories.map((category) => (
            <button
              key={category.id}
              ref={(el) => { if (el) buttonRefs.current[category.id] = el }}
              onClick={() => onCategoryClick(category.id)}
              className={cn(
                "shrink-0 px-4 md:px-6 py-2 md:py-3 rounded-lg font-bold text-sm md:text-base uppercase tracking-wide transition-all whitespace-nowrap",
                activeCategory === category.id
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-primary"
              )}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Product Card
function ProductCard({
  item,
  cartQuantity,
  onAdd,
  onUpdateQuantity
}: {
  item: MenuItem
  cartQuantity: number
  onAdd: () => void
  onUpdateQuantity: (delta: number) => void
}) {
  return (
    <Card className="bg-card border-border overflow-hidden hover:border-primary/50 transition-all group">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {!item.available && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <Badge variant="destructive" className="text-sm">Out of Stock</Badge>
          </div>
        )}
        {item.popular && (
          <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground font-bold">
            Popular
          </Badge>
        )}
      </div>
      <CardContent className="p-3 md:p-4">
        <h3 className="font-bold text-foreground text-sm md:text-base line-clamp-1 mb-1">
          {item.name}
        </h3>
        {item.description && (
          <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 mb-3">
            {item.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-accent font-black text-lg md:text-xl">
            Rs. {item.price.toLocaleString()}
          </span>

          {item.available && (
            cartQuantity > 0 ? (
              <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                <button
                  onClick={() => onUpdateQuantity(-1)}
                  className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center bg-background hover:bg-primary hover:text-primary-foreground rounded transition-colors shadow-sm"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-6 text-center font-bold text-foreground">{cartQuantity}</span>
                <button
                  onClick={() => onUpdateQuantity(1)}
                  className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/80 rounded transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={onAdd}
                className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            )
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Category Section with Products
function CategorySection({
  category,
  items,
  cart,
  onAddToCart,
  onUpdateQuantity
}: {
  category: Category
  items: MenuItem[]
  cart: CartItem[]
  onAddToCart: (item: MenuItem) => void
  onUpdateQuantity: (itemId: string, delta: number) => void
}) {
  const getCartQuantity = (itemId: string) => {
    const cartItem = cart.find(c => c.menuItem.id === itemId)
    return cartItem?.quantity || 0
  }

  if (items.length === 0) return null

  return (
    <section id={`category-${category.id}`} className="py-6 md:py-8 scroll-mt-32">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-4 mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-foreground uppercase tracking-tight">
            {category.name}
          </h2>
          <div className="flex-1 h-[2px] bg-gradient-to-r from-primary/50 to-transparent" />
          <span className="text-sm text-muted-foreground">{items.length} items</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
          {items.map(item => (
            <ProductCard
              key={item.id}
              item={item}
              cartQuantity={getCartQuantity(item.id)}
              onAdd={() => onAddToCart(item)}
              onUpdateQuantity={(delta) => onUpdateQuantity(item.id, delta)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

// Main Broadway Layout Component
export function BroadwayLayout({
  menuItems,
  categories,
  banners,
  cart,
  setCart,
  isLocationSet,
  onRequireLocation,
}: BroadwayLayoutProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(
    categories[0]?.id || null
  )

  // Group items by category
  const itemsByCategory = categories.reduce((acc, category) => {
    acc[category.id] = menuItems.filter(item => item.categoryId === category.id)
    return acc
  }, {} as Record<string, MenuItem[]>)

  // Filter categories that have items
  const categoriesWithItems = categories.filter(c => itemsByCategory[c.id]?.length > 0)

  // Scroll Spy Logic
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Extract category ID from section ID "category-xyz"
            const categoryId = entry.target.id.replace('category-', '')
            setActiveCategory(categoryId)
          }
        })
      },
      {
        rootMargin: '-110px 0px -70% 0px', // Trigger when section is near the sticky header
        threshold: 0
      }
    )

    categoriesWithItems.forEach((cat) => {
      const element = document.getElementById(`category-${cat.id}`)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [categoriesWithItems, menuItems]) // Added menuItems to re-trigger when data loads

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId)
    const element = document.getElementById(`category-${categoryId}`)
    if (element) {
      // Offset for sticky header
      const y = element.getBoundingClientRect().top + window.scrollY - 120
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  const handleAddToCart = (item: MenuItem) => {
    if (!isLocationSet) {
      onRequireLocation()
      return
    }

    setCart((prev) => {
      const existing = prev.find(c => c.menuItem.id === item.id)
      if (existing) {
        return prev.map(c =>
          c.menuItem.id === item.id
            ? { ...c, quantity: c.quantity + 1 }
            : c
        )
      }
      return [...prev, { menuItem: item, quantity: 1 }]
    })
  }

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map(c =>
          c.menuItem.id === itemId
            ? { ...c, quantity: Math.max(0, c.quantity + delta) }
            : c
        )
        .filter(c => c.quantity > 0)
    })
  }


  return (
    <div className="min-h-screen bg-background w-full">
      {/* Hero Slider */}
      <HeroSlider banners={banners} />

      {/* Category Navigation */}
      <CategoryBar
        categories={categoriesWithItems}
        activeCategory={activeCategory}
        onCategoryClick={handleCategoryClick}
      />

      {/* Products by Category */}
      <div className="pb-20">
        {categoriesWithItems.map(category => (
          <CategorySection
            key={category.id}
            category={category}
            items={itemsByCategory[category.id] || []}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateQuantity={handleUpdateQuantity}
          />
        ))}
      </div>
    </div>
  )
}

export default BroadwayLayout
