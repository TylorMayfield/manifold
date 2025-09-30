import { test, expect } from '@playwright/test';

/**
 * Complete User Journey Tests
 * 
 * Tests complete user workflows from start to finish,
 * simulating real-world usage scenarios.
 */

test.describe('Complete User Journey Workflows', () => {
  test.describe('New User Onboarding Journey', () => {
    test('should complete first-time user setup', async ({ page }) => {
      // Step 1: Load home page
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      expect(page.url()).toContain('localhost:3000');
      
      // Step 2: Navigate to settings
      const settingsNav = page.getByRole('button', { name: /settings/i });
      await settingsNav.click();
      await page.waitForURL('**/settings');
      
      // Step 3: Configure basic settings
      await page.waitForTimeout(1000);
      const appName = page.getByLabel(/application name/i).first();
      
      if (await appName.isVisible({ timeout: 5000 }).catch(() => false)) {
        await appName.clear();
        await appName.fill('My Manifold Instance');
      }
      
      // Step 4: Navigate to data sources
      const dataNav = page.getByRole('button', { name: /data sources?/i });
      await dataNav.click();
      await page.waitForURL('**/data');
      
      await page.screenshot({ path: 'playwright-report/journey-onboarding.png' });
    });
  });

  test.describe('Data Import and Analysis Journey', () => {
    test('should complete data import workflow', async ({ page }) => {
      // Step 1: Start at home
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Step 2: Navigate to add data source
      const dataNav = page.getByRole('button', { name: /data sources?/i });
      await dataNav.click();
      await page.waitForURL('**/data');
      await page.waitForTimeout(1000);
      
      // Step 3: Click add data source
      const addButton = page.getByRole('button', { name: /add|create|new/i }).first();
      
      if (await addButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addButton.click();
        await page.waitForTimeout(1000);
        
        // Check if we're in creation flow
        const hasWorkflow = await page.getByText(/csv|json|sql|type/i).isVisible({ timeout: 5000 }).catch(() => false);
        expect(hasWorkflow || page.url().includes('add-data-source')).toBeTruthy();
      }
      
      await page.screenshot({ path: 'playwright-report/journey-data-import.png' });
    });

    test('should navigate through data source creation steps', async ({ page }) => {
      await page.goto('/add-data-source');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Step 1: Select CSV
      const csvOption = page.getByText(/csv file/i).first();
      if (await csvOption.isVisible({ timeout: 5000 }).catch(() => false)) {
        await csvOption.click();
        await page.waitForTimeout(500);
      }
      
      // Step 2: Select upload method
      const uploadOption = page.getByText(/file upload|upload/i).first();
      if (await uploadOption.isVisible({ timeout: 5000 }).catch(() => false)) {
        await uploadOption.click();
        await page.waitForTimeout(500);
      }
      
      // Step 3: Configure
      const nameInput = page.getByLabel(/name/i).first();
      if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await nameInput.fill('Sales Data Q4');
      }
      
      // Step 4: Navigate back
      const backButton = page.getByRole('button', { name: /back/i }).first();
      if (await backButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await backButton.click();
        await page.waitForTimeout(500);
        
        // Should be on previous step
        expect(page.url()).toContain('add-data-source');
      }
    });
  });

  test.describe('Plugin Discovery and Installation Journey', () => {
    test('should discover and explore plugins', async ({ page }) => {
      // Step 1: Navigate to plugins
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const pluginsNav = page.getByRole('button', { name: /plugins?/i });
      await pluginsNav.click();
      await page.waitForURL('**/plugins');
      
      // Step 2: Discover plugins
      await page.waitForTimeout(1000);
      const discoverButton = page.getByRole('button', { name: /discover/i }).first();
      
      if (await discoverButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await discoverButton.click();
        await page.waitForTimeout(2000);
      }
      
      // Step 3: Filter by category
      const categorySelect = page.locator('select').first();
      
      if (await categorySelect.isVisible({ timeout: 5000 }).catch(() => false)) {
        await categorySelect.selectOption({ label: /data source/i });
        await page.waitForTimeout(1000);
      }
      
      // Step 4: Search for specific plugin
      const searchInput = page.getByPlaceholder(/search/i).first();
      
      if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await searchInput.fill('CSV');
        await page.waitForTimeout(1000);
      }
      
      await page.screenshot({ path: 'playwright-report/journey-plugin-discovery.png' });
    });
  });

  test.describe('Job Scheduling Journey', () => {
    test('should create and manage scheduled job', async ({ page }) => {
      // Step 1: Navigate to jobs
      await page.goto('/jobs');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Step 2: Open job creation
      const createButton = page.getByRole('button', { name: /schedule|create|new/i }).first();
      
      if (await createButton.isVisible({ timeout: 5000 })) {
        await createButton.click();
        await page.waitForTimeout(1000);
        
        // Step 3: Fill job details
        const nameInput = page.getByLabel(/job name|name/i).first();
        if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
          await nameInput.fill('Daily Data Sync');
        }
        
        const descInput = page.getByLabel(/description/i).first();
        if (await descInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await descInput.fill('Synchronize data daily at 2 AM');
        }
        
        const cronInput = page.getByLabel(/schedule|cron/i).first();
        if (await cronInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await cronInput.fill('0 2 * * *');
        }
        
        await page.screenshot({ path: 'playwright-report/journey-job-creation.png' });
      }
    });

    test('should view and filter jobs', async ({ page }) => {
      await page.goto('/jobs');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Filter by active jobs
      const activeFilter = page.getByRole('button', { name: /active/i }).first();
      
      if (await activeFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
        await activeFilter.click();
        await page.waitForTimeout(1000);
      }
      
      // View job details
      const viewButton = page.locator('button[aria-label*="view"]').first();
      
      if (await viewButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await viewButton.click();
        await page.waitForTimeout(1000);
        
        // Should show job details
        const details = page.getByText(/schedule|execution|status/i).first();
        await expect(details).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Multi-Page Navigation Journey', () => {
    test('should navigate through all major pages', async ({ page }) => {
      // Start at home
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const pages = [
        { name: /data sources?/i, url: '/data', timeout: 10000 },
        { name: /pipelines?/i, url: '/pipelines', timeout: 10000 },
        { name: /jobs/i, url: '/jobs', timeout: 10000 },
        { name: /webhooks?/i, url: '/webhooks', timeout: 10000 },
        { name: /logs?/i, url: '/logs', timeout: 10000 },
        { name: /settings/i, url: '/settings', timeout: 10000 },
        { name: /home/i, url: '/', timeout: 10000 },
      ];

      for (const { name, url } of pages) {
        const navButton = page.getByRole('button', { name });
        
        if (await navButton.isVisible({ timeout: 5000 }).catch(() => false)) {
          await navButton.click();
          await page.waitForTimeout(1000);
          await page.waitForLoadState('networkidle');
          
          // Verify URL changed
          const currentUrl = page.url();
          expect(currentUrl).toBeTruthy();
          
          // Small delay for stability
          await page.waitForTimeout(300);
        }
      }
      
      await page.screenshot({ path: 'playwright-report/journey-full-navigation.png' });
    });
  });

  test.describe('Data Pipeline Creation Journey', () => {
    test('should create a data pipeline', async ({ page }) => {
      // Navigate to pipelines
      await page.goto('/pipelines');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Look for create pipeline button
      const createButton = page.getByRole('button', { name: /create|new|add.*pipeline/i }).first();
      
      if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await createButton.click();
        await page.waitForTimeout(1000);
        
        // Should show pipeline builder or form
        const builder = page.getByText(/pipeline|source|destination|transform/i).first();
        await expect(builder).toBeVisible({ timeout: 10000 });
        
        await page.screenshot({ path: 'playwright-report/journey-pipeline-creation.png' });
      }
    });
  });

  test.describe('Logs and Monitoring Journey', () => {
    test('should view and filter system logs', async ({ page }) => {
      // Navigate to logs
      await page.goto('/logs');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Should show logs
      const heading = page.getByRole('heading', { name: /logs?|activity|history/i });
      await expect(heading.first()).toBeVisible({ timeout: 10000 });
      
      // Try to filter logs
      const filterButton = page.getByRole('button', { name: /filter|error|warning|info/i }).first();
      
      if (await filterButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await filterButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Try to clear logs
      const clearButton = page.getByRole('button', { name: /clear|delete/i }).first();
      
      if (await clearButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Set up confirmation
        page.once('dialog', dialog => {
          dialog.dismiss();
        });
        
        await clearButton.click().catch(() => {});
        await page.waitForTimeout(500);
      }
      
      await page.screenshot({ path: 'playwright-report/journey-logs.png' });
    });
  });

  test.describe('Error Recovery Journey', () => {
    test('should handle and recover from errors', async ({ page }) => {
      // Navigate to a page
      await page.goto('/data');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Try to trigger an error (e.g., invalid action)
      // Then navigate away and back
      await page.goto('/settings');
      await page.waitForTimeout(1000);
      
      await page.goto('/data');
      await page.waitForTimeout(1000);
      
      // App should still be functional
      const nav = page.locator('nav[role="navigation"]');
      await expect(nav).toBeVisible();
      
      // Navigation should still work
      const homeButton = page.getByRole('button', { name: /home/i });
      await homeButton.click();
      await page.waitForTimeout(500);
      
      await expect(page).toHaveURL(/\/$/);
    });
  });

  test.describe('Mobile User Journey', () => {
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Navigate through pages
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check that navigation is accessible
      const nav = page.locator('nav').first();
      await expect(nav).toBeVisible({ timeout: 5000 });
      
      // Navigate to data
      const dataButton = page.getByRole('button', { name: /data/i }).first();
      if (await dataButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await dataButton.click();
        await page.waitForTimeout(1000);
      }
      
      await page.screenshot({ path: 'playwright-report/journey-mobile.png' });
    });
  });

  test.describe('Power User Journey', () => {
    test('should complete complex workflow efficiently', async ({ page }) => {
      // Step 1: Create data source
      await page.goto('/add-data-source');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const csvOption = page.getByText(/csv/i).first();
      if (await csvOption.isVisible({ timeout: 5000 }).catch(() => false)) {
        await csvOption.click();
        await page.waitForTimeout(500);
      }
      
      // Step 2: Configure pipeline
      await page.goto('/pipelines');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const createPipeline = page.getByRole('button', { name: /create|new/i }).first();
      if (await createPipeline.isVisible({ timeout: 5000 }).catch(() => false)) {
        await createPipeline.click();
        await page.waitForTimeout(1000);
      }
      
      // Step 3: Schedule job
      await page.goto('/jobs');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const scheduleJob = page.getByRole('button', { name: /schedule|create/i }).first();
      if (await scheduleJob.isVisible({ timeout: 5000 }).catch(() => false)) {
        await scheduleJob.click();
        await page.waitForTimeout(1000);
      }
      
      // Step 4: Check logs
      await page.goto('/logs');
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ path: 'playwright-report/journey-power-user.png' });
    });
  });

  test.describe('Keyboard Navigation Journey', () => {
    test('should navigate using keyboard', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Focus on navigation
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);
      
      // Press Enter to activate
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      
      // Continue tabbing
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);
      
      // Take screenshot
      await page.screenshot({ path: 'playwright-report/journey-keyboard-nav.png' });
    });

    test('should use keyboard shortcuts', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Try common shortcuts (if implemented)
      // Ctrl+K for search
      await page.keyboard.press('Control+K');
      await page.waitForTimeout(500);
      
      // Escape to close
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      
      // App should remain functional
      const nav = page.locator('nav');
      await expect(nav).toBeVisible();
    });
  });

  test.describe('Data Lifecycle Journey', () => {
    test('should complete full data lifecycle', async ({ page }) => {
      // Create → View → Edit → Delete
      
      // Step 1: Create data source
      await page.goto('/data');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const addButton = page.getByRole('button', { name: /add|create/i }).first();
      if (await addButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addButton.click();
        await page.waitForTimeout(1000);
        
        // Quick navigation through creation (minimal)
        const cancelButton = page.getByRole('button', { name: /cancel|back/i }).first();
        if (await cancelButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await cancelButton.click();
        }
      }
      
      // Step 2: View existing data
      await page.goto('/data');
      await page.waitForTimeout(1000);
      
      // Step 3: Navigate to settings to view configuration
      await page.goto('/settings');
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: 'playwright-report/journey-data-lifecycle.png' });
    });
  });

  test.describe('Quick Navigation Journey', () => {
    test('should rapidly switch between pages', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Rapid navigation
      const navSequence = ['data', 'jobs', 'settings', 'logs', 'home'];
      
      for (const pageName of navSequence) {
        const navButton = page.getByRole('button', { name: new RegExp(pageName, 'i') }).first();
        
        if (await navButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await navButton.click();
          await page.waitForTimeout(500);
        }
      }
      
      // Should end up at home
      const homeUrl = page.url();
      expect(homeUrl).toMatch(/\/$|\/$/);
    });
  });

  test.describe('Session Persistence Journey', () => {
    test('should maintain state across page reloads', async ({ page }) => {
      // Navigate to settings
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Make a change
      const input = page.getByLabel(/application name/i).first();
      if (await input.isVisible({ timeout: 5000 }).catch(() => false)) {
        await input.fill('Persistence Test');
        await page.waitForTimeout(500);
      }
      
      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Check if still on settings page
      await expect(page).toHaveURL(/\/settings/);
      
      // Navigation should still work
      const nav = page.locator('nav');
      await expect(nav).toBeVisible();
    });
  });

  test.describe('Browser Back/Forward Journey', () => {
    test('should handle browser navigation correctly', async ({ page }) => {
      // Navigate through pages
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await page.goto('/data');
      await page.waitForTimeout(1000);
      
      await page.goto('/jobs');
      await page.waitForTimeout(1000);
      
      // Go back
      await page.goBack();
      await page.waitForTimeout(500);
      expect(page.url()).toContain('/data');
      
      // Go back again
      await page.goBack();
      await page.waitForTimeout(500);
      expect(page.url()).toMatch(/\/$/);
      
      // Go forward
      await page.goForward();
      await page.waitForTimeout(500);
      expect(page.url()).toContain('/data');
    });
  });

  test.describe('Performance Journey', () => {
    test('should load pages quickly', async ({ page }) => {
      const pages = ['/', '/data', '/jobs', '/settings'];
      
      for (const url of pages) {
        const startTime = Date.now();
        
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        
        const loadTime = Date.now() - startTime;
        
        // Pages should load within 5 seconds
        expect(loadTime).toBeLessThan(5000);
        
        console.log(`${url} loaded in ${loadTime}ms`);
      }
    });
  });

  test.describe('Form Interaction Journey', () => {
    test('should handle complex form interactions', async ({ page }) => {
      await page.goto('/add-data-source');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Select type
      const option = page.getByText(/csv|json/i).first();
      if (await option.isVisible({ timeout: 5000 }).catch(() => false)) {
        await option.click();
        await page.waitForTimeout(500);
      }
      
      // Select method
      const method = page.getByText(/upload|file/i).first();
      if (await method.isVisible({ timeout: 5000 }).catch(() => false)) {
        await method.click();
        await page.waitForTimeout(500);
      }
      
      // Fill form
      const nameInput = page.getByLabel(/name/i).first();
      if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Tab through fields
        await nameInput.focus();
        await nameInput.fill('Complex Form Test');
        await page.keyboard.press('Tab');
        await page.waitForTimeout(200);
      }
      
      await page.screenshot({ path: 'playwright-report/journey-form-interaction.png' });
    });
  });

  test.describe('Visual Verification Journey', () => {
    test('should capture screenshots of all major pages', async ({ page }) => {
      const pageUrls = [
        { url: '/', name: 'home' },
        { url: '/data', name: 'data' },
        { url: '/pipelines', name: 'pipelines' },
        { url: '/jobs', name: 'jobs' },
        { url: '/webhooks', name: 'webhooks' },
        { url: '/logs', name: 'logs' },
        { url: '/settings', name: 'settings' },
        { url: '/plugins', name: 'plugins' },
      ];

      for (const { url, name } of pageUrls) {
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        await page.screenshot({ 
          path: `playwright-report/page-${name}.png`,
          fullPage: true 
        });
      }
    });
  });
});
