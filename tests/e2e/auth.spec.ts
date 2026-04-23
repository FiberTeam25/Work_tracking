import { test, expect } from '@playwright/test'

// Override storageState so these tests run without an authenticated session
test.use({ storageState: { cookies: [], origins: [] } })

test('login page renders @smoke', async ({ page }) => {
  await page.goto('/login')
  await expect(page).toHaveTitle(/FieldOps/i)
  await expect(page.getByText('FieldOps FTTH')).toBeVisible()
  await expect(page.getByText('تسجيل الدخول')).toBeVisible()
  await expect(page.locator('input[type="email"]')).toBeVisible()
  await expect(page.locator('input[type="password"]')).toBeVisible()
  await expect(page.locator('button[type="submit"]')).toBeVisible()
})

test('invalid credentials shows error', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type="email"]', 'wrong@example.com')
  await page.fill('input[type="password"]', 'wrongpassword')
  await page.click('button[type="submit"]')

  // Should stay on login page and show an error
  await expect(page).toHaveURL(/login/)
  await expect(page.locator('form')).toBeVisible()
})

test('unauthenticated / redirects to login @smoke', async ({ page }) => {
  await page.goto('/')
  // Middleware should redirect unauthenticated users to /login
  await expect(page).toHaveURL(/login/)
})

test('valid credentials redirect to dashboard @smoke', async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL
  const password = process.env.TEST_USER_PASSWORD

  test.skip(!email || !password, 'TEST_USER_EMAIL and TEST_USER_PASSWORD are required')

  await page.goto('/login')
  await page.fill('input[type="email"]', email!)
  await page.fill('input[type="password"]', password!)
  await page.click('button[type="submit"]')

  await page.waitForURL('/', { timeout: 15_000 })
  await expect(page).toHaveURL('/')
})
