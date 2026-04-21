import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (val: number, currency: 'USD' | 'UYU' = 'USD') => {
  if (!val) val = 0;
  if (currency === 'UYU') {
    return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(val).replace('UYU', '$');
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
};
