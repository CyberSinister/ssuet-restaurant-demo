'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel'
import type { Promotion } from '@/lib/types'

interface PromotionsCarouselProps {
  promotions: Promotion[]
  title: string
  onPromotionClick?: (promotion: Promotion) => void
}

export function PromotionsCarousel({
  promotions,
  title,
  onPromotionClick,
}: PromotionsCarouselProps) {
  // Filter active promotions and sort by displayOrder
  const activePromotions = promotions
    .filter((promo) => {
      if (!promo.active) return false

      const now = Date.now()
      if (promo.validFrom && now < promo.validFrom) return false
      if (promo.validUntil && now > promo.validUntil) return false

      return true
    })
    .sort((a, b) => a.displayOrder - b.displayOrder)

  if (activePromotions.length === 0) {
    return null
  }

  return (
    <section className="w-full px-4 md:px-6 lg:px-8 py-8 md:py-12">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">{title}</h2>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Carousel
            opts={{
              align: 'start',
              loop: activePromotions.length > 3,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {activePromotions.map((promotion) => (
                <CarouselItem
                  key={promotion.id}
                  className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
                >
                  <div className="h-full">
                    <Card
                      className={cn(
                        'overflow-hidden h-full cursor-pointer transition-shadow hover:shadow-lg',
                        onPromotionClick && 'cursor-pointer'
                      )}
                      onClick={() => onPromotionClick?.(promotion)}
                    >
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <img
                          src={promotion.image}
                          alt={promotion.title}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                        {promotion.badgeText && (
                          <Badge className="absolute top-3 left-3 bg-red-500 hover:bg-red-600 text-white">
                            {promotion.badgeText}
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-4 md:p-6">
                        <h3 className="text-lg md:text-xl font-semibold mb-2">
                          {promotion.title}
                        </h3>
                        <p className="text-sm md:text-base text-muted-foreground line-clamp-2">
                          {promotion.description}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {activePromotions.length > 1 && (
              <>
                <CarouselPrevious className="hidden md:flex -left-4 lg:-left-6" />
                <CarouselNext className="hidden md:flex -right-4 lg:-right-6" />
              </>
            )}
          </Carousel>
        </div>
      </div>
    </section>
  )
}
