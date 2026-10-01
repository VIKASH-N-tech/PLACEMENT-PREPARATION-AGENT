import React, { useState } from 'react';
import { Award, Calendar, Flame, Target, BookOpen, Clock, ChevronRight, Sparkles, Map, CheckCircle2, AlertCircle, Plus, Minus, TrendingUp } from 'lucide-react';
import { UserProfile } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DashboardModuleProps {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
  onNavigate: (tab: string) => void;
}

export default function DashboardModule({ profile, setProfile, onNavigate }: DashboardModuleProps) {
  const [targetRole, setTargetRole] = useState('Full Stack Engineer');
  const [months, setMonths] = useState(3);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  const [roadmapError, setRoadmapError] = useState('');

  // Daily calendar tracking
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Custom dummy active days based on recent streak
  const activeDays = ['Mon', 'Tue', 'Wed', 'Thu']; 

  const handleGenerateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingRoadmap(true);
    setRoadmapError('');
    setRoadmap(null);
    try {
      const res = await fetch('/api/career/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole, durationMonths: months }),
      });
      const data = await res.json();
      if (data.success && data.roadmap) {
        setRoadmap(data.roadmap);
      } else {
        setRoadmapError(data.error || 'Failed to generate roadmap. Please try again.');
      }
    } catch (err) {
      setRoadmapError('Failed to communicate with the server. Please check your connection.');
    } finally {
      setLoadingRoadmap(false);
    }
  };

  return (
    <div id="dashboard-module" className="space-y-8 animate-fade-in">
      {/* Welcome Hero Banner */}
      <div className="bg-gradient-to-tr from-blue-600/25 to-indigo-500/15 border border-white/10 rounded-[32px] p-8 relative overflow-hidden backdrop-blur-md shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="w-32 h-32 text-blue-400" />
        </div>
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-blue-500/15 border border-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            AI Placement Co-Pilot Active
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 font-extrabold">{profile.name}</span>
          </h1>
          <p className="mt-3 text-slate-300 leading-relaxed text-sm md:text-base">
            Your daily readiness score is <strong className="text-emerald-400">78%</strong>. You are currently on a <strong className="text-amber-400">{profile.currentStreak}-day learning streak</strong>. Practice today to maintain your streak and secure top-tier offers!
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              id="dash-btn-interview"
              onClick={() => onNavigate('interview')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white font-semibold px-5 py-2.5 rounded-xl transition duration-200 text-sm flex items-center gap-2 shadow-lg shadow-blue-500/20"
            >
              Start AI Mock Interview
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              id="dash-btn-resume"
              onClick={() => onNavigate('resume')}
              className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-5 py-2.5 rounded-xl transition duration-200 text-sm font-semibold flex items-center gap-2"
            >
              Optimize Resume
            </button>
          </div>
        </div>
      </div>

      {/* Bento Grid Stats & Streak Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analytics Summary */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 flex items-start gap-4 backdrop-blur-md hover:bg-white/10 transition">
            <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
              <Award className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Placement XP</p>
              <h3 className="text-3xl font-black text-white mt-1">{profile.xp}</h3>
              <p className="text-[10px] text-slate-400 mt-1">+{profile.currentStreak * 10} Streak Bonus XP Included</p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 flex items-start gap-4 backdrop-blur-md hover:bg-white/10 transition">
            <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
              <BookOpen className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Aptitude Quizzes</p>
              <h3 className="text-3xl font-black text-white mt-1">{profile.completedQuizzes}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Average Accuracy: <span className="text-emerald-400">82%</span></p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 flex items-start gap-4 backdrop-blur-md hover:bg-white/10 transition">
            <div className="bg-purple-500/10 p-3 rounded-xl border border-purple-500/20">
              <Target className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Coding Challenges</p>
              <h3 className="text-3xl font-black text-white mt-1">{profile.completedCoding}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Top Language: <span className="text-purple-400">Python</span></p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 flex items-start gap-4 backdrop-blur-md hover:bg-white/10 transition">
            <div className="bg-pink-500/10 p-3 rounded-xl border border-pink-500/20">
              <Clock className="w-6 h-6 text-pink-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mock Interviews</p>
              <h3 className="text-3xl font-black text-white mt-1">{profile.completedInterviews}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Avg Score: <span className="text-pink-400">8.4/10</span></p>
            </div>
          </div>
        </div>

        {/* Streak and Action Calendar */}
        <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 flex flex-col justify-between backdrop-blur-md">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-6 h-6 text-amber-500 fill-amber-500" />
                <h3 className="text-base font-bold text-slate-200">Daily Streak</h3>
              </div>
              <span className="text-xs font-bold text-slate-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                Longest: {profile.longestStreak} days
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-5xl font-black text-amber-400">{profile.currentStreak}</span>
              <span className="text-xs font-semibold text-slate-400">days active</span>
            </div>
            
            {/* Weekdays indicator */}
            <div className="grid grid-cols-7 gap-2 mt-6">
              {weekdays.map((day) => {
                const isActive = activeDays.includes(day);
                return (
                  <div key={day} className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-slate-500">{day}</span>
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
                        isActive
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 font-bold'
                          : 'bg-white/5 border-white/5 text-slate-600'
                      }`}
                    >
                      {isActive ? <Flame className="w-4 h-4 text-amber-400 fill-amber-400" /> : <Calendar className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-4 border-t border-white/5 pt-4 leading-relaxed">
            ⚡ Maintain consistency to unlock custom referral benefits & exclusive interview masterclasses.
          </p>
        </div>
      </div>

      {/* Study Schedule & Skill Progress Curve Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Study Schedule Card (col-span-5) */}
        <div className={`lg:col-span-5 border rounded-[32px] p-6 backdrop-blur-md flex flex-col justify-between transition-colors duration-300 ${
          profile.theme === 'light' ? 'bg-white border-slate-200 text-slate-800 shadow-xs' : 'bg-white/5 border-white/10 text-white'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                <h3 className={`text-base font-bold ${profile.theme === 'light' ? 'text-slate-900' : 'text-slate-200'}`}>Study Schedule</h3>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                profile.theme === 'light' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              }`}>
                Weekly Goals
              </span>
            </div>
            
            <p className={`text-xs mb-6 leading-relaxed ${profile.theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
              Establish weekly targets for both aptitude evaluations and coding challenges. Your completion values reflect real-time practice stats.
            </p>

            {/* Metrics Checklist */}
            <div className="space-y-5">
              {/* Aptitude Goals */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-semibold ${profile.theme === 'light' ? 'text-slate-700' : 'text-slate-350'}`}>Aptitude Practice</span>
                  <span className="font-mono text-[11px]">
                    Goal: {profile.studySchedule?.aptitudeGoal || 5} | Done: {profile.studySchedule?.aptitudeDone ?? profile.completedQuizzes}
                  </span>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Progress Bar */}
                  <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden relative border border-white/5">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.min(100, Math.round(((profile.studySchedule?.aptitudeDone ?? profile.completedQuizzes) / (profile.studySchedule?.aptitudeGoal || 5)) * 100))}%` 
                      }}
                    />
                  </div>
                  <span className="text-xs font-black min-w-[36px] text-right text-blue-400">
                    {Math.min(100, Math.round(((profile.studySchedule?.aptitudeDone ?? profile.completedQuizzes) / (profile.studySchedule?.aptitudeGoal || 5)) * 100))}%
                  </span>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 justify-end pt-1">
                  <button
                    onClick={() => {
                      const curGoal = profile.studySchedule?.aptitudeGoal || 5;
                      const nextGoal = Math.max(1, curGoal - 1);
                      setProfile({
                        ...profile,
                        studySchedule: {
                          aptitudeGoal: nextGoal,
                          codingGoal: profile.studySchedule?.codingGoal || 5,
                          aptitudeDone: profile.studySchedule?.aptitudeDone ?? profile.completedQuizzes,
                          codingDone: profile.studySchedule?.codingDone ?? profile.completedCoding,
                        }
                      });
                    }}
                    className={`p-1.5 rounded-lg border transition ${
                      profile.theme === 'light' ? 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                    title="Decrease Goal"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      const curGoal = profile.studySchedule?.aptitudeGoal || 5;
                      const nextGoal = curGoal + 1;
                      setProfile({
                        ...profile,
                        studySchedule: {
                          aptitudeGoal: nextGoal,
                          codingGoal: profile.studySchedule?.codingGoal || 5,
                          aptitudeDone: profile.studySchedule?.aptitudeDone ?? profile.completedQuizzes,
                          codingDone: profile.studySchedule?.codingDone ?? profile.completedCoding,
                        }
                      });
                    }}
                    className={`p-1.5 rounded-lg border transition ${
                      profile.theme === 'light' ? 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                    title="Increase Goal"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-px h-4 bg-white/10 mx-1" />
                  <button
                    onClick={() => {
                      const curDone = profile.studySchedule?.aptitudeDone ?? profile.completedQuizzes;
                      const nextDone = curDone + 1;
                      setProfile({
                        ...profile,
                        studySchedule: {
                          aptitudeGoal: profile.studySchedule?.aptitudeGoal || 5,
                          codingGoal: profile.studySchedule?.codingGoal || 5,
                          aptitudeDone: nextDone,
                          codingDone: profile.studySchedule?.codingDone ?? profile.completedCoding,
                        }
                      });
                    }}
                    className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg hover:bg-emerald-500/25 transition cursor-pointer"
                  >
                    Simulate Done
                  </button>
                </div>
              </div>

              {/* Coding Goals */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-semibold ${profile.theme === 'light' ? 'text-slate-700' : 'text-slate-350'}`}>Coding Sandbox</span>
                  <span className="font-mono text-[11px]">
                    Goal: {profile.studySchedule?.codingGoal || 5} | Done: {profile.studySchedule?.codingDone ?? profile.completedCoding}
                  </span>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Progress Bar */}
                  <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden relative border border-white/5">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.min(100, Math.round(((profile.studySchedule?.codingDone ?? profile.completedCoding) / (profile.studySchedule?.codingGoal || 5)) * 100))}%` 
                      }}
                    />
                  </div>
                  <span className="text-xs font-black min-w-[36px] text-right text-purple-400">
                    {Math.min(100, Math.round(((profile.studySchedule?.codingDone ?? profile.completedCoding) / (profile.studySchedule?.codingGoal || 5)) * 100))}%
                  </span>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 justify-end pt-1">
                  <button
                    onClick={() => {
                      const curGoal = profile.studySchedule?.codingGoal || 5;
                      const nextGoal = Math.max(1, curGoal - 1);
                      setProfile({
                        ...profile,
                        studySchedule: {
                          aptitudeGoal: profile.studySchedule?.aptitudeGoal || 5,
                          codingGoal: nextGoal,
                          aptitudeDone: profile.studySchedule?.aptitudeDone ?? profile.completedQuizzes,
                          codingDone: profile.studySchedule?.codingDone ?? profile.completedCoding,
                        }
                      });
                    }}
                    className={`p-1.5 rounded-lg border transition ${
                      profile.theme === 'light' ? 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                    title="Decrease Goal"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      const curGoal = profile.studySchedule?.codingGoal || 5;
                      const nextGoal = curGoal + 1;
                      setProfile({
                        ...profile,
                        studySchedule: {
                          aptitudeGoal: profile.studySchedule?.aptitudeGoal || 5,
                          codingGoal: nextGoal,
                          aptitudeDone: profile.studySchedule?.aptitudeDone ?? profile.completedQuizzes,
                          codingDone: profile.studySchedule?.codingDone ?? profile.completedCoding,
                        }
                      });
                    }}
                    className={`p-1.5 rounded-lg border transition ${
                      profile.theme === 'light' ? 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                    title="Increase Goal"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-px h-4 bg-white/10 mx-1" />
                  <button
                    onClick={() => {
                      const curDone = profile.studySchedule?.codingDone ?? profile.completedCoding;
                      const nextDone = curDone + 1;
                      setProfile({
                        ...profile,
                        studySchedule: {
                          aptitudeGoal: profile.studySchedule?.aptitudeGoal || 5,
                          codingGoal: profile.studySchedule?.codingGoal || 5,
                          aptitudeDone: profile.studySchedule?.aptitudeDone ?? profile.completedQuizzes,
                          codingDone: nextDone,
                        }
                      });
                    }}
                    className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg hover:bg-emerald-500/25 transition cursor-pointer"
                  >
                    Simulate Done
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className={`mt-6 text-[10px] leading-relaxed border-t pt-4 ${
            profile.theme === 'light' ? 'border-slate-100 text-slate-500' : 'border-white/5 text-slate-400'
          }`}>
            🎯 Completion rates of 100% award an extra +150 bonus XP at the end of the week.
          </div>
        </div>

        {/* Skill Progress Visualization (col-span-7) */}
        <div className={`lg:col-span-7 border rounded-[32px] p-6 backdrop-blur-md flex flex-col justify-between transition-colors duration-300 ${
          profile.theme === 'light' ? 'bg-white border-slate-200 text-slate-800 shadow-xs' : 'bg-white/5 border-white/10 text-white'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                <h3 className={`text-base font-bold ${profile.theme === 'light' ? 'text-slate-900' : 'text-slate-200'}`}>Skill Progress Velocity</h3>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                profile.theme === 'light' 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600' 
                  : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
              }`}>
                Real-Time Trends
              </span>
            </div>
            
            <p className={`text-xs mb-6 leading-relaxed ${profile.theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
              Displays score improvement over time across key prep fields. Practicing more will raise the "Current" milestone metrics!
            </p>
          </div>

          <div className="h-60 w-full font-sans">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={[
                  { name: 'Start', Aptitude: 55, Coding: 40, Interview: 50 },
                  { name: 'Week 2', Aptitude: 65, Coding: 52, Interview: 58 },
                  { name: 'Week 3', Aptitude: 72, Coding: 65, Interview: 67 },
                  { name: 'Week 4', Aptitude: 80, Coding: 75, Interview: 74 },
                  {
                    name: 'Current',
                    Aptitude: Math.min(100, 75 + ((profile.studySchedule?.aptitudeDone ?? profile.completedQuizzes) * 2)),
                    Coding: Math.min(100, 65 + ((profile.studySchedule?.codingDone ?? profile.completedCoding) * 3)),
                    Interview: Math.min(100, 70 + (profile.completedInterviews * 4)),
                  },
                ]} 
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorAptitude" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCoding" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorInterview" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={profile.theme === 'light' ? 'rgba(15,23,42,0.06)' : 'rgba(255,255,255,0.06)'} />
                <XAxis dataKey="name" stroke={profile.theme === 'light' ? 'rgba(15,23,42,0.4)' : 'rgba(255,255,255,0.4)'} fontSize={10} tickLine={false} />
                <YAxis stroke={profile.theme === 'light' ? 'rgba(15,23,42,0.4)' : 'rgba(255,255,255,0.4)'} fontSize={10} tickLine={false} domain={[30, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: profile.theme === 'light' ? '#ffffff' : '#1e293b',
                    border: profile.theme === 'light' ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: profile.theme === 'light' ? '#0f172a' : '#fff',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Area type="monotone" name="Aptitude" dataKey="Aptitude" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAptitude)" />
                <Area type="monotone" name="Coding" dataKey="Coding" stroke="#a855f7" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCoding)" />
                <Area type="monotone" name="Interview" dataKey="Interview" stroke="#ec4899" strokeWidth={2.5} fillOpacity={1} fill="url(#colorInterview)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Weak Topics & Career Planner Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weak Topics Insights */}
        <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-[32px] p-6 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold text-slate-200">Personalized Insights</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Based on your mock questions and aptitude performance, our AI identified critical improvement goals. Tackle these to increase your offer matches:
            </p>
            <div className="space-y-4">
              {profile.weakTopics.map((item, index) => (
                <div key={index} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">{item.topic}</span>
                    <span className={`font-bold ${item.score < 50 ? 'text-red-400' : 'text-amber-400'}`}>{item.score}% Mastery</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full`}
                      style={{ width: `${item.score}%`, backgroundColor: item.score < 50 ? '#ef4444' : '#f59e0b' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => onNavigate('aptitude')}
            className="w-full mt-6 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 py-2.5 rounded-xl text-xs font-semibold transition"
          >
            Review and Practice Weak Topics
          </button>
        </div>

        {/* AI Career Prep Planner & Roadmap */}
        <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-[32px] p-6 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-2">
            <Map className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-slate-200">AI Placement Roadmap Generator</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Create a structured study timeline directly mapped to your target tech role.
          </p>

          <form onSubmit={handleGenerateRoadmap} className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-4">
            <div className="sm:col-span-6">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Target Role</label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Frontend React Dev, Data Engineer"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Duration</label>
              <select
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
              >
                <option value={1}>1 Month</option>
                <option value={2}>2 Months</option>
                <option value={3}>3 Months</option>
                <option value={6}>6 Months</option>
              </select>
            </div>
            <div className="sm:col-span-3 flex items-end">
              <button
                type="submit"
                disabled={loadingRoadmap}
                className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-50 text-slate-100 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
              >
                {loadingRoadmap ? (
                  <span className="w-4.5 h-4.5 border-2 border-slate-200 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Build Path
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Roadmap Result */}
          {roadmapError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4.5 h-4.5" />
              {roadmapError}
            </div>
          )}

          {roadmap && (
            <div className="border border-white/10 bg-black/20 rounded-xl p-4 max-h-[280px] overflow-y-auto space-y-4 custom-scrollbar">
              <div className="border-b border-white/5 pb-2">
                <h4 className="text-sm font-bold text-indigo-400">{roadmap.title}</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{roadmap.overview}</p>
              </div>
              <div className="space-y-4">
                {roadmap.timeline?.map((step: any, idx: number) => (
                  <div key={idx} className="relative pl-5 border-l-2 border-indigo-500/30 last:border-0 pb-2">
                    <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-indigo-500" />
                    <h5 className="text-xs font-bold text-slate-200">{step.month}: {step.focus}</h5>
                    <p className="text-[11px] text-emerald-400 mt-0.5">Project Goal: {step.projectGoal}</p>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase">DSA Focus</span>
                        <ul className="list-disc list-inside text-[10px] text-slate-400 space-y-0.5">
                          {step.dsaTopics?.map((t: string, i: number) => <li key={i}>{t}</li>)}
                        </ul>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase">Milestones</span>
                        <ul className="list-disc list-inside text-[10px] text-slate-400 space-y-0.5">
                          {step.weeklyMilestones?.map((m: string, i: number) => <li key={i}>{m}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/5 pt-3">
                <span className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Recommended Material</span>
                <div className="flex flex-wrap gap-1.5">
                  {roadmap.recommendedResources?.map((res: string, i: number) => (
                    <span key={i} className="bg-white/5 border border-white/5 text-slate-300 px-2 py-0.5 rounded-md text-[10px]">
                      {res}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!roadmap && !loadingRoadmap && (
            <div className="border border-dashed border-white/10 rounded-xl p-8 text-center text-slate-500 flex flex-col items-center justify-center">
              <Map className="w-8 h-8 text-slate-600 mb-2 animate-pulse" />
              <p className="text-xs">No roadmap generated yet. Select your target role above and build your custom path.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Recent Activity Logs</h3>
          <span className="text-[10px] uppercase font-bold text-slate-500">History sync'd</span>
        </div>
        <div className="divide-y divide-white/5">
          {profile.history.map((item) => (
            <div key={item.id} className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    item.type === 'aptitude'
                      ? 'bg-blue-450'
                      : item.type === 'coding'
                      ? 'bg-purple-450'
                      : item.type === 'interview'
                      ? 'bg-pink-450'
                      : 'bg-emerald-450'
                  }`}
                />
                <div>
                  <h4 className="font-semibold text-slate-300">{item.title}</h4>
                  <p className="text-[10px] text-slate-500">{item.date}</p>
                </div>
              </div>
              {item.score !== undefined && (
                <span className="font-mono text-[10px] font-bold text-slate-300 bg-white/5 px-2.5 py-0.5 border border-white/5 rounded-lg">
                  {item.score}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
