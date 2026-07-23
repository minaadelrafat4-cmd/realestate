import { AuthProvider } from '@/context/AuthContext';
import { RouterProvider, useRouter } from '@/context/RouterContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HomePage from '@/pages/HomePage';
import SearchPage from '@/pages/SearchPage';
import PropertyDetailsPage from '@/pages/PropertyDetailsPage';
import AuthPage from '@/pages/AuthPage';
import FavoritesPage from '@/pages/FavoritesPage';
import CustomerDashboard from '@/pages/CustomerDashboard';
import AgentDashboard from '@/pages/AgentDashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import SecretAdminPage from '@/pages/SecretAdminPage';

function AppContent() {
  const { route } = useRouter();

  const showChrome = route.name !== 'auth' && route.name !== 'secret-admin';

  return (
    <div className="min-h-screen bg-white">
      {showChrome && <Navbar />}
      <main>
        {route.name === 'home' && <HomePage />}
        {route.name === 'search' && <SearchPage />}
        {route.name === 'property' && <PropertyDetailsPage propertyId={route.id} />}
        {route.name === 'auth' && <AuthPage />}
        {route.name === 'favorites' && <FavoritesPage />}
        {route.name === 'compare' && <FavoritesPage />}
        {route.name === 'dashboard' && <CustomerDashboard />}
        {route.name === 'agent-dashboard' && <AgentDashboard />}
        {route.name === 'secret-admin' && <SecretAdminPage />}
        {route.name === 'admin-dashboard' && <AdminDashboard />}
      </main>
      {showChrome && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <FavoritesProvider>
          <AppContent />
        </FavoritesProvider>
      </RouterProvider>
    </AuthProvider>
  );
}
