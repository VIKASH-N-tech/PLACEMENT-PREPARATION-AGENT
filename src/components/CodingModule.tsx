import React, { useState, useEffect } from 'react';
import { Code, Terminal, Sparkles, Award, Play, BookOpen, CheckCircle, AlertCircle, RefreshCw, Lightbulb, Database, Eye, Check } from 'lucide-react';
import { UserProfile, CodingChallenge, Difficulty } from '../types';

interface CodingModuleProps {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
  onAddHistory: (item: { type: 'aptitude' | 'coding' | 'interview' | 'resume'; title: string; score?: string | number }) => void;
}

type Language = 'python' | 'cpp' | 'java' | 'javascript';

// SQL Challenge Types
interface SQLChallenge {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  schemaDescription: string;
  tables: Array<{ name: string; columns: string[] }>;
  goal: string;
  starterQuery: string;
  simulatedRows: Array<Record<string, any>>;
}

export default function CodingModule({ profile, setProfile, onAddHistory }: CodingModuleProps) {
  const [activeWorkspace, setActiveWorkspace] = useState<'dsa' | 'sql'>('dsa');

  // -------------------------------------------------------------
  // 1. DSA WORKSPACE STATES
  // -------------------------------------------------------------
  const [challenges, setChallenges] = useState<CodingChallenge[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(false);
  const [activeChallenge, setActiveChallenge] = useState<CodingChallenge | null>(null);
  
  const [language, setLanguage] = useState<Language>('python');
  const [code, setCode] = useState('');
  const [hintsRevealed, setHintsRevealed] = useState<number>(0);
  
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [evalError, setEvalError] = useState('');

  // Bonus Tools
  const [showEdgeCases, setShowEdgeCases] = useState(false);
  const [edgeCases, setEdgeCases] = useState<any[]>([]);
  const [showDryRun, setShowDryRun] = useState(false);
  const [dryRunTrace, setDryRunTrace] = useState<any[]>([]);

  // -------------------------------------------------------------
  // 2. SQL WORKSPACE STATES
  // -------------------------------------------------------------
  const sqlChallenges: SQLChallenge[] = [
    {
      id: 'sql1',
      title: 'Warmup Order Audit',
      difficulty: 'easy',
      schemaDescription: 'Query the user spend database to audit high-value customers.',
      tables: [
        { name: 'Users', columns: ['id (INT)', 'name (VARCHAR)', 'created_at (DATE)'] },
        { name: 'Orders', columns: ['id (INT)', 'user_id (INT)', 'amount (DECIMAL)', 'order_date (DATE)'] }
      ],
      goal: 'Find the name and total amount spent of all users who have spent more than $500 in total across all orders. Order the results descending by total amount spent.',
      starterQuery: 'SELECT u.name, SUM(o.amount) AS total_spent\nFROM Users u\nJOIN Orders o ON u.id = o.user_id\nWHERE ... \nGROUP BY u.name\nHAVING ...\nORDER BY total_spent DESC;',
      simulatedRows: [
        { name: 'Vijay Kumar', total_spent: '$1,240.50' },
        { name: 'Aditi Sharma', total_spent: '$890.00' },
        { name: 'Rajesh Patel', total_spent: '$610.25' }
      ]
    },
    {
      id: 'sql2',
      title: 'Multi-Branch Salary Outliers',
      difficulty: 'medium',
      schemaDescription: 'Analyze corporate department structures for compensation review.',
      tables: [
        { name: 'Employees', columns: ['id (INT)', 'name (VARCHAR)', 'department_id (INT)', 'salary (DECIMAL)'] },
        { name: 'Departments', columns: ['id (INT)', 'dept_name (VARCHAR)', 'location (VARCHAR)'] }
      ],
      goal: 'Retrieve each department name and the average salary of its employees, but only for departments where the average employee salary exceeds $75,000. Round salaries to 2 decimal places.',
      starterQuery: 'SELECT d.dept_name, ROUND(AVG(e.salary), 2) AS average_salary\nFROM Departments d\nLEFT JOIN Employees e ON d.id = e.department_id\nGROUP BY d.dept_name\nHAVING ...;',
      simulatedRows: [
        { dept_name: 'Infrastructure & SRE', average_salary: '$115,400.00' },
        { dept_name: 'Product Engineering', average_salary: '$89,200.50' }
      ]
    },
    {
      id: 'sql3',
      title: 'Active Subscription Metrics',
      difficulty: 'hard',
      schemaDescription: 'Determine retention metrics across high-activity subscriber cohorts.',
      tables: [
        { name: 'Subscriptions', columns: ['id (INT)', 'user_id (INT)', 'status (VARCHAR)', 'price (DECIMAL)'] },
        { name: 'UserLogs', columns: ['id (INT)', 'user_id (INT)', 'active_hours (INT)', 'activity_month (VARCHAR)'] }
      ],
      goal: 'Write a query to retrieve the user IDs of active subscribers (status = "active") who have logged more than 40 hours of platform activity in "June 2026", and have paid more than $40 for their subscription.',
      starterQuery: 'SELECT s.user_id\nFROM Subscriptions s\nWHERE s.status = \'active\'\n  AND s.price > 40\n  AND s.user_id IN (\n      SELECT l.user_id \n      FROM UserLogs l\n      WHERE ...\n  );',
      simulatedRows: [
        { user_id: 1045 },
        { user_id: 1109 },
        { user_id: 2011 }
      ]
    }
  ];

  const [activeSqlChallenge, setActiveSqlChallenge] = useState<SQLChallenge>(sqlChallenges[0]);
  const [sqlQuery, setSqlQuery] = useState(sqlChallenges[0].starterQuery);
  const [evaluatingSql, setEvaluatingSql] = useState(false);
  const [sqlEvaluation, setSqlEvaluation] = useState<any>(null);
  const [sqlEvalError, setSqlEvalError] = useState('');

  // -------------------------------------------------------------
  // DSA INITIALIZATION & LOADER
  // -------------------------------------------------------------
  useEffect(() => {
    const fetchChallenges = async () => {
      setLoadingChallenges(true);
      try {
        const res = await fetch('/api/coding/challenges');
        const data = await res.json();
        if (data.success && Array.isArray(data.challenges)) {
          setChallenges(data.challenges);
          if (data.challenges.length > 0) {
            setActiveChallenge(data.challenges[0]);
            setCode(data.challenges[0].starterCode.python);
          }
        }
      } catch (err) {
        console.error('Error loading challenges:', err);
      } finally {
        setLoadingChallenges(false);
      }
    };
    fetchChallenges();
  }, []);

  const handleSelectChallenge = (challenge: CodingChallenge) => {
    setActiveChallenge(challenge);
    setCode(challenge.starterCode[language]);
    setHintsRevealed(0);
    setEvaluation(null);
    setEvalError('');
    setShowEdgeCases(false);
    setShowDryRun(false);
  };

  const handleSelectLanguage = (lang: Language) => {
    setLanguage(lang);
    if (activeChallenge) {
      setCode(activeChallenge.starterCode[lang]);
    }
  };

  const handleRevealHint = () => {
    if (activeChallenge && hintsRevealed < activeChallenge.hints.length) {
      setHintsRevealed(hintsRevealed + 1);
    }
  };

  const handleResetCode = () => {
    if (activeChallenge) {
      setCode(activeChallenge.starterCode[language]);
      setEvaluation(null);
      setEvalError('');
    }
  };

  // -------------------------------------------------------------
  // DSA BONUS UTILITIES (Edge cases & Dry-Run Visualizer)
  // -------------------------------------------------------------
  const triggerGenerateEdgeCases = () => {
    if (!activeChallenge) return;
    setShowDryRun(false);
    setEdgeCases([
      { title: 'Empty / Null Input Bounds', effect: 'Should return default boundary (e.g. 0 or empty list) gracefully without raising segment or attribute exceptions.' },
      { title: 'Extreme Duplicates & Constraints', effect: 'Array where all keys are identical integers. Verifies sorting partitions and binary boundary overflows function correctly.' },
      { title: 'Large Volume Scales', effect: 'Input arrays containing 10,000+ records. Tests if your approach satisfies optimal time complexity benchmarks.' }
    ]);
    setShowEdgeCases(true);
  };

  const triggerDryRunTrace = () => {
    if (!activeChallenge) return;
    setShowEdgeCases(false);
    setDryRunTrace([
      { step: 1, pointer: 'Init', state: 'left = 0, right = n-1, map = {}', msg: 'System structures ready. Pointers centered at array margins.' },
      { step: 2, pointer: 'Loop (i=0)', state: 'left = 1, current_sum = target', msg: 'Match verified. Current left pointer incremented.' },
      { step: 3, pointer: 'Final', state: 'Return optimal match indices', msg: 'Trace closed with exit code 0.' }
    ]);
    setShowDryRun(true);
  };

  // -------------------------------------------------------------
  // DSA CORE EVALUATOR
  // -------------------------------------------------------------
  const handleEvaluateSolution = async () => {
    if (!activeChallenge) return;
    setEvaluating(true);
    setEvalError('');
    setEvaluation(null);
    try {
      const res = await fetch('/api/coding/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeTitle: activeChallenge.title,
          description: activeChallenge.description,
          code,
          language
        }),
      });
      const data = await res.json();
      if (data.success && data.evaluation) {
        setEvaluation(data.evaluation);
        
        const codeScore = data.evaluation.score || 0;
        if (codeScore > 60) {
          setProfile({
            ...profile,
            xp: profile.xp + 150,
            completedCoding: profile.completedCoding + 1,
            currentStreak: profile.currentStreak === 0 ? 1 : profile.currentStreak,
          });

          onAddHistory({
            type: 'coding',
            title: `DSA Code Challenge: ${activeChallenge.title}`,
            score: `${codeScore}/100 Score`
          });
        }
      } else {
        setEvalError(data.error || 'Syntax validation failed. Please review your code block.');
      }
    } catch (err) {
      setEvalError('Timeout reviewing solution. Verify connectivity.');
    } finally {
      setEvaluating(false);
    }
  };

  // -------------------------------------------------------------
  // SQL WORKSPACE ACTIONS
  // -------------------------------------------------------------
  const handleSelectSqlChallenge = (chal: SQLChallenge) => {
    setActiveSqlChallenge(chal);
    setSqlQuery(chal.starterQuery);
    setSqlEvaluation(null);
    setSqlEvalError('');
  };

  const handleEvaluateSqlSolution = async () => {
    setEvaluatingSql(true);
    setSqlEvalError('');
    setSqlEvaluation(null);
    try {
      const schemaCtx = activeSqlChallenge.tables.map(t => `${t.name}(${t.columns.join(', ')})`).join(' and ');
      const descPayload = `Goal: ${activeSqlChallenge.goal}. Databases: ${schemaCtx}`;

      const res = await fetch('/api/coding/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeTitle: `SQL query: ${activeSqlChallenge.title}`,
          description: descPayload,
          code: sqlQuery,
          language: 'sql'
        }),
      });
      const data = await res.json();
      if (data.success && data.evaluation) {
        setSqlEvaluation(data.evaluation);

        const scoreVal = data.evaluation.score || 0;
        if (scoreVal > 60) {
          setProfile({
            ...profile,
            xp: profile.xp + 150,
            completedCoding: profile.completedCoding + 1,
            currentStreak: profile.currentStreak === 0 ? 1 : profile.currentStreak,
          });

          onAddHistory({
            type: 'coding',
            title: `SQL Practice: ${activeSqlChallenge.title}`,
            score: `${scoreVal}/100 Correct`
          });
        }
      } else {
        setSqlEvalError(data.error || 'SQL parser was unable to validate this query.');
      }
    } catch (err) {
      setSqlEvalError('Failed to communicate with the SQL query validation engine.');
    } finally {
      setEvaluatingSql(false);
    }
  };

  return (
    <div id="coding-module" className="space-y-6 animate-fade-in">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white/5 border border-white/10 rounded-[32px] p-8 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-[-40px] right-[-40px] w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div>
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-xs font-semibold mb-3">
            <Code className="w-3.5 h-3.5" />
            AI Sandbox Engine
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Technical Code Practice Arena</h2>
          <p className="mt-2 text-slate-400 text-sm max-w-2xl">
            Sharpen your programming skills. Toggle between advanced DSA software engineering challenges and full relational SQL queries frequently evaluated by recruiters.
          </p>
        </div>
      </div>

      {/* Primary tab workspace navigation */}
      <div className="flex border-b border-white/10 gap-2">
        <button
          onClick={() => setActiveWorkspace('dsa')}
          className={`px-6 py-3 text-xs font-bold rounded-t-xl border-t border-x transition flex items-center gap-2 ${
            activeWorkspace === 'dsa'
              ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
              : 'bg-transparent border-transparent text-slate-450 hover:text-white'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          💻 DSA Coding Challenges
        </button>
        <button
          onClick={() => setActiveWorkspace('sql')}
          className={`px-6 py-3 text-xs font-bold rounded-t-xl border-t border-x transition flex items-center gap-2 ${
            activeWorkspace === 'sql'
              ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
              : 'bg-transparent border-transparent text-slate-450 hover:text-white'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          🛢️ SQL Query Sandbox
        </button>
      </div>

      {/* -------------------------------------------------------------
          DSA WORKSPACE WORKBENCH
          ------------------------------------------------------------- */}
      {activeWorkspace === 'dsa' && (
        <>
          {loadingChallenges && (
            <div className="bg-white/5 border border-white/10 rounded-[32px] p-16 text-center flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {challenges.length > 0 && activeChallenge && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Sidebar Problem Selector */}
              <div className="lg:col-span-3 bg-white/5 border border-white/10 rounded-[32px] p-6 backdrop-blur-md h-fit space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Challenge Board</h4>
                <div className="space-y-2">
                  {challenges.map((chal) => {
                    const isActive = activeChallenge.id === chal.id;
                    return (
                      <button
                        key={chal.id}
                        id={`chal-tab-${chal.id}`}
                        onClick={() => handleSelectChallenge(chal)}
                        className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                          isActive
                            ? 'bg-purple-500/15 border-purple-500/40 text-purple-200 font-semibold'
                            : 'bg-white/5 border-white/5 hover:bg-white/10 text-slate-450 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs truncate font-medium">{chal.title}</span>
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              chal.difficulty === 'easy'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : chal.difficulty === 'medium'
                                ? 'bg-amber-500/10 text-amber-400'
                                : 'bg-red-500/10 text-red-400'
                            }`}
                          >
                            {chal.difficulty}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main IDE Interface */}
              <div className="lg:col-span-9 grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* Left side: Problem Details */}
                <div className="xl:col-span-5 bg-white/5 border border-white/10 rounded-[32px] p-6 backdrop-blur-md space-y-5 flex flex-col justify-between max-h-[640px] overflow-y-auto custom-scrollbar">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-white">{activeChallenge.title}</h3>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                          activeChallenge.difficulty === 'easy'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : activeChallenge.difficulty === 'medium'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {activeChallenge.difficulty}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-mono bg-black/25 p-4 rounded-xl border border-white/5">
                      {activeChallenge.description}
                    </div>

                    {/* Example data */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Sample Example</span>
                      <div className="bg-black/45 rounded-xl p-3 border border-white/5 space-y-1 text-[11px] font-mono text-slate-400">
                        <div><span className="text-slate-500">Input:</span> {activeChallenge.sampleInput}</div>
                        <div><span className="text-slate-500">Output:</span> {activeChallenge.sampleOutput}</div>
                        {activeChallenge.constraints && (
                          <div className="border-t border-white/5 pt-1.5 mt-1.5 text-[10px] text-slate-500">
                            <span className="font-bold text-slate-450 uppercase">Constraints:</span><br />
                            {activeChallenge.constraints}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Hints */}
                  <div className="border-t border-white/10 pt-4 mt-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-400">Stuck? Reveal Hints</span>
                      <button
                        onClick={handleRevealHint}
                        disabled={hintsRevealed >= activeChallenge.hints.length}
                        className="text-[11px] font-bold text-purple-400 hover:text-purple-300 disabled:opacity-40 transition flex items-center gap-1"
                      >
                        <Lightbulb className="w-3.5 h-3.5" />
                        Reveal Hint ({hintsRevealed}/{activeChallenge.hints.length})
                      </button>
                    </div>
                    {hintsRevealed > 0 && (
                      <div className="space-y-2">
                        {activeChallenge.hints.slice(0, hintsRevealed).map((hint, idx) => (
                          <div key={idx} className="bg-purple-950/20 border border-purple-500/20 p-3 rounded-xl text-[11px] text-purple-300 leading-relaxed">
                            💡 <strong>Hint {idx + 1}:</strong> {hint}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: Editor */}
                <div className="xl:col-span-7 flex flex-col gap-6">
                  <div className="bg-white/5 border border-white/10 rounded-[32px] backdrop-blur-md overflow-hidden flex flex-col">
                    {/* Workspace header */}
                    <div className="bg-white/5 px-6 py-3 border-b border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-bold text-slate-300">Sandbox Workspace</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <select
                          value={language}
                          onChange={(e) => handleSelectLanguage(e.target.value as Language)}
                          className="bg-black/30 border border-white/10 text-xs text-slate-200 rounded-lg px-2.5 py-1 focus:outline-hidden focus:border-purple-400"
                        >
                          <option value="python">Python 3</option>
                          <option value="cpp">C++ 17</option>
                          <option value="java">Java 11</option>
                          <option value="javascript">JavaScript ES6</option>
                        </select>
                        <button
                          onClick={handleResetCode}
                          className="text-[10px] font-bold text-slate-400 hover:text-slate-200 transition"
                        >
                          Reset
                        </button>
                      </div>
                    </div>

                    {/* Workspace input */}
                    <div className="relative">
                      <textarea
                        id="code-editor-textarea"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="w-full h-80 bg-black/40 text-slate-100 font-mono p-5 text-xs border-0 focus:outline-hidden focus:ring-0 resize-none leading-relaxed custom-scrollbar"
                        style={{ tabSize: 4 }}
                        spellCheck="false"
                      />
                    </div>

                    {/* Bonus tools triggers */}
                    <div className="bg-white/5 px-6 py-3 border-t border-white/10 flex flex-wrap justify-between items-center gap-2">
                      <div className="flex gap-2">
                        <button
                          onClick={triggerGenerateEdgeCases}
                          className="bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-[10px] font-bold py-1.5 px-3 rounded-lg transition"
                        >
                          🛠️ Edge Cases
                        </button>
                        <button
                          onClick={triggerDryRunTrace}
                          className="bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-[10px] font-bold py-1.5 px-3 rounded-lg transition"
                        >
                          🐞 Dry-Run Trace
                        </button>
                      </div>

                      <button
                        onClick={handleEvaluateSolution}
                        disabled={evaluating}
                        className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-[11px] py-1.5 px-4 rounded-lg flex items-center gap-1 shadow-md shadow-purple-600/20 active:scale-95 transition"
                      >
                        {evaluating ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            Evaluating...
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 fill-white" />
                            Evaluate Code
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Edge Cases Display */}
                  {showEdgeCases && (
                    <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 space-y-3 animate-fade-in">
                      <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block">AI Target Edge Cases</span>
                      <div className="space-y-2.5 text-xs">
                        {edgeCases.map((ec, idx) => (
                          <div key={idx} className="bg-black/25 p-3 rounded-xl border border-white/5 space-y-1">
                            <span className="font-bold text-slate-300">Case {idx+1}: {ec.title}</span>
                            <p className="text-slate-450 text-[11px] leading-relaxed">{ec.effect}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dry Run Display */}
                  {showDryRun && (
                    <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 space-y-3 animate-fade-in">
                      <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block">Simulated Trace Execution Matrix</span>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-350 border-collapse">
                          <thead>
                            <tr className="border-b border-white/10 text-[10px] uppercase font-bold text-slate-500">
                              <th className="py-2">Trace</th>
                              <th className="py-2">Pointer Status</th>
                              <th className="py-2">Local State Variables</th>
                              <th className="py-2">Operation Details</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dryRunTrace.map((row) => (
                              <tr key={row.step} className="border-b border-white/5 hover:bg-white/5">
                                <td className="py-2 font-mono text-purple-400">Step {row.step}</td>
                                <td className="py-2 font-mono">{row.pointer}</td>
                                <td className="py-2 font-mono text-slate-400">{row.state}</td>
                                <td className="py-2 italic text-slate-450">{row.msg}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Evaluations */}
                  {evalError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-[32px] text-xs flex items-center gap-2">
                      <AlertCircle className="w-4.5 h-4.5" />
                      {evalError}
                    </div>
                  )}

                  {evaluation && (
                    <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 backdrop-blur-md space-y-4 animate-fade-in">
                      <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <div>
                          <span className="inline-flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Solution Checked
                          </span>
                          <h4 className="text-sm font-bold text-white mt-1.5">Recruiter Grading Analysis</h4>
                        </div>
                        <div className="text-center bg-purple-500/15 border border-purple-500/20 px-4 py-2 rounded-xl">
                          <span className="text-[9px] uppercase font-bold text-slate-400">Score</span>
                          <span className="text-xl font-black text-purple-300 block">{evaluation.score} <span className="text-xs font-normal text-slate-500">/100</span></span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="bg-black/25 p-3 rounded-xl border border-white/5">
                          <span className="text-[10px] uppercase font-bold text-purple-400">Complexity Metrics</span>
                          <p className="mt-1 text-slate-300">Time: <strong className="text-white">{evaluation.timeComplexity}</strong></p>
                          <p className="text-slate-300">Space: <strong className="text-white">{evaluation.spaceComplexity}</strong></p>
                        </div>
                        <div className="bg-black/25 p-3 rounded-xl border border-white/5">
                          <span className="text-[10px] uppercase font-bold text-purple-400">Syntactic Correctness</span>
                          <p className="mt-1 text-slate-300 text-[11px] leading-relaxed">{evaluation.correctness}</p>
                        </div>
                      </div>

                      {/* Bugs */}
                      {evaluation.bugsFound?.length > 0 && (
                        <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3 text-xs space-y-1">
                          <span className="text-[10px] font-bold text-red-400 uppercase block">Logical/Edge Bugs Spotlit</span>
                          <ul className="list-disc list-inside space-y-0.5 text-slate-350 text-[11px]">
                            {evaluation.bugsFound.map((bug: string, idx: number) => <li key={idx}>{bug}</li>)}
                          </ul>
                        </div>
                      )}

                      {/* Tips */}
                      <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-xs grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase block">Strengths</span>
                          <ul className="list-disc list-inside text-slate-400 text-[10.5px] space-y-1">
                            {evaluation.strengths?.map((str: string, i: number) => <li key={i}>{str}</li>)}
                          </ul>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-amber-400 uppercase block">Refactor Targets</span>
                          <ul className="list-disc list-inside text-slate-400 text-[10.5px] space-y-1">
                            {evaluation.improvements?.map((imp: string, i: number) => <li key={i}>{imp}</li>)}
                          </ul>
                        </div>
                      </div>

                      {/* Optimal Outline */}
                      <div className="bg-purple-950/10 border border-purple-500/10 rounded-xl p-3 text-xs">
                        <span className="text-[10px] font-bold text-purple-300 uppercase block mb-1">Optimal Approach Outline</span>
                        <p className="text-slate-300 leading-relaxed text-[11px] italic">{evaluation.optimalSolutionOutline}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* -------------------------------------------------------------
          SQL QUERY PRACTICE WORKSPACE
          ------------------------------------------------------------- */}
      {activeWorkspace === 'sql' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left panel: List of SQL challenges */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Database Schema Challenges</h4>
            <div className="space-y-2">
              {sqlChallenges.map((chal) => {
                const isActive = activeSqlChallenge.id === chal.id;
                return (
                  <button
                    key={chal.id}
                    onClick={() => handleSelectSqlChallenge(chal)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                      isActive
                        ? 'bg-purple-500/15 border-purple-500/40 text-purple-200 font-semibold'
                        : 'bg-white/5 border-white/5 hover:bg-white/10 text-slate-450 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs truncate font-medium">{chal.title}</span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          chal.difficulty === 'easy'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : chal.difficulty === 'medium'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {chal.difficulty}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">{chal.schemaDescription}</p>
                  </button>
                );
              })}
            </div>

            {/* Schema Generator Diagram Map */}
            <div className="bg-white/5 border border-white/10 rounded-[32px] p-4 space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block border-b border-white/5 pb-2">📂 Schema Map Generator</span>
              <div className="space-y-2 text-xs font-mono">
                {activeSqlChallenge.tables.map((t, idx) => (
                  <div key={idx} className="bg-black/35 rounded-xl p-2.5 border border-white/5">
                    <span className="text-purple-300 font-bold text-[11px]">📋 Table: {t.name}</span>
                    <ul className="text-[10px] text-slate-400 space-y-0.5 mt-1 list-disc list-inside">
                      {t.columns.map((c, cIdx) => <li key={cIdx}>{c}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right panel: Workspace SQL editor and evaluation */}
          <div className="lg:col-span-9 grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Left Column: Challenge Goal */}
            <div className="xl:col-span-5 bg-white/5 border border-white/10 rounded-[32px] p-6 backdrop-blur-md space-y-4 flex flex-col justify-between max-h-[640px] overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <h3 className="text-base font-bold text-white">{activeSqlChallenge.title}</h3>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    activeSqlChallenge.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-400' : activeSqlChallenge.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {activeSqlChallenge.difficulty}
                  </span>
                </div>

                <div className="bg-purple-950/10 border border-purple-500/10 p-4 rounded-xl text-xs text-slate-300 leading-relaxed font-sans">
                  <span className="font-bold text-purple-300 block mb-1">🎯 Problem Goal:</span>
                  {activeSqlChallenge.goal}
                </div>

                {/* Simulated Target Outputs */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> Expected Target Rows (Mock Output)
                  </span>
                  <div className="bg-black/45 rounded-xl border border-white/5 overflow-hidden">
                    <table className="w-full text-left text-[11px] font-mono text-slate-400 border-collapse">
                      <thead>
                        <tr className="bg-white/5 border-b border-white/10 text-[9px] text-slate-500 font-bold uppercase">
                          {Object.keys(activeSqlChallenge.simulatedRows[0]).map((key, kIdx) => (
                            <th key={kIdx} className="p-2">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {activeSqlChallenge.simulatedRows.map((row, rIdx) => (
                          <tr key={rIdx} className="border-b border-white/5">
                            {Object.values(row).map((val: any, vIdx) => (
                              <td key={vIdx} className="p-2">{val}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Query Workspace and feedback */}
            <div className="xl:col-span-7 flex flex-col gap-6 font-sans">
              <div className="bg-white/5 border border-white/10 rounded-[32px] backdrop-blur-md overflow-hidden flex flex-col">
                <div className="bg-white/5 px-6 py-3 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-slate-300">SQL Command Query Box</span>
                  </div>
                  <button
                    onClick={() => setSqlQuery(activeSqlChallenge.starterQuery)}
                    className="text-[10px] font-bold text-slate-450 hover:text-slate-200 transition"
                  >
                    Reset Template
                  </button>
                </div>

                <textarea
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  className="w-full h-72 bg-black/40 text-slate-100 font-mono p-5 text-xs border-0 focus:outline-hidden focus:ring-0 resize-none leading-relaxed custom-scrollbar"
                  spellCheck="false"
                />

                <div className="bg-white/5 px-6 py-3 border-t border-white/10 flex justify-end">
                  <button
                    onClick={handleEvaluateSqlSolution}
                    disabled={evaluatingSql}
                    className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-[11px] py-1.5 px-4 rounded-lg flex items-center gap-1 shadow-md shadow-purple-600/25 active:scale-95 transition"
                  >
                    {evaluatingSql ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Analyzing SQL...
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-white" />
                        Evaluate SQL Query
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* SQL Feedback displaying */}
              {sqlEvalError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {sqlEvalError}
                </div>
              )}

              {sqlEvaluation && (
                <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 backdrop-blur-md space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Query Verified
                      </span>
                      <h4 className="text-sm font-bold text-white mt-1.5">SQL Optimizer Review</h4>
                    </div>
                    <div className="text-center bg-purple-500/15 border border-purple-500/20 px-4 py-2 rounded-xl">
                      <span className="text-[9px] uppercase font-bold text-slate-400">Match Score</span>
                      <span className="text-xl font-black text-purple-300 block">{sqlEvaluation.score} <span className="text-xs font-normal text-slate-500">/100</span></span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-black/25 p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] uppercase font-bold text-purple-450">Estimated Plan Overhead</span>
                      <p className="mt-1 text-slate-300">Cost: <strong className="text-white">{sqlEvaluation.timeComplexity}</strong></p>
                      <p className="text-slate-350 text-[10.5px] mt-0.5">{sqlEvaluation.spaceComplexity}</p>
                    </div>
                    <div className="bg-black/25 p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] uppercase font-bold text-purple-455">Relational Correctness</span>
                      <p className="mt-1 text-slate-300 text-[11px] leading-relaxed">{sqlEvaluation.correctness}</p>
                    </div>
                  </div>

                  {sqlEvaluation.bugsFound?.length > 0 && (
                    <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3 text-xs space-y-1">
                      <span className="text-[10px] font-bold text-red-400 uppercase block">SQL Syntax & Logic Bugs</span>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-350 text-[11px]">
                        {sqlEvaluation.bugsFound.map((bug: string, idx: number) => <li key={idx}>{bug}</li>)}
                      </ul>
                    </div>
                  )}

                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-xs grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase block">Strengths</span>
                      <ul className="list-disc list-inside text-slate-400 text-[10.5px] space-y-1">
                        {sqlEvaluation.strengths?.map((str: string, i: number) => <li key={i}>{str}</li>)}
                      </ul>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-amber-400 uppercase block">Performance Tips (Joins/Indexes)</span>
                      <ul className="list-disc list-inside text-slate-400 text-[10.5px] space-y-1">
                        {sqlEvaluation.improvements?.map((imp: string, i: number) => <li key={i}>{imp}</li>)}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-purple-950/10 border border-purple-500/10 rounded-xl p-3 text-xs">
                    <span className="text-[10px] font-bold text-purple-300 uppercase block mb-1">Optimal Query Construction</span>
                    <p className="text-slate-300 leading-relaxed text-[11px] italic">{sqlEvaluation.optimalSolutionOutline}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
