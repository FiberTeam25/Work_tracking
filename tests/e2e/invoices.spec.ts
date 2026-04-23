import { test, expect } from '@playwright/test'

test.describe('Invoices page @smoke', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !process.env.TEST_USER_EMAIL,
      'Requires TEST_USER_EMAIL / TEST_USER_PASSWORD to be set'
    )
    await page.goto('/invoices')
  })

  test('renders invoices heading', async ({ page }) => {
    // Accepts either the Arabic or English translation key value
    const heading = page.locator('h1')
    await expect(heading).toBeVisible()
  })

  test('generate invoice button is visible @smoke', async ({ page }) => {
    // Button text comes from the "invoice.new" i18n key — check by btn-accent class
    const btn = page.locator('.btn-accent').first()
    await expect(btn).toBeVisible()
  })

  test('generate invoice modal opens @smoke', async ({ page }) => {
    const btn = page.locator('.btn-accent').first()
    await btn.click()

    // Modal should appear with date inputs
    await expect(page.locator('input[type="date"]').first()).toBeVisible()
    await expect(page.getByText('إلغاء')).toBeVisible()
  })

  test('generate invoice modal closes on cancel', async ({ page }) => {
    const btn = page.locator('.btn-accent').first()
    await btn.click()

    // Verify modal is open
    await expect(page.locator('input[type="date"]').first()).toBeVisible()

    // Click cancel
    await page.getByText('إلغاء').click()

    // Modal should be gone
    await expect(page.locator('input[type="date"]')).not.toBeVisible()
  })

  test('generate invoice validates required fields', async ({ page }) => {
    const btn = page.locator('.btn-accent').first()
    await btn.click()

    // Submit without filling in dates — HTML5 validation should prevent it
    const submitBtn = page.locator('button[type="submit"]')
    await submitBtn.click()

    // Modal should still be open (form not submitted)
    await expect(page.locator('input[type="date"]').first()).toBeVisible()
  })
})
