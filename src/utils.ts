import { Product } from './types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

export function getProductEffectivePrice(product: Product): number {
  if (product.isOnSale && product.discountPercent) {
    const discounted = product.price * (1 - product.discountPercent / 100);
    // Round to 2 decimal places to prevent float precision issues in calculations
    return Math.round(discounted * 100) / 100;
  }
  return product.price;
}

export function generateInvoiceNumber(existingCount: number): string {
  const nextNum = existingCount + 1;
  const year = new Date().getFullYear();
  return `FAC-${year}-${nextNum.toString().padStart(4, '0')}`;
}

export function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function getLocalStorageData<T>(key: string, initialValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue;
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return initialValue;
  }
}

export function setLocalStorageData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing localStorage key "${key}":`, error);
  }
}
