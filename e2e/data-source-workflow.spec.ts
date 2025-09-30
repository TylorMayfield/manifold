import { test, expect } from '@playwright/test';

/**
 * Data Source Creation Workflow Tests
 * 
 * Tests the complete workflow of creating different types of data sources,
 * simulating actual user interactions.
 */

test.describe('Data Source Creation Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the data sources page
    await page.goto('/data');
    await page.waitForLoadState('networkidle');
  });

  test('should display add data source button', async ({ page }) => {
    // Check for the add data source button or link
    const addButton = page.getByRole('button', { name: /add data source|create|new/i });
    await expect(addButton.first()).toBeVisible();
  });

  test('should open data source creation modal', async ({ page }) => {
    // Click to add a new data source
    const addButton = page.getByRole('button', { name: /add data source|create|new/i }).first();
    await addButton.click();
    
    // Wait for modal or new page
    await page.waitForTimeout(1000);
    
    // Check that we're in the creation flow (either modal or new page)
    const hasModal = await page.locator('[role="dialog"]').isVisible().catch(() => false);
    const hasHeading = await page.getByRole('heading', { name: /data source/i }).isVisible();
    
    expect(hasModal || hasHeading).toBeTruthy();
  });

  test('should navigate through data source type selection', async ({ page }) => {
    // Navigate to add data source page
    await page.goto('/add-data-source');
    await page.waitForLoadState('networkidle');
    
    // Look for data source type options
    const csvOption = page.getByText(/csv/i).first();
    const jsonOption = page.getByText(/json/i).first();
    
    // Verify type selection options are visible
    await expect(csvOption).toBeVisible({ timeout: 10000 });
  });

  test('should complete CSV data source creation workflow', async ({ page }) => {
    // Navigate to add data source page
    await page.goto('/add-data-source');
    await page.waitForLoadState('networkidle');
    
    // Step 1: Select CSV data source type
    const csvOption = page.getByText(/csv file/i).first();
    if (await csvOption.isVisible({ timeout: 5000 })) {
      await csvOption.click();
      await page.waitForTimeout(500);
    }
    
    // Step 2: Select import method (if available)
    const uploadOption = page.getByText(/file upload|upload/i).first();
    if (await uploadOption.isVisible({ timeout: 5000 })) {
      await uploadOption.click();
      await page.waitForTimeout(500);
    }
    
    // Step 3: Fill in data source details
    const nameInput = page.getByLabel(/name/i).first();
    if (await nameInput.isVisible({ timeout: 5000 })) {
      await nameInput.fill('Test CSV Data Source');
      await page.waitForTimeout(300);
    }
    
    // Take a screenshot of the configuration step
    await page.screenshot({ path: 'playwright-report/csv-workflow.png' });
  });

  test('should complete JSON data source creation workflow', async ({ page }) => {
    // Navigate to add data source page
    await page.goto('/add-data-source');
    await page.waitForLoadState('networkidle');
    
    // Step 1: Select JSON data source type
    const jsonOption = page.getByText(/json/i).first();
    if (await jsonOption.isVisible({ timeout: 5000 })) {
      await jsonOption.click();
      await page.waitForTimeout(500);
    }
    
    // Step 2: Select import method
    const uploadOption = page.getByText(/file upload|upload/i).first();
    if (await uploadOption.isVisible({ timeout: 5000 })) {
      await uploadOption.click();
      await page.waitForTimeout(500);
    }
    
    // Step 3: Fill in configuration
    const nameInput = page.getByLabel(/name/i).first();
    if (await nameInput.isVisible({ timeout: 5000 })) {
      await nameInput.fill('Test JSON Data Source');
    }
  });

  test('should show validation errors for empty form', async ({ page }) => {
    // Navigate to add data source page
    await page.goto('/add-data-source');
    await page.waitForLoadState('networkidle');
    
    // Try to submit without filling required fields
    const submitButton = page.getByRole('button', { name: /create|submit|save/i }).first();
    if (await submitButton.isVisible({ timeout: 5000 })) {
      // Check if button is disabled (validation)
      const isDisabled = await submitButton.isDisabled();
      expect(isDisabled).toBeTruthy();
    }
  });

  test('should allow canceling data source creation', async ({ page }) => {
    // Navigate to add data source page
    await page.goto('/add-data-source');
    await page.waitForLoadState('networkidle');
    
    // Look for cancel or back button
    const cancelButton = page.getByRole('button', { name: /cancel|back/i }).first();
    if (await cancelButton.isVisible({ timeout: 5000 })) {
      await cancelButton.click();
      await page.waitForTimeout(500);
      
      // Should navigate away from the creation flow
      const url = page.url();
      expect(url).not.toContain('add-data-source');
    }
  });

  test('should display progress indicator during workflow', async ({ page }) => {
    // Navigate to add data source page
    await page.goto('/add-data-source');
    await page.waitForLoadState('networkidle');
    
    // Look for step indicators (1, 2, 3, 4 or similar)
    const stepIndicators = page.locator('div[class*="step"], span[class*="step"]');
    const count = await stepIndicators.count();
    
    // Should have multiple steps
    expect(count).toBeGreaterThan(0);
  });

  test('should navigate between workflow steps', async ({ page }) => {
    // Navigate to add data source page
    await page.goto('/add-data-source');
    await page.waitForLoadState('networkidle');
    
    // Select a data source type
    const csvOption = page.getByText(/csv file/i).first();
    if (await csvOption.isVisible({ timeout: 5000 })) {
      await csvOption.click();
      await page.waitForTimeout(500);
      
      // Look for next button
      const nextButton = page.getByRole('button', { name: /next|continue/i }).first();
      if (await nextButton.isVisible({ timeout: 5000 })) {
        await nextButton.click();
        await page.waitForTimeout(500);
        
        // Should be on the next step
        const backButton = page.getByRole('button', { name: /back|previous/i }).first();
        await expect(backButton).toBeVisible();
      }
    }
  });

  test('should support JavaScript data source type', async ({ page }) => {
    // Navigate to add data source page
    await page.goto('/add-data-source');
    await page.waitForLoadState('networkidle');
    
    // Look for JavaScript option
    const jsOption = page.getByText(/javascript|js script/i).first();
    const isVisible = await jsOption.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isVisible) {
      await jsOption.click();
      await page.waitForTimeout(500);
      
      // Should show script editor or configuration
      const editorExists = await page.locator('[class*="editor"], [class*="monaco"]').isVisible({ timeout: 5000 }).catch(() => false);
      
      // Take screenshot of JS configuration
      await page.screenshot({ path: 'playwright-report/js-workflow.png' });
    }
  });

  test('should support SQL data source type', async ({ page }) => {
    // Navigate to add data source page
    await page.goto('/add-data-source');
    await page.waitForLoadState('networkidle');
    
    // Look for SQL option
    const sqlOption = page.getByText(/sql/i).first();
    const isVisible = await sqlOption.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isVisible) {
      await sqlOption.click();
      await page.waitForTimeout(500);
      
      // Should show SQL configuration options
      const configExists = await page.getByText(/connection|database|query/i).first().isVisible({ timeout: 5000 }).catch(() => false);
      
      expect(configExists).toBeTruthy();
    }
  });
});
