import { useEffect, useState, useMemo } from 'react';
import { Map as MapIcon, LayoutGrid, X, MapPin, Star, Bed, Bath, Maximize } from 'lucide-react';
import FilterPanel from '@/components/FilterPanel';
import PropertyCard from '@/components/PropertyCard';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/context/RouterContext';
import type { Property, SearchFilters } from '@/types';
import { formatPrice, formatArea } from '@/lib/utils';

export default function SearchPage() {
  const { route } = useRouter();
  const initialFilters = route.name === 'search' ? (route.filters as SearchFilters) ?? {} : {};
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'map'>('grid');
  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high' | 'popular'>('newest');

  useEffect(() => {
    setLoading(true);
    let query = supabase.from('properties').select('*, agent:profiles(*)').eq('approved', true);

    if (filters.city) query = query.eq('city', filters.city);
    if (filters.neighborhood) query = query.eq('neighborhood', filters.neighborhood);
    if (filters.propertyType) query = query.eq('property_type', filters.propertyType);
    if (filters.listingStatus) query = query.eq('listing_status', filters.listingStatus);
    if (filters.minPrice !== undefined) query = query.gte('price', filters.minPrice);
    if (filters.maxPrice !== undefined) query = query.lte('price', filters.maxPrice);
    if (filters.bedrooms !== undefined) query = query.gte('bedrooms', filters.bedrooms);
    if (filters.bathrooms !== undefined) query = query.gte('bathrooms', filters.bathrooms);
    if (filters.minArea !== undefined) query = query.gte('area', filters.minArea);
    if (filters.furnished) query = query.eq('furnished', true);
    if (filters.parking) query = query.eq('parking', true);
    if (filters.swimmingPool) query = query.eq('swimming_pool', true);
    if (filters.garden) query = query.eq('garden', true);
    if (filters.balcony) query = query.eq('balcony', true);
    if (filters.readyToMove) query = query.eq('ready_to_move', true);
    if (filters.query) {
      query = query.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%,neighborhood.ilike.%${filters.query}%,city.ilike.%${filters.query}%`);
    }

    query.then(({ data, error }) => {
      if (error) console.error(error);
      setProperties((data ?? []) as Property[]);
      setLoading(false);
    });
  }, [filters]);

  const sorted = useMemo(() => {
    const arr = [...properties];
    switch (sortBy) {
      case 'price-low': arr.sort((a, b) => a.price - b.price); break;
      case 'price-high': arr.sort((a, b) => b.price - a.price); break;
      case 'popular': arr.sort((a, b) => b.views - a.views); break;
      default: arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return arr;
  }, [properties, sortBy]);

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => v !== undefined && v !== '' && v !== false && k !== 'query').length;

  return (
    <div className="pt-16 lg:pt-20 min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-1">
            {properties.length} Properties Found
          </h1>
          <p className="text-slate-500 text-sm">
            {filters.city || 'All cities'} {filters.propertyType ? `· ${filters.propertyType}` : ''} {filters.listingStatus ? `· ${filters.listingStatus}` : ''}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters */}
          <div className="lg:w-80 flex-shrink-0">
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              onReset={() => setFilters({})}
            />
          </div>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-5 bg-white rounded-xl border border-slate-100 p-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setView('grid')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    view === 'grid' ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" /> Grid
                </button>
                <button
                  onClick={() => setView('map')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    view === 'map' ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <MapIcon className="w-4 h-4" /> Map
                </button>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium outline-none focus:border-primary-400"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="popular">Most Viewed</option>
              </select>
            </div>

            {view === 'grid' ? (
              loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="aspect-[4/3] rounded-2xl skeleton" />
                  ))}
                </div>
              ) : sorted.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
                  <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No properties found</h3>
                  <p className="text-slate-500 text-sm mb-4">Try adjusting your filters to see more results</p>
                  <button onClick={() => setFilters({})} className="px-5 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors">
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {sorted.map((p, i) => (
                    <PropertyCard key={p.id} property={p} index={i} />
                  ))}
                </div>
              )
            ) : (
              <MapView properties={sorted} selectedPin={selectedPin} onSelectPin={setSelectedPin} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MapView({ properties, selectedPin, onSelectPin }: { properties: Property[]; selectedPin: string | null; onSelectPin: (id: string | null) => void }) {
  const { navigate } = useRouter();
  const selected = properties.find((p) => p.id === selectedPin);

  const pins = useMemo(() => {
    const minLat = Math.min(...properties.map((p) => p.lat ?? 0).filter(Boolean));
    const maxLat = Math.max(...properties.map((p) => p.lat ?? 0).filter(Boolean));
    const minLng = Math.min(...properties.map((p) => p.lng ?? 0).filter(Boolean));
    const maxLng = Math.max(...properties.map((p) => p.lng ?? 0).filter(Boolean));
    return { minLat, maxLat, minLng, maxLng };
  }, [properties]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-100 bg-slate-100 h-[600px]">
      {/* Stylized map background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-blue-50 to-emerald-50">
        <svg className="w-full h-full opacity-40" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
          {/* Roads */}
          <line x1="0" y1="200" x2="800" y2="200" stroke="#cbd5e1" strokeWidth="3" />
          <line x1="0" y1="400" x2="800" y2="400" stroke="#cbd5e1" strokeWidth="3" />
          <line x1="200" y1="0" x2="200" y2="600" stroke="#cbd5e1" strokeWidth="3" />
          <line x1="500" y1="0" x2="500" y2="600" stroke="#cbd5e1" strokeWidth="3" />
          <line x1="0" y1="100" x2="800" y2="100" stroke="#e2e8f0" strokeWidth="2" />
          <line x1="0" y1="500" x2="800" y2="500" stroke="#e2e8f0" strokeWidth="2" />
          <line x1="350" y1="0" x2="350" y2="600" stroke="#e2e8f0" strokeWidth="2" />
          <line x1="650" y1="0" x2="650" y2="600" stroke="#e2e8f0" strokeWidth="2" />
          {/* Water area */}
          <path d="M 600 400 Q 700 450 800 500 L 800 600 L 600 600 Z" fill="#bfdbfe" opacity="0.5" />
          {/* Parks */}
          <rect x="220" y="220" width="120" height="80" rx="8" fill="#bbf7d0" opacity="0.5" />
          <rect x="520" y="120" width="100" height="60" rx="8" fill="#bbf7d0" opacity="0.5" />
        </svg>
      </div>

      {/* Map pins */}
      {properties.map((p) => {
        if (!p.lat || !p.lng) return null;
        const x = ((p.lng - pins.minLng) / (pins.maxLng - pins.minLng || 1)) * 85 + 7;
        const y = ((pins.maxLat - p.lat) / (pins.maxLat - pins.minLat || 1)) * 85 + 7;
        const isSelected = selectedPin === p.id;
        return (
          <button
            key={p.id}
            onClick={() => onSelectPin(p.id)}
            className={`absolute -translate-x-1/2 -translate-y-full transition-all z-10 ${isSelected ? 'z-20 scale-125' : 'hover:scale-110'}`}
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <div className={`px-3 py-1.5 rounded-full shadow-lg font-semibold text-xs whitespace-nowrap transition-all ${
              isSelected ? 'bg-primary-700 text-white' : 'bg-white text-slate-800 border-2 border-primary-500'
            }`}>
              {formatPrice(p.price, p.listing_status).replace('/mo', '')}
            </div>
            <div className={`w-3 h-3 mx-auto -mt-1 rotate-45 ${isSelected ? 'bg-primary-700' : 'bg-white border-2 border-primary-500'}`} />
          </button>
        );
      })}

      {/* Selected property card */}
      {selected && (
        <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-96 bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in z-30">
          {selected.images?.[0] && (
            <img src={selected.images[0].image_url} alt="" className="w-full h-40 object-cover cursor-pointer" onClick={() => navigate({ name: 'property', id: selected.id })} />
          )}
          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-xl font-bold text-slate-900">{formatPrice(selected.price, selected.listing_status)}</p>
              <button onClick={() => onSelectPin(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <h3 className="font-semibold text-slate-800 mb-1 line-clamp-1">{selected.title}</h3>
            <p className="text-sm text-slate-500 flex items-center gap-1 mb-3">
              <MapPin className="w-3.5 h-3.5" /> {selected.neighborhood}, {selected.city}
            </p>
            <div className="flex items-center gap-3 text-sm text-slate-600 mb-3">
              {selected.bedrooms > 0 && <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" /> {selected.bedrooms}</span>}
              {selected.bathrooms > 0 && <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {selected.bathrooms}</span>}
              <span className="flex items-center gap-1"><Maximize className="w-3.5 h-3.5" /> {formatArea(selected.area)}</span>
            </div>
            <button
              onClick={() => navigate({ name: 'property', id: selected.id })}
              className="w-full py-2.5 bg-primary-600 text-white rounded-xl font-medium text-sm hover:bg-primary-700 transition-colors"
            >
              View Details
            </button>
          </div>
        </div>
      )}

      {/* Nearby info */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md rounded-xl p-3 shadow-lg">
        <p className="text-xs font-semibold text-slate-700 mb-2">Nearby Amenities</p>
        <div className="flex flex-col gap-1.5 text-xs text-slate-600">
          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-400" /> Schools</span>
          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-400" /> Hospitals</span>
          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-400" /> Restaurants</span>
          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-accent-500" /> Transport</span>
        </div>
      </div>
    </div>
  );
}
