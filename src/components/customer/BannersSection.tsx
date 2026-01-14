import type { Banner, BannerPosition } from '@/lib/types'
import { PromotionalBanner } from './PromotionalBanner'

interface BannersSectionProps {
  banners: Banner[]
  position: BannerPosition
  onBannerClick?: (banner: Banner) => void
}

export function BannersSection({
  banners,
  position,
  onBannerClick,
}: BannersSectionProps) {
  // Filter banners by position and active status, then sort by displayOrder
  const filteredBanners = banners
    .filter((banner) => banner.position === position && banner.active)
    .sort((a, b) => a.displayOrder - b.displayOrder)

  if (filteredBanners.length === 0) {
    return null
  }

  return (
    <section className="w-full px-4 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-4">
        {filteredBanners.map((banner) => (
          <PromotionalBanner
            key={banner.id}
            banner={banner}
            onClick={onBannerClick}
          />
        ))}
      </div>
    </section>
  )
}
