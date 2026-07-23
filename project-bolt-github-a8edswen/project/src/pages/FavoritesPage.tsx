import { useEffect, useState } from 'react';
import { Heart, GitCompare, X, Bed, Bath, Maximize, MapPin, Trash2, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useRouter } from '@/context/RouterContext';
import PropertyCard from '@/components/PropertyCard';
import { formatPrice, formatArea } from '@/lib/utils';
import type { Property } from '@/types';

export default function FavoritesPage() {
  const { user } = useAuth();
  const { favorites, compareList, toggleFavorite, toggleCompare } = useFavorites();
  const { navigate } = useRouter();
  const [favProperties, setFavProperties] = useState<Property[]>([]);
  const [compareProperties, setCompareProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      favorites.length > 0
        ? supabase.from('properties').select('*, agent:profiles(*), images:property_images(*)').in('id', favorites)
        : Promise.resolve({ data: [] }),
      compareList.length > 0
        ? supabase.from('properties').select('*, agent:profiles(*), images:property_images(*)').in('id', compareList)
        : Promise.resolve({ data: [] }),
    ]).then(([fav, comp]) => {
      setFavProperties((fav.data ?? []) as Property[]);
      setCompareProperties((comp.data ?? []) as Property[]);
      setLoading(false);
    });
  }, [favorites, compareList, user]);

  if (!user) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Heart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-xl font-semibold text-slate-900 mb-2">Sign in to view favorites</p>
          <button onClick={() => navigate({ name: 'auth' })} className="text-primary-600 font-medium">Sign In</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 lg:pt-20 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Favorites */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Heart className="w-6 h-6 text-red-500" />
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">My Favorites</h1>
            <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-sm font-medium">{favProperties.length}</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="aspect-[4/3] rounded-2xl skeleton" />)}
            </div>
          ) : favProperties.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
              <Heart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No favorites yet</h3>
              <p className="text-slate-500 text-sm mb-4">Browse properties and tap the heart icon to save them here</p>
              <button onClick={() => navigate({ name: 'search' })} className="px-5 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors">
                Browse Properties
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favProperties.map((p, i) => (
                <PropertyCard key={p.id} property={p} index={i} />
              ))}
            </div>
          )}
        </section>

        {/* Compare */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <GitCompare className="w-6 h-6 text-primary-600" />
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Compare Properties</h1>
            <span className="px-2.5 py-1 rounded-full bg-primary-50 text-primary-600 text-sm font-medium">{compareProperties.length}</span>
          </div>

          {compareProperties.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
              <GitCompare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Nothing to compare yet</h3>
              <p className="text-slate-500 text-sm mb-4">Add up to 4 properties to compare side by side</p>
              <button onClick={() => navigate({ name: 'search' })} className="px-5 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors">
                Browse Properties
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="p-4 text-left text-sm font-semibold text-slate-700 min-w-[150px]">Property</th>
                      {compareProperties.map((p) => (
                        <th key={p.id} className="p-4 min-w-[220px]">
                          <div className="relative">
                            <button onClick={() => toggleCompare(p.id)} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center z-10">
                              <X className="w-3.5 h-3.5" />
                            </button>
                            {p.images?.[0] && (
                              <img src={p.images[0].image_url} alt="" className="w-full h-32 object-cover rounded-xl cursor-pointer" onClick={() => navigate({ name: 'property', id: p.id })} />
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Title', key: 'title' },
                      { label: 'Price', render: (p: Property) => formatPrice(p.price, p.listing_status) },
                      { label: 'Type', key: 'property_type' },
                      { label: 'Status', key: 'listing_status' },
                      { label: 'City', key: 'city' },
                      { label: 'Neighborhood', key: 'neighborhood' },
                      { label: 'Bedrooms', key: 'bedrooms' },
                      { label: 'Bathrooms', key: 'bathrooms' },
                      { label: 'Area', render: (p: Property) => formatArea(p.area) },
                      { label: 'Floor', key: 'floor' },
                      { label: 'Year Built', key: 'year_built' },
                      { label: 'Furnished', render: (p: Property) => p.furnished ? 'Yes' : 'No' },
                      { label: 'Parking', render: (p: Property) => p.parking ? 'Yes' : 'No' },
                      { label: 'Pool', render: (p: Property) => p.swimming_pool ? 'Yes' : 'No' },
                      { label: 'Garden', render: (p: Property) => p.garden ? 'Yes' : 'No' },
                      { label: 'Balcony', render: (p: Property) => p.balcony ? 'Yes' : 'No' },
                    ].map((row) => (
                      <tr key={row.label} className="border-t border-slate-100">
                        <td className="p-4 text-sm font-medium text-slate-500">{row.label}</td>
                        {compareProperties.map((p) => (
                          <td key={p.id} className="p-4 text-sm text-slate-700">
                            {row.render ? row.render(p) : String((p as unknown as Record<string, unknown>)[row.key as string] ?? '—')}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr className="border-t border-slate-100">
                      <td className="p-4"></td>
                      {compareProperties.map((p) => (
                        <td key={p.id} className="p-4">
                          <button onClick={() => navigate({ name: 'property', id: p.id })} className="flex items-center gap-1 text-primary-600 font-medium text-sm hover:gap-2 transition-all">
                            View <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
