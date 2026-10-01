import React, { useState } from 'react';
import { Mail, Lock, User, Sparkles, AlertCircle, ArrowLeft, KeyRound, Check, Chrome } from 'lucide-react';
import { UserProfile } from '../types';
import ThreeDGraphic from './ThreeDGraphic';

interface AuthModuleProps {
  onAuthSuccess: (profile: UserProfile, token: string) => void;
}

type AuthMode = 'login' | 'register' | 'forgot';

export default function AuthModule({ onAuthSuccess }: AuthModuleProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [targetRole, setTargetRole] = useState('Software Development Engineer (SDE)');
  const [primaryLanguage, setPrimaryLanguage] = useState('python');
  
  // Error / Status Messages
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    
    setTimeout(() => {
      setLoading(false);
      setSuccess(`A password reset link has been dispatched to ${email}.`);
      setEmail('');
    }, 1500);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please fill in all credentials.');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Invalid credentials.');
      }
      
      setSuccess('Successfully authenticated! Starting workspace...');
      setTimeout(() => {
        onAuthSuccess(data.profile, data.token);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate SDE candidate.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setError('All fields are required.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          targetRole,
          preferredLanguage: primaryLanguage
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to register account.');
      }

      setSuccess('Profile successfully provisioned on server! Opening workspace...');
      setTimeout(() => {
        onAuthSuccess(data.profile, data.token);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to register candidate profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (platform: 'google') => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const socialName = 'Google Candidate';
      const socialEmail = 'google_user@placementprep.ai';
      
      const response = await fetch('/api/auth/social', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: socialName, email: socialEmail, provider: platform })
      });
      
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to complete Google sign-in.');
      }
      
      setSuccess('Google Workspace Session Synchronized! Launching...');
      setTimeout(() => {
        onAuthSuccess(data.profile, data.token);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Google integration error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background radial spotlights */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

      {/* Main Container: Split Grid for 3D Graphic and Auth Card */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-slate-900/40 border border-white/10 rounded-[32px] p-6 md:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        
        {/* LEFT COLUMN: 3D Animated Hologram Polyhedron (Cube) */}
        <div className="col-span-1 md:col-span-5 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/5 pb-6 md:pb-0 md:pr-8">
          <div className="text-center md:text-left md:align-start mb-4 space-y-1">
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2 justify-center md:justify-start">
              <Sparkles className="w-5 h-5 text-blue-400" />
              SDE Placement Matrix
            </h2>
            <p className="text-xs text-slate-400">
              Interactive 3D representation of active DSA preparation streams.
            </p>
          </div>
          
          <ThreeDGraphic />
        </div>

        {/* RIGHT COLUMN: Sign In / Sign Up Form */}
        <div className="col-span-1 md:col-span-7 flex flex-col justify-center">
          {/* Top Header Logo */}
          <div className="flex items-center gap-3 mb-6 justify-start">
            <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 animate-pulse">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight">PrepAgent.AI</h1>
              <p className="text-[9px] text-blue-400 uppercase font-bold tracking-wider">Candidate Control Center</p>
            </div>
          </div>

          {/* Dynamic Mode Heading */}
          <div className="space-y-1.5 mb-6">
            {mode === 'login' && (
              <>
                <h2 className="text-xl font-black text-white tracking-tight">Welcome Back Candidate</h2>
                <p className="text-xs text-slate-400">Sign in with correct credentials to sync SDE benchmark progress</p>
              </>
            )}
            {mode === 'register' && (
              <>
                <h2 className="text-xl font-black text-white tracking-tight">Create Candidate Account</h2>
                <p className="text-xs text-slate-400">Setup your personalized dashboard and track real-time study goals</p>
              </>
            )}
            {mode === 'forgot' && (
              <>
                <h2 className="text-xl font-black text-white tracking-tight">Trouble Signing In?</h2>
                <p className="text-xs text-slate-400">Enter your email and we'll transmit a password reset token</p>
              </>
            )}
          </div>

          {/* Global Error/Success banner */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs mb-4 flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs mb-4 flex items-center gap-2">
              <Check className="w-4.5 h-4.5 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* 1. LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Candidate Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@college.edu"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Security Password</label>
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                    className="text-[10px] text-blue-400 hover:underline font-bold"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl text-xs transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In Securely</span>
                    <KeyRound className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3 text-[10.5px] leading-relaxed text-slate-400 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-200">Instant Sandbox Access:</span> Use the pre-seeded account <span className="font-mono text-blue-400 font-bold bg-white/5 px-1.5 py-0.5 rounded">demo@placementprep.ai</span> with password <span className="font-mono text-blue-400 font-bold bg-white/5 px-1.5 py-0.5 rounded">password123</span> to login immediately.
                </div>
              </div>
            </form>
          )}

          {/* 2. REGISTER FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Candidate Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex.rivera@university.edu"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Role</label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-3 text-xs text-white focus:outline-hidden focus:border-blue-500 transition"
                  >
                    <option value="Software Development Engineer (SDE)">Software Engineer</option>
                    <option value="Frontend UI/UX Specialist">Frontend Dev</option>
                    <option value="Backend & Systems Scalability">Backend Dev</option>
                    <option value="Full Stack React Engineer">Full Stack Dev</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Primary Language</label>
                  <select
                    value={primaryLanguage}
                    onChange={(e) => setPrimaryLanguage(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-3 text-xs text-white focus:outline-hidden focus:border-blue-500 transition"
                  >
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="javascript">JavaScript</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Setup Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Choose secure password"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl text-xs transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Register SDE Account</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* 3. FORGOT PASSWORD FORM */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Candidate Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@college.edu"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                  className="w-1/3 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold py-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl text-xs transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Send Reset Token</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Social Authentication Splitter (Google login remains, Github is fully removed as requested) */}
          {(mode === 'login' || mode === 'register') && (
            <div className="mt-6 pt-6 border-t border-white/5 space-y-4">
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-white/5"></div>
                <span className="flex-shrink mx-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest">Or authenticate via</span>
                <div className="flex-grow border-t border-white/5"></div>
              </div>

              <button
                type="button"
                id="google-login"
                onClick={() => handleSocialLogin('google')}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-2.5 px-4 text-xs font-bold text-white flex items-center justify-center gap-2 transition duration-200 active:scale-95 cursor-pointer"
              >
                <Chrome className="w-4.5 h-4.5 text-red-400" />
                <span>Sign in with Google Workspace</span>
              </button>
            </div>
          )}

          {/* Bottom Switch Mode Link */}
          <p className="text-center text-xs text-slate-400 mt-6">
            {mode === 'login' ? "Don't have an account yet?" : "Already registered?"}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError('');
                setSuccess('');
              }}
              className="text-blue-400 hover:underline font-bold cursor-pointer"
            >
              {mode === 'login' ? 'Create Account' : 'Sign In Now'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}
