import { expect, test } from '@playwright/test';
import { ADMIN, CLIENTE, evidencia, ingresar } from './apoyo';

test.describe('Flujos principales (Especificación §12)', () => {
  test('A · login → venta al contado → historial', async ({ page }) => {
    await ingresar(page, ADMIN);
    await evidencia(page, 'S02-dashboard');
    await page.goto('/ventas/nueva');
    await page.getByLabel('Buscar producto').fill('arroz');
    await page.getByRole('button', { name: /agregar arroz extra/i }).click();
    await page.getByRole('button', { name: /agregar arroz extra/i }).click();
    await page.getByLabel('Buscar producto').fill('gaseosa');
    await page.getByRole('button', { name: /agregar gaseosa/i }).click();
    await page.getByRole('button', { name: /^confirmar venta/i }).click();
    await expect(page.getByRole('heading', { name: 'Venta registrada' })).toBeVisible();
    const texto = await page.getByRole('status').filter({ hasText: 'Venta N.º' }).innerText();
    const id = /N\.º (\d+)/.exec(texto)![1]!;
    await evidencia(page, 'S03-pos-confirmada');
    // Navegación dentro de la app (sin recargar): detalle y luego historial.
    await page.getByRole('link', { name: /ver detalle/i }).click();
    await expect(page.getByRole('heading', { name: `Venta N.º ${id}` })).toBeVisible();
    await page.getByRole('button', { name: 'Volver' }).click();
    await expect(page).toHaveURL(/\/ventas$/);
    await expect(page.getByText(`N.º ${id}`).first()).toBeVisible();
  });

  test('B · fiado excedido → mensaje → cambiar a contado', async ({ page }) => {
    await ingresar(page, ADMIN);
    await page.goto('/clientes?q=Jorge');
    await page.getByText('Jorge Huamán').first().click();
    await page.getByRole('button', { name: /nueva venta fiada/i }).click();
    await page.getByLabel('Buscar producto').fill('huevos');
    await page.getByRole('button', { name: /agregar huevos/i }).click();
    await page.getByRole('button', { name: /confirmar venta fiada/i }).click();
    await expect(page.getByRole('heading', { name: 'No se pudo fiar' })).toBeVisible();
    await expect(page.getByRole('alert')).toContainText('Supera el límite de crédito. Disponible: S/');
    await evidencia(page, 'S03-pos-fiado-limite');
    await page.getByRole('button', { name: /cambiar a contado/i }).click();
    await page.getByRole('button', { name: /^confirmar venta$/i }).click();
    await expect(page.getByRole('heading', { name: 'Venta registrada' })).toBeVisible();
  });

  test('C · pago parcial → el saldo baja', async ({ page }) => {
    await ingresar(page, ADMIN);
    await page.goto('/clientes?q=Mar%C3%ADa');
    await page.getByText('María Quispe').first().click();
    const saldoTexto = await page.getByText(/^Debe S\//).first().innerText();
    const saldo = Number(saldoTexto.replace(/[^\d.]/g, ''));
    await page.getByRole('button', { name: /registrar pago/i }).first().click();
    await page.getByLabel(/monto a pagar/i).fill('5');
    await page.getByRole('dialog').getByRole('button', { name: /registrar pago/i }).click();
    const nuevo = (saldo - 5).toFixed(2);
    await expect(page.getByText(new RegExp(`Debe S/ ${nuevo.replace('.', '\\.')}`)).first()).toBeVisible();
    await expect(page.getByText('Pago a cuenta').first()).toBeVisible();
    await evidencia(page, 'S05-estado-cuenta');
  });

  test('D · el cliente ve solo su cuenta y recibe 403 en /clientes', async ({ page }) => {
    await ingresar(page, CLIENTE);
    await expect(page).toHaveURL(/\/mi-cuenta/);
    await expect(page.getByRole('heading', { name: /¡Hola, María Quispe!/ })).toBeVisible();
    await evidencia(page, 'S10-mi-cuenta');
    await page.goto('/clientes');
    await expect(page.getByRole('heading', { name: 'No tienes permiso para ver esta página' })).toBeVisible();
  });
});
