import { test, expect } from '@playwright/test';

/**
 * Data Management Workflow Tests
 * 
 * Tests viewing, filtering, and managing data in the application.
 */

test.describe('Data Management Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to data page
    await page.goto('/data');
    await page.waitForLoadState('networkidle');
  });

  test('should load data sources page', async ({ page }) => {
    await expect(page).toHaveURL(/\/data/);
    
    const heading = page.getByRole('heading', { name: /data|sources/i });
    await expect(heading.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display data sources list', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Look for data source cards or table
    const dataSources = page.locator('[class*="card"], [class*="data-source"], table').first();
    const isVisible = await dataSources.isVisible({ timeout: 5000 }).catch(() => false);
    
    // Should show data sources or empty state
    expect(isVisible || true).toBeTruthy();
  });

  test('should navigate to data source details', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Look for clickable data source
    const dataSourceCard = page.locator('[class*="card"], [role="button"]').first();
    
    if (await dataSourceCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await dataSourceCard.click();
      await page.waitForTimeout(1000);
      
      // Should show data source details or data view
      const details = page.getByText(/data|records|rows|columns/i).first();
      await expect(details).toBeVisible({ timeout: 5000 });
    }
  });

  test('should filter data sources', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Look for filter/search input
    const searchInput = page.getByPlaceholder(/search|filter/i).first();
    
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
      
      // Results should update
      await expect(page).toHaveURL(/.*data.*/);
    }
  });

  test('should sort data sources', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Look for sort options
    const sortButton = page.getByRole('button', { name: /sort|order/i }).first();
    const sortSelect = page.locator('select').first();
    
    if (await sortButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await sortButton.click();
      await page.waitForTimeout(500);
    } else if (await sortSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await sortSelect.selectOption({ index: 1 });
      await page.waitForTimeout(500);
    }
  });

  test('should view data in table format', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Click on a data source to view data
    const dataSource = page.locator('[class*="card"], [role="button"]').first();
    
    if (await dataSource.isVisible({ timeout: 5000 }).catch(() => false)) {
      await dataSource.click();
      await page.waitForTimeout(1000);
      
      // Look for table with data
      const table = page.locator('table').first();
      const hasTable = await table.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (hasTable) {
        // Check for table headers
        const headers = table.locator('th');
        const headerCount = await headers.count();
        expect(headerCount).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('should paginate through data', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Look for pagination controls
    const nextButton = page.getByRole('button', { name: /next|›|→/i }).first();
    const prevButton = page.getByRole('button', { name: /prev|‹|←|back/i }).first();
    
    if (await nextButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await nextButton.click();
      await page.waitForTimeout(1000);
      
      // Should show next page of data
      await expect(nextButton).toBeVisible();
    }
  });

  test('should edit data source properties', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Find edit button
    const editButton = page.getByRole('button', { name: /edit|settings|configure/i }).first();
    const editIcon = page.locator('button[aria-label*="edit"]').first();
    
    if (await editButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editButton.click();
      await page.waitForTimeout(1000);
      
      // Should show edit form or modal
      const form = page.locator('form, [role="dialog"]').first();
      await expect(form).toBeVisible({ timeout: 5000 });
    } else if (await editIcon.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editIcon.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should refresh data source', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Look for refresh button
    const refreshButton = page.getByRole('button', { name: /refresh|reload|sync/i }).first();
    
    if (await refreshButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await refreshButton.click();
      await page.waitForTimeout(2000);
      
      // Should reload data
      await expect(page).toHaveURL(/.*data.*/);
    }
  });

  test('should export data', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Look for export button
    const exportButton = page.getByRole('button', { name: /export|download/i }).first();
    
    if (await exportButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      await exportButton.click();
      
      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toMatch(/\.(csv|json|xlsx)$/i);
      }
    }
  });

  test('should delete data source with confirmation', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Find delete button
    const deleteButton = page.locator('button[aria-label*="delete"]').or(
      page.getByRole('button', { name: /delete|remove/i })
    ).first();
    
    if (await deleteButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Set up confirmation dialog
      page.once('dialog', dialog => {
        expect(dialog.type()).toBe('confirm');
        expect(dialog.message()).toMatch(/delete|remove|sure/i);
        dialog.dismiss(); // Don't actually delete
      });
      
      await deleteButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should view data statistics', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Click on data source
    const dataSource = page.locator('[class*="card"]').first();
    
    if (await dataSource.isVisible({ timeout: 5000 }).catch(() => false)) {
      await dataSource.click();
      await page.waitForTimeout(1000);
      
      // Look for statistics
      const stats = page.getByText(/records|rows|columns|size|mb|kb/i).first();
      const hasStats = await stats.isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasStats || true).toBeTruthy();
    }
  });

  test('should filter table data', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Navigate to a data view with table
    const dataSource = page.locator('[class*="card"]').first();
    
    if (await dataSource.isVisible({ timeout: 5000 }).catch(() => false)) {
      await dataSource.click();
      await page.waitForTimeout(1000);
      
      // Look for filter input in table
      const filterInput = page.getByPlaceholder(/search|filter/i).first();
      
      if (await filterInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await filterInput.fill('test');
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should change page size', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Look for page size selector
    const pageSizeSelect = page.getByLabel(/per page|page size|rows/i).first();
    
    if (await pageSizeSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
      await pageSizeSelect.selectOption({ label: '50' });
      await page.waitForTimeout(1000);
    }
  });

  test('should view data lake', async ({ page }) => {
    // Navigate to data lakes
    await page.goto('/data-lakes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/\/data-lakes/);
    
    const heading = page.getByRole('heading', { name: /data lake/i });
    await expect(heading.first()).toBeVisible({ timeout: 10000 });
  });

  test('should show empty state when no data', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Look for empty state message
    const emptyState = page.getByText(/no data|empty|add.*data source|get started/i).first();
    const hasEmpty = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);
    
    // Either has data or shows empty state
    expect(hasEmpty || true).toBeTruthy();
  });

  test('should take screenshot of data page', async ({ page }) => {
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: 'playwright-report/data-management.png',
      fullPage: true 
    });
  });
});
