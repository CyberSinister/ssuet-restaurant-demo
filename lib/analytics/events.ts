/**
 * Analytics event tracking
 * Track user interactions and performance metrics
 */

// Event types
export enum AnalyticsEvent {
  // Order events
  ORDER_PLACED = 'order_placed',
  ORDER_STATUS_CHANGED = 'order_status_changed',
  ORDER_CANCELLED = 'order_cancelled',

  // Cart events
  ITEM_ADDED_TO_CART = 'item_added_to_cart',
  ITEM_REMOVED_FROM_CART = 'item_removed_from_cart',
  CART_CLEARED = 'cart_cleared',

  // Menu events
  MENU_VIEWED = 'menu_viewed',
  CATEGORY_SELECTED = 'category_selected',
  ITEM_VIEWED = 'item_viewed',

  // Admin events
  ADMIN_LOGIN = 'admin_login',
  MENU_ITEM_CREATED = 'menu_item_created',
  MENU_ITEM_UPDATED = 'menu_item_updated',
  MENU_ITEM_DELETED = 'menu_item_deleted',
  CATEGORY_CREATED = 'category_created',
  CATEGORY_UPDATED = 'category_updated',
  SETTINGS_UPDATED = 'settings_updated',

  // Performance events
  PAGE_LOAD = 'page_load',
  API_CALL = 'api_call',
  ERROR_OCCURRED = 'error_occurred',
}

interface EventProperties {
  [key: string]: string | number | boolean | null | undefined
}

// Track custom events
export function trackEvent(event: AnalyticsEvent, properties?: EventProperties): void {
  // Client-side only
  if (typeof window === 'undefined') return

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', event, properties)
  }

  // Send to Vercel Analytics
  if (window.va) {
    window.va('event', event, properties)
  }

  // Send to other analytics platforms (Google Analytics, etc.)
  if (window.gtag) {
    window.gtag('event', event, properties)
  }
}

// Order tracking
export function trackOrderPlaced(orderId: string, total: number, itemCount: number): void {
  trackEvent(AnalyticsEvent.ORDER_PLACED, {
    order_id: orderId,
    total,
    item_count: itemCount,
  })
}

export function trackOrderStatusChanged(orderId: string, newStatus: string): void {
  trackEvent(AnalyticsEvent.ORDER_STATUS_CHANGED, {
    order_id: orderId,
    status: newStatus,
  })
}

// Cart tracking
export function trackItemAddedToCart(itemId: string, itemName: string, price: number): void {
  trackEvent(AnalyticsEvent.ITEM_ADDED_TO_CART, {
    item_id: itemId,
    item_name: itemName,
    price,
  })
}

export function trackItemRemovedFromCart(itemId: string): void {
  trackEvent(AnalyticsEvent.ITEM_REMOVED_FROM_CART, {
    item_id: itemId,
  })
}

// Menu tracking
export function trackCategorySelected(categoryId: string, categoryName: string): void {
  trackEvent(AnalyticsEvent.CATEGORY_SELECTED, {
    category_id: categoryId,
    category_name: categoryName,
  })
}

// Performance tracking
export function trackPageLoad(path: string, loadTime: number): void {
  trackEvent(AnalyticsEvent.PAGE_LOAD, {
    path,
    load_time: loadTime,
  })
}

export function trackApiCall(
  endpoint: string,
  method: string,
  duration: number,
  status: number
): void {
  trackEvent(AnalyticsEvent.API_CALL, {
    endpoint,
    method,
    duration,
    status,
  })
}

export function trackError(error: Error, context?: string): void {
  trackEvent(AnalyticsEvent.ERROR_OCCURRED, {
    error_message: error.message,
    error_stack: error.stack?.substring(0, 500), // Limit stack trace length
    context,
  })
}

// Type declarations for global analytics
declare global {
  interface Window {
    va?: (event: string, name: string, properties?: EventProperties) => void
    gtag?: (
      command: string,
      event: string,
      properties?: EventProperties
    ) => void
  }
}
