import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  LayoutDashboard,
  FileText,
  Brain,
  Terminal,
  Clock,
  Building2,
  Trophy,
  Settings as SettingsIcon,
  Flame,
  User,
  LogOut,
  Bell,
  Menu,
  X,
  Plus,
  Compass,
  Briefcase,
  Sun,
  Moon
} from 'lucide-react';
import { UserProfile } from './types';

// Modular Component Imports
import DashboardModule from './components/DashboardModule';
import ResumeModule from './components/ResumeModule';
import AptitudeModule from './components/AptitudeModule';
import CodingModule from './components/CodingModule';
import InterviewModule from './components/InterviewModule';
import CompanyModule from './components/CompanyModule';
import LeaderboardModule from './components/LeaderboardModule';
import AuthModule from './components/AuthModule';
import Interactive3DBackground from './components/Interactive3DBackground';

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Daily push notification simulation states
  const [showPushNotification, setShowPushNotification] = useState(false);
  const [pushNotificationDismissed, setPushNotificationDismissed] = useState(false);

  // Load profile from server session or local storage
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('placement_prep_token');
      if (token) {
        try {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const data = await response.json();
          if (response.ok && data.success) {
            setProfile(data.profile);
            if (data.profile.theme) {
              setTheme(data.profile.theme);
            }
            return;
          }
        } catch (err) {
          console.error('Failed to verify session:', err);
        }
        // Clear invalid session
        localStorage.removeItem('placement_prep_token');
        localStorage.removeItem('placement_prep_profile');
      }
    };
    checkAuth();
  }, []);

  // Show simulated push alert on start if incomplete practice
  useEffect(() => {
    if (profile && !pushNotificationDismissed) {
      const timer = setTimeout(() => {
        setShowPushNotification(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [profile, pushNotificationDismissed]);

  // Sync profile changes to local storage and backend server database
  const handleSetProfile = (updated: UserProfile) => {
    setProfile(updated);
    localStorage.setItem('placement_prep_profile', JSON.stringify(updated));
    
    // Async update to server database
    const token = localStorage.getItem('placement_prep_token');
    if (token) {
      fetch('/api/auth/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ profile: updated })
      }).catch(err => console.error('Failed to sync profile to server:', err));
    }
  };

  // Toggle dark/light theme
  const toggleTheme = () => {
    if (!profile) return;
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    handleSetProfile({
      ...profile,
      theme: nextTheme
    });
  };

  // Helper to append action to history log
  const handleAddHistory = (item: { type: 'aptitude' | 'coding' | 'interview' | 'resume'; title: string; score?: string | number }) => {
    if (!profile) return;
    const newItem = {
      id: 'hist_' + Date.now(),
      ...item,
      date: new Date().toLocaleDateString()
    };
    handleSetProfile({
      ...profile,
      history: [newItem, ...profile.history.slice(0, 9)] // Limit to 10 logs
    });
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('placement_prep_profile');
    localStorage.removeItem('placement_prep_token');
    setProfile(null);
    setShowLogoutConfirm(false);
  };

  // Calculate Level and Progress
  const calculateLevel = (xp: number) => {
    const level = Math.floor(xp / 1000) + 1;
    const currentLevelXp = xp % 1000;
    const percent = (currentLevelXp / 1000) * 100;
    return { level, percent, currentLevelXp };
  };

  // Render Auth screen if no profile exists
  if (!profile) {
    return (
      <AuthModule
        onAuthSuccess={(newProfile, token) => {
          localStorage.setItem('placement_prep_token', token);
          handleSetProfile(newProfile);
          if (newProfile.theme) {
            setTheme(newProfile.theme);
          }
          setActiveTab('dashboard');
        }}
      />
    );
  }

  // Calculate dynamic stats
  const { level, percent, currentLevelXp } = calculateLevel(profile.xp);

  // Define sidebar menu options
  const menuOptions = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard, color: 'text-blue-400' },
    { id: 'resume', label: 'Resume Optimizer', icon: FileText, color: 'text-emerald-400' },
    { id: 'aptitude', label: 'Aptitude Practice', icon: Brain, color: 'text-indigo-400' },
    { id: 'coding', label: 'Coding Sandbox', icon: Terminal, color: 'text-purple-400' },
    { id: 'interview', label: 'Mock Interviews', icon: Clock, color: 'text-pink-400' },
    { id: 'company', label: 'Company Prep', icon: Building2, color: 'text-amber-400' },
    { id: 'leaderboard', label: 'Rankings Board', icon: Trophy, color: 'text-orange-400' },
  ];

  return (
    <div className={`min-h-screen flex font-sans antialiased relative overflow-hidden transition-colors duration-300 ${
      theme === 'light' ? 'bg-slate-50 text-slate-800' : 'bg-slate-950 text-slate-100'
    }`}>
      {/* Interactive 3D Background */}
      <Interactive3DBackground theme={theme} />

      {/* Simulated Daily 8 PM Push Notification Toast */}
      {showPushNotification && (
        <div 
          className={`fixed top-4 right-4 z-[100] max-w-sm w-full border rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-fade-in flex items-start gap-3.5 transition-colors duration-300 ${
            theme === 'light' 
              ? 'bg-white border-blue-200 text-slate-800 shadow-xl' 
              : 'bg-slate-900 border-blue-500/30 text-white'
          }`}
        >
          <div className="bg-blue-500/15 p-2 rounded-xl border border-blue-500/20 text-blue-500 flex-shrink-0">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">PrepAgent.AI Push Warning</span>
              <span className="text-[9px] text-slate-400 font-semibold">⏰ Simulated: 8:00 PM</span>
            </div>
            <p className="text-xs font-bold leading-snug">
              Daily Streak Safeguard!
            </p>
            <p className={`text-[11px] leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
              You haven't completed your daily practice streak yet! Perform an evaluation or practice sandbox right away to protect your <strong className="text-amber-500 font-extrabold">{profile?.currentStreak}-day streak</strong>!
            </p>
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveTab('aptitude');
                  setShowPushNotification(false);
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition cursor-pointer"
              >
                Practice Now
              </button>
              <button
                onClick={() => {
                  setShowPushNotification(false);
                  setPushNotificationDismissed(true);
                }}
                className={`font-semibold px-3 py-1.5 rounded-lg text-[10px] transition ${
                  theme === 'light' ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-white/5 hover:bg-white/10 text-slate-300'
                }`}
              >
                Dismiss
              </button>
            </div>
          </div>
          <button 
            onClick={() => {
              setShowPushNotification(false);
              setPushNotificationDismissed(true);
            }}
            className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. SIDEBAR NAVIGATION */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r backdrop-blur-md p-6 flex flex-col justify-between transition-all duration-300 xl:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } xl:static xl:h-screen ${
          theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/60 border-white/10'
        }`}
      >
        <div className="space-y-6">
          {/* Logo header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <Sparkles className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h1 className={`text-base font-black tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>PrepAgent.AI</h1>
                <p className="text-[9px] text-blue-500 uppercase font-bold tracking-widest">Co-Pilot Engine</p>
              </div>
            </div>
            {/* Close sidebar button on mobile */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="xl:hidden text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Level tracker */}
          <div className={`rounded-2xl p-4 space-y-2.5 border transition-colors duration-300 ${
            theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/5'
          }`}>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className={theme === 'light' ? 'text-slate-600' : 'text-slate-400'}>Student Level</span>
              <span className={`font-bold ${theme === 'light' ? 'text-blue-600' : 'text-blue-350'}`}>Lvl {level}</span>
            </div>
            <div className={`w-full h-1.5 rounded-full overflow-hidden ${theme === 'light' ? 'bg-slate-200' : 'bg-white/10'}`}>
              <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${percent}%` }} />
            </div>
            <div className={`flex items-center justify-between text-[10px] uppercase font-semibold ${theme === 'light' ? 'text-slate-500' : 'text-slate-500'}`}>
              <span>{currentLevelXp} XP</span>
              <span>1000 XP to Lvl {level + 1}</span>
            </div>
          </div>

          {/* Menus List */}
          <nav className="space-y-1">
            {menuOptions.map((opt) => {
              const isActive = activeTab === opt.id;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  id={`nav-opt-${opt.id}`}
                  onClick={() => {
                    setActiveTab(opt.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full text-left py-3 px-4 rounded-xl text-xs font-bold transition flex items-center gap-3 border cursor-pointer ${
                    isActive
                      ? theme === 'light'
                        ? 'bg-blue-50 border-blue-200/80 text-blue-600 font-extrabold shadow-sm'
                        : 'bg-blue-600/10 border-blue-500/25 text-blue-300 font-extrabold shadow-sm shadow-blue-500/5'
                      : theme === 'light'
                        ? 'bg-transparent border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                        : 'bg-transparent border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${opt.color}`} />
                  {opt.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Block */}
        <div className="space-y-4">
          {/* Theme Toggle option */}
          <div className="flex items-center justify-between px-2 pb-2">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Appearance</span>
            <button
              id="theme-toggle-btn"
              onClick={toggleTheme}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                theme === 'light' 
                  ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200' 
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
              }`}
              title="Toggle Light/Dark Theme"
            >
              {theme === 'dark' ? (
                <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase">
                  <Moon className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Dark</span>
                </div>
              )}
            </button>
          </div>

          {/* Upgrade Pro Widget mockup */}
          <div className={`border rounded-2xl p-4 text-xs space-y-2 text-center relative overflow-hidden transition-colors duration-300 ${
            theme === 'light' 
              ? 'bg-gradient-to-br from-amber-50 to-indigo-50 border-amber-200 shadow-xs' 
              : 'bg-gradient-to-br from-amber-500/15 to-indigo-500/10 border-amber-500/20'
          }`}>
            <div className="absolute top-[-10px] right-[-10px] w-12 h-12 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
            <p className="font-bold text-amber-500 flex items-center gap-1 justify-center">
              👑 Referral Engine
            </p>
            <p className={`text-[10px] leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
              Achieve 1500 XP to get direct referral matches at Google & Amazon!
            </p>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-1.5 rounded-lg text-[10px] uppercase transition duration-200 active:scale-95 cursor-pointer"
            >
              Get Referred Now
            </button>
          </div>

          {/* User profile card */}
          <div className={`border-t pt-4 flex items-center justify-between transition-colors duration-300 ${
            theme === 'light' ? 'border-slate-200' : 'border-white/5'
          }`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-bold text-xs text-blue-400 flex-shrink-0">
                {profile.name[0]}
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-bold truncate ${theme === 'light' ? 'text-slate-950' : 'text-white'}`}>{profile.name}</p>
                <p className="text-[9px] text-slate-500 truncate font-semibold uppercase">{profile.preferredLanguage} Specialist</p>
              </div>
            </div>
            <button
              id="btn-logout"
              onClick={handleLogout}
              className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg transition cursor-pointer"
              title="Clear stats & Reset profile"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN HUB SHELL */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        {/* Navigation header row */}
        <header className={`backdrop-blur-md py-4 px-6 md:px-8 flex items-center justify-between flex-shrink-0 border-b transition-colors duration-300 ${
          theme === 'light' ? 'bg-white border-slate-200 shadow-2xs' : 'bg-slate-900/40 border-white/10'
        }`}>
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="xl:hidden text-slate-450 hover:text-slate-950 p-1 rounded-lg transition cursor-pointer"
            >
              <Menu className="w-5.5 h-5.5" />
            </button>
            <h2 className={`text-sm font-black hidden sm:block uppercase tracking-wider ${
              theme === 'light' ? 'text-slate-800' : 'text-slate-300'
            }`}>
              {menuOptions.find(o => o.id === activeTab)?.label || 'Workspace'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Streak metrics */}
            <div className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border transition-colors duration-300 ${
              theme === 'light' ? 'bg-amber-50 border-amber-200' : 'bg-amber-500/10 border-amber-500/20'
            }`}>
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className={`text-xs font-black ${theme === 'light' ? 'text-amber-700' : 'text-amber-300'}`}>{profile.currentStreak} Day Streak</span>
            </div>

            {/* Notification simulated drawer */}
            <div className="relative">
              <button
                onClick={() => setShowNotification(!showNotification)}
                className="text-slate-400 hover:text-slate-650 p-1.5 rounded-full hover:bg-white/5 transition relative cursor-pointer"
              >
                <Bell className="w-4.5 h-4.5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full border border-slate-900" />
              </button>
              
              {showNotification && (
                <div className={`absolute right-0 mt-3 w-72 p-4 rounded-2xl shadow-2xl backdrop-blur-xl z-50 text-xs space-y-3 animate-fade-in border transition-all duration-300 ${
                  theme === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-white/10 text-white'
                }`}>
                  <div className={`flex justify-between items-center border-b pb-2 ${theme === 'light' ? 'border-slate-100' : 'border-white/5'}`}>
                    <span className="font-bold">System Notifications</span>
                    <button onClick={() => setShowNotification(false)} className="text-slate-500 hover:text-slate-950 cursor-pointer">Clear</button>
                  </div>
                  <div className="space-y-2.5">
                    {/* Simulated Alert Row for Practice Goal Safeguard */}
                    <div className={`p-2.5 rounded-xl border flex flex-col gap-1.5 ${
                      theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'
                    }`}>
                      <div className="flex justify-between items-center">
                        <p className={`font-bold ${theme === 'light' ? 'text-slate-800' : 'text-slate-350'}`}>⏰ Daily Push Simulator</p>
                        <span className="text-[9px] font-bold bg-blue-500/20 text-blue-500 px-1.5 py-0.5 rounded-md">8 PM Alert</span>
                      </div>
                      <p className={`text-[10px] leading-relaxed ${theme === 'light' ? 'text-slate-500' : 'text-slate-450'}`}>
                        Test how the daily safeguard triggers at 8 PM if practice is incomplete.
                      </p>
                      <button
                        onClick={() => {
                          setPushNotificationDismissed(false);
                          setShowPushNotification(true);
                          setShowNotification(false);
                        }}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-1 px-2 rounded-lg text-[10px] transition text-center cursor-pointer"
                      >
                        Simulate 8 PM Streak Alert
                      </button>
                    </div>

                    <div className={`p-2 rounded-lg border ${theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-white/5 border-white/5'}`}>
                      <p className="font-semibold text-blue-500">📈 Streak Multiplier Active</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Maintain active DSA practices to maximize XP gains!</p>
                    </div>
                    <div className={`p-2 rounded-lg border ${theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-white/5 border-white/5'}`}>
                      <p className="font-semibold text-amber-500">💼 Google Recruitment Call</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Practicing the Google Track opens referral matrices.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main interactive tabs viewport */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {activeTab === 'dashboard' && (
              <DashboardModule profile={profile} setProfile={handleSetProfile} onNavigate={setActiveTab} />
            )}
            {activeTab === 'resume' && (
              <ResumeModule profile={profile} setProfile={handleSetProfile} onAddHistory={handleAddHistory} />
            )}
            {activeTab === 'aptitude' && (
              <AptitudeModule profile={profile} setProfile={handleSetProfile} onAddHistory={handleAddHistory} />
            )}
            {activeTab === 'coding' && (
              <CodingModule profile={profile} setProfile={handleSetProfile} onAddHistory={handleAddHistory} />
            )}
            {activeTab === 'interview' && (
              <InterviewModule profile={profile} setProfile={handleSetProfile} onAddHistory={handleAddHistory} />
            )}
            {activeTab === 'company' && (
              <CompanyModule profile={profile} setProfile={handleSetProfile} onAddHistory={handleAddHistory} />
            )}
            {activeTab === 'leaderboard' && (
              <LeaderboardModule profile={profile} />
            )}
          </div>
        </div>
      </main>

      {/* Upgrade / Referral Modal Simulation */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className={`border rounded-[32px] p-8 max-w-sm w-full text-center space-y-5 animate-fade-in ${
            theme === 'light' ? 'bg-white border-slate-200 text-slate-850 shadow-2xl' : 'bg-slate-900 border-white/10 text-white'
          }`}>
            <Trophy className="w-12 h-12 text-amber-500 mx-auto animate-pulse" />
            <div className="space-y-1">
              <h3 className={`text-lg font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>AI Placement Referral Engine</h3>
              <p className={`text-xs leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                Unlock direct candidate profiles referral mapping. Once you hit <strong className="text-indigo-500">1500 XP</strong> and maintain your streak, we auto-share your top portfolio scorecards with partner tech recruiters at Google, Microsoft, Meta, and Amazon.
              </p>
            </div>
            
            <div className={`border-y py-3 text-xs flex justify-between ${theme === 'light' ? 'border-slate-100' : 'border-white/5'}`}>
              <span className="text-slate-500">Your Current XP</span>
              <span className="font-bold text-amber-500">{profile.xp} XP</span>
            </div>

            <button
              onClick={() => setShowUpgradeModal(false)}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs transition active:scale-95 cursor-pointer"
            >
              Continue Practice (Gain XP)
            </button>
          </div>
        </div>
      )}

      {/* Custom Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className={`border rounded-[28px] p-8 max-w-md w-full space-y-6 animate-fade-in ${
            theme === 'light' ? 'bg-white border-slate-200 text-slate-850 shadow-2xl' : 'bg-slate-900 border-white/10 text-white'
          }`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0 text-red-500">
                <LogOut className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className={`text-base font-black ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Confirm SDE Session Reset</h3>
                <p className="text-[10px] text-blue-500 uppercase font-black tracking-wider">Placement Prep Control Center</p>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-2.5 ${
              theme === 'light' ? 'bg-slate-50 border-slate-250 text-slate-600' : 'bg-white/5 border-white/5 text-slate-300'
            }`}>
              <p className="font-bold text-red-500">🚨 This action is destructive and permanent!</p>
              <p>
                Logging out will clear your authorization token, current progress streaks (<span className="font-bold text-amber-500">{profile?.currentStreak} days</span>), and cumulative <span className="font-bold text-blue-400">{profile?.xp} XP</span> metrics from your device session.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className={`flex-1 font-bold py-2.5 rounded-xl text-xs transition border cursor-pointer ${
                  theme === 'light' 
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' 
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                }`}
              >
                Keep Active Session
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-xs transition active:scale-95 cursor-pointer shadow-lg shadow-red-600/10"
              >
                Reset & Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
