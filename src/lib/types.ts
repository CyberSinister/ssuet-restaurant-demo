export interface Category {
  id: string
  name: string
  description: string
  displayOrder: number
  active: boolean
}

export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  categoryId: string
  image: string
  dietaryTags: string[]
  available: boolean
}

export interface CartItem {
  menuItem: MenuItem
  quantity: number
  specialInstructions?: string
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'

export type OrderType = 'delivery' | 'pickup'

export interface Order {
  id: string
  items: CartItem[]
  customerName: string
  customerEmail: string
  customerPhone: string
  orderType: OrderType
  address?: string
  status: OrderStatus
  subtotal: number
  tax: number
  total: number
  createdAt: number
  notes?: string
}

export interface RestaurantSettings {
  name: string
  phone: string
  email: string
  address: string
  hours: {
    [key: string]: { open: string; close: string; closed: boolean }
  }
  deliveryFee: number
  minimumOrder: number
  taxRate: number
}

export interface SMTPConfig {
  host: string
  port: number
  username: string
  password: string
  secure: boolean
  fromEmail: string
  fromName: string
  enabled: boolean
}

// Landing Page Types

export interface HeroConfig {
  id: string
  title: string
  subtitle: string
  tagline: string
  backgroundImage: string
  ctaText: string
  ctaLink: string // 'menu', 'category:id', or external URL
  overlayOpacity: number // 0-100
  textAlignment: 'left' | 'center' | 'right'
  active: boolean
}

export type PromotionDiscountType = 'percentage' | 'fixed' | 'bogo' | 'freeItem'

export interface Promotion {
  id: string
  title: string
  description: string
  discountType: PromotionDiscountType
  discountValue: number
  image: string
  badgeText?: string // "20% OFF", "LIMITED TIME"
  linkedCategoryId?: string
  linkedMenuItemIds?: string[]
  validFrom?: number
  validUntil?: number
  active: boolean
  displayOrder: number
}

export interface FeaturedItem {
  id: string
  menuItemId: string
  customTitle?: string
  customDescription?: string
  badgeText?: string // "Chef's Special", "Popular"
  displayOrder: number
  active: boolean
}

export type BannerLinkType = 'category' | 'external' | 'menu' | 'none'
export type BannerPosition = 'top' | 'middle' | 'bottom'
export type BannerSize = 'small' | 'medium' | 'large' | 'full'

export interface Banner {
  id: string
  title: string
  subtitle?: string
  image: string
  linkType: BannerLinkType
  linkValue: string
  backgroundColor?: string
  textColor?: 'light' | 'dark'
  position: BannerPosition
  size: BannerSize
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

export interface Location {
  id: string
  name: string
  address: string
  city: string
  country: string
  phone?: string
  email?: string
  image?: string
  countryImages?: string[]
  cityImages?: string[]
  latitude?: number
  longitude?: number
  hours?: string
  active: boolean
  slug: string
  createdAt: string | Date
  updatedAt: string | Date
}
