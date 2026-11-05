import { expect, test } from '@playwright/test';

test('keyboard navigation, synthetic catalog, search, and honest character empty state', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Every story starts',
  );
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Skip to content' }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Library' })
    .focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('heading', { name: 'Content library' }),
  ).toBeFocused();
  await expect(
    page.getByRole('heading', { name: 'Synthetic Demo Spark' }),
  ).toBeVisible();
  await expect(
    page.getByText('Synthetic demo · Not SRD', { exact: true }),
  ).toBeVisible();
  await page.getByLabel('Search demo assets').fill('missing-demo');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'No matching demo assets' }),
  ).toBeVisible();
  await page.getByLabel('Search demo assets').fill('Spark');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Synthetic Demo Spark' }),
  ).toBeVisible();
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Characters' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'No character system yet' }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Character workspace' }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
for (const width of [320, 768, 1440]) {
  test(`readable shell at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/', '/library', '/characters', '/attribution']) {
      await page.goto(path);
      if (path === '/library')
        await expect(
          page.getByRole('heading', { name: 'Synthetic Demo Spark' }),
        ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      const clipped = await page
        .locator('h1, h2, h3, p, dd, a, button, label')
        .evaluateAll((elements) =>
          elements
            .filter((el) => {
              const style = getComputedStyle(el);
              return (
                ['hidden', 'clip'].includes(style.overflowY) &&
                el.scrollHeight > el.clientHeight + 1
              );
            })
            .map((el) => el.textContent),
        );
      expect(clipped).toEqual([]);
    }
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Every story starts',
    );
    await page.screenshot({
      path: `test-results/home-${width}.png`,
      fullPage: true,
    });
  });
}
test('catalog failure is visible and retry recovers', async ({ page }) => {
  await page.route('**/api/v1/assets?*', (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Catalog temporarily unavailable.',
        },
      }),
    }),
  );
  await page.goto('/library');
  await expect(page.getByRole('alert')).toContainText(
    'Catalog temporarily unavailable.',
  );
  await page.unroute('**/api/v1/assets?*');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(
    page.getByRole('heading', { name: 'Synthetic Demo Spark' }),
  ).toBeVisible();
});
