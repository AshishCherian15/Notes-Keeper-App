import React, { useState } from 'react';
import { apiFetch } from '../api';
import { User } from '../types';
import { LogIn, UserPlus, Loader2, BookText, CheckCircle2 } from 'lucide-react';

interface AuthFormProps {
  onLogin: (user: User, token: string) => void;
}

export function AuthForm({ onLogin }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const data = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      
      onLogin(data.user, data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full min-h-screen bg-slate-50 flex-col lg:flex-row">
      {/* Left Pane - Context & Branding */}
      <div className="lg:w-[55%] bg-gradient-to-br from-orange-400 via-pink-500 to-indigo-600 p-10 lg:p-20 text-white flex flex-col justify-center relative overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <div className="absolute -top-24 -left-24 w-[30rem] h-[30rem] bg-white rounded-full mix-blend-overlay blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-[40rem] h-[40rem] bg-white rounded-full mix-blend-overlay blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-lg mx-auto lg:max-w-none lg:mx-0">
          <div className="flex items-center gap-3 mb-12">
            <div className="p-3.5 bg-white/20 rounded-2xl backdrop-blur-md shadow-lg shadow-pink-500/20">
              <BookText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">Notes Keeper</h1>
          </div>
          
          <h2 className="text-5xl lg:text-6xl font-extrabold leading-tight mb-8 drop-shadow-sm">
            Capture your thoughts,<br />organize your life.
          </h2>
          
          <p className="text-xl text-white/95 mb-14 drop-shadow-sm max-w-xl leading-relaxed">
            A beautiful, intuitive, and secure workspace designed to help you focus on what matters. Jot down ideas, manage projects, and never lose a thought again.
          </p>

          <div className="space-y-5">
            <div className="flex items-center gap-4 text-white hover:translate-x-2 transition-transform duration-300">
              <div className="bg-orange-400/30 p-2 rounded-full"><CheckCircle2 className="w-6 h-6 text-orange-100" /></div>
              <span className="text-xl font-medium drop-shadow-sm">Instant real-time saving</span>
            </div>
            <div className="flex items-center gap-4 text-white hover:translate-x-2 transition-transform duration-300">
              <div className="bg-pink-400/30 p-2 rounded-full"><CheckCircle2 className="w-6 h-6 text-pink-100" /></div>
              <span className="text-xl font-medium drop-shadow-sm">Lightning-fast search</span>
            </div>
            <div className="flex items-center gap-4 text-white hover:translate-x-2 transition-transform duration-300">
              <div className="bg-indigo-400/30 p-2 rounded-full"><CheckCircle2 className="w-6 h-6 text-indigo-100" /></div>
              <span className="text-xl font-medium drop-shadow-sm">Colorful notes organization</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane - Form */}
      <div className="lg:w-[45%] flex items-center justify-center p-8 bg-slate-50 shadow-[-20px_0_40px_-10px_rgba(0,0,0,0.05)] z-10 relative">
        <div className="w-full max-w-md bg-white p-8 sm:p-12 border border-slate-100 rounded-[2rem] shadow-2xl shadow-slate-200/50">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-3">
              {isLogin ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-slate-500">
              {isLogin ? 'Sign in to access your notes workspace' : 'Sign up to start organizing your thoughts'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all placeholder:text-slate-400"
                placeholder="e.g. admin"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all placeholder:text-slate-400"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center gap-2">
                <span className="font-medium">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 text-white py-4 rounded-xl transition-all font-semibold shadow-lg shadow-pink-500/25 disabled:opacity-70 disabled:cursor-not-allowed text-lg mt-4"
            >
              {loading ? (
                 <Loader2 className="w-5 h-5 animate-spin" />
              ) : isLogin ? (
                <><LogIn className="w-5 h-5" /> Sign In</>
              ) : (
                <><UserPlus className="w-5 h-5" /> Sign Up</>
              )}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-slate-100 text-center text-sm text-slate-600">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-pink-600 hover:text-pink-700 font-semibold transition-colors"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
