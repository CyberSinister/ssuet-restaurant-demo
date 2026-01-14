import { test, expect } from '@playwright/test'

// Run tests serially to avoid overwhelming the server
test.describe.configure({ mode: 'serial' })

test.describe('Customer Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport to desktop size so header elements are visible
    await page.setViewportSize({ width: 1280, height: 720 })

    // Log console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser error:', msg.text())
      }
    })

    await page.goto('/')

    // Wait for cart button which indicates header loaded with settings
    await page.waitForSelector('[data-testid="cart-button"]', { timeout: 20000 })
    console.log('Cart button is visible')
  })

  test('should display menu items', async ({ page }) => {
    // Wait for menu to be visible
    await expect(page.getByTestId('menu-view')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('menu-item').first()).toBeVisible({ timeout: 10000 })

    // Take screenshot
    await page.screenshot({ path: 'test-results/customer-menu.png', fullPage: true })

    // Count menu items
    const menuItems = await page.getByTestId('menu-item').count()
    expect(menuItems).toBeGreaterThan(0)
    console.log(`Found ${menuItems} menu items`)
  })

  test('should filter menu by category', async ({ page }) => {
    // Wait for menu to load
    await expect(page.getByTestId('menu-view')).toBeVisible({ timeout: 15000 })

    // Click on Burgers category
    await page.getByRole('tab', { name: 'Burgers' }).click()
    await page.waitForTimeout(500)

    // Verify filtered results still show items
    const menuItems = page.getByTestId('menu-item')
    const count = await menuItems.count()
    expect(count).toBeGreaterThan(0)

    await page.screenshot({ path: 'test-results/customer-burgers-filter.png', fullPage: true })
  })

  test('should add item to cart', async ({ page }) => {
    // Wait for menu to load
    await expect(page.getByTestId('menu-view')).toBeVisible({ timeout: 15000 })

    // Click add to cart on first item
    await page.getByTestId('add-to-cart').first().click()

    // Verify toast appears
    await expect(page.getByText('added to cart')).toBeVisible({ timeout: 5000 })

    // Verify cart badge shows 1 item
    await expect(page.getByTestId('cart-count')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('cart-count')).toHaveText('1')
  })

  test('should open cart and view items', async ({ page }) => {
    // Wait for menu and add an item
    await expect(page.getByTestId('menu-view')).toBeVisible({ timeout: 15000 })
    await page.getByTestId('add-to-cart').first().click()
    await expect(page.getByTestId('cart-count')).toBeVisible({ timeout: 5000 })

    // Open cart
    await page.getByTestId('cart-button').click()

    // Verify cart drawer is visible
    await expect(page.getByTestId('cart-drawer')).toBeVisible({ timeout: 5000 })

    // Verify cart title
    await expect(page.getByText('Your Cart')).toBeVisible()

    // Verify checkout button is visible
    await expect(page.getByTestId('proceed-to-checkout')).toBeVisible()

    await page.screenshot({ path: 'test-results/customer-cart.png', fullPage: true })
  })

  test('should proceed to checkout', async ({ page }) => {
    // Add items to meet minimum order ($15)
    await expect(page.getByTestId('menu-view')).toBeVisible({ timeout: 15000 })

    // Add first item
    await page.getByTestId('add-to-cart').first().click()
    await expect(page.getByTestId('cart-count')).toBeVisible({ timeout: 5000 })

    // Add second item to meet minimum
    await page.getByTestId('add-to-cart').nth(1).click()
    await page.waitForTimeout(500)

    // Open cart
    await page.getByTestId('cart-button').click()
    await expect(page.getByTestId('cart-drawer')).toBeVisible({ timeout: 5000 })

    // Click proceed to checkout (should be enabled now)
    await page.getByTestId('proceed-to-checkout').click()

    // Verify checkout form is displayed
    await expect(page.getByTestId('checkout-form')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('checkout-name')).toBeVisible()
    await expect(page.getByTestId('checkout-email')).toBeVisible()
    await expect(page.getByTestId('checkout-phone')).toBeVisible()
    await expect(page.getByTestId('place-order-button')).toBeVisible()

    await page.screenshot({ path: 'test-results/customer-checkout.png', fullPage: true })
  })

  test('should validate required fields in checkout', async ({ page }) => {
    // Add items to meet minimum order
    await expect(page.getByTestId('menu-view')).toBeVisible({ timeout: 15000 })
    await page.getByTestId('add-to-cart').first().click()
    await page.getByTestId('add-to-cart').nth(1).click()
    await page.waitForTimeout(500)

    await page.getByTestId('cart-button').click()
    await page.getByTestId('proceed-to-checkout').click()
    await expect(page.getByTestId('checkout-form')).toBeVisible({ timeout: 5000 })

    // Try to submit without filling form
    await page.getByTestId('place-order-button').click()

    // Verify error message
    await expect(page.getByText('Please fill in all required fields')).toBeVisible({ timeout: 5000 })
  })

  test('should complete order placement', async ({ page }) => {
    // Add items to meet minimum order ($15)
    await expect(page.getByTestId('menu-view')).toBeVisible({ timeout: 15000 })
    await page.getByTestId('add-to-cart').first().click()
    await page.getByTestId('add-to-cart').nth(1).click()
    await page.waitForTimeout(500)
    await expect(page.getByTestId('cart-count')).toHaveText('2')

    // Open cart and checkout
    await page.getByTestId('cart-button').click()
    await expect(page.getByTestId('cart-drawer')).toBeVisible({ timeout: 5000 })
    await page.getByTestId('proceed-to-checkout').click()
    await expect(page.getByTestId('checkout-form')).toBeVisible({ timeout: 5000 })

    // Fill out checkout form
    await page.getByTestId('checkout-name').fill('John Doe')
    await page.getByTestId('checkout-email').fill('john@example.com')
    await page.getByTestId('checkout-phone').fill('555-123-4567')

    // Submit order
    await page.getByTestId('place-order-button').click()

    // Verify success message
    await expect(page.getByText('Order placed successfully')).toBeVisible({ timeout: 15000 })

    await page.screenshot({ path: 'test-results/customer-order-success.png', fullPage: true })
  })
})

test.describe('Order History', () => {
  test('should navigate to order history page', async ({ page }) => {
    // Set viewport to desktop size
    await page.setViewportSize({ width: 1280, height: 720 })

    await page.goto('/')
    // Wait for header to load
    await page.waitForSelector('[data-testid="cart-button"]', { timeout: 30000 })

    // Click on orders link and wait for navigation
    const ordersLink = page.getByTestId('orders-link')
    await expect(ordersLink).toBeVisible({ timeout: 5000 })
    await ordersLink.click()

    // Wait for URL change with longer timeout
    await page.waitForURL(/\/orders/, { timeout: 30000 })

    // Verify orders page loaded with correct content
    await expect(page.getByText('Your Orders')).toBeVisible({ timeout: 10000 })
  })
})
