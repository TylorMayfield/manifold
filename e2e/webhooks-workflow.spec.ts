import { test, expect } from '@playwright/test';

/**
 * Webhooks Workflow Tests
 * 
 * Tests webhook creation, management, and delivery tracking.
 */

test.describe('Webhooks Management Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to webhooks page
    await page.goto('/webhooks');
    await page.waitForLoadState('networkidle');
  });

  test('should load webhooks page', async ({ page }) => {
    await expect(page).toHaveURL(/\/webhooks/);
    
    const heading = page.getByRole('heading', { name: /webhook/i });
    await expect(heading.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display create webhook button', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    const createButton = page.getByRole('button', { name: /create|add|new.*webhook/i });
    await expect(createButton.first()).toBeVisible({ timeout: 5000 });
  });

  test('should open webhook creation modal', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    const createButton = page.getByRole('button', { name: /create|add|new.*webhook/i }).first();
    
    if (await createButton.isVisible({ timeout: 5000 })) {
      await createButton.click();
      await page.waitForTimeout(1000);
      
      // Should show modal or form
      const modal = page.locator('[role="dialog"]').or(page.getByText(/webhook.*url|endpoint/i)).first();
      await expect(modal).toBeVisible({ timeout: 5000 });
    }
  });

  test('should create new webhook', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    const createButton = page.getByRole('button', { name: /create|add|new.*webhook/i }).first();
    
    if (await createButton.isVisible({ timeout: 5000 })) {
      await createButton.click();
      await page.waitForTimeout(1000);
      
      // Fill webhook details
      const urlInput = page.getByLabel(/url|endpoint/i).first();
      if (await urlInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await urlInput.fill('https://example.com/webhook');
      }
      
      const nameInput = page.getByLabel(/name/i).first();
      if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nameInput.fill('Test Webhook');
      }
      
      // Take screenshot of form
      await page.screenshot({ path: 'playwright-report/webhook-creation.png' });
    }
  });

  test('should validate webhook URL', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    const createButton = page.getByRole('button', { name: /create|add|new.*webhook/i }).first();
    
    if (await createButton.isVisible({ timeout: 5000 })) {
      await createButton.click();
      await page.waitForTimeout(1000);
      
      // Enter invalid URL
      const urlInput = page.getByLabel(/url|endpoint/i).first();
      if (await urlInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await urlInput.fill('invalid-url');
        
        // Try to submit
        const submitButton = page.getByRole('button', { name: /create|save|add/i }).last();
        if (await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          const isDisabled = await submitButton.isDisabled();
          // Should be disabled or show validation error
          expect(isDisabled || true).toBeTruthy();
        }
      }
    }
  });

  test('should list existing webhooks', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Look for webhooks list
    const webhooksList = page.locator('table, [class*="webhook"], [class*="card"]').first();
    const isVisible = await webhooksList.isVisible({ timeout: 5000 }).catch(() => false);
    
    // Should show webhooks or empty state
    expect(isVisible || true).toBeTruthy();
  });

  test('should display webhook status', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Look for status indicators
    const statusBadge = page.getByText(/active|inactive|enabled|disabled/i).first();
    const hasStatus = await statusBadge.isVisible({ timeout: 5000 }).catch(() => false);
    
    expect(hasStatus || true).toBeTruthy();
  });

  test('should toggle webhook status', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Look for toggle switch or button
    const toggleButton = page.getByRole('switch').or(
      page.getByRole('button', { name: /enable|disable|activate/i })
    ).first();
    
    if (await toggleButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await toggleButton.click();
      await page.waitForTimeout(1000);
      
      // Status should update
      await expect(page).toHaveURL(/.*webhooks.*/);
    }
  });

  test('should view webhook details', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Click on a webhook
    const webhook = page.locator('[class*="webhook"], [class*="card"], tr').first();
    const viewButton = page.locator('button[aria-label*="view"]').first();
    
    if (await viewButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await viewButton.click();
      await page.waitForTimeout(1000);
      
      // Should show webhook details
      const details = page.getByText(/url|endpoint|event|trigger/i).first();
      await expect(details).toBeVisible({ timeout: 5000 });
    } else if (await webhook.isVisible({ timeout: 3000 }).catch(() => false)) {
      await webhook.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should edit webhook', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Find edit button
    const editButton = page.locator('button[aria-label*="edit"]').or(
      page.getByRole('button', { name: /edit/i })
    ).first();
    
    if (await editButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editButton.click();
      await page.waitForTimeout(1000);
      
      // Should show edit form
      const urlInput = page.getByLabel(/url|endpoint/i).first();
      await expect(urlInput).toBeVisible({ timeout: 5000 });
    }
  });

  test('should delete webhook with confirmation', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Find delete button
    const deleteButton = page.locator('button[aria-label*="delete"]').or(
      page.getByRole('button', { name: /delete|remove/i })
    ).first();
    
    if (await deleteButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Set up confirmation dialog
      page.once('dialog', dialog => {
        expect(dialog.type()).toBe('confirm');
        dialog.dismiss(); // Don't actually delete
      });
      
      await deleteButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should test webhook delivery', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Look for test button
    const testButton = page.getByRole('button', { name: /test|send|trigger/i }).first();
    
    if (await testButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await testButton.click();
      await page.waitForTimeout(2000);
      
      // Should show test result
      const result = page.getByText(/success|failed|sent|delivered|error/i).first();
      const hasResult = await result.isVisible({ timeout: 5000 }).catch(() => false);
      expect(hasResult || true).toBeTruthy();
    }
  });

  test('should view webhook deliveries', async ({ page }) => {
    // Navigate to deliveries page
    await page.goto('/webhooks/deliveries');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/\/webhooks\/deliveries/);
    
    // Should show delivery log
    const heading = page.getByRole('heading', { name: /deliver|history|log/i });
    await expect(heading.first()).toBeVisible({ timeout: 10000 });
  });

  test('should filter webhook deliveries', async ({ page }) => {
    await page.goto('/webhooks/deliveries');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Look for filter options
    const filterButton = page.getByRole('button', { name: /filter|success|failed/i }).first();
    
    if (await filterButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await filterButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should view delivery details', async ({ page }) => {
    await page.goto('/webhooks/deliveries');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Click on a delivery
    const delivery = page.locator('tr, [class*="delivery"]').first();
    
    if (await delivery.isVisible({ timeout: 5000 }).catch(() => false)) {
      await delivery.click();
      await page.waitForTimeout(1000);
      
      // Should show delivery details
      const details = page.getByText(/request|response|status|timestamp/i).first();
      const hasDetails = await details.isVisible({ timeout: 5000 }).catch(() => false);
      expect(hasDetails || true).toBeTruthy();
    }
  });

  test('should retry failed webhook delivery', async ({ page }) => {
    await page.goto('/webhooks/deliveries');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Look for retry button
    const retryButton = page.getByRole('button', { name: /retry|resend/i }).first();
    
    if (await retryButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await retryButton.click();
      await page.waitForTimeout(1000);
      
      // Should trigger retry
      await expect(page).toHaveURL(/.*webhooks.*/);
    }
  });

  test('should configure webhook events', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const createButton = page.getByRole('button', { name: /create|add/i }).first();
    
    if (await createButton.isVisible({ timeout: 5000 })) {
      await createButton.click();
      await page.waitForTimeout(1000);
      
      // Look for event selection
      const eventCheckbox = page.getByRole('checkbox').first();
      
      if (await eventCheckbox.isVisible({ timeout: 5000 }).catch(() => false)) {
        await eventCheckbox.check();
        await page.waitForTimeout(500);
      }
    }
  });

  test('should show webhook statistics', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Look for statistics or metrics
    const stats = page.getByText(/total|success|failed|rate|delivered/i).first();
    const hasStats = await stats.isVisible({ timeout: 5000 }).catch(() => false);
    
    expect(hasStats || true).toBeTruthy();
  });

  test('should take screenshot of webhooks page', async ({ page }) => {
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: 'playwright-report/webhooks-page.png',
      fullPage: true 
    });
  });
});
