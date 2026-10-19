import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { reiniciarDatos } from '@/mocks/datos';
import { server } from '@/mocks/server';

// jsdom no implementa estas APIs que usan Radix y algunos componentes.
class ResizeObserverFalso {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverFalso as unknown as typeof ResizeObserver;
window.HTMLElement.prototype.scrollIntoView ??= () => {};
window.HTMLElement.prototype.hasPointerCapture ??= () => false;
window.HTMLElement.prototype.releasePointerCapture ??= () => {};

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  reiniciarDatos();
  sessionStorage.clear();
  localStorage.clear();
});
afterAll(() => server.close());
