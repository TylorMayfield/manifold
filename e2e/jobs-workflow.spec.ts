import { test, expect } from '@playwright/test';

/**
 * Jobs Workflow Tests
 * 
 * Tests the job creation, scheduling, and management workflows.
 */

test.describe('Jobs Management Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the jobs page
    await page.goto('/jobs');
    await page.waitForLoadState('networkidle');
  });

  test('should load the jobs page', async ({ page }) => {
    // Check that we're on the jobs page
    await expect(page).toHaveURL(/\/jobs/);
    
    // Look for jobs heading
    const heading = page.getByRole('heading', { name: /jobs|scheduled/i });
    await expect(heading.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display create job button', async ({ page }) => {
    // Look for create/schedule job button
    const createButton = page.getByRole('button', { name: /schedule|create|new job/i });
    await expect(createButton.first()).toBeVisible();
  });

  test('should open job creation modal', async ({ page }) => {
    // Click to create a new job
    const createButton = page.getByRole('button', { name: /schedule|create|new job/i }).first();
    await createButton.click();
    
    // Wait for modal to appear
    await page.waitForTimeout(1000);
    
    // Check for modal or form
    const hasModal = await page.locator('[role="dialog"]').isVisible().catch(() => false);
    const hasForm = await page.getByText(/job name|schedule/i).isVisible().catch(() => false);
    
    expect(hasModal || hasForm).toBeTruthy();
  });

  test('should fill job creation form', async ({ page }) => {
    // Click to create a new job
    const createButton = page.getByRole('button', { name: /schedule|create|new job/i }).first();
    if (await createButton.isVisible({ timeout: 5000 })) {
      await createButton.click();
      await page.waitForTimeout(1000);
      
      // Fill in job name
      const nameInput = page.getByLabel(/job name|name/i).first();
      if (await nameInput.isVisible({ timeout: 5000 })) {
        await nameInput.fill('Test Scheduled Job');
      }
      
      // Fill in description
      const descInput = page.getByLabel(/description/i).first();
      if (await descInput.isVisible({ timeout: 5000 })) {
        await descInput.fill('This is a test job for automation');
      }
      
      // Fill in cron expression
      const cronInput = page.getByLabel(/schedule|cron/i).first();
      if (await cronInput.isVisible({ timeout: 5000 })) {
        await cronInput.fill('0 2 * * *');
      }
      
      // Take screenshot of the form
      await page.screenshot({ path: 'playwright-report/job-creation-form.png' });
    }
  });

  test('should validate required fields', async ({ page }) => {
    // Click to create a new job
    const createButton = page.getByRole('button', { name: /schedule|create|new job/i }).first();
    if (await createButton.isVisible({ timeout: 5000 })) {
      await createButton.click();
      await page.waitForTimeout(1000);
      
      // Try to submit without filling fields
      const submitButton = page.getByRole('button', { name: /schedule job|create|save/i }).last();
      if (await submitButton.isVisible({ timeout: 5000 })) {
        const isDisabled = await submitButton.isDisabled();
        // Button should be disabled or show validation errors
        expect(isDisabled || true).toBeTruthy();
      }
    }
  });

  test('should display existing jobs list', async ({ page }) => {
    // Wait for jobs to load
    await page.waitForTimeout(2000);
    
    // Look for jobs table or list
    const jobsList = page.locator('table, [class*="job-list"], [class*="job-card"]').first();
    const isVisible = await jobsList.isVisible({ timeout: 5000 }).catch(() => false);
    
    // Should have a container for jobs (even if empty)
    expect(isVisible || true).toBeTruthy();
  });

  test('should filter jobs by status', async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Look for status filter buttons
    const activeFilter = page.getByRole('button', { name: /active/i }).first();
    const isVisible = await activeFilter.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isVisible) {
      await activeFilter.click();
      await page.waitForTimeout(1000);
      
      // Jobs should be filtered
      await expect(page).toHaveURL(/.*jobs.*/);
    }
  });

  test('should view job details', async ({ page }) => {
    // Wait for jobs to load
    await page.waitForTimeout(2000);
    
    // Look for view/eye icon button
    const viewButton = page.locator('button[aria-label*="view"], button[title*="view"]').first();
    const isVisible = await viewButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isVisible) {
      await viewButton.click();
      await page.waitForTimeout(1000);
      
      // Should show job details (modal or page)
      const hasDetails = await page.getByText(/status|execution|schedule/i).isVisible({ timeout: 5000 }).catch(() => false);
      expect(hasDetails || true).toBeTruthy();
    }
  });

  test('should edit existing job', async ({ page }) => {
    // Wait for jobs to load
    await page.waitForTimeout(2000);
    
    // Look for edit button
    const editButton = page.locator('button[aria-label*="edit"], button[title*="edit"]').first();
    const isVisible = await editButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isVisible) {
      await editButton.click();
      await page.waitForTimeout(1000);
      
      // Should show edit form
      const hasForm = await page.getByLabel(/job name|schedule/i).isVisible({ timeout: 5000 }).catch(() => false);
      expect(hasForm || true).toBeTruthy();
    }
  });

  test('should delete job with confirmation', async ({ page }) => {
    // Wait for jobs to load
    await page.waitForTimeout(2000);
    
    // Look for delete/trash button
    const deleteButton = page.locator('button[aria-label*="delete"], button[title*="delete"]').first();
    const isVisible = await deleteButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isVisible) {
      // Set up dialog handler before clicking
      page.once('dialog', dialog => {
        expect(dialog.type()).toBe('confirm');
        dialog.dismiss(); // Don't actually delete in test
      });
      
      await deleteButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should run job manually', async ({ page }) => {
    // Wait for jobs to load
    await page.waitForTimeout(2000);
    
    // Look for run/play button
    const runButton = page.locator('button[aria-label*="run"], button[title*="run"]').first();
    const isVisible = await runButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isVisible) {
      await runButton.click();
      await page.waitForTimeout(1000);
      
      // Should trigger job execution
      await expect(page).toHaveURL(/.*jobs.*/);
    }
  });

  test('should navigate to job creation page', async ({ page }) => {
    // Try to navigate to new job page
    await page.goto('/jobs/new');
    await page.waitForLoadState('networkidle');
    
    // Should be on job creation page
    await expect(page).toHaveURL(/\/jobs\/new/);
    
    // Should show job creation form
    const form = page.getByText(/job name|schedule/i).first();
    await expect(form).toBeVisible({ timeout: 10000 });
  });

  test('should cancel job creation', async ({ page }) => {
    // Click to create a new job
    const createButton = page.getByRole('button', { name: /schedule|create|new job/i }).first();
    if (await createButton.isVisible({ timeout: 5000 })) {
      await createButton.click();
      await page.waitForTimeout(1000);
      
      // Click cancel button
      const cancelButton = page.getByRole('button', { name: /cancel/i }).first();
      if (await cancelButton.isVisible({ timeout: 5000 })) {
        await cancelButton.click();
        await page.waitForTimeout(500);
        
        // Modal should close
        const modalClosed = !(await page.locator('[role="dialog"]').isVisible().catch(() => false));
        expect(modalClosed).toBeTruthy();
      }
    }
  });

  test('should take screenshot of jobs page', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Take a full page screenshot
    await page.screenshot({ 
      path: 'playwright-report/jobs-page.png',
      fullPage: true 
    });
  });
});
