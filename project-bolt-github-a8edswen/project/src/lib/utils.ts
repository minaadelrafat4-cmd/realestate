import type { Property, ListingStatus } from '@/types';

export function formatPrice(price: number, status: ListingStatus, currency = 'USD'): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  });
  const formatted = formatter.format(price);
  return status === 'For Rent' ? `${formatted}/mo` : formatted;
}

export function formatArea(area: number): string {
  return `${area.toLocaleString()} m²`;
}

export const PROPERTY_TYPES: Array<Property['property_type']> = ['Apartment', 'Villa', 'Office', 'Land', 'Commercial'];

export const CITIES = ['New York', 'Miami', 'San Francisco', 'Los Angeles'];

export const NEIGHBORHOODS: Record<string, string[]> = {
  'New York': ['Tribeca', 'Brooklyn', 'Midtown', 'West Village', 'Greenwich', 'Astoria', 'Staten Island'],
  Miami: ['South Beach', 'Brickell', 'Coral Gables', 'Edgewater', 'Golden Beach', 'Coconut Grove'],
  'San Francisco': ['Financial District', 'Union Square', 'SoMa', 'Mission District'],
  'Los Angeles': ['Hollywood Hills'],
};

export function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}
