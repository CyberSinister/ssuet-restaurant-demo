# Planning Guide

A complete food ordering system for a single restaurant with customer-facing ordering portal and admin dashboard for managing menu items, orders, and restaurant settings.

**Experience Qualities**:
1. **Efficient** - Quick ordering flow with minimal clicks, real-time order status updates, and instant admin controls
2. **Delightful** - Appetizing food imagery presentation, smooth transitions, and satisfying micro-interactions for order confirmations
3. **Trustworthy** - Clear pricing, order summaries, status tracking, and secure admin authentication

**Complexity Level**: Complex Application (advanced functionality, accounts)
  - Full ordering system with cart management, order history, admin dashboard, menu management, and order processing workflow

## Essential Features

### Customer Portal - Menu Browse & Search
- **Functionality**: Display categorized menu items with images, descriptions, prices, and dietary tags
- **Purpose**: Allow customers to discover and explore available food items
- **Trigger**: Landing on the app or clicking "Menu" navigation
- **Progression**: View categories → Browse items → Filter by dietary preferences → View item details → Add to cart
- **Success criteria**: All menu items display correctly with accurate pricing and clear categorization

### Customer Portal - Shopping Cart
- **Functionality**: Collect selected items, show quantities, calculate totals, apply modifiers
- **Purpose**: Enable customers to review and modify their order before checkout
- **Trigger**: Adding first item to cart or clicking cart icon
- **Progression**: Add items → Adjust quantities → Add special instructions → Review total → Proceed to checkout
- **Success criteria**: Cart persists across sessions, quantities update correctly, total calculates accurately including tax

### Customer Portal - Checkout & Order Placement
- **Functionality**: Collect customer info, delivery/pickup selection, payment method, place order
- **Purpose**: Complete the transaction and submit order to restaurant
- **Trigger**: Clicking "Checkout" from cart
- **Progression**: Enter contact info → Select delivery/pickup → Choose payment method → Review order → Place order → Receive confirmation
- **Success criteria**: Order successfully created with unique ID, customer receives confirmation, order appears in admin dashboard

### Customer Portal - Order Tracking
- **Functionality**: View current and past orders with real-time status updates
- **Purpose**: Keep customers informed about their order progress
- **Trigger**: After placing order or clicking "My Orders"
- **Progression**: View order list → Select order → See detailed status → Track preparation → Receive completion notification
- **Success criteria**: Status updates reflect admin changes in real-time, estimated times display correctly

### Admin Dashboard - Order Management
- **Functionality**: View incoming orders, update order status, mark as complete
- **Purpose**: Enable restaurant staff to process and fulfill orders efficiently
- **Trigger**: Admin logs in and views dashboard
- **Progression**: See new orders → Review order details → Update status (received → preparing → ready → completed) → Archive completed orders
- **Success criteria**: All orders display with complete details, status changes persist and notify customers

### Admin Dashboard - Menu Management
- **Functionality**: Add, edit, disable, or delete menu items with full details
- **Purpose**: Keep menu current and manage availability
- **Trigger**: Admin clicks "Manage Menu"
- **Progression**: View menu items → Add/edit item → Upload image → Set price/category → Toggle availability → Save changes
- **Success criteria**: Changes immediately reflect in customer portal, images upload and display correctly

### Admin Dashboard - Restaurant Settings
- **Functionality**: Update restaurant info, hours, delivery settings, contact details
- **Purpose**: Maintain accurate restaurant information
- **Trigger**: Admin clicks "Settings"
- **Progression**: Edit business hours → Update delivery radius → Set minimum order → Configure contact info → Save
- **Success criteria**: Settings persist and affect customer experience appropriately

## Edge Case Handling

- **Empty Cart Checkout** - Disable checkout button and show friendly message prompting to add items
- **Out of Stock Items** - Display "unavailable" badge, prevent adding to cart, show alternative suggestions
- **Invalid Contact Info** - Real-time validation with specific error messages for each field
- **Network Errors** - Show retry options with cached data, queue orders for retry, display connection status
- **Concurrent Admin Edits** - Last save wins with confirmation dialog if conflict detected
- **Large Order Quantities** - Warn when quantity exceeds reasonable amount (>10), confirm intentional
- **Past Business Hours** - Show closed status, allow browsing but disable ordering until next open time
- **Empty Menu States** - Guide admin to add first menu item, show placeholder for customers

## Design Direction

The design should feel warm, appetizing, and professional - evoking the comfort of quality restaurant dining with the efficiency of modern digital ordering. A clean, imagery-focused interface that puts food photos front and center, with generous white space and subtle shadows for depth. The admin dashboard should feel powerful yet simple, with clear data hierarchy and quick-action controls.

## Color Selection

