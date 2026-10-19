import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { config } from './lib/config';
import './index.css';

async function iniciar() {
  if (config.usarMocks) {
    // Modo sin backend (Especificación §10): MSW responde todas las rutas del contrato.
    const { worker } = await import('./mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass', quiet: true });
  }
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

iniciar();
