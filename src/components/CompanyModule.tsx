import { useState } from 'react';
import { Sparkles, Building2, Calendar, Target, Award, CheckCircle2, AlertCircle, RefreshCw, ChevronDown, ChevronUp, Brain, BookOpen } from 'lucide-react';
import { UserProfile } from '../types';

interface CompanyModuleProps {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
  onAddHistory: (item: { type: 'aptitude' | 'coding' | 'interview' | 'resume'; title: string; score?: string | number }) => void;
}

export default function CompanyModule({ profile, setProfile, onAddHistory }: CompanyModuleProps) {
  const [selectedCompany, setSelectedCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [prepData, setPrepData] = useState<any>(null);

  // Active question index state for the MCQ section inside company prep
  const [aptitudeAnswers, setAptitudeAnswers] = useState<Record<number, number>>({});
  const [showAptitudeExpl, setShowAptitudeExpl] = useState<Record<number, boolean>>({});

  // Collapsible solutions state for technical questions
  const [showTechSolution, setShowTechSolution] = useState<Record<number, boolean>>({});

  const companiesList = [
    { name: 'Google', logo: 'G', color: '#4285F4', tagline: 'Googlyness, advanced algorithms, and systems scale.' },
    { name: 'Amazon', logo: 'A', color: '#FF9900', tagline: 'Customer obsession & 16 Leadership Principles.' },
    { name: 'Microsoft', logo: 'M', color: '#0078D4', tagline: 'C++, operating systems, and developer ergonomics.' },
    { name: 'TCS', logo: 'T', color: '#002E7A', tagline: 'Quantitative foundations, core TCS NQT metrics.' },
    { name: 'Infosys', logo: 'I', color: '#007CC3', tagline: 'InfyTQ conceptual OOPs, Java/Python tracks.' },
    { name: 'Accenture', logo: 'AC', color: '#A100FF', tagline: 'Critical cognitive skills and software architecture.' }
  ];

  const handleFetchPrepData = async (companyName: string) => {
    setSelectedCompany(companyName);
    setLoading(true);
    setError('');
    setPrepData(null);
    setAptitudeAnswers({});
    setShowAptitudeExpl({});
    setShowTechSolution({});

    try {
      const res = await fetch('/api/company/prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName }),
      });
      const data = await res.json();
      if (data.success && data.prep) {
        setPrepData(data.prep);

        // Log search
        onAddHistory({
          type: 'aptitude',
          title: `Company Prep: ${companyName}`,
          score: 'Review Completed'
        });
      } else {
        setError(data.error || 'Failed to assemble company-specific preparation guides.');
      }
    } catch (err) {
      setError('Connection timeout. Please retry accessing the prep dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAptitude = (qIdx: number, optIdx: number) => {
    setAptitudeAnswers({
      ...aptitudeAnswers,
      [qIdx]: optIdx
    });
    setShowAptitudeExpl({
      ...showAptitudeExpl,
      [qIdx]: true
    });
  };

  const toggleTechSolution = (idx: number) => {
    setShowTechSolution({
      ...showTechSolution,
      [idx]: !showTechSolution[idx]
    });
  };

  return (
    <div id="company-module" className="space-y-6 animate-fade-in">
      {/* Description header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white/5 border border-white/10 rounded-[32px] p-8 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-[-40px] right-[-40px] w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div>
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs font-semibold mb-3">
            <Building2 className="w-3.5 h-3.5" />
            Recruiter Specific Focus
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Company-wise Preparation Track</h2>
          <p className="mt-2 text-slate-400 text-sm max-w-2xl">
            Choose your target company. Our AI generates highly-focused technical syllabus, interview process breakdowns, live MCQ aptitude questions, and DSA practice problems calibrated to standard recruiting sheets.
          </p>
        </div>
      </div>

      {/* 1. SELECTION TILES */}
      {!prepData && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companiesList.map((comp) => (
            <button
              key={comp.name}
              id={`comp-btn-${comp.name.toLowerCase()}`}
              onClick={() => handleFetchPrepData(comp.name)}
              className="bg-white/5 border border-white/10 hover:border-white/20 rounded-[32px] p-6 backdrop-blur-md text-left group active:scale-95 transition relative overflow-hidden flex flex-col justify-between h-[180px]"
            >
              <div className="absolute top-[-20px] right-[-20px] w-16 h-16 rounded-full blur-xl pointer-events-none opacity-20" style={{ backgroundColor: comp.color }} />
              <div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-base shadow-md mb-4"
                  style={{ backgroundColor: comp.color }}
                >
                  {comp.logo}
                </div>
                <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition">{comp.name} Track</h4>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{comp.tagline}</p>
              </div>
              <span className="text-[10px] font-bold text-blue-400 mt-2 block">
                Launch Prep Suite →
              </span>
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="bg-white/5 border border-white/10 rounded-[32px] p-16 text-center flex flex-col items-center justify-center space-y-4 backdrop-blur-md">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <Building2 className="w-5 h-5 text-blue-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div>
            <h4 className="font-bold text-white text-lg">Generating {selectedCompany} Prep Suite...</h4>
            <p className="text-slate-400 text-xs mt-1.5 max-w-sm">
              Calibrating active recruiting models, standard question trends, multiple-choice quizzes, and dynamic logic explanations.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-[32px] flex items-center gap-4">
          <AlertCircle className="w-8 h-8 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-white text-sm">Suite Error</h4>
            <p className="text-xs text-red-300 mt-0.5">{error}</p>
            <button
              onClick={() => handleFetchPrepData(selectedCompany)}
              className="mt-3 text-xs bg-red-500/20 text-red-200 border border-red-500/30 px-3 py-1 rounded-lg hover:bg-red-500/30 transition"
            >
              Retry Loading Suite
            </button>
          </div>
        </div>
      )}

      {/* 2. DYNAMIC PREP VIEW */}
      {prepData && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Company Rundown & Timeline */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 backdrop-blur-md relative overflow-hidden">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-base"
                  style={{ backgroundColor: companiesList.find(c => c.name === selectedCompany)?.color || '#2563eb' }}
                >
                  {selectedCompany[0]}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedCompany} Suite</h3>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">AI Curated Profile</span>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Recruiting Style</span>
                  <p className="text-slate-300 leading-relaxed mt-1">{prepData.overview}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Hiring Processes (Timeline)</span>
                  <div className="space-y-2 mt-1.5">
                    {prepData.interviewProcess?.map((step: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2.5 p-2 bg-white/5 rounded-xl border border-white/5 text-[11px] text-slate-300">
                        <span className="w-5 h-5 rounded-lg bg-blue-500/20 text-blue-300 font-bold flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Company Core Focus Topics</span>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {prepData.keyFocusAreas?.map((val: string, idx: number) => (
                      <span key={idx} className="bg-blue-500/15 border border-blue-500/25 text-blue-300 px-2 py-0.5 rounded-md text-[10px]">
                        {val}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setPrepData(null)}
                className="w-full mt-6 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 py-2.5 rounded-xl text-xs font-semibold transition"
              >
                Choose Different Company
              </button>
            </div>
          </div>

          {/* Interactive Learning Questions (Aptitude, Coding, Technical) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Aptitude MCQ Panel */}
            <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 backdrop-blur-md space-y-6">
              <h4 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
                <Brain className="w-5 h-5 text-indigo-400" />
                Targeted Aptitude Mini-Test
              </h4>

              <div className="space-y-6">
                {prepData.aptitudeQuestions?.map((q: any, qIdx: number) => {
                  const chosenOpt = aptitudeAnswers[qIdx];
                  const hasAnswered = chosenOpt !== undefined;

                  return (
                    <div key={qIdx} className="space-y-3.5 border-b border-white/5 pb-5 last:border-0 last:pb-0">
                      <p className="text-xs font-semibold text-slate-300 leading-relaxed">
                        Q{qIdx + 1}. {q.question}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {q.options?.map((opt: string, optIdx: number) => {
                          const isChosen = chosenOpt === optIdx;
                          const isCorrect = q.correctAnswer === optIdx;

                          let btnClass = 'bg-white/5 border-white/5 hover:bg-white/10 text-slate-300';
                          if (hasAnswered) {
                            if (isCorrect) {
                              btnClass = 'bg-emerald-500/15 border-emerald-500 text-emerald-300 font-semibold';
                            } else if (isChosen) {
                              btnClass = 'bg-red-500/15 border-red-500 text-red-300';
                            } else {
                              btnClass = 'bg-white/5 border-white/5 opacity-50';
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              onClick={() => !hasAnswered && handleSelectAptitude(qIdx, optIdx)}
                              disabled={hasAnswered}
                              className={`text-left px-4 py-2.5 rounded-xl text-xs border transition ${btnClass}`}
                            >
                              <span className="font-semibold mr-2">{String.fromCharCode(65 + optIdx)}.</span>
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {showAptitudeExpl[qIdx] && (
                        <div className="bg-indigo-950/25 border border-indigo-500/15 p-3.5 rounded-xl text-[11px] text-indigo-300 italic whitespace-pre-wrap leading-relaxed animate-fade-in">
                          <strong>AI Step:</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Coding Challenge Reference */}
            <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 backdrop-blur-md space-y-6">
              <h4 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
                <BookOpen className="w-5 h-5 text-purple-400" />
                Featured DSA Challenges
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {prepData.codingQuestions?.map((chal: any, idx: number) => (
                  <div key={idx} className="bg-black/25 rounded-2xl p-5 border border-white/5 space-y-3 flex flex-col justify-between">
                    <div>
                      <h5 className="text-sm font-bold text-slate-200">{chal.title}</h5>
                      <p className="text-xs text-slate-400 leading-relaxed mt-1.5 whitespace-pre-wrap font-mono">
                        {chal.description}
                      </p>
                      
                      <div className="bg-black/40 rounded-lg p-2 mt-3 text-[10px] font-mono text-slate-450 border border-white/5">
                        <span className="text-slate-500 block mb-0.5">Sample Output:</span>
                        {chal.sampleOutput}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/5">
                      <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest block mb-1">Interviewer Hint</span>
                      <p className="text-[11px] text-purple-200 italic leading-relaxed">
                        💡 {chal.hints?.[0] || 'Analyze optimal spatial constraints.'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Collage Solutions (Tech/Systems Questions) */}
            <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 backdrop-blur-md space-y-4">
              <h4 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
                <Target className="w-5 h-5 text-emerald-400" />
                System Design & Technical Core Syllabus
              </h4>

              <div className="space-y-3">
                {prepData.technicalQuestions?.map((q: string, idx: number) => {
                  const isOpen = showTechSolution[idx];
                  return (
                    <div key={idx} className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden transition">
                      <button
                        onClick={() => toggleTechSolution(idx)}
                        className="w-full text-left px-5 py-3.5 flex justify-between items-center text-xs font-bold text-slate-300 hover:bg-white/5"
                      >
                        <span className="leading-relaxed flex-1 pr-4">{q}</span>
                        {isOpen ? <ChevronUp className="w-4 h-4 flex-shrink-0 text-slate-400" /> : <ChevronDown className="w-4 h-4 flex-shrink-0 text-slate-400" />}
                      </button>

                      {isOpen && (
                        <div className="px-5 pb-5 pt-1 text-xs text-slate-400 border-t border-white/5 bg-black/15 leading-relaxed whitespace-pre-wrap">
                          💡 <strong>Expected Senior Answer Blueprint:</strong><br />
                          To address this query appropriately during interview panel briefings, design structures modeling robust microservices bounds, message queues, standard fault-tolerances, database schemas matching atomic consistency parameters, or standard data structure loops with strict Big-O complexity optimizations.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
