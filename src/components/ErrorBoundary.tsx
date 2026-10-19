import { Component, type ReactNode } from 'react';
import { ErrorRender } from '@/features/estados/Estados';

/** Error de renderizado: pantalla con botón "Recargar" (Especificación §S11). */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };

  static getDerivedStateFromError() {
    return { error: true };
  }

  render() {
    return this.state.error ? <ErrorRender /> : this.props.children;
  }
}
