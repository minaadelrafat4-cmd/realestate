import { useEffect, useState } from 'react';
import { Building2, Users, Calendar, Star, BarChart3, TrendingUp, Eye, DollarSign, CheckCircle2, XCircle, Trash2, Check, MapPin, Home, UserCheck, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/context/RouterContext';
import { formatPrice, PROPERTY_TYPES } from '@/lib/utils';
import type { Property, Profile, Review, Appointment } from '@/types';

export default function AdminDashboard() {
  const { navigate } = useRouter();
  const [tab, setTab] = useState<'analytics' | 'properties' | 'agents' | 'users' | 'appointments' | 'reviews'>('analytics');
  const [properties, setProperties] = useState<Property[]>([]);
  const [agents, setAgents] = useState<Profile[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('properties').select('*, agent:profiles(*)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('role', 'agent').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('role', 'customer').order('created_at', { ascending: false }),
      supabase.from('reviews').select('*, property:properties(*), user:profiles(*)').order('created_at', { ascending: false }),
      supabase.from('appointments').select('*, property:properties(*), user:profiles(*)').order('date', { ascending: false }),
    ]).then(([props, agts, usrs, revs, appts]) => {
      setProperties((props.data ?? []) as Property[]);
      setAgents((agts.data ?? []) as Profile[]);
      setUsers((usrs.data ?? []) as Profile[]);
      setReviews((revs.data ?? []) as Review[]);
      setAppointments((appts.data ?? []) as Appointment[]);
      setLoading(false);
    });
  }, []);

  const toggleFeatured = async (p: Property) => {
    await supabase.from('properties').update({ featured: !p.featured }).eq('id', p.id);
    setProperties((prev) => prev.map((x) => x.id === p.id ? { ...x, featured: !x.featured } : x));
  };

  const toggleApproved = async (p: Property) => {
    await supabase.from('properties').update({ approved: !p.approved }).eq('id', p.id);
    setProperties((prev) => prev.map((x) => x.id === p.id ? { ...x, approved: !x.approved } : x));
  };

  const deleteProperty = async (id: string) => {
    if (!confirm('Delete this property?')) return;
    await supabase.from('properties').delete().eq('id', id);
    setProperties((prev) => prev.filter((p) => p.id !== id));
  };

  const approveReview = async (r: Review) => {
    await supabase.from('reviews').update({ approved: !r.approved }).eq('id', r.id);
    setReviews((prev) => prev.map((x) => x.id === r.id ? { ...x, approved: !r.approved } : x));
  };

  const deleteReview = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    await supabase.from('reviews').delete().eq('id', id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
  };

  const toggleVerified = async (a: Profile) => {
    await supabase.from('profiles').update({ verified: !a.verified }).eq('id', a.id);
    setAgents((prev) => prev.map((x) => x.id === a.id ? { ...x, verified: !a.verified } : x));
  };

  // Analytics
  const totalViews = properties.reduce((s, p) => s + p.views, 0);
  const totalValue = properties.reduce((s, p) => s + p.price, 0);
  const soldCount = properties.filter((p) => p.is_sold).length;
  const pendingReviews = reviews.filter((r) => !r.approved).length;
  const conversionRate = appointments.length > 0 ? Math.round((soldCount / appointments.length) * 100) : 0;

  const viewsByType = PROPERTY_TYPES.map((type) => ({
    type,
    count: properties.filter((p) => p.property_type === type).length,
    views: properties.filter((p) => p.property_type === type).reduce((s, p) => s + p.views, 0),
  }));

  const topCities = Array.from(new Set(properties.map((p) => p.city))).map((city) => ({
    city,
    count: properties.filter((p) => p.city === city).length,
  })).sort((a, b) => b.count - a.count).slice(0, 5);

  const mostViewed = [...properties].sort((a, b) => b.views - a.views).slice(0, 5);
  const maxViews = Math.max(...mostViewed.map((p) => p.views), 1);

  // Monthly data (mock based on created_at)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyListings = months.map((m, i) => ({
    month: m,
    count: properties.filter((p) => new Date(p.created_at).getMonth() === i).length,
  }));
  const maxMonthly = Math.max(...monthlyListings.map((m) => m.count), 1);

  const overviewStats = [
    { label: 'Total Properties', value: properties.length, icon: Building2, color: 'text-primary-600 bg-primary-50' },
    { label: 'Total Users', value: users.length + agents.length, icon: Users, color: 'text-amber-600 bg-amber-50' },
    { label: 'Appointments', value: appointments.length, icon: Calendar, color: 'text-rose-600 bg-rose-50' },
    { label: 'Total Views', value: totalViews, icon: Eye, color: 'text-accent-600 bg-accent-50' },
  ];

  const tabs = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'properties', label: 'Properties', icon: Building2 },
    { id: 'agents', label: 'Agents', icon: UserCheck },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'reviews', label: 'Reviews', icon: Star },
  ];

  return (
    <div className="pt-16 lg:pt-20 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            Admin Dashboard
          </h1>
          <button onClick={() => navigate({ name: 'home' })} className="text-sm text-slate-500 hover:text-slate-700 font-medium">
            Exit to site
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {overviewStats.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-5 border border-slate-100">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
                <s.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{s.value.toLocaleString()}</p>
              <p className="text-sm text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-1 mb-6 bg-white rounded-xl border border-slate-100 p-1 overflow-x-auto no-scrollbar">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${tab === t.id ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <t.icon className="w-4 h-4" /> {t.label}
              {t.id === 'reviews' && pendingReviews > 0 && <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs">{pendingReviews}</span>}
            </button>
          ))}
        </div>

        {tab === 'analytics' && (
          <div className="space-y-6">
            {/* Key metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-100">
                <DollarSign className="w-8 h-8 text-accent-600 mb-2" />
                <p className="text-xl font-bold text-slate-900">{formatPrice(totalValue, 'For Sale')}</p>
                <p className="text-sm text-slate-500">Total Portfolio Value</p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-100">
                <TrendingUp className="w-8 h-8 text-primary-600 mb-2" />
                <p className="text-xl font-bold text-slate-900">{conversionRate}%</p>
                <p className="text-sm text-slate-500">Conversion Rate</p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-100">
                <CheckCircle2 className="w-8 h-8 text-accent-600 mb-2" />
                <p className="text-xl font-bold text-slate-900">{soldCount}</p>
                <p className="text-sm text-slate-500">Properties Sold</p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-100">
                <Star className="w-8 h-8 text-amber-500 mb-2" />
                <p className="text-xl font-bold text-slate-900">{reviews.filter((r) => r.approved).length}</p>
                <p className="text-sm text-slate-500">Approved Reviews</p>
              </div>
            </div>

            {/* Monthly listings chart */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-4">Monthly Listings</h3>
              <div className="flex items-end gap-2 h-48">
                {monthlyListings.map((m) => (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-slate-100 rounded-t-lg overflow-hidden flex items-end" style={{ height: '100%' }}>
                      <div className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-lg transition-all duration-500" style={{ height: `${(m.count / maxMonthly) * 100}%` }} />
                    </div>
                    <span className="text-xs text-slate-500">{m.month}</span>
                    <span className="text-xs font-semibold text-slate-700">{m.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Most viewed */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-4">Most Viewed Properties</h3>
                <div className="space-y-3">
                  {mostViewed.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{p.title}</p>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-primary-500 rounded-full" style={{ width: `${(p.views / maxViews) * 100}%` }} />
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-slate-700">{p.views}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top cities */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-4">Most Searched Cities</h3>
                <div className="space-y-3">
                  {topCities.map((c, i) => {
                    const maxCount = Math.max(...topCities.map((x) => x.count), 1);
                    return (
                      <div key={c.city} className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-primary-500 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{c.city}</p>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                            <div className="h-full bg-accent-500 rounded-full" style={{ width: `${(c.count / maxCount) * 100}%` }} />
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{c.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Property types */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-4">Listings by Type</h3>
                <div className="space-y-3">
                  {viewsByType.map((t) => {
                    const maxCount = Math.max(...viewsByType.map((x) => x.count), 1);
                    return (
                      <div key={t.type} className="flex items-center gap-3">
                        <Home className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{t.type}</p>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                            <div className="h-full bg-primary-500 rounded-full" style={{ width: `${(t.count / maxCount) * 100}%` }} />
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{t.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* User growth */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-4">User Growth</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-primary-50 rounded-xl">
                    <Users className="w-6 h-6 text-primary-600 mb-2" />
                    <p className="text-2xl font-bold text-slate-900">{users.length}</p>
                    <p className="text-sm text-slate-500">Customers</p>
                  </div>
                  <div className="p-4 bg-accent-50 rounded-xl">
                    <UserCheck className="w-6 h-6 text-accent-600 mb-2" />
                    <p className="text-2xl font-bold text-slate-900">{agents.length}</p>
                    <p className="text-sm text-slate-500">Agents</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-sm text-slate-500">Total registered users</p>
                  <p className="text-3xl font-bold text-slate-900">{users.length + agents.length + 1}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'properties' && (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-3 text-left text-xs font-semibold text-slate-600">Property</th>
                    <th className="p-3 text-left text-xs font-semibold text-slate-600">Agent</th>
                    <th className="p-3 text-left text-xs font-semibold text-slate-600">Price</th>
                    <th className="p-3 text-left text-xs font-semibold text-slate-600">Views</th>
                    <th className="p-3 text-left text-xs font-semibold text-slate-600">Status</th>
                    <th className="p-3 text-left text-xs font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {properties.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <p className="text-sm font-medium text-slate-900 truncate max-w-[200px]">{p.title}</p>
                        <p className="text-xs text-slate-500">{p.property_type} · {p.city}</p>
                      </td>
                      <td className="p-3 text-sm text-slate-600">{p.agent?.full_name ?? '—'}</td>
                      <td className="p-3 text-sm font-medium text-slate-900">{formatPrice(p.price, p.listing_status)}</td>
                      <td className="p-3 text-sm text-slate-600">{p.views}</td>
                      <td className="p-3">
                        <div className="flex gap-1 flex-wrap">
                          {p.approved && <span className="text-xs px-2 py-0.5 rounded-full bg-accent-50 text-accent-600">Approved</span>}
                          {p.featured && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">Featured</span>}
                          {p.is_sold && <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600">Sold</span>}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => toggleApproved(p)} className={`w-7 h-7 rounded-lg flex items-center justify-center ${p.approved ? 'bg-accent-50 text-accent-600' : 'bg-slate-100 text-slate-400'}`} title="Toggle approval"><Check className="w-4 h-4" /></button>
                          <button onClick={() => toggleFeatured(p)} className={`w-7 h-7 rounded-lg flex items-center justify-center ${p.featured ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'}`} title="Toggle featured"><Star className="w-4 h-4" /></button>
                          <button onClick={() => deleteProperty(p.id)} className="w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'agents' && (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {agents.map((a) => (
                <div key={a.id} className="flex items-center gap-4 p-4 hover:bg-slate-50">
                  {a.avatar_url ? <img src={a.avatar_url} alt="" className="w-12 h-12 rounded-xl object-cover" /> : <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold">{a.full_name.charAt(0)}</div>}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-900">{a.full_name}</p>
                    <p className="text-xs text-slate-500">{a.email} · {a.agency}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${a.verified ? 'bg-accent-50 text-accent-600' : 'bg-amber-50 text-amber-600'}`}>{a.verified ? 'Verified' : 'Pending'}</span>
                  <button onClick={() => toggleVerified(a)} className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700">{a.verified ? 'Unverify' : 'Verify'}</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            {users.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p>No customer accounts yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center gap-4 p-4 hover:bg-slate-50">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-slate-600 font-bold">{u.full_name.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-900">{u.full_name}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                    <span className="text-xs text-slate-500">{new Date(u.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'appointments' && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            {appointments.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">No appointments</p>
            ) : (
              <div className="space-y-3">
                {appointments.map((a) => (
                  <div key={a.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-900 truncate">{a.property?.title}</p>
                      <p className="text-xs text-slate-500">{a.date} at {a.time} · {a.user?.full_name}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${a.status === 'completed' ? 'bg-accent-50 text-accent-600' : a.status === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-primary-50 text-primary-600'}`}>{a.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'reviews' && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            {reviews.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">No reviews</p>
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div key={r.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm text-slate-900">{r.user?.full_name ?? 'Anonymous'}</p>
                        <div className="flex gap-0.5">
                          {Array.from({ length: r.rating }).map((_, j) => <Star key={j} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.approved ? 'bg-accent-50 text-accent-600' : 'bg-amber-50 text-amber-600'}`}>{r.approved ? 'Approved' : 'Pending'}</span>
                      </div>
                      <p className="text-sm text-slate-600">{r.content}</p>
                      <p className="text-xs text-slate-400 mt-1">on {r.property?.title}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => approveReview(r)} className={`w-8 h-8 rounded-lg flex items-center justify-center ${r.approved ? 'bg-accent-50 text-accent-600' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`} title="Toggle approval"><Check className="w-4 h-4" /></button>
                      <button onClick={() => deleteReview(r.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center" title="Delete"><XCircle className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
