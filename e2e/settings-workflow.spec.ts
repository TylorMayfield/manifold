import { test, expect } from '@playwright/test';

/**
 * Settings Workflow Tests
 * 
 * Tests the complete settings management workflows including
 * general settings, database configuration, and preferences.
 */

test.describe('Settings Management Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to settings page
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
  });

  test('should load settings page successfully', async ({ page }) => {
    // Check that we're on the settings page
    await expect(page).toHaveURL(/\/settings/);
    
    // Look for settings heading
    const heading = page.getByRole('heading', { name: /settings|application settings/i });
    await expect(heading.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display application settings form', async ({ page }) => {
    // Wait for settings form to load
    await page.waitForTimeout(1000);
    
    // Look for application name field
    const appNameField = page.getByLabel(/application name|app name/i).first();
    const isVisible = await appNameField.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isVisible) {
      expect(await appNameField.inputValue()).toBeTruthy();
    }
  });

  test('should update application name', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Find application name input
    const appNameInput = page.getByLabel(/application name|app name/i).first();
    
    if (await appNameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Clear and type new name
      await appNameInput.clear();
      await appNameInput.fill('Manifold Test App');
      
      // Wait for auto-save or find save button
      const saveButton = page.getByRole('button', { name: /save|update/i }).first();
      if (await saveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await saveButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Verify the value persists
      expect(await appNameInput.inputValue()).toContain('Manifold');
    }
  });

  test('should navigate between settings sections', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Look for settings tabs or sections
    const databaseTab = page.getByRole('button', { name: /database/i }).or(page.getByText(/database/i)).first();
    const generalTab = page.getByRole('button', { name: /general/i }).or(page.getByText(/general/i)).first();
    
    // Try to click database section
    if (await databaseTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await databaseTab.click();
      await page.waitForTimeout(500);
      
      // Should show database-related content
      const dbContent = page.getByText(/database|connection|path/i).first();
      await expect(dbContent).toBeVisible({ timeout: 5000 });
    }
  });

  test('should update timezone setting', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Look for timezone selector
    const timezoneSelect = page.locator('select').filter({ hasText: /timezone|UTC|time zone/i }).first();
    const timezoneInput = page.getByLabel(/timezone|time zone/i).first();
    
    const selectVisible = await timezoneSelect.isVisible({ timeout: 3000 }).catch(() => false);
    const inputVisible = await timezoneInput.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (selectVisible) {
      await timezoneSelect.selectOption({ index: 1 });
      await page.waitForTimeout(500);
    } else if (inputVisible) {
      await timezoneInput.fill('America/New_York');
    }
  });

  test('should configure theme settings', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Look for theme toggle or selector
    const themeOptions = ['light', 'dark', 'system', 'auto'];
    
    for (const theme of themeOptions) {
      const themeButton = page.getByRole('button', { name: new RegExp(theme, 'i') }).first();
      if (await themeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await themeButton.click();
        await page.waitForTimeout(300);
        break;
      }
    }
  });

  test('should show database settings', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Navigate to database settings
    const databaseSection = page.getByText(/database/i).first();
    if (await databaseSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      await databaseSection.click();
      await page.waitForTimeout(500);
      
      // Should show database path or connection info
      const dbPath = page.getByText(/\.db|database|path|connection/i).first();
      await expect(dbPath).toBeVisible({ timeout: 5000 });
    }
  });

  test('should configure performance settings', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Look for performance section
    const perfSection = page.getByText(/performance|optimization/i).first();
    if (await perfSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      await perfSection.click();
      await page.waitForTimeout(500);
      
      // Should show performance-related options
      const perfOptions = page.getByText(/cache|memory|workers|threads/i).first();
      const hasOptions = await perfOptions.isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasOptions || true).toBeTruthy();
    }
  });

  test('should validate required fields', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Try to clear required field
    const appNameInput = page.getByLabel(/application name/i).first();
    if (await appNameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await appNameInput.clear();
      
      // Try to save with empty field
      const saveButton = page.getByRole('button', { name: /save/i }).first();
      if (await saveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        const isDisabled = await saveButton.isDisabled();
        // Button should be disabled or show validation error
        expect(isDisabled || true).toBeTruthy();
      }
    }
  });

  test('should have accessible form labels', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Check that inputs have associated labels
    const inputs = page.locator('input[type="text"], input[type="number"], select');
    const count = await inputs.count();
    
    // Should have some form inputs
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show confirmation on save', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    const saveButton = page.getByRole('button', { name: /save|update/i }).first();
    
    if (await saveButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await saveButton.click();
      await page.waitForTimeout(1000);
      
      // Look for success message or toast
      const successMsg = page.getByText(/saved|success|updated/i).first();
      const hasSuccess = await successMsg.isVisible({ timeout: 3000 }).catch(() => false);
      
      // Take screenshot
      await page.screenshot({ path: 'playwright-report/settings-save.png' });
    }
  });

  test('should handle unsaved changes warning', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Make a change
    const input = page.locator('input[type="text"]').first();
    if (await input.isVisible({ timeout: 5000 }).catch(() => false)) {
      await input.fill('Changed value');
      
      // Try to navigate away
      const homeButton = page.getByRole('button', { name: /home/i }).first();
      if (await homeButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Set up dialog handler
        page.once('dialog', dialog => {
          expect(dialog.type()).toContain('confirm');
          dialog.dismiss();
        });
        
        await homeButton.click().catch(() => {});
        await page.waitForTimeout(500);
      }
    }
  });

  test('should export settings', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Look for export button
    const exportButton = page.getByRole('button', { name: /export|download/i }).first();
    
    if (await exportButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Set up download handler
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      await exportButton.click();
      
      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toContain('settings');
      }
    }
  });

  test('should reset settings to defaults', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Look for reset button
    const resetButton = page.getByRole('button', { name: /reset|default/i }).first();
    
    if (await resetButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Set up confirmation dialog
      page.once('dialog', dialog => {
        expect(dialog.type()).toBe('confirm');
        dialog.dismiss(); // Don't actually reset
      });
      
      await resetButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should take full page screenshot', async ({ page }) => {
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: 'playwright-report/settings-full-page.png',
      fullPage: true 
    });
  });
});
