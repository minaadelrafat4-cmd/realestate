export type UserRole = 'customer' | 'agent' | 'admin';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  phone: string;
  avatar_url: string;
  bio: string;
  agency: string;
  specialization: string;
  verified: boolean;
  created_at: string;
}

export type PropertyType = 'Apartment' | 'Villa' | 'Office' | 'Land' | 'Commercial';
export type ListingStatus = 'For Sale' | 'For Rent';

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  property_type: PropertyType;
  listing_status: ListingStatus;
  city: string;
  neighborhood: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  floor: number;
  year_built: number | null;
  furnished: boolean;
  parking: boolean;
  swimming_pool: boolean;
  garden: boolean;
  balcony: boolean;
  ready_to_move: boolean;
  has_video: boolean;
  has_virtual_tour: boolean;
  lat: number | null;
  lng: number | null;
  agent_id: string | null;
  featured: boolean;
  is_sold: boolean;
  is_rented: boolean;
  approved: boolean;
  views: number;
  created_at: string;
  agent?: Profile;
  images?: PropertyImage[];
  favorite_count?: number;
}

export interface PropertyImage {
  id: string;
  property_id: string;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar_url: string;
}

export interface Appointment {
  id: string;
  property_id: string;
  user_id: string;
  agent_id: string | null;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes: string;
  created_at: string;
  property?: Property;
  agent?: Profile;
  user?: Profile;
}

export interface Favorite {
  id: string;
  user_id: string;
  property_id: string;
  created_at: string;
  property?: Property;
}

export interface Review {
  id: string;
  property_id: string;
  user_id: string;
  rating: number;
  content: string;
  approved: boolean;
  created_at: string;
  user?: Profile;
  property?: Property;
}

export interface SearchFilters {
  city?: string;
  neighborhood?: string;
  propertyType?: PropertyType | '';
  listingStatus?: ListingStatus | '';
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  minArea?: number;
  furnished?: boolean;
  parking?: boolean;
  swimmingPool?: boolean;
  garden?: boolean;
  balcony?: boolean;
  readyToMove?: boolean;
  query?: string;
}
