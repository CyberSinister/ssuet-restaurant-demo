export interface HeroConfig {
  id: string
  title: string
  subtitle: string
  tagline: string
  backgroundImage: string
  ctaText: string
  ctaLink: string
  overlayOpacity: number
  textAlignment: 'left' | 'center' | 'right'
  active: boolean
}

export interface Promotion {
  id: string
  title: string
  description: string
  discountType: 'percentage' | 'fixed' | 'bogo' | 'freeItem'
  discountValue: number
  image: string
  badgeText?: string
  linkedCategoryId?: string
  active: boolean
  displayOrder: number
}

export interface FeaturedItem {
  id: string
  menuItemId: string
  customTitle?: string
  customDescription?: string
  badgeText?: string
  displayOrder: number
  active: boolean
}

export interface Banner {
  id: string
  title: string
  subtitle?: string
  image: string
  linkType: 'category' | 'external' | 'menu' | 'none'
  linkValue: string
  backgroundColor?: string
  textColor?: 'light' | 'dark'
  position: 'top' | 'middle' | 'bottom'
  size: 'small' | 'medium' | 'large' | 'full'
  active: boolean
  displayOrder: number
}

export interface LandingPageConfig {
  showHero: boolean
  showPromotions: boolean
  showFeaturedItems: boolean
  showBanners: boolean
  promotionsTitle: string
  featuredItemsTitle: string
}
