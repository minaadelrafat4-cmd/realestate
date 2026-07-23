import { SlidersHorizontal, X, Bed, Bath, Maximize, Car, Waves, Trees, Building, CheckCircle2, Sofa } from 'lucide-react';
import type { SearchFilters } from '@/types';
import { CITIES, NEIGHBORHOODS, PROPERTY_TYPES } from '@/lib/utils';

interface Props {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  onReset: () => void;
}

export default function FilterPanel({ filters, onChange, onReset }: Props) {
  const update = (key: keyof SearchFilters, value: unknown) => {
    onChange({ ...filters, [key]: value });
  };

  const neighborhoods = filters.city ? NEIGHBORHOODS[filters.city] ?? [] : [];

  const toggleFeature = (key: keyof SearchFilters) => {
    update(key, !filters[key]);
  };

  const FeatureToggle = ({ icon: Icon, label, field }: { icon: React.ElementType; label: string; field: keyof SearchFilters }) => (
    <button
      onClick={() => toggleFeature(field)}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
        filters[field]
          ? 'border-primary-500 bg-primary-50 text-primary-700'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
      }`}
    >
      <Icon className="w-4 h-4" /> {label}
    </button>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sticky top-24">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-primary-600" /> Filters
        </h3>
        <button onClick={onReset} className="text-sm text-slate-500 hover:text-red-500 transition-colors flex items-center gap-1">
          <X className="w-4 h-4" /> Reset
        </button>
      </div>

      <div className="space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto pr-1 no-scrollbar">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">City</label>
          <select
            value={filters.city ?? ''}
            onChange={(e) => onChange({ ...filters, city: e.target.value, neighborhood: '' })}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm"
          >
            <option value="">All Cities</option>
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {neighborhoods.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Neighborhood</label>
            <select
              value={filters.neighborhood ?? ''}
              onChange={(e) => update('neighborhood', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm"
            >
              <option value="">All Neighborhoods</option>
              {neighborhoods.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Property Type</label>
          <div className="grid grid-cols-2 gap-2">
            {PROPERTY_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => update('propertyType', filters.propertyType === t ? '' : t)}
                className={`px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                  filters.propertyType === t
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Listing Status</label>
          <div className="grid grid-cols-2 gap-2">
            {['For Sale', 'For Rent'].map((s) => (
              <button
                key={s}
                onClick={() => update('listingStatus', filters.listingStatus === s ? '' : s)}
                className={`px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                  filters.listingStatus === s
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Price Range</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.minPrice ?? ''}
              onChange={(e) => update('minPrice', e.target.value ? Number(e.target.value) : undefined)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.maxPrice ?? ''}
              onChange={(e) => update('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <Bed className="w-4 h-4" /> Bedrooms
          </label>
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => update('bedrooms', filters.bedrooms === n ? undefined : n)}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                  filters.bedrooms === n
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                {n === 0 ? 'Any' : `${n}+`}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <Bath className="w-4 h-4" /> Bathrooms
          </label>
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => update('bathrooms', filters.bathrooms === n ? undefined : n)}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                  filters.bathrooms === n
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                {n === 0 ? 'Any' : `${n}+`}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <Maximize className="w-4 h-4" /> Min Area (m²)
          </label>
          <input
            type="number"
            placeholder="Any"
            value={filters.minArea ?? ''}
            onChange={(e) => update('minArea', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Features</label>
          <div className="flex flex-wrap gap-2">
            <FeatureToggle icon={Sofa} label="Furnished" field="furnished" />
            <FeatureToggle icon={Car} label="Parking" field="parking" />
            <FeatureToggle icon={Waves} label="Pool" field="swimmingPool" />
            <FeatureToggle icon={Trees} label="Garden" field="garden" />
            <FeatureToggle icon={Building} label="Balcony" field="balcony" />
            <FeatureToggle icon={CheckCircle2} label="Ready to Move" field="readyToMove" />
          </div>
        </div>
      </div>
    </div>
  );
}
