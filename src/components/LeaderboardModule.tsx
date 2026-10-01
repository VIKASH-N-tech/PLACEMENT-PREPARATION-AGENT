import { useState } from 'react';
import { Award, Flame, Search, Sparkles, User, Medal, Trophy } from 'lucide-react';
import { UserProfile, LeaderboardEntry } from '../types';

interface LeaderboardModuleProps {
  profile: UserProfile;
}

export default function LeaderboardModule({ profile }: LeaderboardModuleProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Pre-configured competitive cohort
  const defaultLeaderboard: LeaderboardEntry[] = [
    { rank: 1, name: 'Siddharth Sharma', email: 'siddharth@gmail.com', xp: 2840, streak: 21 },
    { rank: 2, name: 'Priya Patel', email: 'priya@outlook.com', xp: 2410, streak: 14 },
    { rank: 3, name: 'Amit Verma', email: 'amit.verma@yahoo.com', xp: 2150, streak: 18 },
    { rank: 4, name: 'Anjali Nair', email: 'anjali@naver.com', xp: 1980, streak: 9 },
    { rank: 5, name: 'Vikash Kumar (You)', email: profile.email, xp: profile.xp, streak: profile.currentStreak, isCurrentUser: true },
    { rank: 6, name: 'Rohan Deshmukh', email: 'rohan.d@gmail.com', xp: 1450, streak: 12 },
    { rank: 7, name: 'Kirti Sen', email: 'kirti@live.com', xp: 1280, streak: 5 },
    { rank: 8, name: 'Sanjay Dutt', email: 'sanjay@gmail.com', xp: 1100, streak: 7 },
  ];

  // Dynamically update and sort leaderboard with user's current live XP
  const sortedLeaderboard = [...defaultLeaderboard]
    .map(entry => {
      if (entry.isCurrentUser) {
        return {
          ...entry,
          xp: profile.xp,
          streak: profile.currentStreak
        };
      }
      return entry;
    })
    .sort((a, b) => b.xp - a.xp)
    .map((entry, idx) => ({
      ...entry,
      rank: idx + 1
    }));

  const filteredLeaderboard = sortedLeaderboard.filter(entry =>
    entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="leaderboard-module" className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white/5 border border-white/10 rounded-[32px] p-8 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-[-40px] right-[-40px] w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div>
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-300 px-3 py-1 rounded-full text-xs font-semibold mb-3">
            <Trophy className="w-3.5 h-3.5" />
            Live Placements Cohort
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Placement Prep Leaderboard</h2>
          <p className="mt-2 text-slate-400 text-sm max-w-2xl">
            Compare and benchmark your conceptual mastery with global candidates. Earn placement XP by writing optimal routines, reviewing resumes, and tackling aptitude sets.
          </p>
        </div>
      </div>

      {/* Podium Top 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {/* 2nd Place */}
        {sortedLeaderboard[1] && (
          <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 text-center backdrop-blur-md relative overflow-hidden order-2 md:order-1 flex flex-col justify-center items-center">
            <div className="w-12 h-12 rounded-full bg-slate-500/20 text-slate-300 flex items-center justify-center font-bold mb-3 border border-slate-500/30">
              2
            </div>
            <h4 className="font-bold text-white text-sm">{sortedLeaderboard[1].name}</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">{sortedLeaderboard[1].email}</p>
            <div className="mt-3 flex items-center gap-4 text-xs">
              <span className="text-indigo-400 font-bold">{sortedLeaderboard[1].xp} XP</span>
              <span className="text-amber-400 font-bold flex items-center gap-0.5">
                🔥 {sortedLeaderboard[1].streak}d
              </span>
            </div>
          </div>
        )}

        {/* 1st Place */}
        {sortedLeaderboard[0] && (
          <div className="bg-gradient-to-b from-amber-500/10 to-indigo-500/10 border border-amber-500/30 rounded-[32px] p-8 text-center backdrop-blur-md relative overflow-hidden order-1 md:order-2 flex flex-col justify-center items-center scale-105">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Trophy className="w-24 h-24 text-amber-500" />
            </div>
            <div className="w-14 h-14 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-lg mb-3 shadow-lg shadow-amber-500/20">
              🏆
            </div>
            <h4 className="font-black text-white text-base flex items-center gap-1">
              {sortedLeaderboard[0].name}
              <Sparkles className="w-4 h-4 text-amber-400" />
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">{sortedLeaderboard[0].email}</p>
            <div className="mt-4 flex items-center gap-6 text-xs bg-black/25 px-4 py-1.5 rounded-full border border-white/5">
              <span className="text-amber-400 font-bold">{sortedLeaderboard[0].xp} XP</span>
              <span className="text-amber-500 font-bold flex items-center gap-0.5">
                🔥 {sortedLeaderboard[0].streak}d
              </span>
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {sortedLeaderboard[2] && (
          <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 text-center backdrop-blur-md relative overflow-hidden order-3 flex flex-col justify-center items-center">
            <div className="w-12 h-12 rounded-full bg-amber-700/20 text-amber-600 flex items-center justify-center font-bold mb-3 border border-amber-700/30">
              3
            </div>
            <h4 className="font-bold text-white text-sm">{sortedLeaderboard[2].name}</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">{sortedLeaderboard[2].email}</p>
            <div className="mt-3 flex items-center gap-4 text-xs">
              <span className="text-indigo-400 font-bold">{sortedLeaderboard[2].xp} XP</span>
              <span className="text-amber-400 font-bold flex items-center gap-0.5">
                🔥 {sortedLeaderboard[2].streak}d
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 backdrop-blur-md space-y-4">
        {/* Search header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Benchmark Rankings</h3>
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search competitors by name..."
              className="w-full bg-white/5 border border-white/10 text-xs text-white rounded-xl pl-10 pr-4 py-2 focus:outline-hidden focus:border-amber-500"
            />
          </div>
        </div>

        {/* Responsive Table grid */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs text-slate-300">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase font-bold text-slate-500">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Candidate</th>
                <th className="py-3 px-4 text-right">Placement XP</th>
                <th className="py-3 px-4 text-right">Streak</th>
                <th className="py-3 px-4 text-right">League Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLeaderboard.map((user) => {
                const isUser = user.isCurrentUser;
                return (
                  <tr
                    key={user.email}
                    className={`transition hover:bg-white/5 ${
                      isUser
                        ? 'bg-amber-500/10 border-y border-amber-500/20 text-white font-semibold'
                        : ''
                    }`}
                  >
                    <td className="py-4 px-4 font-bold text-slate-400">
                      {user.rank === 1 ? '🥇 1' : user.rank === 2 ? '🥈 2' : user.rank === 3 ? '🥉 3' : user.rank}
                    </td>
                    <td className="py-4 px-4 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold ${
                        isUser
                          ? 'bg-amber-500/20 border-amber-500/30 text-amber-300'
                          : 'bg-white/5 border-white/10 text-slate-400'
                      }`}>
                        {isUser ? <User className="w-4 h-4 text-amber-300" /> : user.name[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-200">{user.name}</p>
                        <p className="text-[10px] text-slate-500">{user.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-indigo-400">{user.xp} XP</td>
                    <td className="py-4 px-4 text-right text-amber-400 font-bold">
                      🔥 {user.streak} days
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        user.xp >= 2000
                          ? 'bg-indigo-500/20 text-indigo-300'
                          : user.xp >= 1500
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {user.xp >= 2000 ? 'Expert' : user.xp >= 1500 ? 'Pioneer' : 'Associate'}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredLeaderboard.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                    No active competitors match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
