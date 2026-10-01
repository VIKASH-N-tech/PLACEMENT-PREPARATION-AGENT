import { useState } from 'react';
import { Sparkles, Brain, Award, ArrowRight, CheckCircle2, XCircle, AlertCircle, RefreshCw, ChevronRight, ChevronLeft } from 'lucide-react';
import { UserProfile, AptitudeQuestion, Difficulty } from '../types';

interface AptitudeModuleProps {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
  onAddHistory: (item: { type: 'aptitude' | 'coding' | 'interview' | 'resume'; title: string; score?: string | number }) => void;
}

export default function AptitudeModule({ profile, setProfile, onAddHistory }: AptitudeModuleProps) {
  const [category, setCategory] = useState<'quantitative' | 'logical' | 'verbal'>('quantitative');
  const [subtopic, setSubtopic] = useState<string>('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [questions, setQuestions] = useState<AptitudeQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({}); // question index -> chosen index
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const subtopicsConfig = {
    quantitative: [
      { id: '', name: '✨ All Quantitative Topics' },
      { id: 'Time and Work', name: '⏳ Time and Work' },
      { id: 'Probability', name: '🎲 Probability' },
      { id: 'Permutations and Combinations', name: '🔢 Permutations & Combinations' },
      { id: 'Number System', name: '🔢 Number System' },
      { id: 'Percentage & Profit/Loss', name: '📈 Percentage & Profit/Loss' },
      { id: 'Time Speed Distance', name: '🚗 Time Speed Distance' },
      { id: 'Alligation & Mixture', name: '🧪 Alligation & Mixture' },
      { id: 'Calendar & Clock', name: '📅 Calendar & Clock' }
    ],
    logical: [
      { id: '', name: '✨ All Logical Topics' },
      { id: 'Blood Relations', name: '👥 Blood Relations' },
      { id: 'Coding-Decoding', name: '🔐 Coding-Decoding' },
      { id: 'Syllogism & Venn Diagrams', name: '📊 Syllogisms & Venn' },
      { id: 'Puzzles & Seating Arrangement', name: '🧩 Seating Arrangements' }
    ],
    verbal: [
      { id: '', name: '✨ All Verbal Topics' },
      { id: 'Reading Comprehension', name: '📖 Reading Comprehension' },
      { id: 'Synonyms and Antonyms', name: '🔤 Synonyms & Antonyms' },
      { id: 'Sentence Correction & Grammar', name: '✍️ Sentence Correction' }
    ]
  };

  const handleFetchQuestions = async () => {
    setLoading(true);
    setError('');
    setQuestions([]);
    setCurrentIdx(0);
    setSelectedAnswers({});
    setIsSubmitted(false);
    setScore(0);

    try {
      const res = await fetch('/api/aptitude/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, difficulty, subtopic }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.questions)) {
        setQuestions(data.questions);
      } else {
        setError(data.error || 'Failed to generate questions. Please try again.');
      }
    } catch (err) {
      setError('Error connecting to the AI generator. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (optIdx: number) => {
    if (isSubmitted) return;
    setSelectedAnswers({
      ...selectedAnswers,
      [currentIdx]: optIdx
    });
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const handleSubmitQuiz = () => {
    let finalScore = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) {
        finalScore++;
      }
    });

    setScore(finalScore);
    setIsSubmitted(true);

    // Calculate XP reward
    const xpEarned = finalScore * 20 + (difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 35);
    
    // Update profile
    const updatedProfile = {
      ...profile,
      xp: profile.xp + xpEarned,
      completedQuizzes: profile.completedQuizzes + 1,
      currentStreak: profile.currentStreak === 0 ? 1 : profile.currentStreak, // trigger streak
    };
    
    // Update weak topics dynamically
    const categoryLabel = category === 'quantitative' ? 'Quantitative Aptitude' : category === 'logical' ? 'Logical Reasoning' : 'Verbal Ability';
    const originalTopic = profile.weakTopics.find(t => t.topic === categoryLabel);
    let newMasteryScore = 50; // default initial fallback
    if (originalTopic) {
      const performancePercent = (finalScore / questions.length) * 100;
      // Weighted update
      newMasteryScore = Math.min(100, Math.round(originalTopic.score * 0.4 + performancePercent * 0.6));
    }
    
    const updatedWeakTopics = profile.weakTopics.map(t => {
      if (t.topic === categoryLabel) {
        return { ...t, score: newMasteryScore };
      }
      return t;
    });

    setProfile({
      ...updatedProfile,
      weakTopics: updatedWeakTopics
    });

    // Add activity log
    onAddHistory({
      type: 'aptitude',
      title: `${categoryLabel} (${difficulty.toUpperCase()})`,
      score: `${finalScore}/${questions.length} Correct`
    });
  };

  return (
    <div id="aptitude-module" className="space-y-6 animate-fade-in">
      {/* Description header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white/5 border border-white/10 rounded-[32px] p-8 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-[-40px] right-[-40px] w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div>
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs font-semibold mb-3">
            <Brain className="w-3.5 h-3.5" />
            Adaptive Learning Engine
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">AI Aptitude Practice Arena</h2>
          <p className="mt-2 text-slate-400 text-sm max-w-2xl">
            Generate unlimited customized multiple-choice tests powered by Google Gemini. Practice Quantitative, Logical, and Verbal topics calibrated to standard tech recruiter metrics.
          </p>
        </div>
      </div>

      {/* Control panel & Generation Options */}
      {questions.length === 0 && !loading && (
        <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 backdrop-blur-md space-y-6">
          <h3 className="text-lg font-bold text-slate-200">Configure Your Test Session</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Select Category</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  id="apt-cat-quant"
                  onClick={() => { setCategory('quantitative'); setSubtopic(''); }}
                  className={`py-3 px-4 rounded-xl text-xs font-bold transition border ${
                    category === 'quantitative'
                      ? 'bg-blue-500/25 border-blue-400 text-blue-300'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  📉 Quantitative
                </button>
                <button
                  type="button"
                  id="apt-cat-logic"
                  onClick={() => { setCategory('logical'); setSubtopic(''); }}
                  className={`py-3 px-4 rounded-xl text-xs font-bold transition border ${
                    category === 'logical'
                      ? 'bg-blue-500/25 border-blue-400 text-blue-300'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  🧩 Logical Reasoning
                </button>
                <button
                  type="button"
                  id="apt-cat-verbal"
                  onClick={() => { setCategory('verbal'); setSubtopic(''); }}
                  className={`py-3 px-4 rounded-xl text-xs font-bold transition border ${
                    category === 'verbal'
                      ? 'bg-blue-500/25 border-blue-400 text-blue-300'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  🗣️ Verbal Ability
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Select Difficulty</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  id="apt-diff-easy"
                  onClick={() => setDifficulty('easy')}
                  className={`py-3 px-4 rounded-xl text-xs font-bold transition border ${
                    difficulty === 'easy'
                      ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  Easy (L1)
                </button>
                <button
                  type="button"
                  id="apt-diff-med"
                  onClick={() => setDifficulty('medium')}
                  className={`py-3 px-4 rounded-xl text-xs font-bold transition border ${
                    difficulty === 'medium'
                      ? 'bg-amber-500/25 border-amber-455 text-amber-300'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  Medium (L2)
                </button>
                <button
                  type="button"
                  id="apt-diff-hard"
                  onClick={() => setDifficulty('hard')}
                  className={`py-3 px-4 rounded-xl text-xs font-bold transition border ${
                    difficulty === 'hard'
                      ? 'bg-red-500/25 border-red-400 text-red-300'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  Hard (L3)
                </button>
              </div>
            </div>
          </div>

          {/* Syllabus Sub-topic Selector */}
          <div className="space-y-2 border-t border-white/5 pt-4">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Syllabus Focus Subtopic</label>
            <select
              value={subtopic}
              onChange={(e) => setSubtopic(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 text-xs text-slate-200 rounded-xl px-4 py-3.5 focus:outline-hidden focus:border-blue-400 transition"
            >
              {subtopicsConfig[category].map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-500 italic">
              * Choosing a specific syllabus focus will tailor your multiple-choice questions to that exact recruitment curriculum topic.
            </p>
          </div>

          <div className="border-t border-white/5 pt-6 flex justify-end">
            <button
              id="btn-generate-aptitude"
              onClick={handleFetchQuestions}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3 px-8 rounded-xl shadow-lg shadow-blue-500/25 active:scale-95 transition flex items-center gap-2 text-sm"
            >
              <Sparkles className="w-4 h-4" />
              Generate Customized AI Test
            </button>
          </div>
        </div>
      )}

      {/* Loading and Errors */}
      {loading && (
        <div className="bg-white/5 border border-white/10 rounded-[32px] p-16 backdrop-blur-md text-center flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <Sparkles className="w-5 h-5 text-blue-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div>
            <h4 className="font-bold text-white text-lg">Assembling Your Practice Set...</h4>
            <p className="text-slate-400 text-xs mt-1.5 max-w-sm">
              Gemini is calibrating high-yield competitive aptitude questions, correct answer matrices, and step-by-step explanations.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-[32px] flex items-center gap-4">
          <AlertCircle className="w-8 h-8 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-white text-sm">Generation Error</h4>
            <p className="text-xs text-red-300 mt-0.5">{error}</p>
            <button
              onClick={handleFetchQuestions}
              className="mt-3 text-xs bg-red-500/20 text-red-200 border border-red-500/30 px-3 py-1 rounded-lg hover:bg-red-500/30 transition"
            >
              Retry Generation
            </button>
          </div>
        </div>
      )}

      {/* Interactive Quiz Mode */}
      {questions.length > 0 && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Question Panel */}
          <div className="lg:col-span-8 bg-white/5 border border-white/10 rounded-[32px] p-8 backdrop-blur-md flex flex-col justify-between min-h-[480px]">
            <div>
              {/* Quiz Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <span className="text-xs font-bold text-blue-400 tracking-wider uppercase">
                  Question {currentIdx + 1} of {questions.length}
                </span>
                <span className="text-xs font-bold text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                  {difficulty.toUpperCase()} • {category.toUpperCase()}
                </span>
              </div>

              {/* Question Body */}
              <div className="space-y-6">
                <h4 className="text-lg md:text-xl font-medium text-slate-100 leading-relaxed">
                  {questions[currentIdx].question}
                </h4>

                {/* MCQ Options */}
                <div className="grid grid-cols-1 gap-3.5">
                  {questions[currentIdx].options.map((option, optIdx) => {
                    const isSelected = selectedAnswers[currentIdx] === optIdx;
                    const isCorrect = questions[currentIdx].correctAnswer === optIdx;
                    
                    let btnStyle = 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10';
                    let markerStyle = 'bg-white/10 text-slate-400';

                    if (isSubmitted) {
                      if (isCorrect) {
                        btnStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-medium';
                        markerStyle = 'bg-emerald-500 text-slate-950 font-black';
                      } else if (isSelected) {
                        btnStyle = 'bg-red-500/20 border-red-500 text-red-300';
                        markerStyle = 'bg-red-500 text-white font-black';
                      } else {
                        btnStyle = 'bg-white/5 border-white/10 opacity-50';
                      }
                    } else if (isSelected) {
                      btnStyle = 'bg-blue-500/20 border-blue-400 text-blue-300 font-medium';
                      markerStyle = 'bg-blue-500 text-white font-bold';
                    }

                    return (
                      <button
                        key={optIdx}
                        id={`opt-btn-${optIdx}`}
                        onClick={() => handleSelectOption(optIdx)}
                        disabled={isSubmitted}
                        className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-center gap-4 ${btnStyle}`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs tracking-tight transition ${markerStyle}`}>
                          {isSubmitted && isCorrect ? '✓' : isSubmitted && isSelected ? '✗' : String.fromCharCode(65 + optIdx)}
                        </div>
                        <span className="text-sm leading-relaxed">{option}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Pagination / Action Row */}
            <div className="border-t border-white/10 pt-6 mt-8 flex justify-between items-center">
              <div className="flex gap-2">
                <button
                  onClick={handlePrev}
                  disabled={currentIdx === 0}
                  className="bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-slate-200 p-2.5 rounded-xl border border-white/10 transition active:scale-95"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentIdx === questions.length - 1}
                  className="bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-slate-200 p-2.5 rounded-xl border border-white/10 transition active:scale-95"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {!isSubmitted ? (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={Object.keys(selectedAnswers).length < questions.length}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-emerald-500/20 transition text-sm active:scale-95"
                >
                  Submit Answers
                </button>
              ) : (
                <button
                  onClick={handleFetchQuestions}
                  className="bg-white/5 hover:bg-white/10 text-slate-100 font-semibold py-2.5 px-6 border border-white/10 rounded-xl transition text-sm active:scale-95 flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Another Quiz
                </button>
              )}
            </div>
          </div>

          {/* AI Explanation and Progress panel */}
          <div className="lg:col-span-4 space-y-6">
            {/* Realtime Feedback Card */}
            {isSubmitted && (
              <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border border-white/10 rounded-[32px] p-6 backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-[-30px] right-[-30px] w-24 h-24 bg-blue-500/20 rounded-full blur-2xl" />
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  Quiz Scorecard
                </h4>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-black text-amber-400">{score}</span>
                  <span className="text-slate-400 text-sm">/ {questions.length} Correct</span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-3">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-emerald-400"
                    style={{ width: `${(score / questions.length) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-slate-300 mt-4 leading-relaxed">
                  🎉 Fantastic! You completed the quiz and gained <strong className="text-emerald-400">+{score * 20} XP</strong> and difficulty completion bonuses! Keep it up to level up.
                </p>
              </div>
            )}

            {/* Answer Explanations */}
            <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 backdrop-blur-md flex-1">
              <h4 className="text-base font-bold text-white mb-3">AI Explanation Hub</h4>
              {isSubmitted ? (
                <div className="space-y-4 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-2">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase">Question {currentIdx + 1} Explained</span>
                    <p className="text-xs text-slate-200 font-semibold">
                      Correct Answer: {String.fromCharCode(65 + questions[currentIdx].correctAnswer)}. {questions[currentIdx].options[questions[currentIdx].correctAnswer]}
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed italic whitespace-pre-wrap">
                      {questions[currentIdx].explanation}
                    </p>
                  </div>
                  <div className="text-[10px] text-slate-500 text-center">
                    Navigate between questions using the arrow buttons to see their specific AI-crafted breakdowns.
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 flex flex-col items-center justify-center space-y-2">
                  <Brain className="w-10 h-10 text-slate-600 animate-pulse" />
                  <p className="text-xs leading-relaxed max-w-[200px]">
                    Submit your answers first to reveal detailed AI-designed mathematical and logic steps.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
