import { test, expect } from '@playwright/test'

test.describe('Admin Dashboard', () => {
  // Increase timeout for admin dashboard tests (cold start can be slow)
  test.setTimeout(60000)
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/admin/login')
    await page.waitForSelector('#email', { timeout: 15000 })

    await page.fill('#email', 'admin@bistrobay.com')
    await page.fill('#password', 'admin123')
    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard (longer timeout for first compile)
    await page.waitForURL(/\/admin$/, { timeout: 60000 })

    // Wait for the dashboard to fully load (tabs should be visible)
    await page.waitForSelector('[role="tablist"]', { timeout: 15000 })
  })

  test('should display admin dashboard after login', async ({ page }) => {
    // Wait for settings to load (shows restaurant name)
    await page.waitForTimeout(1000)

    // Take screenshot
    await page.screenshot({ path: 'test-results/admin-dashboard.png', fullPage: true })

    // Verify dashboard elements
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible()

    // Check tabs are present using role='tab'
    await expect(page.getByRole('tab', { name: /Orders/ })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Categories' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Menu' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Settings' })).toBeVisible()

    // Check logout button
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible()
  })

  test('should navigate to categories tab', async ({ page }) => {
    // Click Categories tab
    await page.getByRole('tab', { name: 'Categories' }).click()

    // Wait for content to load
    await page.waitForTimeout(1000)

    await page.screenshot({ path: 'test-results/admin-categories.png', fullPage: true })

    // Verify categories content is displayed - look for a category name or the add button
    await expect(page.getByRole('button', { name: /Add Category/i })).toBeVisible({ timeout: 10000 })
  })

  test('should navigate to menu tab and see menu items', async ({ page }) => {
    // Click Menu tab
    await page.getByRole('tab', { name: 'Menu' }).click()
    await page.waitForTimeout(1000)

    await page.screenshot({ path: 'test-results/admin-menu.png', fullPage: true })

    // Verify menu items management - look for the heading and add button
    await expect(page.getByText(/Menu Items/)).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: /Add Item/i })).toBeVisible()
  })

  test('should navigate to settings tab', async ({ page }) => {
    // Click Settings tab
    await page.getByRole('tab', { name: 'Settings' }).click()
    await page.waitForTimeout(1000)

    await page.screenshot({ path: 'test-results/admin-settings.png', fullPage: true })

    // Verify settings form - look for the Restaurant Information section
    await expect(page.getByText('Restaurant Information')).toBeVisible({ timeout: 10000 })
  })

  test('should logout successfully', async ({ page }) => {
    // Click logout
    await page.getByRole('button', { name: 'Logout' }).click()

    // Should redirect to login
    await page.waitForURL(/\/admin\/login/, { timeout: 10000 })
    await expect(page.getByText('Admin Login')).toBeVisible()
  })
})
