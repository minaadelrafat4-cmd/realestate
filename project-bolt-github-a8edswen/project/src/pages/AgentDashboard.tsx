import { useEffect, useState } from 'react';
import { Plus, Edit3, Trash2, Eye, CheckCircle2, X, Building2, TrendingUp, Calendar, DollarSign, BarChart3, Home, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';
import { formatPrice, PROPERTY_TYPES, CITIES, NEIGHBORHOODS } from '@/lib/utils';
import { sanitizeText, sanitizeNumber, detectSqlInjection, RateLimiter } from '@/lib/security';
import type { Property, Appointment, PropertyType, ListingStatus } from '@/types';

const listingRateLimiter = new RateLimiter(3000);

export default function AgentDashboard() {
  const { user, profile } = useAuth();
  const { navigate } = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProp, setEditingProp] = useState<Property | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [tab, setTab] = useState<'listings' | 'appointments' | 'stats'>('listings');

  const emptyForm = {
    title: '', description: '', price: 0, property_type: 'Apartment' as PropertyType,
    listing_status: 'For Sale' as ListingStatus, city: '', neighborhood: '', address: '',
    bedrooms: 0, bathrooms: 0, area: 0, floor: 0, year_built: new Date().getFullYear(),
    furnished: false, parking: false, swimming_pool: false, garden: false, balcony: false,
    ready_to_move: false, has_video: false, has_virtual_tour: false, featured: false,
    lat: 0, lng: 0,
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    Promise.all([
      supabase.from('properties').select('*, images:property_images(*)').eq('agent_id', user.id).order('created_at', { ascending: false }),
      supabase.from('appointments').select('*, property:properties(*), user:profiles(*)').eq('agent_id', user.id).order('date', { ascending: false }),
    ]).then(([props, appts]) => {
      setProperties((props.data ?? []) as Property[]);
      setAppointments((appts.data ?? []) as Appointment[]);
      setLoading(false);
    });
  }, [user]);

  if (!user || (profile?.role !== 'agent' && profile?.role !== 'admin')) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold text-slate-900 mb-2">Agent access required</p>
          <button onClick={() => navigate({ name: 'auth' })} className="text-primary-600 font-medium">Sign in as agent</button>
        </div>
      </div>
    );
  }

  const openCreate = () => {
    setEditingProp(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (p: Property) => {
    setEditingProp(p);
    setForm({
      title: p.title, description: p.description, price: p.price, property_type: p.property_type,
      listing_status: p.listing_status, city: p.city, neighborhood: p.neighborhood, address: p.address,
      bedrooms: p.bedrooms, bathrooms: p.bathrooms, area: p.area, floor: p.floor, year_built: p.year_built ?? new Date().getFullYear(),
      furnished: p.furnished, parking: p.parking, swimming_pool: p.swimming_pool, garden: p.garden, balcony: p.balcony,
      ready_to_move: p.ready_to_move, has_video: p.has_video, has_virtual_tour: p.has_virtual_tour, featured: p.featured,
      lat: p.lat ?? 0, lng: p.lng ?? 0,
    });
    setShowForm(true);
  };

  const saveProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setFormError(null);

    if (detectSqlInjection(form.title) || detectSqlInjection(form.description) || detectSqlInjection(form.address)) {
      setFormError('Invalid characters detected in the form. Please review your input.');
      return;
    }
    if (!listingRateLimiter.canProceed(user.id)) {
      setFormError('Please wait a few seconds before submitting again.');
      return;
    }

    const cleanForm = {
      ...form,
      title: sanitizeText(form.title, 200),
      description: sanitizeText(form.description, 5000),
      address: sanitizeText(form.address, 300),
      price: sanitizeNumber(form.price, 0, 1_000_000_000) ?? 0,
      bedrooms: sanitizeNumber(form.bedrooms, 0, 50) ?? 0,
      bathrooms: sanitizeNumber(form.bathrooms, 0, 50) ?? 0,
      area: sanitizeNumber(form.area, 0, 1_000_000) ?? 0,
      floor: sanitizeNumber(form.floor, 0, 500) ?? 0,
      year_built: sanitizeNumber(form.year_built, 1800, new Date().getFullYear() + 5) ?? new Date().getFullYear(),
      lat: sanitizeNumber(form.lat, -90, 90) ?? 0,
      lng: sanitizeNumber(form.lng, -180, 180) ?? 0,
    };

    if (editingProp) {
      await supabase.from('properties').update(cleanForm).eq('id', editingProp.id);
    } else {
      const { data } = await supabase.from('properties').insert({ ...cleanForm, agent_id: user.id, approved: true }).select().single();
      if (data) {
        await supabase.from('property_images').insert({
          property_id: data.id,
          image_url: 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1200',
          is_primary: true,
        });
      }
    }
    setShowForm(false);
    const { data } = await supabase.from('properties').select('*, images:property_images(*)').eq('agent_id', user.id).order('created_at', { ascending: false });
    setProperties((data ?? []) as Property[]);
  };

  const deleteProperty = async (id: string) => {
    if (!confirm('Delete this property? This cannot be undone.')) return;
    await supabase.from('properties').delete().eq('id', id);
    setProperties((prev) => prev.filter((p) => p.id !== id));
  };

  const toggleSold = async (p: Property) => {
    const newSold = !p.is_sold;
    await supabase.from('properties').update({ is_sold: newSold }).eq('id', p.id);
    setProperties((prev) => prev.map((x) => x.id === p.id ? { ...x, is_sold: newSold } : x));
  };

  const toggleRented = async (p: Property) => {
    const newRented = !p.is_rented;
    await supabase.from('properties').update({ is_rented: newRented }).eq('id', p.id);
    setProperties((prev) => prev.map((x) => x.id === p.id ? { ...x, is_rented: newRented } : x));
  };

  const updateApptStatus = async (id: string, status: Appointment['status']) => {
    await supabase.from('appointments').update({ status }).eq('id', id);
    setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
  };

  const totalViews = properties.reduce((sum, p) => sum + p.views, 0);
  const totalValue = properties.filter((p) => !p.is_sold).reduce((sum, p) => sum + p.price, 0);
  const soldCount = properties.filter((p) => p.is_sold).length;

  const stats = [
    { label: 'Total Listings', value: properties.length, icon: Building2, color: 'text-primary-600 bg-primary-50' },
    { label: 'Properties Sold', value: soldCount, icon: CheckCircle2, color: 'text-accent-600 bg-accent-50' },
    { label: 'Total Views', value: totalViews, icon: Eye, color: 'text-amber-600 bg-amber-50' },
    { label: 'Portfolio Value', value: formatPrice(totalValue, 'For Sale').replace('USD', '$'), icon: DollarSign, color: 'text-rose-600 bg-rose-50' },
  ];

  return (
    <div className="pt-16 lg:pt-20 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Agent Dashboard</h1>
            <p className="text-slate-500 text-sm">{profile?.agency} · {profile?.specialization}</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4" /> Add Listing
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-5 border border-slate-100">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
                <s.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-sm text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-1 mb-6 bg-white rounded-xl border border-slate-100 p-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'listings', label: 'My Listings', icon: Building2 },
            { id: 'appointments', label: 'Appointments', icon: Calendar },
            { id: 'stats', label: 'Statistics', icon: BarChart3 },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${tab === t.id ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {tab === 'listings' && (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            {properties.length === 0 ? (
              <div className="p-12 text-center">
                <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 mb-3">No listings yet</p>
                <button onClick={openCreate} className="text-primary-600 font-medium">Create your first listing</button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {properties.map((p) => (
                  <div key={p.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                    {p.images?.[0] && <img src={p.images[0].image_url} alt="" className="w-16 h-16 rounded-xl object-cover" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-900 truncate">{p.title}</p>
                      <p className="text-xs text-slate-500">{p.neighborhood}, {p.city} · {p.property_type}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-bold text-primary-600">{formatPrice(p.price, p.listing_status)}</span>
                        {p.is_sold && <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-medium">Sold</span>}
                        {p.is_rented && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">Rented</span>}
                        {p.featured && <span className="text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-600 font-medium">Featured</span>}
                        <span className="text-xs text-slate-400 flex items-center gap-0.5"><Eye className="w-3 h-3" /> {p.views}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => navigate({ name: 'property', id: p.id })} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600" title="View"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => openEdit(p)} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600" title="Edit"><Edit3 className="w-4 h-4" /></button>
                      {p.listing_status === 'For Sale' && <button onClick={() => toggleSold(p)} className={`px-2.5 h-8 rounded-lg text-xs font-medium ${p.is_sold ? 'bg-accent-100 text-accent-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>{p.is_sold ? 'Unsold' : 'Mark Sold'}</button>}
                      {p.listing_status === 'For Rent' && <button onClick={() => toggleRented(p)} className={`px-2.5 h-8 rounded-lg text-xs font-medium ${p.is_rented ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>{p.is_rented ? 'Available' : 'Mark Rented'}</button>}
                      <button onClick={() => deleteProperty(p.id)} className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'appointments' && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h3 className="font-bold text-slate-900 mb-4">Property Visits</h3>
            {appointments.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">No appointments scheduled</p>
            ) : (
              <div className="space-y-3">
                {appointments.map((a) => (
                  <div key={a.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-900 truncate">{a.property?.title}</p>
                      <p className="text-xs text-slate-500">{a.date} at {a.time} · {a.user?.full_name}</p>
                      {a.notes && <p className="text-xs text-slate-400 mt-1 truncate">"{a.notes}"</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {a.status === 'scheduled' && (
                        <>
                          <span className="text-xs px-2 py-1 rounded-full bg-primary-50 text-primary-600 font-medium">Scheduled</span>
                          <button onClick={() => updateApptStatus(a.id, 'completed')} className="text-xs text-accent-600 font-medium hover:text-accent-700">Mark Done</button>
                          <button onClick={() => updateApptStatus(a.id, 'cancelled')} className="text-xs text-red-500 font-medium hover:text-red-600">Cancel</button>
                        </>
                      )}
                      {a.status === 'completed' && <span className="text-xs px-2 py-1 rounded-full bg-accent-50 text-accent-600 font-medium">Completed</span>}
                      {a.status === 'cancelled' && <span className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-600 font-medium">Cancelled</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'stats' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-4">Views by Property</h3>
              <div className="space-y-3">
                {properties.slice(0, 5).sort((a, b) => b.views - a.views).map((p) => {
                  const maxViews = Math.max(...properties.map((x) => x.views), 1);
                  return (
                    <div key={p.id}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-slate-600 truncate flex-1">{p.title}</span>
                        <span className="text-slate-900 font-medium ml-2">{p.views}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all" style={{ width: `${(p.views / maxViews) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-4">Listing Performance</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-primary-50 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-primary-600 mb-2" />
                  <p className="text-2xl font-bold text-slate-900">{totalViews}</p>
                  <p className="text-sm text-slate-500">Total Views</p>
                </div>
                <div className="p-4 bg-accent-50 rounded-xl">
                  <CheckCircle2 className="w-6 h-6 text-accent-600 mb-2" />
                  <p className="text-2xl font-bold text-slate-900">{Math.round((soldCount / properties.length) * 100) || 0}%</p>
                  <p className="text-sm text-slate-500">Sold Rate</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl">
                  <Calendar className="w-6 h-6 text-amber-600 mb-2" />
                  <p className="text-2xl font-bold text-slate-900">{appointments.length}</p>
                  <p className="text-sm text-slate-500">Appointments</p>
                </div>
                <div className="p-4 bg-rose-50 rounded-xl">
                  <Home className="w-6 h-6 text-rose-600 mb-2" />
                  <p className="text-2xl font-bold text-slate-900">{properties.filter((p) => !p.is_sold && !p.is_rented).length}</p>
                  <p className="text-sm text-slate-500">Active Listings</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Property Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5 sticky top-0 bg-white pb-3 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">{editingProp ? 'Edit Listing' : 'Add New Listing'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={saveProperty} className="space-y-4">
              {formError && <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">{formError}</div>}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Price</label>
                  <input type="number" required value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Property Type</label>
                  <select value={form.property_type} onChange={(e) => setForm({ ...form, property_type: e.target.value as PropertyType })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm">
                    {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Listing Status</label>
                  <select value={form.listing_status} onChange={(e) => setForm({ ...form, listing_status: e.target.value as ListingStatus })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm">
                    <option value="For Sale">For Sale</option>
                    <option value="For Rent">For Rent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                  <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value, neighborhood: '' })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm">
                    <option value="">Select city</option>
                    {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Neighborhood</label>
                  <select value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm">
                    <option value="">Select neighborhood</option>
                    {(NEIGHBORHOODS[form.city] ?? []).map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                  <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Beds</label>
                  <input type="number" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: Number(e.target.value) })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Baths</label>
                  <input type="number" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: Number(e.target.value) })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Area (m²)</label>
                  <input type="number" value={form.area} onChange={(e) => setForm({ ...form, area: Number(e.target.value) })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Floor</label>
                  <input type="number" value={form.floor} onChange={(e) => setForm({ ...form, floor: Number(e.target.value) })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Year Built</label>
                  <input type="number" value={form.year_built} onChange={(e) => setForm({ ...form, year_built: Number(e.target.value) })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Latitude</label>
                  <input type="number" step="0.0001" value={form.lat} onChange={(e) => setForm({ ...form, lat: Number(e.target.value) })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Longitude</label>
                  <input type="number" step="0.0001" value={form.lng} onChange={(e) => setForm({ ...form, lng: Number(e.target.value) })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'furnished', label: 'Furnished' },
                  { key: 'parking', label: 'Parking' },
                  { key: 'swimming_pool', label: 'Pool' },
                  { key: 'garden', label: 'Garden' },
                  { key: 'balcony', label: 'Balcony' },
                  { key: 'ready_to_move', label: 'Ready' },
                  { key: 'has_video', label: 'Video Tour' },
                  { key: 'has_virtual_tour', label: '360° Tour' },
                  { key: 'featured', label: 'Featured' },
                ].map((f) => (
                  <button key={f.key} type="button" onClick={() => setForm({ ...form, [f.key]: !form[f.key as keyof typeof form] })} className={`px-3 py-2 rounded-xl border text-sm font-medium transition-all ${(form as Record<string, unknown>)[f.key] ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors">{editingProp ? 'Save Changes' : 'Create Listing'}</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
