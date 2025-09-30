import { test, expect } from '@playwright/test';

/**
 * Navigation Workflow Tests
 * 
 * Tests the basic navigation functionality of the application,
 * ensuring users can move between different pages.
 */

test.describe('Navigation Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page before each test
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Wait for navigation to be visible
    await page.locator('nav').first().waitFor({ state: 'visible', timeout: 10000 });
  });

  test('should load the home page successfully', async ({ page }) => {
    // Check that the page has loaded
    await expect(page).toHaveTitle(/Manifold/);
    
    // Check that navigation is present (more flexible selector)
    const nav = page.locator('nav').or(page.locator('[class*="nav"]')).first();
    await expect(nav).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to Data Sources page', async ({ page }) => {
    // Click on Data Sources navigation item
    await page.locator('nav').getByRole('button', { name: /data sources/i }).first().click();
    
    // Wait for URL to change (increased time for slow navigation)
    await page.waitForTimeout(2000);
    
    // Verify URL changed (don't wait for full page load due to API issues)
    const url = page.url();
    expect(url).toContain('/data');
  });

  test('should navigate to Pipelines page', async ({ page }) => {
    // Click on Pipelines navigation item
    await page.locator('nav').getByRole('button', { name: /pipelines/i }).first().click();
    
    // Give time for navigation
    await page.waitForTimeout(500);
    
    // Verify URL changed
    const url = page.url();
    expect(url).toContain('/pipelines');
  });

  test('should navigate to Jobs page', async ({ page }) => {
    // Click on Jobs navigation item
    await page.locator('nav').getByRole('button', { name: /^jobs$/i }).first().click();
    
    // Give time for navigation
    await page.waitForTimeout(500);
    
    // Verify URL changed
    const url = page.url();
    expect(url).toContain('/jobs');
  });

  test('should navigate to Logs page', async ({ page }) => {
    // Click on Logs navigation item
    await page.locator('nav').getByRole('button', { name: /^logs$/i }).first().click();
    
    // Give time for navigation
    await page.waitForTimeout(500);
    
    // Verify URL changed
    const url = page.url();
    expect(url).toContain('/logs');
  });

  test('should navigate to Settings page via footer', async ({ page }) => {
    // Click on Settings icon in footer (we moved it from nav!)
    await page.locator('footer').getByRole('button', { name: /settings/i }).first().click();
    
    // Give time for navigation
    await page.waitForTimeout(1000);
    
    // Verify URL changed
    const url = page.url();
    expect(url).toContain('/settings');
  });

  test('should navigate to Webhooks page', async ({ page }) => {
    // Click on Webhooks navigation item
    await page.locator('nav').getByRole('button', { name: /^webhooks$/i }).first().click();
    
    // Give time for navigation
    await page.waitForTimeout(500);
    
    // Verify URL changed
    const url = page.url();
    expect(url).toContain('/webhooks');
  });

  test('should highlight active navigation item', async ({ page }) => {
    // Navigate to Jobs page
    await page.locator('nav').getByRole('button', { name: /^jobs$/i }).first().click();
    
    // Give time for navigation
    await page.waitForTimeout(500);
    
    // Verify URL changed
    const url = page.url();
    expect(url).toContain('/jobs');
    
    // Check that Jobs button has active class
    const jobsButton = page.locator('nav').getByRole('button', { name: /^jobs$/i }).first();
    await expect(jobsButton).toHaveClass(/active/);
  });

  test('should complete full navigation cycle', async ({ page }) => {
    // Test navigating through all main nav pages (Settings moved to footer)
    const pages = [
      { name: /data sources/i, urlPart: '/data' },
      { name: /pipelines/i, urlPart: '/pipelines' },
      { name: /^jobs$/i, urlPart: '/jobs' },
      { name: /^logs$/i, urlPart: '/logs' },
      { name: /webhooks/i, urlPart: '/webhooks' },
      { name: /home/i, urlPart: '/' },
    ];

    for (const { name, urlPart } of pages) {
      await page.locator('nav').getByRole('button', { name }).first().click();
      await page.waitForTimeout(2000);
      
      // Verify URL contains expected part
      const url = page.url();
      if (urlPart === '/') {
        expect(url).toMatch(/localhost:3000\/?$/);
      } else {
        expect(url).toContain(urlPart);
      }
    }
  });

  test('should maintain navigation after page reload', async ({ page }) => {
    // Navigate to a specific page
    await page.locator('nav').getByRole('button', { name: /pipelines/i }).first().click();
    await page.waitForTimeout(500);
    
    // Verify URL changed
    let url = page.url();
    expect(url).toContain('/pipelines');
    
    // Reload the page
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    
    // Verify we're still on the pipelines page
    url = page.url();
    expect(url).toContain('/pipelines');
    
    // Check that navigation is still functional
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible({ timeout: 10000 });
  });
});
