import { Button } from '@/components/ui/button'
import { ArrowRight } from '@phosphor-icons/react'
import type {
  HeroConfig,
  Promotion,
  FeaturedItem,
  Banner,
  MenuItem,
  Category,
  CartItem,
  LandingPageConfig,
} from '@/lib/types'
import { HeroSection } from './HeroSection'
import { BannersSection } from './BannersSection'
import { PromotionsCarousel } from './PromotionsCarousel'
import { FeaturedItems } from './FeaturedItems'

interface LandingPageProps {
  heroConfig: HeroConfig
  promotions: Promotion[]
  featuredItems: FeaturedItem[]
  banners: Banner[]
  menuItems: MenuItem[]
  categories: Category[]
  landingPageConfig: LandingPageConfig
  cart: CartItem[]
  setCart: (cart: CartItem[] | ((prev: CartItem[]) => CartItem[])) => void
  onNavigate: (view: string, categoryId?: string) => void
}

export function LandingPage({
  heroConfig,
  promotions,
  featuredItems,
  banners,
  menuItems,
  categories: _categories,
  landingPageConfig,
  cart: _cart,
  setCart,
  onNavigate,
}: LandingPageProps) {
  // _categories and _cart are available for future use (e.g., category quick links)
  const handleCtaClick = (link: string) => {
    if (link === 'menu') {
      onNavigate('menu')
    } else if (link.startsWith('category:')) {
      const categoryId = link.replace('category:', '')
      onNavigate('menu', categoryId)
    } else if (link.startsWith('http://') || link.startsWith('https://')) {
      window.open(link, '_blank', 'noopener,noreferrer')
    } else {
      onNavigate('menu')
    }
  }

  const handlePromotionClick = (promotion: Promotion) => {
    if (promotion.linkedCategoryId) {
      onNavigate('menu', promotion.linkedCategoryId)
    } else if (
      promotion.linkedMenuItemIds &&
      promotion.linkedMenuItemIds.length > 0
    ) {
      // Navigate to menu - the user can view the promoted items
      onNavigate('menu')
    } else {
      onNavigate('menu')
    }
  }

  const handleBannerClick = (banner: Banner) => {
    switch (banner.linkType) {
      case 'category':
        onNavigate('menu', banner.linkValue)
        break
      case 'menu':
        onNavigate('menu')
        break
      case 'external':
        if (banner.linkValue) {
          window.open(banner.linkValue, '_blank', 'noopener,noreferrer')
        }
        break
      case 'none':
      default:
        // Do nothing for non-clickable banners
        break
    }
  }

  const handleViewFullMenu = () => {
    onNavigate('menu')
  }

  return (
    <div className="w-full">
      {/* Hero Section */}
      {landingPageConfig.showHero && (
        <HeroSection config={heroConfig} onCtaClick={handleCtaClick} />
      )}

      {/* Top Banners */}
      {landingPageConfig.showBanners && (
        <div className="mt-8">
          <BannersSection
            banners={banners}
            position="top"
            onBannerClick={handleBannerClick}
          />
        </div>
      )}

      {/* Promotions Carousel */}
      {landingPageConfig.showPromotions && (
        <div className="mt-8 md:mt-12">
          <PromotionsCarousel
            promotions={promotions}
            title={landingPageConfig.promotionsTitle}
            onPromotionClick={handlePromotionClick}
          />
        </div>
      )}

      {/* Middle Banners */}
      {landingPageConfig.showBanners && (
        <div className="mt-8">
          <BannersSection
            banners={banners}
            position="middle"
            onBannerClick={handleBannerClick}
          />
        </div>
      )}

      {/* Featured Items */}
      {landingPageConfig.showFeaturedItems && (
        <div className="mt-8 md:mt-12">
          <FeaturedItems
            featuredItems={featuredItems}
            menuItems={menuItems}
            title={landingPageConfig.featuredItemsTitle}
            setCart={setCart}
          />
        </div>
      )}

      {/* Bottom Banners */}
      {landingPageConfig.showBanners && (
        <div className="mt-8">
          <BannersSection
            banners={banners}
            position="bottom"
            onBannerClick={handleBannerClick}
          />
        </div>
      )}

      {/* View Full Menu Button */}
      <div className="w-full px-4 md:px-6 lg:px-8 py-12 md:py-16">
        <div className="max-w-7xl mx-auto flex justify-center">
          <Button
            size="lg"
            onClick={handleViewFullMenu}
            className="text-base md:text-lg px-8 py-6 gap-2"
          >
            View Full Menu
            <ArrowRight weight="bold" className="size-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
