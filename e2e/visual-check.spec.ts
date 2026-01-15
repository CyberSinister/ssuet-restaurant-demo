import { test, expect } from '@playwright/test'

test.describe('Visual Check', () => {
  test('should render homepage with proper styling', async ({ page }) => {
    await page.goto('/')

    // Wait for content to load (skeleton should be replaced)
    await page.waitForTimeout(3000)

    // Take screenshot
    await page.screenshot({ path: 'test-results/homepage.png', fullPage: true })

    // Check that page has loaded properly
    const body = await page.locator('body')
    await expect(body).toBeVisible()

    // Check for some styled elements
    const cards = await page.locator('[data-slot="card"]')
    expect(await cards.count()).toBeGreaterThan(0)
  })

  test('should render admin login page', async ({ page }) => {
    await page.goto('/admin/login')

    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'test-results/admin-login.png', fullPage: true })

    // Should have login form
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 })
  })

  test('should show menu items after loading', async ({ page }) => {
    await page.goto('/')

    // Wait for React Query to fetch data
    await page.waitForTimeout(5000)

    // Check for menu images
    const images = await page.locator('img')
    const imageCount = await images.count()
    console.log(`Found ${imageCount} images on page`)

    await page.screenshot({ path: 'test-results/menu-loaded.png', fullPage: true })
  })
})
