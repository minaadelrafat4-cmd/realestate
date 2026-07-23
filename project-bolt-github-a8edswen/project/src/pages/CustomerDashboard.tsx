import { useEffect, useState } from 'react';
import { Heart, Calendar, MessageSquare, User, Bell, Clock, MapPin, CheckCircle2, XCircle, Mail, Phone, Edit3 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';
import { formatPrice } from '@/lib/utils';
import { sanitizeText, detectSqlInjection } from '@/lib/security';
import type { Appointment, Property } from '@/types';

export default function CustomerDashboard() {
  const { user, profile, refreshProfile } = useAuth();
  const { navigate } = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', phone: '', bio: '' });
  const [tab, setTab] = useState<'overview' | 'appointments' | 'favorites' | 'profile'>('overview');

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setEditForm({ full_name: profile?.full_name ?? '', phone: profile?.phone ?? '', bio: profile?.bio ?? '' });
    Promise.all([
      supabase.from('appointments').select('*, property:properties(*, images:property_images(*)), agent:profiles(*)').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('favorites').select('property:properties(*, images:property_images(*), agent:profiles(*))').eq('user_id', user.id),
    ]).then(([appts, favs]) => {
      setAppointments((appts.data ?? []) as Appointment[]);
      setFavorites((favs.data ?? []).map((f) => f.property) as unknown as Property[]);
      setLoading(false);
    });
  }, [user, profile]);

  if (!user) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <button onClick={() => navigate({ name: 'auth' })} className="text-primary-600 font-medium">Sign in to view dashboard</button>
      </div>
    );
  }

  const upcomingAppts = appointments.filter((a) => a.status === 'scheduled' && new Date(a.date) >= new Date());
  const pastAppts = appointments.filter((a) => a.status === 'completed' || (a.status === 'scheduled' && new Date(a.date) < new Date()));
  const cancelledAppts = appointments.filter((a) => a.status === 'cancelled');

  const cancelAppt = async (id: string) => {
    await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id);
    setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status: 'cancelled' } : a));
  };

  const saveProfile = async () => {
    if (detectSqlInjection(editForm.full_name) || detectSqlInjection(editForm.bio) || detectSqlInjection(editForm.phone)) {
      alert('Invalid characters detected in profile fields.');
      return;
    }
    const cleanForm = {
      full_name: sanitizeText(editForm.full_name, 100),
      phone: sanitizeText(editForm.phone, 20),
      bio: sanitizeText(editForm.bio, 2000),
    };
    await supabase.from('profiles').update(cleanForm).eq('id', user.id);
    await refreshProfile();
    setEditing(false);
  };

  const stats = [
    { label: 'Favorites', value: favorites.length, icon: Heart, color: 'text-red-500 bg-red-50' },
    { label: 'Upcoming Visits', value: upcomingAppts.length, icon: Calendar, color: 'text-primary-600 bg-primary-50' },
    { label: 'Total Inquiries', value: appointments.length, icon: MessageSquare, color: 'text-amber-600 bg-amber-50' },
    { label: 'Completed', value: pastAppts.length, icon: CheckCircle2, color: 'text-accent-600 bg-accent-50' },
  ];

  return (
    <div className="pt-16 lg:pt-20 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-2xl object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-2xl font-bold">
              {profile?.full_name?.charAt(0) ?? 'U'}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome, {profile?.full_name?.split(' ')[0]}</h1>
            <p className="text-slate-500 text-sm">Manage your favorites, appointments, and profile</p>
          </div>
        </div>

        {/* Stats */}
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

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl border border-slate-100 p-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Overview', icon: User },
            { id: 'appointments', label: 'Appointments', icon: Calendar },
            { id: 'favorites', label: 'Favorites', icon: Heart },
            { id: 'profile', label: 'Profile', icon: Edit3 },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as typeof tab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                tab === t.id ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-4">Upcoming Appointments</h3>
              {upcomingAppts.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-6">No upcoming appointments</p>
              ) : (
                <div className="space-y-3">
                  {upcomingAppts.slice(0, 3).map((a) => (
                    <div key={a.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                      {a.property?.images?.[0] && <img src={a.property.images[0].image_url} alt="" className="w-14 h-14 rounded-lg object-cover" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-900 truncate">{a.property?.title}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {a.date} at {a.time}
                        </p>
                      </div>
                      <button onClick={() => navigate({ name: 'property', id: a.property_id })} className="text-primary-600 text-sm font-medium">View</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-4">Recent Favorites</h3>
              {favorites.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-6">No favorites yet</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favorites.slice(0, 3).map((p) => (
                    <div key={p.id} onClick={() => navigate({ name: 'property', id: p.id })} className="cursor-pointer group">
                      {p.images?.[0] && <img src={p.images[0].image_url} alt="" className="w-full h-32 object-cover rounded-xl mb-2 group-hover:opacity-90 transition-opacity" />}
                      <p className="font-semibold text-sm text-slate-900 truncate">{p.title}</p>
                      <p className="text-sm text-primary-600 font-medium">{formatPrice(p.price, p.listing_status)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'appointments' && (
          <div className="space-y-6">
            <AppointmentSection title="Upcoming" items={upcomingAppts} onCancel={cancelAppt} navigate={navigate} />
            <AppointmentSection title="Completed" items={pastAppts} navigate={navigate} />
            <AppointmentSection title="Cancelled" items={cancelledAppts} navigate={navigate} />
          </div>
        )}

        {tab === 'favorites' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.length === 0 ? (
              <div className="col-span-full text-center py-12 text-slate-500">
                <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p>No favorites yet</p>
                <button onClick={() => navigate({ name: 'search' })} className="mt-3 text-primary-600 font-medium">Browse Properties</button>
              </div>
            ) : (
              favorites.map((p) => (
                <div key={p.id} onClick={() => navigate({ name: 'property', id: p.id })} className="bg-white rounded-2xl overflow-hidden border border-slate-100 cursor-pointer group hover:shadow-lg transition-all">
                  {p.images?.[0] && <img src={p.images[0].image_url} alt="" className="w-full h-40 object-cover group-hover:scale-105 transition-transform" />}
                  <div className="p-4">
                    <p className="font-semibold text-slate-900 truncate mb-1">{p.title}</p>
                    <p className="text-sm text-slate-500 flex items-center gap-1 mb-2"><MapPin className="w-3.5 h-3.5" /> {p.neighborhood}, {p.city}</p>
                    <p className="font-bold text-primary-600">{formatPrice(p.price, p.listing_status)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'profile' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-100 max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-slate-900">Profile Settings</h3>
              {!editing && <button onClick={() => setEditing(true)} className="flex items-center gap-2 text-primary-600 text-sm font-medium"><Edit3 className="w-4 h-4" /> Edit</button>}
            </div>
            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input type="text" value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input type="text" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
                  <textarea value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} rows={3} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm resize-none" />
                </div>
                <div className="flex gap-2">
                  <button onClick={saveProfile} className="px-5 py-2.5 bg-primary-600 text-white rounded-xl font-medium text-sm hover:bg-primary-700 transition-colors">Save Changes</button>
                  <button onClick={() => setEditing(false)} className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-200 transition-colors">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <div><p className="text-xs text-slate-500">Email</p><p className="text-sm font-medium text-slate-900">{profile?.email}</p></div>
                </div>
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <User className="w-5 h-5 text-slate-400" />
                  <div><p className="text-xs text-slate-500">Full Name</p><p className="text-sm font-medium text-slate-900">{profile?.full_name}</p></div>
                </div>
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <Phone className="w-5 h-5 text-slate-400" />
                  <div><p className="text-xs text-slate-500">Phone</p><p className="text-sm font-medium text-slate-900">{profile?.phone || 'Not set'}</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <Edit3 className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div><p className="text-xs text-slate-500">Bio</p><p className="text-sm font-medium text-slate-900">{profile?.bio || 'Not set'}</p></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AppointmentSection({ title, items, onCancel, navigate }: { title: string; items: Appointment[]; onCancel?: (id: string) => void; navigate: (r: { name: 'property'; id: string }) => void }) {
  if (items.length === 0) return null;
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100">
      <h3 className="font-bold text-slate-900 mb-4">{title} ({items.length})</h3>
      <div className="space-y-3">
        {items.map((a) => (
          <div key={a.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
            {a.property?.images?.[0] && <img src={a.property.images[0].image_url} alt="" className="w-14 h-14 rounded-lg object-cover cursor-pointer" onClick={() => navigate({ name: 'property', id: a.property_id })} />}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-slate-900 truncate cursor-pointer" onClick={() => navigate({ name: 'property', id: a.property_id })}>{a.property?.title}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {a.date} at {a.time}
              </p>
              {a.notes && <p className="text-xs text-slate-400 mt-1 truncate">"{a.notes}"</p>}
            </div>
            {a.status === 'scheduled' && onCancel && (
              <button onClick={() => onCancel(a.id)} className="text-red-500 text-xs font-medium hover:text-red-600 flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> Cancel
              </button>
            )}
            {a.status === 'cancelled' && <span className="text-xs text-red-500 font-medium">Cancelled</span>}
            {a.status === 'completed' && <span className="text-xs text-accent-600 font-medium flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Done</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
