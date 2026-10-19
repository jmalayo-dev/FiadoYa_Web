import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { ADMIN, CLIENTE, evidencia, ingresar } from './apoyo';

/** Revisión con axe (Especificación §12): sin errores graves ni críticos en S01, S03, S05 y S10. */
async function revisar(page: import('@playwright/test').Page) {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const graves = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(graves.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
}

test('S01 login', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(/usuario o dni/i).fill('bodeguero');
  await page.getByLabel(/^contraseña/i).fill('incorrecta');
  await page.getByRole('button', { name: /ingresar/i }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await evidencia(page, 'S01-login');
  await revisar(page);
});

test('S03 caja', async ({ page }) => {
  await ingresar(page, ADMIN);
  await page.goto('/ventas/nueva');
  await expect(page.getByLabel('Buscar producto')).toBeVisible();
  await revisar(page);
});

test('S05 clientes y S06 productos', async ({ page }) => {
  await ingresar(page, ADMIN);
  await page.goto('/clientes');
  await expect(page.getByText('María Quispe').first()).toBeVisible();
  await revisar(page);
  await page.goto('/productos?soloBajos=1');
  await expect(page.getByRole('heading', { name: 'Productos' })).toBeVisible();
  await evidencia(page, 'S06-productos-stock-bajo');
  await page.goto('/reportes');
  await page.getByRole('button', { name: /descargar zip/i }).click();
  await expect(page.getByText(/Paralelo \d+ ms · Secuencial/)).toBeVisible();
  await evidencia(page, 'S08-reportes-tiempos');
});

test('S10 mi cuenta', async ({ page }) => {
  await ingresar(page, CLIENTE);
  await expect(page.getByRole('heading', { name: /¡Hola/ })).toBeVisible();
  await revisar(page);
});
