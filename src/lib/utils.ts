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

export function getVisualName(catName?: string, maestroName?: string, variantName?: string): string {
  const cat = (catName || '').trim();
  const maestro = (maestroName || '').trim();
  if (!variantName) return cat ? `${cat}_${maestro}` : maestro;
  
  let cleanVar = variantName.trim();
  if (maestroName && cleanVar.toLowerCase().startsWith(maestroName.toLowerCase())) {
    cleanVar = cleanVar.substring(maestroName.length).trim();
  }
  cleanVar = cleanVar.replace(/^[-_\s/,]+/, '').trim();
  
  const mainPart = cat ? `${cat}_${maestro}` : maestro;
  return cleanVar ? `${mainPart}_${cleanVar}` : mainPart;
}

