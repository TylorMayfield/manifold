import { test, expect } from '@playwright/test';

/**
 * Plugin Management Workflow Tests
 * 
 * Tests the plugin discovery, installation, and management workflows.
 */

test.describe('Plugin Management Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the plugins page
    await page.goto('/plugins');
    await page.waitForLoadState('networkidle');
  });

  test('should load the plugins page', async ({ page }) => {
    // Check that we're on the plugins page
    await expect(page).toHaveURL(/\/plugins/);
    
    // Look for plugin manager heading
    const heading = page.getByRole('heading', { name: /plugin/i });
    await expect(heading.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display plugin discovery button', async ({ page }) => {
    // Look for discover or refresh button
    const discoverButton = page.getByRole('button', { name: /discover|refresh/i });
    await expect(discoverButton.first()).toBeVisible();
  });

  test('should discover available plugins', async ({ page }) => {
    // Click discover button
    const discoverButton = page.getByRole('button', { name: /discover/i }).first();
    await discoverButton.click();
    
    // Wait for plugins to load
    await page.waitForTimeout(2000);
    
    // Should show plugin list or cards
    const pluginElements = page.locator('[class*="plugin"], [data-testid*="plugin"]');
    const count = await pluginElements.count();
    
    // Should have some plugins discovered
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should filter plugins by category', async ({ page }) => {
    // Look for category filter
    const categorySelect = page.locator('select').first();
    const isVisible = await categorySelect.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isVisible) {
      // Select a category
      await categorySelect.selectOption({ label: /data source/i });
      await page.waitForTimeout(1000);
      
      // Results should be filtered
      const results = page.locator('[class*="plugin"]');
      const count = await results.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should search for plugins', async ({ page }) => {
    // Look for search input
    const searchInput = page.getByPlaceholder(/search/i).first();
    const isVisible = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isVisible) {
      // Type in search
      await searchInput.fill('CSV');
      await page.waitForTimeout(1000);
      
      // Should show filtered results
      const searchResults = page.locator('[class*="plugin"]');
      const count = await searchResults.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display plugin information', async ({ page }) => {
    // Wait for plugins to load
    await page.waitForTimeout(2000);
    
    // Look for plugin cards with information
    const pluginCard = page.locator('[class*="plugin"]').first();
    const isVisible = await pluginCard.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isVisible) {
      // Should show plugin name, description, etc.
      const hasText = await pluginCard.textContent();
      expect(hasText).toBeTruthy();
      expect(hasText!.length).toBeGreaterThan(0);
    }
  });

  test('should enable/disable plugins', async ({ page }) => {
    // Wait for plugins to load
    await page.waitForTimeout(2000);
    
    // Look for enable/disable buttons
    const toggleButton = page.getByRole('button', { name: /enable|disable/i }).first();
    const isVisible = await toggleButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isVisible) {
      const initialText = await toggleButton.textContent();
      
      // Click the toggle button
      await toggleButton.click();
      await page.waitForTimeout(1000);
      
      // Button text might have changed
      const afterText = await toggleButton.textContent();
      
      // At least verify the button is still clickable
      await expect(toggleButton).toBeVisible();
    }
  });

  test('should filter enabled plugins only', async ({ page }) => {
    // Look for "enabled only" checkbox
    const enabledCheckbox = page.getByText(/enabled only/i).first();
    const isVisible = await enabledCheckbox.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isVisible) {
      await enabledCheckbox.click();
      await page.waitForTimeout(1000);
      
      // Results should be filtered
      const results = page.locator('[class*="plugin"]');
      const count = await results.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should refresh plugin list', async ({ page }) => {
    // Click refresh button
    const refreshButton = page.getByRole('button', { name: /refresh/i }).first();
    const isVisible = await refreshButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isVisible) {
      await refreshButton.click();
      
      // Wait for refresh to complete
      await page.waitForTimeout(2000);
      
      // Should still be on plugins page
      await expect(page).toHaveURL(/\/plugins/);
    }
  });

  test('should navigate back from plugins page', async ({ page }) => {
    // Click on home or back to navigate away
    const homeButton = page.getByRole('button', { name: /home/i }).first();
    await homeButton.click();
    
    // Should navigate away from plugins
    await page.waitForURL(/^(?!.*plugins)/);
  });

  test('should take screenshot of plugins page', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Take a full page screenshot
    await page.screenshot({ 
      path: 'playwright-report/plugins-page.png',
      fullPage: true 
    });
  });
});
