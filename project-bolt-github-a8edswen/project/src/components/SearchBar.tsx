import { useState } from 'react';
import { Search, MapPin, Home, DollarSign } from 'lucide-react';
import { useRouter } from '@/context/RouterContext';
import { CITIES, PROPERTY_TYPES } from '@/lib/utils';
import type { ListingStatus, PropertyType } from '@/types';

interface Props {
  variant?: 'hero' | 'compact';
}

export default function SearchBar({ variant = 'hero' }: Props) {
  const { navigate } = useRouter();
  const [city, setCity] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType | ''>('');
  const [listingStatus, setListingStatus] = useState<ListingStatus | ''>('');
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    navigate({
      name: 'search',
      filters: { city, propertyType, listingStatus, query },
    });
  };

  if (variant === 'compact') {
    return (
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search by city, neighborhood, or keyword..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm"
        />
        <button
          onClick={handleSearch}
          className="px-5 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <Search className="w-4 h-4" /> Search
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl shadow-slate-900/10 p-2 max-w-4xl w-full">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 border border-transparent focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 outline-none text-sm font-medium text-slate-700 appearance-none cursor-pointer"
          >
            <option value="">All Cities</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value as PropertyType | '')}
            className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 border border-transparent focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 outline-none text-sm font-medium text-slate-700 appearance-none cursor-pointer"
          >
            <option value="">All Types</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <select
            value={listingStatus}
            onChange={(e) => setListingStatus(e.target.value as ListingStatus | '')}
            className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 border border-transparent focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 outline-none text-sm font-medium text-slate-700 appearance-none cursor-pointer"
          >
            <option value="">Buy or Rent</option>
            <option value="For Sale">For Sale</option>
            <option value="For Rent">For Rent</option>
          </select>
        </div>

        <button
          onClick={handleSearch}
          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-primary-600/30 transition-all"
        >
          <Search className="w-5 h-5" /> Search
        </button>
      </div>

      <div className="px-3 pt-2 pb-1">
        <input
          type="text"
          placeholder="Or search by keyword, neighborhood, address..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="w-full px-4 py-2.5 rounded-lg bg-slate-50 border border-transparent focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 outline-none text-sm"
        />
      </div>
    </div>
  );
}
