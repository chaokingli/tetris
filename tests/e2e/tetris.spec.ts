import { test, expect } from '@playwright/test';

test.describe('Tetris Game', () => {
  test('game page loads with correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Tetris/i);
  });

  test('game canvas renders', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('game UI elements are present', async ({ page }) => {
    await page.goto('/');
    
    // Check for score display
    const scoreElement = page.getByText(/score/i);
    await expect(scoreElement).toBeVisible();
    
    // Check for level display
    const levelElement = page.getByText(/level/i);
    await expect(levelElement).toBeVisible();
  });
});
