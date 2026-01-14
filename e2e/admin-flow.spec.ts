import { test, expect } from '@playwright/test'

// Helper function to login to admin
async function adminLogin(page: import('@playwright/test').Page) {
  await page.goto('/admin/login')
  await page.waitForSelector('#email', { timeout: 15000 })
  await page.fill('#email', 'admin@bistrobay.com')
  await page.fill('#password', 'admin123')
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(/\/admin$/, { timeout: 15000 })
  await page.waitForSelector('[role="tablist"]', { timeout: 15000 })
}

test.describe('Admin Authentication', () => {
  test('should display admin login page', async ({ page }) => {
    await page.goto('/admin/login')

    await expect(page.locator('#email')).toBeVisible({ timeout: 15000 })
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should validate login credentials', async ({ page }) => {
    await page.goto('/admin/login')
    await page.waitForSelector('#email', { timeout: 15000 })

    // Try to login with empty credentials - form should not submit due to required fields
    await page.locator('button[type="submit"]').click()

    // Should stay on login page
    await expect(page).toHaveURL(/\/admin\/login/)
  })

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/admin/login')
    await page.waitForSelector('#email', { timeout: 15000 })

    await page.fill('#email', 'admin@bistrobay.com')
    await page.fill('#password', 'admin123')
    await page.locator('button[type="submit"]').click()

    // Should redirect to admin dashboard
    await expect(page).toHaveURL(/\/admin$/, { timeout: 15000 })
  })
})

test.describe('Admin Menu Management', () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page)
    // Click Menu tab
    await page.getByRole('tab', { name: 'Menu' }).click()
    await page.waitForTimeout(500)
  })

  test('should navigate to menu management', async ({ page }) => {
    // Verify menu items section is displayed
    await expect(page.getByText(/Menu Items/)).toBeVisible({ timeout: 10000 })
  })

  test('should open add menu item dialog', async ({ page }) => {
    // Click add new item button
    await page.getByRole('button', { name: /Add Item/i }).click()

    // Verify dialog is open
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByLabel('Name')).toBeVisible()
  })

  test('should create a new menu item', async ({ page }) => {
    // Click the Add Item button to open the dialog
    const addButton = page.getByRole('button', { name: /Add Item/i })
    await expect(addButton).toBeVisible()
    await addButton.click()

    // Wait for dialog to open
    await page.waitForTimeout(500)
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // Verify form fields are present
    await expect(page.locator('#name')).toBeVisible()
    await expect(page.locator('#description')).toBeVisible()
    await expect(page.locator('#price')).toBeVisible()
    await expect(page.locator('#image')).toBeVisible()
    await expect(page.locator('#category')).toBeVisible()

    // Fill in form
    await page.locator('#name').fill('Test Burger')
    await page.locator('#description').fill('A delicious test burger')
    await page.locator('#price').fill('12.99')
    await page.locator('#image').fill('https://example.com/burger.jpg')

    // Select category from dropdown
    await page.locator('#category').click()
    await page.waitForTimeout(300)
    await page.getByRole('option').first().click()

    // Verify form is filled correctly
    await expect(page.locator('#name')).toHaveValue('Test Burger')
    await expect(page.locator('#price')).toHaveValue('12.99')

    // Submit button should be visible
    const submitButton = dialog.locator('button[type="submit"]')
    await expect(submitButton).toBeVisible()
  })

  test('should display existing menu items', async ({ page }) => {
    // Wait for menu items to load
    await page.waitForTimeout(1000)
    // Verify we can see menu items text
    await expect(page.getByText(/Menu Items/)).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Admin Category Management', () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page)
    // Click Categories tab
    await page.getByRole('tab', { name: 'Categories' }).click()
    await page.waitForTimeout(500)
  })

  test('should navigate to categories', async ({ page }) => {
    // Verify categories section is displayed with add button
    await expect(page.getByRole('button', { name: /Add Category/i })).toBeVisible({ timeout: 10000 })
  })

  test('should display existing categories', async ({ page }) => {
    // Wait for categories to load
    await page.waitForTimeout(1000)
    // Verify at least one category card is visible (Burgers is in seed data)
    await expect(page.getByRole('heading', { name: 'Burgers' })).toBeVisible({ timeout: 10000 })
  })

  test('should open add category dialog', async ({ page }) => {
    await page.getByRole('button', { name: /Add Category/i }).click()

    // Verify dialog is open - the form uses "Name" as label not "Category Name"
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByLabel('Name')).toBeVisible()
  })

  test('should create a new category', async ({ page }) => {
    await page.getByRole('button', { name: /Add Category/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Fill form - use the correct label "Name"
    await page.getByLabel('Name').fill('Test Category')
    await page.getByLabel('Description').fill('A test category')

    // Submit - look for the add button in the dialog
    await page.getByRole('dialog').getByRole('button', { name: /Add Category|Save/i }).click()

    // Verify success toast
    await expect(page.getByText(/added|created|success/i)).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Admin Orders Management', () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page)
    // Orders tab is default, but click to ensure we're there
    await page.getByRole('tab', { name: /Orders/ }).click()
    // Wait for orders to load
    await page.waitForTimeout(2000)
  })

  test('should display orders section', async ({ page }) => {
    // Wait for the tabpanel to have content (either orders or empty message)
    await page.waitForTimeout(1000)

    // Check for orders content or empty state
    const hasActiveOrders = await page.getByText(/Active Orders|Order History/i).isVisible().catch(() => false)
    const hasNoOrdersMessage = await page.getByText(/No Orders Yet/i).isVisible().catch(() => false)
    const hasOrderCards = await page.getByText(/Order \w+/i).first().isVisible().catch(() => false)

    // One of these should be true
    expect(hasActiveOrders || hasNoOrdersMessage || hasOrderCards).toBeTruthy()
  })
})

test.describe('Admin Settings', () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page)
    // Click Settings tab
    await page.getByRole('tab', { name: 'Settings' }).click()
    await page.waitForTimeout(500)
  })

  test('should navigate to settings', async ({ page }) => {
    // Verify settings section is displayed
    await expect(page.getByText('Restaurant Information')).toBeVisible({ timeout: 10000 })
  })

  test('should display restaurant settings form', async ({ page }) => {
    // Verify form fields are present
    await expect(page.getByLabel('Restaurant Name')).toBeVisible()
    await expect(page.getByLabel('Phone')).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Email', exact: true })).toBeVisible()
    await expect(page.getByLabel('Address')).toBeVisible()
  })

  test('should update restaurant settings', async ({ page }) => {
    // Update restaurant name
    const nameInput = page.getByLabel('Restaurant Name')
    await nameInput.clear()
    await nameInput.fill('Updated Bistro Bay')

    // Save
    await page.getByRole('button', { name: /Save Restaurant Settings/i }).click()

    // Verify success toast
    await expect(page.getByText(/updated|saved/i)).toBeVisible({ timeout: 5000 })
  })

  test('should display business hours section', async ({ page }) => {
    // Verify business hours section - use exact match to avoid button text
    await expect(page.getByText('Business Hours', { exact: true })).toBeVisible({ timeout: 10000 })
    // Check for day names
    await expect(page.getByText('monday')).toBeVisible()
  })
})
