import { Building2, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { useRouter } from '@/context/RouterContext';

export default function Footer() {
  const { navigate } = useRouter();

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-white">Estate<span className="text-primary-400">Pro</span></span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Your trusted partner in finding the perfect property. Browse thousands of listings with powerful search tools.
            </p>
            <div className="flex gap-3">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-primary-600 flex items-center justify-center transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => navigate({ name: 'home' })} className="hover:text-primary-400 transition-colors">Home</button></li>
              <li><button onClick={() => navigate({ name: 'search' })} className="hover:text-primary-400 transition-colors">Browse Properties</button></li>
              <li><button onClick={() => navigate({ name: 'favorites' })} className="hover:text-primary-400 transition-colors">Favorites</button></li>
              <li><button onClick={() => navigate({ name: 'compare' })} className="hover:text-primary-400 transition-colors">Compare</button></li>
              <li><button onClick={() => navigate({ name: 'auth' })} className="hover:text-primary-400 transition-colors">Sign In</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Categories</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => navigate({ name: 'search', filters: { propertyType: 'Apartment' } })} className="hover:text-primary-400 transition-colors">Apartments</button></li>
              <li><button onClick={() => navigate({ name: 'search', filters: { propertyType: 'Villa' } })} className="hover:text-primary-400 transition-colors">Villas</button></li>
              <li><button onClick={() => navigate({ name: 'search', filters: { propertyType: 'Office' } })} className="hover:text-primary-400 transition-colors">Offices</button></li>
              <li><button onClick={() => navigate({ name: 'search', filters: { propertyType: 'Commercial' } })} className="hover:text-primary-400 transition-colors">Commercial</button></li>
              <li><button onClick={() => navigate({ name: 'search', filters: { propertyType: 'Land' } })} className="hover:text-primary-400 transition-colors">Land</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-primary-400 flex-shrink-0" />
                <span>123 Real Estate Ave, New York, NY 10001</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-primary-400 flex-shrink-0" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-primary-400 flex-shrink-0" />
                <span>contact@estatepro.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">© 2026 EstatePro. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-primary-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary-400 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary-400 transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
