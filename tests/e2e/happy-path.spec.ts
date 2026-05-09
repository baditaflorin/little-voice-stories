import { expect, test } from '@playwright/test';

test('published app happy path', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /Drawing to story/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Star on GitHub/i })).toHaveAttribute(
    'href',
    'https://github.com/baditaflorin/little-voice-stories',
  );
  await expect(page.getByRole('link', { name: /Support/i })).toHaveAttribute(
    'href',
    'https://www.paypal.com/paypalme/florinbadita',
  );
  await expect(page.getByText(/v0\.\d+\.\d+/)).toBeVisible();

  await page.getByRole('button', { name: /Use sample/i }).click();
  await expect(page.getByRole('heading', { name: 'Character' })).toBeVisible();

  await page.getByLabel('Character name').fill('Pip Lantern');
  await page.getByLabel('Child name').fill('Mara');
  await page.getByRole('button', { name: /Continue to story/i }).click();
  await page.getByRole('button', { name: /Compose story/i }).click();

  await expect(page.getByLabel('Story title')).toHaveValue(/Pip Lantern/);
  await expect(page.getByLabel('Story text')).toHaveValue(/Mara/);

  await page.getByRole('button', { name: /Continue to voice/i }).click();
  await page.getByRole('button', { name: /Demo voice/i }).click();
  await expect(page.getByText(/warm and close/i)).toBeVisible();
});

test('session export and import round-trip', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Use sample/i }).click();
  await page.getByLabel('Character name').fill('Pip Lantern');
  await page.getByLabel('Child name').fill('Mara');
  await page.getByRole('button', { name: /Continue to story/i }).click();
  await page.getByRole('button', { name: /Compose story/i }).click();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export session/i }).click();
  const download = await downloadPromise;
  const path = await download.path();
  if (!path) {
    throw new Error('Session export did not create a downloadable file.');
  }

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: /Reset local data/i }).click();
  await expect(page.getByText(/Character seed/i)).toBeVisible();
  await expect(page.getByText(/Local project cleared\./i)).toBeVisible();
  await expect(page.getByText(/Local save failed in this browser\./i)).toHaveCount(0);

  await page.locator('input[type="file"][accept="application/json,.json"]').setInputFiles(path);
  await expect(page.getByLabel('Story title')).toHaveValue(/Pip Lantern/);
  await expect(page.getByLabel('Story text')).toHaveValue(/Mara/);
});
