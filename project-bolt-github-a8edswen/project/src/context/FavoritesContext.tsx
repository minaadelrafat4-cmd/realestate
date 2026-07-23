import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface FavoritesContextValue {
  favorites: string[];
  compareList: string[];
  toggleFavorite: (propertyId: string) => Promise<void>;
  isFavorite: (propertyId: string) => boolean;
  toggleCompare: (propertyId: string) => void;
  isInCompare: (propertyId: string) => boolean;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setFavorites([]);
      return;
    }
    setLoading(true);
    supabase
      .from('favorites')
      .select('property_id')
      .eq('user_id', user.id)
      .then(({ data, error }) => {
        if (!error && data) {
          setFavorites(data.map((f) => f.property_id));
        }
        setLoading(false);
      });
  }, [user]);

  const toggleFavorite = async (propertyId: string) => {
    if (!user) return;
    if (favorites.includes(propertyId)) {
      setFavorites((prev) => prev.filter((id) => id !== propertyId));
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('property_id', propertyId);
    } else {
      setFavorites((prev) => [...prev, propertyId]);
      await supabase.from('favorites').insert({ user_id: user.id, property_id: propertyId });
    }
  };

  const isFavorite = (propertyId: string) => favorites.includes(propertyId);

  const toggleCompare = (propertyId: string) => {
    setCompareList((prev) => {
      if (prev.includes(propertyId)) return prev.filter((id) => id !== propertyId);
      if (prev.length >= 4) return prev;
      return [...prev, propertyId];
    });
  };

  const isInCompare = (propertyId: string) => compareList.includes(propertyId);

  return (
    <FavoritesContext.Provider
      value={{ favorites, compareList, toggleFavorite, isFavorite, toggleCompare, isInCompare, loading }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