Complementary (opposite colors) - Using warm orange tones for appetite appeal paired with deep teal for trust and professionalism, creating visual interest and clear action hierarchy.

- **Primary Color**: Deep Teal `oklch(0.45 0.08 220)` - Communicates trustworthiness and professionalism for primary actions and navigation
- **Secondary Colors**: Warm Cream `oklch(0.96 0.015 85)` for cards and soft backgrounds, providing warmth without overwhelming
- **Accent Color**: Vibrant Orange `oklch(0.68 0.18 45)` - Draws attention to CTAs, "Add to Cart" buttons, and active order status
- **Foreground/Background Pairings**:
  - Background (White `oklch(1 0 0)`): Dark Gray text `oklch(0.25 0 0)` - Ratio 13.5:1 ✓
  - Card (Warm Cream `oklch(0.96 0.015 85)`): Dark Gray text `oklch(0.25 0 0)` - Ratio 12.1:1 ✓
  - Primary (Deep Teal `oklch(0.45 0.08 220)`): White text `oklch(1 0 0)` - Ratio 6.8:1 ✓
  - Secondary (Warm Cream `oklch(0.96 0.015 85)`): Dark Gray text `oklch(0.25 0 0)` - Ratio 12.1:1 ✓
  - Accent (Vibrant Orange `oklch(0.68 0.18 45)`): White text `oklch(1 0 0)` - Ratio 4.9:1 ✓
  - Muted (Light Gray `oklch(0.92 0 0)`): Medium Gray text `oklch(0.5 0 0)` - Ratio 5.2:1 ✓

## Font Selection

Typography should be friendly yet sophisticated - approachable like a casual bistro but polished enough for upscale dining, using Poppins for its geometric warmth in headings and Inter for excellent readability in body text.

- **Typographic Hierarchy**:
  - H1 (Restaurant Name): Poppins SemiBold/36px/tight letter spacing/-0.02em
  - H2 (Section Headers): Poppins SemiBold/24px/normal letter spacing
  - H3 (Menu Item Names): Poppins Medium/18px/normal letter spacing
  - Body (Descriptions): Inter Regular/15px/relaxed line height 1.6
  - Price Labels: Poppins SemiBold/18px/tight letter spacing
  - Small Text (Tags, Status): Inter Medium/13px/normal letter spacing

## Animations

Animations should feel snappy and purposeful, reinforcing user actions with subtle feedback - like the satisfying moment of adding an item to cart or seeing an order status update - without slowing down the efficient ordering flow.

- **Purposeful Meaning**: Cart bounce animation on add, gentle pulse on new orders in admin, smooth status transitions convey progress
- **Hierarchy of Movement**: Primary focus on cart actions and order confirmations, secondary attention to menu item reveals, subtle hover states throughout

## Component Selection

- **Components**: 
  - Card for menu items and order summaries with hover elevation
  - Sheet for mobile cart drawer with smooth slide-in
  - Dialog for item details, checkout flow, and admin forms
  - Tabs for menu categories and admin sections
  - Badge for dietary tags, order status, and availability
  - Button with distinct variants (primary for add to cart, secondary for navigation, destructive for delete)
  - Input and Textarea for forms with clear focus states
  - Select for category filters and status dropdowns
  - ScrollArea for long menu lists and order history
  - Separator for visual grouping
  - Avatar for user/admin profile display
  - Toast (sonner) for order confirmations and admin actions
  
- **Customizations**: 
  - Custom food item card with image, quick-add button, and price overlay
  - Cart summary component with line items and running total
  - Order status stepper showing progression visually
  - Admin order card with quick status actions
  
- **States**: 
  - Buttons: default (solid), hover (slight scale + shadow increase), active (scale down), disabled (muted with reduced opacity)
  - Inputs: default (subtle border), focus (primary color border + ring), error (destructive border + message), success (green accent)
  - Cards: default (subtle shadow), hover (elevated shadow + slight scale), selected (primary border)
  
- **Icon Selection**: 
  - ShoppingCart (cart icon)
  - Plus/Minus (quantity controls)
  - Clock (prep time)
  - MapPin (delivery)
  - User (account/profile)
  - ForkKnife (dietary preferences)
  - CheckCircle (order complete)
  - Package (order status)
  - PencilSimple (edit)
  - Trash (delete)
  - MagnifyingGlass (search)
  - List (categories)
  
- **Spacing**: Consistent 4px base unit, cards with p-6, list items with p-4, sections with gap-6, page padding px-4 md:px-8
  
- **Mobile**: 
  - Stack navigation horizontally to hamburger menu at <768px
  - Cart becomes bottom sheet instead of sidebar
  - Menu grid collapses from 3 columns → 2 columns → 1 column
  - Admin dashboard switches to tabbed mobile view instead of sidebar layout
  - Touch-optimized 44px minimum tap targets for all interactive elements
