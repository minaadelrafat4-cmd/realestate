import { useEffect, useState } from 'react';
import { ArrowRight, TrendingUp, Home as HomeIcon, Users, Star, MapPin, Quote, Building2, Briefcase, Trees, LandPlot, Mail, Phone, Clock } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import PropertyCard from '@/components/PropertyCard';
import { useRouter } from '@/context/RouterContext';
import { supabase } from '@/lib/supabase';
import { detectSqlInjection } from '@/lib/security';
import type { Property, Profile, Testimonial } from '@/types';

export default function HomePage() {
  const { navigate } = useRouter();
  const [featured, setFeatured] = useState<Property[]>([]);
  const [latest, setLatest] = useState<Property[]>([]);
  const [agents, setAgents] = useState<Profile[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [stats, setStats] = useState({ properties: 0, agents: 0, sold: 0, clients: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('properties').select('*, agent:profiles(*)').eq('featured', true).eq('approved', true).limit(6),
      supabase.from('properties').select('*, agent:profiles(*)').eq('approved', true).order('created_at', { ascending: false }).limit(6),
      supabase.from('profiles').select('*').eq('role', 'agent').eq('verified', true),
      supabase.from('testimonials').select('*').limit(5),
      supabase.from('properties').select('id, is_sold'),
    ]).then(([feat, lat, agt, test, all]) => {
      setFeatured((feat.data ?? []) as Property[]);
      setLatest((lat.data ?? []) as Property[]);
      setAgents((agt.data ?? []) as Profile[]);
      setTestimonials((test.data ?? []) as Testimonial[]);
      const allProps = all.data ?? [];
      setStats({
        properties: allProps.length,
        agents: agt.data?.length ?? 0,
        sold: allProps.filter((p: { is_sold: boolean }) => p.is_sold).length,
        clients: 8500,
      });
      setLoading(false);
    });
  }, []);

  const categories = [
    { type: 'Apartment', icon: Building2, count: '2.4k+ listings', color: 'from-blue-500 to-blue-700' },
    { type: 'Villa', icon: HomeIcon, count: '890+ listings', color: 'from-emerald-500 to-emerald-700' },
    { type: 'Office', icon: Briefcase, count: '560+ listings', color: 'from-amber-500 to-amber-700' },
    { type: 'Land', icon: LandPlot, count: '320+ listings', color: 'from-rose-500 to-rose-700' },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/302769/pexels-photo-302769.jpeg?auto=compress&cs=tinysrgb&w=1920"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/50 to-slate-900/80" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
          <div className="animate-fade-in">
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white/90 text-sm font-medium mb-6 border border-white/20">
              #1 Real Estate Platform
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 text-balance leading-tight">
              Find Your Dream<br />
              <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                Property Today
              </span>
            </h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto mb-10 text-balance">
              Discover thousands of premium properties with our advanced search. Filter by location, price, amenities, and more.
            </p>
          </div>

          <div className="flex justify-center animate-fade-in" style={{ animationDelay: '200ms' }}>
            <SearchBar />
          </div>

          <div className="flex flex-wrap justify-center gap-8 mt-12 text-white">
            {[
              { label: 'Active Listings', value: stats.properties, icon: HomeIcon },
              { label: 'Properties Sold', value: stats.sold, icon: TrendingUp },
              { label: 'Happy Clients', value: stats.clients, icon: Users },
              { label: 'Expert Agents', value: stats.agents, icon: Briefcase },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-xl bg-white/10 backdrop-blur-md">
                  <s.icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-2xl font-bold">{s.value.toLocaleString()}+</p>
                <p className="text-sm text-white/60">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 to-transparent" />
      </section>

      {/* Categories */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-3">Browse by Category</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Explore our diverse range of property types tailored to your needs</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat, i) => (
              <button
                key={cat.type}
                onClick={() => navigate({ name: 'search', filters: { propertyType: cat.type } })}
                className="group relative overflow-hidden rounded-2xl bg-white p-8 text-center shadow-sm hover:shadow-xl transition-all hover-lift animate-fade-in border border-slate-100"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                  <cat.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-1">{cat.type}</h3>
                <p className="text-sm text-slate-500">{cat.count}</p>
                <ArrowRight className="w-5 h-5 text-primary-500 mx-auto mt-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-primary-600 font-semibold text-sm uppercase tracking-wide">Featured</span>
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mt-1">Featured Properties</h2>
            </div>
            <button
              onClick={() => navigate({ name: 'search' })}
              className="flex items-center gap-2 text-primary-600 font-medium hover:gap-3 transition-all"
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[4/3] rounded-2xl skeleton" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((p, i) => (
                <PropertyCard key={p.id} property={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Agents */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-primary-400 font-semibold text-sm uppercase tracking-wide">Our Team</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mt-1">Featured Agents</h2>
            <p className="text-slate-400 max-w-xl mx-auto mt-3">Meet our expert agents dedicated to helping you find the perfect property</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent, i) => (
              <div
                key={agent.id}
                className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 hover:border-primary-500/50 transition-all animate-fade-in"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-center gap-4 mb-4">
                  {agent.avatar_url ? (
                    <img src={agent.avatar_url} alt="" className="w-16 h-16 rounded-2xl object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center text-white text-xl font-bold">
                      {agent.full_name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-white text-lg flex items-center gap-2">
                      {agent.full_name}
                      {agent.verified && (
                        <span className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-slate-400">{agent.agency}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-400 line-clamp-2 mb-4">{agent.specialization}</p>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <MapPin className="w-4 h-4" /> {agent.bio.split(' ').slice(-3).join(' ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Properties */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-primary-600 font-semibold text-sm uppercase tracking-wide">Just Listed</span>
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mt-1">Latest Properties</h2>
            </div>
            <button
              onClick={() => navigate({ name: 'search' })}
              className="flex items-center gap-2 text-primary-600 font-medium hover:gap-3 transition-all"
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[4/3] rounded-2xl skeleton" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {latest.map((p, i) => (
                <PropertyCard key={p.id} property={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-primary-600 font-semibold text-sm uppercase tracking-wide">Testimonials</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mt-1">What Our Clients Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div
                key={t.id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative animate-fade-in"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <Quote className="w-10 h-10 text-primary-100 absolute top-6 right-6" />
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 relative z-10">"{t.content}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  {t.avatar_url ? (
                    <img src={t.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover" />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">
                      {t.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Map Preview */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-primary-600 font-semibold text-sm uppercase tracking-wide">Explore</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mt-1">Find Properties on the Map</h2>
            <p className="text-slate-500 max-w-xl mx-auto mt-3">Browse listings geographically and discover what's nearby</p>
          </div>
          <button
            onClick={() => navigate({ name: 'search' })}
            className="block w-full relative rounded-3xl overflow-hidden group h-[400px] shadow-xl"
          >
            <img
              src="https://images.pexels.com/photos/2246476/pexels-photo-2246476.jpeg?auto=compress&cs=tinysrgb&w=1920"
              alt="Map"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex items-end justify-center pb-12">
              <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-xl shadow-lg group-hover:gap-4 transition-all">
                <MapPin className="w-5 h-5 text-primary-600" />
                <span className="font-semibold text-slate-900">Open Interactive Map</span>
                <ArrowRight className="w-5 h-5 text-primary-600" />
              </div>
            </div>
            {/* Floating pins */}
            <div className="absolute top-1/4 left-1/3 w-8 h-8 rounded-full bg-primary-600 border-4 border-white shadow-lg animate-bounce" style={{ animationDuration: '2s' }} />
            <div className="absolute top-1/3 right-1/4 w-8 h-8 rounded-full bg-accent-600 border-4 border-white shadow-lg animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
            <div className="absolute bottom-1/3 left-1/2 w-8 h-8 rounded-full bg-amber-500 border-4 border-white shadow-lg animate-bounce" style={{ animationDuration: '3s' }} />
          </button>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-primary-400 font-semibold text-sm uppercase tracking-wide">Get in Touch</span>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mt-1 mb-4">Have Questions? We're Here to Help</h2>
              <p className="text-slate-400 mb-8">Whether you're buying, selling, or renting, our team is ready to assist you every step of the way.</p>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-600/20 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Call Us</p>
                    <p className="text-white font-semibold">+1 (555) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-600/20 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Email Us</p>
                    <p className="text-white font-semibold">contact@estatepro.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-600/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Office Hours</p>
                    <p className="text-white font-semibold">Mon - Sat: 9AM - 7PM</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50">
              <form onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const inputs = form.querySelectorAll('input, textarea');
                const values = Array.from(inputs).map((i) => (i as HTMLInputElement).value);
                if (values.some((v) => detectSqlInjection(v))) {
                  alert('Invalid input detected. Please check your message.');
                  return;
                }
                alert('Message sent! We will get back to you soon.');
                form.reset();
              }} className="space-y-4">
                <input type="text" placeholder="Your Name" required className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder-slate-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm" />
                <input type="email" placeholder="Your Email" required className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder-slate-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm" />
                <input type="text" placeholder="Subject" className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder-slate-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm" />
                <textarea placeholder="Your Message" rows={4} required className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder-slate-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm resize-none" />
                <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-primary-600/30 transition-all">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
