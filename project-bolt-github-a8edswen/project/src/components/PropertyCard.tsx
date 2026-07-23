import { Bed, Bath, Maximize, MapPin, Heart, GitCompare, Play, Eye, CheckCircle2 } from 'lucide-react';
import type { Property } from '@/types';
import { formatPrice, formatArea } from '@/lib/utils';
import { useRouter } from '@/context/RouterContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

interface Props {
  property: Property;
  index?: number;
}

export default function PropertyCard({ property, index = 0 }: Props) {
  const { navigate } = useRouter();
  const { toggleFavorite, isFavorite, toggleCompare, isInCompare } = useFavorites();
  const { user } = useAuth();
  const [imgLoaded, setImgLoaded] = useState(false);

  const primaryImage = property.images?.find((i) => i.is_primary) ?? property.images?.[0];
  const fav = isFavorite(property.id);
  const comparing = isInCompare(property.id);

  const handleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate({ name: 'auth' });
      return;
    }
    toggleFavorite(property.id);
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleCompare(property.id);
  };

  return (
    <div
      onClick={() => navigate({ name: 'property', id: property.id })}
      className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-slate-300/40 transition-all duration-300 hover-lift border border-slate-100 animate-fade-in"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {!imgLoaded && <div className="absolute inset-0 skeleton" />}
        {primaryImage && (
          <img
            src={primaryImage.image_url}
            alt={property.title}
            onLoad={() => setImgLoaded(true)}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${
              imgLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md ${
            property.listing_status === 'For Sale' ? 'bg-primary-600/90 text-white' : 'bg-accent-600/90 text-white'
          }`}>
            {property.listing_status}
          </span>
          {property.featured && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/90 text-white backdrop-blur-md">
              Featured
            </span>
          )}
        </div>

        <div className="absolute top-3 right-3 flex gap-2">
          <button
            onClick={handleFav}
            className={`w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 ${
              fav ? 'bg-red-500 text-white' : 'bg-white/80 text-slate-700 hover:bg-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${fav ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={handleCompare}
            className={`w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 ${
              comparing ? 'bg-primary-600 text-white' : 'bg-white/80 text-slate-700 hover:bg-white'
            }`}
          >
            <GitCompare className="w-4 h-4" />
          </button>
        </div>

        <div className="absolute bottom-3 left-3 flex gap-2">
          {property.has_virtual_tour && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-black/60 text-white backdrop-blur-md flex items-center gap-1">
              <Eye className="w-3 h-3" /> 360°
            </span>
          )}
          {property.has_video && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-black/60 text-white backdrop-blur-md flex items-center gap-1">
              <Play className="w-3 h-3" /> Video
            </span>
          )}
          {property.ready_to_move && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-accent-600/80 text-white backdrop-blur-md flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Ready
            </span>
          )}
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-2xl font-bold text-slate-900">
            {formatPrice(property.price, property.listing_status, property.currency)}
          </p>
        </div>

        <h3 className="font-semibold text-slate-800 text-lg leading-snug mb-2 line-clamp-1 group-hover:text-primary-600 transition-colors">
          {property.title}
        </h3>

        <p className="text-sm text-slate-500 flex items-center gap-1.5 mb-4">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="line-clamp-1">{property.neighborhood}, {property.city}</span>
        </p>

        <div className="flex items-center gap-4 text-sm text-slate-600 pt-4 border-t border-slate-100">
          {property.property_type !== 'Land' && property.bedrooms > 0 && (
            <span className="flex items-center gap-1.5">
              <Bed className="w-4 h-4 text-primary-500" /> {property.bedrooms}
            </span>
          )}
          {property.property_type !== 'Land' && property.bathrooms > 0 && (
            <span className="flex items-center gap-1.5">
              <Bath className="w-4 h-4 text-primary-500" /> {property.bathrooms}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Maximize className="w-4 h-4 text-primary-500" /> {formatArea(property.area)}
          </span>
          <span className="ml-auto text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">
            {property.property_type}
          </span>
        </div>
      </div>
    </div>
  );
}
