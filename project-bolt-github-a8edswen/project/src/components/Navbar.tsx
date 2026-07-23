import { useState, useEffect } from 'react';
import { Building2, Heart, Menu, X, User, LogOut, LayoutDashboard, Briefcase } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';
import { useFavorites } from '@/context/FavoritesContext';

export default function Navbar() {
  const { profile, signOut } = useAuth();
  const { route, navigate } = useRouter();
  const { favorites, compareList } = useFavorites();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems = [
    { label: 'Home', action: () => navigate({ name: 'home' }) },
    { label: 'Browse', action: () => navigate({ name: 'search' }) },
    { label: 'Favorites', action: () => navigate({ name: 'favorites' }) },
    { label: 'Compare', action: () => navigate({ name: 'compare' }) },
  ];

  const dashboardLink = () => {
    if (profile?.role === 'agent') return { label: 'Agent Panel', route: { name: 'agent-dashboard' } as const, icon: Briefcase };
    return { label: 'Dashboard', route: { name: 'dashboard' } as const, icon: LayoutDashboard };
  };

  const dash = dashboardLink();

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass shadow-lg shadow-slate-200/50' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <button onClick={() => navigate({ name: 'home' })} className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shadow-lg shadow-primary-600/30 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className={`font-bold text-xl transition-colors ${scrolled ? 'text-slate-900' : 'text-white'}`}>
              Estate<span className="text-primary-500">Pro</span>
            </span>
          </button>

          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all hover:bg-white/10 ${
                  scrolled ? 'text-slate-700 hover:text-primary-600' : 'text-white/90 hover:text-white'
                }`}
              >
                {item.label}
                {item.label === 'Favorites' && favorites.length > 0 && (
                  <span className="ml-1 text-xs bg-primary-600 text-white px-1.5 py-0.5 rounded-full">{favorites.length}</span>
                )}
                {item.label === 'Compare' && compareList.length > 0 && (
                  <span className="ml-1 text-xs bg-accent-600 text-white px-1.5 py-0.5 rounded-full">{compareList.length}</span>
                )}
              </button>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            {profile ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenu(!userMenu)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all hover:bg-white/10 ${
                    scrolled ? 'text-slate-700' : 'text-white'
                  }`}
                >
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-semibold">
                      {profile.full_name.charAt(0)}
                    </div>
                  )}
                  <span className="text-sm font-medium max-w-[120px] truncate">{profile.full_name}</span>
                </button>
                {userMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenu(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-scale-in">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-900 truncate">{profile.full_name}</p>
                        <p className="text-xs text-slate-500 truncate">{profile.email}</p>
                      </div>
                      <button
                        onClick={() => { setUserMenu(false); navigate(dash.route); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <dash.icon className="w-4 h-4" /> {dash.label}
                      </button>
                      <button
                        onClick={() => { setUserMenu(false); navigate({ name: 'favorites' }); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <Heart className="w-4 h-4" /> Favorites
                      </button>
                      <button
                        onClick={async () => { setUserMenu(false); await signOut(); navigate({ name: 'home' }); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate({ name: 'auth' })}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl font-medium text-sm hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/30"
              >
                <User className="w-4 h-4" /> Sign In
              </button>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`lg:hidden p-2 ${scrolled ? 'text-slate-900' : 'text-white'}`}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="lg:hidden glass border-t border-slate-200 py-4 animate-fade-in">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => { item.action(); setMobileOpen(false); }}
                className="w-full text-left px-4 py-3 text-slate-700 hover:bg-slate-50 rounded-lg font-medium"
              >
                {item.label}
              </button>
            ))}
            {profile ? (
              <>
                <button
                  onClick={() => { navigate(dash.route); setMobileOpen(false); }}
                  className="w-full text-left px-4 py-3 text-slate-700 hover:bg-slate-50 rounded-lg font-medium flex items-center gap-2"
                >
                  <dash.icon className="w-4 h-4" /> {dash.label}
                </button>
                <button
                  onClick={async () => { await signOut(); setMobileOpen(false); navigate({ name: 'home' }); }}
                  className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => { navigate({ name: 'auth' }); setMobileOpen(false); }}
                className="w-full text-left px-4 py-3 text-primary-600 hover:bg-primary-50 rounded-lg font-medium"
              >
                Sign In
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
