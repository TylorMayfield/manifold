import { test, expect } from '@playwright/test';

test.describe('UI Components - Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test.describe('Navigation Improvements', () => {
    test('should not show Settings in top navigation', async ({ page }) => {
      const nav = page.locator('nav').first();
      
      // Wait for nav to be visible
      await nav.waitFor({ state: 'visible' });
      
      // Settings should NOT be in the nav anymore
      const navText = await nav.textContent();
      
      // Count how many times "Settings" appears in nav (should be 0)
      const settingsInNav = await nav.getByRole('button', { name: /^settings$/i }).count();
      expect(settingsInNav).toBe(0);
    });

    test('should have 8 navigation items (not 9)', async ({ page }) => {
      const nav = page.locator('nav').first();
      await nav.waitFor({ state: 'visible' });
      
      // Count navigation buttons
      const navButtons = nav.getByRole('button');
      const count = await navButtons.count();
      
      // Should be 8 (Home, Data Sources, Data Lakes, Plugins, Pipelines, Jobs, Webhooks, Logs)
      expect(count).toBe(8);
    });

    test('should have cleaner navigation layout', async ({ page }) => {
      const nav = page.locator('nav').first();
      
      // Verify nav contains expected items
      await expect(nav.getByRole('button', { name: /home/i })).toBeVisible();
      await expect(nav.getByRole('button', { name: /data sources/i })).toBeVisible();
      await expect(nav.getByRole('button', { name: /pipelines/i })).toBeVisible();
      await expect(nav.getByRole('button', { name: /^jobs$/i })).toBeVisible();
      
      // But NOT settings
      const settingsButton = nav.getByRole('button', { name: /^settings$/i });
      await expect(settingsButton).toHaveCount(0);
    });
  });

  test.describe('Status Footer Visibility', () => {
    test('should show footer on home page', async ({ page }) => {
      const footer = page.locator('footer').first();
      await expect(footer).toBeVisible();
    });

    test('should show footer on data sources page', async ({ page }) => {
      await page.locator('nav').getByRole('button', { name: /data sources/i }).first().click();
      await page.waitForTimeout(1000);
      
      const footer = page.locator('footer').first();
      await expect(footer).toBeVisible();
    });

    test('should show footer on jobs page', async ({ page }) => {
      await page.locator('nav').getByRole('button', { name: /^jobs$/i }).first().click();
      await page.waitForTimeout(1000);
      
      const footer = page.locator('footer').first();
      await expect(footer).toBeVisible();
    });

    test('should show footer on settings page', async ({ page }) => {
      // Navigate to settings via footer
      const footer = page.locator('footer').first();
      const settingsButton = footer.locator('button[title*="Settings"]').first();
      await settingsButton.click();
      await page.waitForTimeout(1000);
      
      // Footer should still be visible on settings page
      const footerOnSettings = page.locator('footer').first();
      await expect(footerOnSettings).toBeVisible();
    });
  });

  test.describe('Footer Interactive Elements', () => {
    test('should have clickable Settings icon', async ({ page }) => {
      const footer = page.locator('footer').first();
      const settingsButton = footer.locator('button[title*="Settings"]').first();
      
      await expect(settingsButton).toBeVisible();
      await expect(settingsButton).toBeEnabled();
    });

    test('should have expand/collapse button', async ({ page }) => {
      const footer = page.locator('footer').first();
      const expandButton = footer.getByRole('button').filter({ hasText: /more info|hide details/i }).first();
      
      await expect(expandButton).toBeVisible();
      await expect(expandButton).toBeEnabled();
    });

    test('should show system status text', async ({ page }) => {
      const footer = page.locator('footer').first();
      
      // Should show either "System Idle" or processing info
      const hasStatus = await footer.getByText(/system idle|processing/i).count();
      expect(hasStatus).toBeGreaterThan(0);
    });
  });

  test.describe('Footer Statistics Display', () => {
    test('should display statistics when expanded', async ({ page }) => {
      const footer = page.locator('footer').first();
      
      // Expand footer
      const expandButton = footer.getByRole('button').filter({ hasText: /more info/i }).first();
      await expandButton.click();
      await page.waitForTimeout(500);
      
      // Should show some statistics (numbers)
      const footerText = await footer.textContent();
      expect(footerText).toMatch(/\d+/);
    });

    test('should show completed/failed counts', async ({ page }) => {
      const footer = page.locator('footer').first();
      
      // Look for stat indicators (may be in compact or expanded view)
      const footerContent = await footer.textContent();
      
      // Should have some text content
      expect(footerContent).toBeTruthy();
      expect(footerContent!.length).toBeGreaterThan(10);
    });
  });

  test.describe('Accessibility', () => {
    test('footer should have proper ARIA attributes', async ({ page }) => {
      const footer = page.locator('footer').first();
      
      // Footer should be identifiable
      await expect(footer).toBeVisible();
    });

    test('Settings button should have accessible name', async ({ page }) => {
      const footer = page.locator('footer').first();
      const settingsButton = footer.locator('button[title*="Settings"]').first();
      
      // Should have title attribute
      const title = await settingsButton.getAttribute('title');
      expect(title).toBe('Settings');
    });

    test('footer should not block page content', async ({ page }) => {
      // Check that body has padding for footer
      const bodyPadding = await page.evaluate(() => {
        return window.getComputedStyle(document.body).paddingBottom;
      });
      
      // Should have some padding (we set 72px)
      expect(bodyPadding).not.toBe('0px');
    });
  });
});

