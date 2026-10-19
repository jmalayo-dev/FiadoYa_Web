import { expect, type Page } from '@playwright/test';

export const ADMIN = { usuario: 'bodeguero', clave: process.env.E2E_ADMIN_PASSWORD ?? 'Demo12345' };
export const CLIENTE = { usuario: 'cliente1', clave: process.env.E2E_CLIENTE_PASSWORD ?? 'Demo12345' };
export const CON_BACKEND_REAL = Boolean(process.env.E2E_BASE_URL);

export async function ingresar(page: Page, cuenta: { usuario: string; clave: string }) {
  await page.goto('/login');
  await page.getByLabel(/usuario o dni/i).fill(cuenta.usuario);
  await page.getByLabel(/^contraseña/i).fill(cuenta.clave);
  await page.getByRole('button', { name: /ingresar/i }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

/** Captura de evidencia (Especificación §14): docs/handoff/evidencias/S##-descripcion-ancho.png */
export async function evidencia(page: Page, nombre: string) {
  const ancho = page.viewportSize()?.width ?? 0;
  await page.screenshot({ path: `${process.env.E2E_EVIDENCIAS ?? '../backend/docs/handoff/evidencias'}/${nombre}-${ancho}.png`, fullPage: true });
}
