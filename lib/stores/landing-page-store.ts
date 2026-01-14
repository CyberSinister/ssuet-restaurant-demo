import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  HeroConfig,
  Promotion,
  FeaturedItem,
  Banner,
  LandingPageConfig,
} from '@/lib/types/landing-page'

interface LandingPageState {
  heroConfig: HeroConfig
  promotions: Promotion[]
  featuredItems: FeaturedItem[]
  banners: Banner[]
  landingPageConfig: LandingPageConfig
}

interface LandingPageActions {
  setHeroConfig: (config: HeroConfig) => void
  updateHeroConfig: (config: Partial<HeroConfig>) => void
  setPromotions: (promotions: Promotion[]) => void
  addPromotion: (promotion: Promotion) => void
  updatePromotion: (id: string, promotion: Partial<Promotion>) => void
  removePromotion: (id: string) => void
  setFeaturedItems: (items: FeaturedItem[]) => void
  addFeaturedItem: (item: FeaturedItem) => void
  updateFeaturedItem: (id: string, item: Partial<FeaturedItem>) => void
  removeFeaturedItem: (id: string) => void
  setBanners: (banners: Banner[]) => void
  addBanner: (banner: Banner) => void
  updateBanner: (id: string, banner: Partial<Banner>) => void
  removeBanner: (id: string) => void
  setLandingPageConfig: (config: LandingPageConfig) => void
  updateLandingPageConfig: (config: Partial<LandingPageConfig>) => void
  resetToDefaults: () => void
}

type LandingPageStore = LandingPageState & LandingPageActions

const defaultHeroConfig: HeroConfig = {
  id: 'hero-1',
  title: 'Welcome to Bistro Bay',
  subtitle: 'Experience culinary excellence with every bite',
  tagline: 'Fresh ingredients, timeless recipes',
  backgroundImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=80',
  ctaText: 'View Our Menu',
  ctaLink: '/menu',
  overlayOpacity: 0.5,
  textAlignment: 'center',
  active: true,
}

const defaultPromotions: Promotion[] = [
  {
    id: 'promo-1',
    title: 'Weekend Brunch Special',
    description: 'Enjoy 20% off all brunch items every Saturday and Sunday from 9am to 2pm.',
    discountType: 'percentage',
    discountValue: 20,
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
    badgeText: '20% OFF',
    linkedCategoryId: 'brunch',
    active: true,
    displayOrder: 1,
  },
  {
    id: 'promo-2',
    title: 'Family Feast Deal',
    description: 'Order any 2 main courses and get a free appetizer of your choice.',
    discountType: 'freeItem',
    discountValue: 0,
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
    badgeText: 'FREE APPETIZER',
    active: true,
    displayOrder: 2,
  },
  {
    id: 'promo-3',
    title: 'Happy Hour',
    description: 'Half price on selected drinks and appetizers from 4pm to 7pm daily.',
    discountType: 'percentage',
    discountValue: 50,
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&q=80',
    badgeText: '50% OFF',
    linkedCategoryId: 'drinks',
    active: true,
    displayOrder: 3,
  },
]

const defaultFeaturedItems: FeaturedItem[] = [
  {
    id: 'featured-1',
    menuItemId: '1',
    customTitle: 'Chef\'s Signature Steak',
    customDescription: 'Our award-winning dry-aged ribeye with truffle butter',
    badgeText: 'Chef\'s Choice',
    displayOrder: 1,
    active: true,
  },
  {
    id: 'featured-2',
    menuItemId: '2',
    customTitle: 'Fresh Catch of the Day',
    customDescription: 'Sustainably sourced seafood prepared to perfection',
    badgeText: 'Popular',
    displayOrder: 2,
    active: true,
  },
  {
    id: 'featured-3',
    menuItemId: '3',
    customTitle: 'Artisan Pasta',
    customDescription: 'Handmade pasta with seasonal ingredients',
    badgeText: 'New',
    displayOrder: 3,
    active: true,
  },
  {
    id: 'featured-4',
    menuItemId: '4',
    customTitle: 'Decadent Dessert Platter',
    customDescription: 'A selection of our finest house-made desserts',
    badgeText: 'Must Try',
    displayOrder: 4,
    active: true,
  },
]

