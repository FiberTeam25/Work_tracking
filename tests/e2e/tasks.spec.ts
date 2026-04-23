import { test, expect } from '@playwright/test'

// These tests run with the authenticated session from global-setup
test.describe('Tasks page @smoke', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !process.env.TEST_USER_EMAIL,
      'Requires TEST_USER_EMAIL / TEST_USER_PASSWORD to be set'
    )
    await page.goto('/tasks')
  })

  test('renders task list heading and filters', async ({ page }) => {
    await expect(page.getByText('التاسكات اليومية')).toBeVisible()
    // Filter dropdowns
    await expect(page.locator('select').first()).toBeVisible()
  })

  test('table headers are present', async ({ page }) => {
    await expect(page.getByText('التاريخ')).toBeVisible()
    await expect(page.getByText('الحالة')).toBeVisible()
  })

  test('status filter works', async ({ page }) => {
    // Select "Pending Approval" from the status filter
    const statusSelect = page.locator('select').nth(2)
    await statusSelect.selectOption('pending')

    // URL should reflect the filter
    await expect(page).toHaveURL(/status=pending/)
  })

  test('task row is clickable', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first()
    const rowCount = await page.locator('tbody tr').count()

    if (rowCount === 0) {
      test.skip(true, 'No tasks in the database to click')
    }

    await firstRow.click()
    // Should navigate to a task detail page
    await expect(page).toHaveURL(/\/tasks\//)
  })
})
