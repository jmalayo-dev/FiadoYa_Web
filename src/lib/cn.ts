import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Une clases de Tailwind resolviendo conflictos. */
export function cn(...valores: ClassValue[]) {
  return twMerge(clsx(valores));
}
