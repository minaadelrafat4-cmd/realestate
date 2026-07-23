import { useState } from 'react';
import { Building2, Mail, Lock, User, Briefcase, Home as HomeIcon, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';
import type { UserRole } from '@/types';
import { sanitizeText, isValidEmail, isStrongPassword, detectSqlInjection, RateLimiter } from '@/lib/security';

const authRateLimiter = new RateLimiter(3000);

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const { navigate } = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('customer');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (detectSqlInjection(email) || detectSqlInjection(password) || detectSqlInjection(fullName)) {
      setError('Invalid input detected. Please check your entries.');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (mode === 'signup') {
      const pwdCheck = isStrongPassword(password);
      if (!pwdCheck.valid) {
        setError(pwdCheck.message ?? 'Password is not strong enough.');
        return;
      }
      if (fullName.trim().length < 2) {
        setError('Please enter your full name.');
        return;
      }
    }

    if (!authRateLimiter.canProceed(email)) {
      setError('Too many attempts. Please wait a moment and try again.');
      return;
    }

    setLoading(true);
    const cleanEmail = sanitizeText(email, 254);
    const cleanName = mode === 'signup' ? sanitizeText(fullName, 100) : '';

    if (mode === 'signin') {
      const { error } = await signIn(cleanEmail, password);
      if (error) setError(error);
      else navigate({ name: 'home' });
    } else {
      const { error } = await signUp(cleanEmail, password, cleanName, role);
      if (error) setError(error);
      else navigate({ name: 'home' });
    }
    setLoading(false);
  };

  const demoLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('demo1234');
    setMode('signin');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img
          src="https://images.pexels.com/photos/302769/pexels-photo-302769.jpeg?auto=compress&cs=tinysrgb&w=1920"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/90 via-primary-800/80 to-slate-900/90" />
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <button onClick={() => navigate({ name: 'home' })} className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl">Estate<span className="text-primary-300">Pro</span></span>
          </button>
          <h1 className="text-4xl font-bold mb-4 leading-tight">
            Your dream property<br />is just a click away
          </h1>
          <p className="text-white/70 text-lg mb-8 max-w-md">
            Join thousands of happy clients who found their perfect home with EstatePro.
          </p>
          <div className="space-y-3">
            {['Advanced search with 15+ filters', 'Interactive map browsing', 'Save favorites and compare', 'Schedule visits online'].map((f) => (
              <div key={f} className="flex items-center gap-3 text-white/80">
                <CheckCircle2 className="w-5 h-5 text-accent-400" /> {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">Estate<span className="text-primary-500">Pro</span></span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">
              {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-slate-500 text-sm mb-6">
              {mode === 'signin' ? 'Sign in to access your dashboard' : 'Join EstatePro and find your dream property'}
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Account Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setRole('customer')} className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${role === 'customer' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                        <HomeIcon className="w-4 h-4" /> Customer
                      </button>
                      <button type="button" onClick={() => setRole('agent')} className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${role === 'agent' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                        <Briefcase className="w-4 h-4" /> Agent
                      </button>
                    </div>
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" minLength={6} className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-primary-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-5">
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }} className="text-primary-600 font-semibold hover:text-primary-700">
                {mode === 'signin' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>

          {/* Demo accounts */}
          <div className="mt-4 p-4 bg-white rounded-xl border border-slate-100">
            <p className="text-xs font-semibold text-slate-500 mb-2">Demo Accounts (click to fill):</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => demoLogin('admin@estate.demo')} className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition-colors">Admin</button>
              <button onClick={() => demoLogin('agent1@estate.demo')} className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition-colors">Agent</button>
              <button onClick={() => demoLogin('agent2@estate.demo')} className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition-colors">Agent 2</button>
            </div>
            <p className="text-xs text-slate-400 mt-2">Password for all: demo1234</p>
          </div>
        </div>
      </div>
    </div>
  );
}
