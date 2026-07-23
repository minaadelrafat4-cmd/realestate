import { useState } from 'react';
import { Shield, Lock, ArrowRight, Eye, EyeOff, Building2, ArrowLeft } from 'lucide-react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { sanitizeText, RateLimiter } from '@/lib/security';

const ADMIN_PASSWORD = 'EstatePro@Admin2026!';
const ADMIN_EMAIL = 'admin@estatepro.internal';
const accessLimiter = new RateLimiter(3000);

export default function SecretAdminPage() {
  const { navigate } = useRouter();
  const { user, profile } = useAuth();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!accessLimiter.canProceed('admin-access')) {
      setError('Too many attempts. Please wait a moment.');
      return;
    }

    setLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 400));

    if (sanitizeText(password, 100) !== ADMIN_PASSWORD) {
      setError('Incorrect password. Access denied.');
      setLoading(false);
      return;
    }

    // Sign in the pre-provisioned admin account so RLS-protected writes work.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    if (signInError) {
      setError('Unable to establish admin session. Please try again.');
      setLoading(false);
      return;
    }

    navigate({ name: 'admin-dashboard' });
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900 p-4">
      <div className="absolute top-6 left-6">
        <button onClick={() => navigate({ name: 'home' })} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to site
        </button>
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-2xl shadow-primary-600/40 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Restricted Access</h1>
          <p className="text-white/50 text-sm">This area is protected. Enter the admin password to continue.</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Admin Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoFocus
                  className="w-full pl-11 pr-11 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-primary-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? 'Verifying...' : 'Unlock Access'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Building2 className="w-3.5 h-3.5" />
              <span>EstatePro Admin Control Panel</span>
            </div>
            {user && (
              <p className="text-xs text-white/30 mt-2">
                Signed in as {profile?.full_name} ({profile?.role})
              </p>
            )}
          </div>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          Unauthorized access is prohibited and logged.
        </p>
      </div>
    </div>
  );
}