const defaultBanners: Banner[] = [
  {
    id: 'banner-1',
    title: 'Order Online for Pickup',
    subtitle: 'Skip the wait - order ahead and pick up when ready',
    image: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=1200&q=80',
    linkType: 'menu',
    linkValue: '/menu',
    backgroundColor: '#1a1a2e',
    textColor: 'light',
    position: 'top',
    size: 'large',
    active: true,
    displayOrder: 1,
  },
  {
    id: 'banner-2',
    title: 'Catering Services Available',
    subtitle: 'Let us cater your next event with our delicious menu',
    image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=1200&q=80',
    linkType: 'external',
    linkValue: '/catering',
    backgroundColor: '#16213e',
    textColor: 'light',
    position: 'middle',
    size: 'medium',
    active: true,
    displayOrder: 2,
  },
]

const defaultLandingPageConfig: LandingPageConfig = {
  showHero: true,
  showPromotions: true,
  showFeaturedItems: true,
  showBanners: true,
  promotionsTitle: 'Special Offers',
  featuredItemsTitle: 'Featured Dishes',
}

const defaultState: LandingPageState = {
  heroConfig: defaultHeroConfig,
  promotions: defaultPromotions,
  featuredItems: defaultFeaturedItems,
  banners: defaultBanners,
  landingPageConfig: defaultLandingPageConfig,
}

export const useLandingPageStore = create<LandingPageStore>()(
  persist(
    (set) => ({
      ...defaultState,

      setHeroConfig: (config) => set({ heroConfig: config }),

      updateHeroConfig: (config) =>
        set((state) => ({
          heroConfig: { ...state.heroConfig, ...config },
        })),

      setPromotions: (promotions) => set({ promotions }),

      addPromotion: (promotion) =>
        set((state) => ({
          promotions: [...state.promotions, promotion],
        })),

      updatePromotion: (id, promotion) =>
        set((state) => ({
          promotions: state.promotions.map((p) =>
            p.id === id ? { ...p, ...promotion } : p
          ),
        })),

      removePromotion: (id) =>
        set((state) => ({
          promotions: state.promotions.filter((p) => p.id !== id),
        })),

      setFeaturedItems: (items) => set({ featuredItems: items }),

      addFeaturedItem: (item) =>
        set((state) => ({
          featuredItems: [...state.featuredItems, item],
        })),

      updateFeaturedItem: (id, item) =>
        set((state) => ({
          featuredItems: state.featuredItems.map((i) =>
            i.id === id ? { ...i, ...item } : i
          ),
        })),

      removeFeaturedItem: (id) =>
        set((state) => ({
          featuredItems: state.featuredItems.filter((i) => i.id !== id),
        })),

      setBanners: (banners) => set({ banners }),

      addBanner: (banner) =>
        set((state) => ({
          banners: [...state.banners, banner],
        })),

      updateBanner: (id, banner) =>
        set((state) => ({
          banners: state.banners.map((b) =>
            b.id === id ? { ...b, ...banner } : b
          ),
        })),

      removeBanner: (id) =>
        set((state) => ({
          banners: state.banners.filter((b) => b.id !== id),
        })),

      setLandingPageConfig: (config) => set({ landingPageConfig: config }),

      updateLandingPageConfig: (config) =>
        set((state) => ({
          landingPageConfig: { ...state.landingPageConfig, ...config },
        })),

      resetToDefaults: () => set(defaultState),
    }),
    {
      name: 'landing-page-config',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

export type { LandingPageStore, LandingPageState, LandingPageActions }
