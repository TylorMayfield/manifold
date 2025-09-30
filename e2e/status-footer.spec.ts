import { test, expect } from '@playwright/test';

test.describe('Status Footer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Wait for footer to be visible
    await page.locator('footer').first().waitFor({ state: 'visible', timeout: 10000 });
  });

  test('should display status footer on all pages', async ({ page }) => {
    // Verify footer is visible
    const footer = page.locator('footer').first();
    await expect(footer).toBeVisible();
    
    // Check for key elements
    await expect(footer.getByText(/system idle|processing/i)).toBeVisible();
  });

  test('should show Settings icon in footer', async ({ page }) => {
    const footer = page.locator('footer').first();
    
    // Look for Settings button (by title or aria-label)
    const settingsButton = footer.getByRole('button').filter({ hasText: /settings/i }).or(
      footer.locator('button[title*="Settings"]')
    ).first();
    
    await expect(settingsButton).toBeVisible();
  });

  test('should navigate to Settings when clicking footer icon', async ({ page }) => {
    const footer = page.locator('footer').first();
    
    // Click Settings button in footer
    const settingsButton = footer.locator('button[title*="Settings"]').or(
      footer.getByRole('button').filter({ hasText: /settings/i })
    ).first();
    
    await settingsButton.click();
    await page.waitForTimeout(2500);
    
    // Verify navigation to settings
    const url = page.url();
    expect(url).toContain('/settings');
  });

  test('should expand and collapse details', async ({ page }) => {
    const footer = page.locator('footer').first();
    
    // Find expand button (looks for "More Info" or chevron)
    const expandButton = footer.getByRole('button').filter({ hasText: /more info|hide details/i }).first();
    
    // Click to expand
    await expandButton.click();
    await page.waitForTimeout(500);
    
    // Verify expanded content is visible (look for detailed stats)
    const expandedContent = footer.locator('div').filter({ hasText: /total jobs|completed today/i }).first();
    await expect(expandedContent).toBeVisible();
    
    // Click to collapse
    await expandButton.click();
    await page.waitForTimeout(500);
    
    // Expanded content should not be visible
    await expect(expandedContent).not.toBeVisible();
  });

  test('should display system statistics', async ({ page }) => {
    const footer = page.locator('footer').first();
    
    // Click expand to see all stats
    const expandButton = footer.getByRole('button').filter({ hasText: /more info/i }).first();
    await expandButton.click();
    await page.waitForTimeout(500);
    
    // Check for various statistics (text may vary, so use flexible matching)
    const footerText = await footer.textContent();
    
    // Should contain numeric values (jobs, sources, etc.)
    expect(footerText).toMatch(/\d+/);
  });

  test('should persist footer across page navigation', async ({ page }) => {
    // Footer should be visible on home
    let footer = page.locator('footer').first();
    await expect(footer).toBeVisible();
    
    // Navigate to data page
    await page.locator('nav').getByRole('button', { name: /data sources/i }).first().click();
    await page.waitForTimeout(1000);
    
    // Footer should still be visible
    footer = page.locator('footer').first();
    await expect(footer).toBeVisible();
    
    // Navigate to jobs page
    await page.locator('nav').getByRole('button', { name: /^jobs$/i }).first().click();
    await page.waitForTimeout(1000);
    
    // Footer should still be visible
    footer = page.locator('footer').first();
    await expect(footer).toBeVisible();
  });

  test('should display idle status when no jobs running', async ({ page }) => {
    const footer = page.locator('footer').first();
    
    // Should show "System Idle" or similar text
    await expect(footer.getByText(/system idle|idle/i)).toBeVisible();
  });

  test('should have correct footer styling', async ({ page }) => {
    const footer = page.locator('footer').first();
    
    // Verify footer has fixed position (stays at bottom)
    const position = await footer.evaluate((el) => {
      return window.getComputedStyle(el).position;
    });
    
    expect(position).toBe('fixed');
    
    // Verify footer is at bottom
    const bottom = await footer.evaluate((el) => {
      return window.getComputedStyle(el).bottom;
    });
    
    expect(bottom).toBe('0px');
  });
});

test.describe('Status Footer - Responsive', () => {
  test('should adapt to mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    const footer = page.locator('footer').first();
    await expect(footer).toBeVisible();
    
    // Footer should still be accessible
    const settingsButton = footer.locator('button[title*="Settings"]').first();
    await expect(settingsButton).toBeVisible();
  });

  test('should adapt to tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    const footer = page.locator('footer').first();
    await expect(footer).toBeVisible();
  });
});
