import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Route =
  | { name: 'home' }
  | { name: 'search'; filters?: Record<string, unknown> }
  | { name: 'property'; id: string }
  | { name: 'auth' }
  | { name: 'favorites' }
  | { name: 'compare' }
  | { name: 'dashboard' }
  | { name: 'agent-dashboard' }
  | { name: 'secret-admin' }
  | { name: 'admin-dashboard' };

interface RouterContextValue {
  route: Route;
  navigate: (route: Route) => void;
}

const RouterContext = createContext<RouterContextValue | undefined>(undefined);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>({ name: 'home' });

  const navigate = (newRoute: Route) => {
    setRoute(newRoute);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#admin-access') {
        setRoute({ name: 'secret-admin' });
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  useEffect(() => {
    const handlePop = () => setRoute({ name: 'home' });
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  return <RouterContext.Provider value={{ route, navigate }}>{children}</RouterContext.Provider>;
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}