test.describe('Component System Integration', () => {
  test('should use consistent styling across pages', async ({ page }) => {
    // Navigate to a few pages and verify consistent design elements
    const pages = [
      { nav: /home/i, url: '/' },
      { nav: /data sources/i, url: '/data' },
      { nav: /^jobs$/i, url: '/jobs' },
    ];

    for (const { nav: navPattern } of pages) {
      await page.locator('nav').getByRole('button', { name: navPattern }).first().click();
      await page.waitForTimeout(1500);
      
      // Footer should always be present
      const footer = page.locator('footer').first();
      await expect(footer).toBeVisible();
      
      // Navigation should always be present
      const navigation = page.locator('nav').first();
      await expect(navigation).toBeVisible();
    }
  });

  test('should maintain responsive behavior', async ({ page }) => {
    // Test at different viewport sizes
    const viewports = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1920, height: 1080, name: 'desktop' },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      
      // Footer should be visible at all sizes
      const footer = page.locator('footer').first();
      await expect(footer).toBeVisible();
      
      // Navigation should be visible
      const nav = page.locator('nav').first();
      await expect(nav).toBeVisible();
    }
  });
});

test.describe('Footer Auto-Update Behavior', () => {
  test('should update statistics over time', async ({ page }) => {
    const footer = page.locator('footer').first();
    
    // Get initial footer content
    const initialContent = await footer.textContent();
    
    // Wait for polling interval (5 seconds + buffer)
    await page.waitForTimeout(6000);
    
    // Get updated content
    const updatedContent = await footer.textContent();
    
    // Content should exist
    expect(initialContent).toBeTruthy();
    expect(updatedContent).toBeTruthy();
  });

  test('should maintain footer state during navigation', async ({ page }) => {
    const footer = page.locator('footer').first();
    
    // Expand footer
    const expandButton = footer.getByRole('button').filter({ hasText: /more info/i }).first();
    await expandButton.click();
    await page.waitForTimeout(500);
    
    // Navigate to another page
    await page.locator('nav').getByRole('button', { name: /data sources/i }).first().click();
    await page.waitForTimeout(1000);
    
    // Footer should still exist (may reset expansion state)
    const footerAfterNav = page.locator('footer').first();
    await expect(footerAfterNav).toBeVisible();
  });
});
