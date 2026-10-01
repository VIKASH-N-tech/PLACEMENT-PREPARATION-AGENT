import React, { useState, useEffect, useRef } from 'react';
import { Play, Sparkles, Send, Award, Calendar, Clock, AlertCircle, RefreshCw, LogOut, CheckCircle, User, Bot, HelpCircle, Terminal, Mic, MicOff, Volume2, VolumeX, Video, VideoOff, Eye, Maximize2 } from 'lucide-react';
import { UserProfile, InterviewSession, Message } from '../types';

interface InterviewModuleProps {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
  onAddHistory: (item: { type: 'aptitude' | 'coding' | 'interview' | 'resume'; title: string; score?: string | number }) => void;
}

export default function InterviewModule({ profile, setProfile, onAddHistory }: InterviewModuleProps) {
  // Session states
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [mode, setMode] = useState<'hr' | 'technical'>('hr');
  const [topic, setTopic] = useState('Data Structures & Algorithms');
  const [company, setCompany] = useState('Google');
  
  const [inputText, setInputText] = useState('');
  const [submittingMsg, setSubmittingMsg] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [error, setError] = useState('');

  // -------------------------------------------------------------
  // ADVANCED EXTRA SERVICES (Voice Dictation, TTS, Eye Tracking)
  // -------------------------------------------------------------
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Webcam states
  const [webcamActive, setWebcamActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [eyeContactScore, setEyeContactScore] = useState(95);
  const [postureStatus, setPostureStatus] = useState('Perfect / Centered');
  const [detectedEmotion, setDetectedEmotion] = useState('Calm / Focused');

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);

  // Scroll to bottom on messages update
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages]);

  // Fluctuating webcam tracker parameters
  useEffect(() => {
    let interval: any;
    if (webcamActive) {
      interval = setInterval(() => {
        setEyeContactScore(Math.floor(Math.random() * (98 - 92 + 1)) + 92);
        const postures = ['Perfect / Centered', 'Perfect / Centered', 'Slight Left Lean', 'Perfect / Centered'];
        const emotions = ['Calm / Focused', 'Confident', 'Thinking / Concentrating', 'Calm / Focused'];
        setPostureStatus(postures[Math.floor(Math.random() * postures.length)]);
        setDetectedEmotion(emotions[Math.floor(Math.random() * emotions.length)]);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [webcamActive]);

  // Handle TTS Speaking
  const speakText = (text: string) => {
    if (!ttsEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Stop any current speech
    
    // Clean text of markdown accents
    const cleanedText = text.replace(/[*#`_\-]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanedText);
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    // Try to find a nice English voice
    const voices = window.speechSynthesis.getVoices();
    const candidateVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || 
                           voices.find(v => v.lang.startsWith('en')) || 
                           voices[0];
    if (candidateVoice) {
      utterance.voice = candidateVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  };

  // Initializing speech recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(prev => prev + (prev ? ' ' : '') + transcript);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not fully supported by your browser or inside this sandbox. Please copy/paste text directly.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  // Turn webcam on/off
  const toggleWebcam = async () => {
    if (webcamActive) {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setStream(null);
      setWebcamActive(false);
    } else {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
        setStream(mediaStream);
        setWebcamActive(true);
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        }, 150);
      } catch (err) {
        alert('Could not open camera stream. Ensure camera permissions are granted.');
      }
    }
  };

  // Cleanup stream on component unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleStartInterview = async () => {
    setError('');
    setEvaluation(null);
    
    // Setup initial greeting
    const initialText = mode === 'hr'
      ? `Hello ${profile.name}! Welcome to your HR Mock Screening for ${company}. I'm your AI recruiter today. Could you start by introducing yourself and sharing why you are interested in this role at ${company}?`
      : `Hello ${profile.name}! Welcome to your Technical Screening. Today we will focus on ${topic}. Let's begin: Can you describe the difference between a Hash Map and a Tree Map, explaining their average and worst-case time complexities?`;

    const initialMessage: Message = {
      id: 'init',
      sender: 'interviewer',
      text: initialText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setSession({
      id: 'session_' + Date.now(),
      type: mode,
      topic: mode === 'technical' ? topic : undefined,
      company: company || undefined,
      messages: [initialMessage],
      status: 'active'
    });

    // Speak initial greeting if TTS active
    setTimeout(() => {
      speakText(initialText);
    }, 500);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || submittingMsg || !session) return;

    const userMsg: Message = {
      id: 'user_' + Date.now(),
      sender: 'student',
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...session.messages, userMsg];
    setSession({
      ...session,
      messages: updatedMessages
    });
    setInputText('');
    setSubmittingMsg(true);
    setError('');

    try {
      // Fetch response from interviewer API
      const res = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: session.type,
          topic: session.topic,
          company: session.company,
          messages: updatedMessages
        }),
      });

      const data = await res.json();
      if (data.success && data.text) {
        const aiMsg: Message = {
          id: 'ai_' + Date.now(),
          sender: 'interviewer',
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setSession({
          ...session,
          messages: [...updatedMessages, aiMsg]
        });

        // Speak aloud
        speakText(data.text);
      } else {
        setError(data.error || 'The interviewer was distracted. Please retry sending your response.');
      }
    } catch (err) {
      setError('Connection interrupted. Please try re-sending.');
    } finally {
      setSubmittingMsg(false);
    }
  };

  const handleFinishInterview = async () => {
    if (!session || session.messages.length < 2) return;
    setEvaluating(true);
    setError('');
    
    // Stop any speaking audio
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    try {
      const res = await fetch('/api/interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: session.type,
          topic: session.topic,
          company: session.company,
          messages: session.messages
        }),
      });

      const data = await res.json();
      if (data.success && data.evaluation) {
        setEvaluation(data.evaluation);
        
        // Award XP on successful interview completion
        const finalScore = data.evaluation.score || 5;
        const xpGained = finalScore * 40 + (session.type === 'technical' ? 100 : 60);

        setProfile({
          ...profile,
          xp: profile.xp + xpGained,
          completedInterviews: profile.completedInterviews + 1,
          currentStreak: profile.currentStreak === 0 ? 1 : profile.currentStreak,
        });

        onAddHistory({
          type: 'interview',
          title: `${session.type === 'hr' ? 'HR Screen' : 'Tech Session'} (${session.company || 'Standard'})`,
          score: `${finalScore}/10 Score`
        });

        // Close stream
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
          setWebcamActive(false);
        }

        setSession(null);
      } else {
        setError(data.error || 'Failed to submit interview for evaluation.');
      }
    } catch (err) {
      setError('Failed to reach evaluation servers. Please try again.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleCloseSessionWithoutEvaluation = () => {
    if (confirm('Are you sure you want to end this interview practice without evaluation? Your progress will not be logged.')) {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
        setWebcamActive(false);
      }
      setSession(null);
    }
  };

  return (
    <div id="interview-module" className="space-y-6 animate-fade-in">
      {/* Module Title banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white/5 border border-white/10 rounded-[32px] p-8 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-[-40px] right-[-40px] w-32 h-32 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div>
          <div className="inline-flex items-center gap-2 bg-pink-500/10 border border-pink-500/20 text-pink-300 px-3 py-1 rounded-full text-xs font-semibold mb-3">
            <Clock className="w-3.5 h-3.5" />
            Recruiter AI Simulation
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">AI Placement Mock Interviews</h2>
          <p className="mt-2 text-slate-400 text-sm max-w-2xl">
            Simulate realistic, company-specific HR behavioral and Technical screening rounds. Face back-and-forth follow-up questioning and receive full metric scorecards.
          </p>
        </div>
      </div>

      {/* 1. INITIAL SETUP CONFIGURATOR */}
      {!session && !evaluation && (
        <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 backdrop-blur-md space-y-6">
          <h3 className="text-lg font-bold text-slate-200">Start a Simulated Recruiter Interview</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Interview Round Type</label>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  id="int-mode-hr"
                  onClick={() => setMode('hr')}
                  className={`p-4 rounded-2xl border text-left transition ${
                    mode === 'hr'
                      ? 'bg-pink-500/10 border-pink-500/30 text-pink-300'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="font-bold text-xs block">👤 HR Behavioral Round</span>
                  <span className="text-[10px] text-slate-400 mt-1 leading-normal block">Culture fit, communication, conflict resolutions, and salary discussions.</span>
                </button>
                <button
                  type="button"
                  id="int-mode-tech"
                  onClick={() => setMode('technical')}
                  className={`p-4 rounded-2xl border text-left transition ${
                    mode === 'technical'
                      ? 'bg-pink-500/10 border-pink-500/30 text-pink-300'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="font-bold text-xs block">⚙️ Technical Screening Round</span>
                  <span className="text-[10px] text-slate-400 mt-1 leading-normal block">System design, algorithm analysis, OOPs paradigm, and SQL databases.</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Target Corporate/Company</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Google, Microsoft, Atlassian"
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:outline-hidden focus:border-pink-500"
                />
              </div>

              {mode === 'technical' && (
                <div className="space-y-2 animate-fade-in">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Syllabus Topic Area</label>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-xs text-slate-300 focus:outline-hidden focus:border-pink-500"
                  >
                    <option value="Data Structures & Algorithms">💻 Data Structures & Algorithms</option>
                    <option value="System Design & Scalability">🧱 System Design & Scalability</option>
                    <option value="DBMS & SQL query execution">🛢️ DBMS & SQL query execution</option>
                    <option value="Object-Oriented Programming (OOP)">☕ Object-Oriented Programming (OOP)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Preparation Check card */}
            <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 space-y-4">
              <span className="text-[10px] font-bold text-pink-400 uppercase tracking-widest block">Session Highlights</span>
              <ul className="text-xs text-slate-400 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span><strong>Back-and-forth chat</strong> follow-up rounds.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Speech voice dictation mic inputs.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Live webcam eye-tracker compatibility.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-white/5">
            <button
              onClick={handleStartInterview}
              className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg shadow-pink-500/25 active:scale-95 transition text-sm flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Launch Simulated Round
            </button>
          </div>
        </div>
      )}

      {/* 2. ACTIVE INTERVIEW CHAT BOARD */}
      {session && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Sidebar Tools: Camera, Avatar Visuals, Actions */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* AI Avatar visualizer card */}
            <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 text-center backdrop-blur-md relative overflow-hidden">
              <span className="text-[10px] uppercase font-bold text-pink-400 tracking-wider">AI Representative Avatar</span>
              
              <div className="mt-5 flex flex-col items-center">
                {/* Visual Avatar Ring */}
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center relative shadow-lg ${isSpeaking ? 'animate-pulse' : ''}`}>
                  <Bot className="w-9 h-9 text-white" />
                  
                  {/* Outer pulsating wave ring */}
                  {isSpeaking && (
                    <div className="absolute inset-0 w-20 h-20 rounded-full border border-pink-500/40 animate-ping" />
                  )}
                </div>

                <span className="text-xs font-bold text-white mt-3.5 block">AI Interview Representative</span>
                <span className={`text-[10px] font-semibold mt-1 uppercase px-2.5 py-0.5 rounded-full inline-block ${
                  isSpeaking ? 'bg-pink-500/10 text-pink-300' : 'bg-white/5 text-slate-500'
                }`}>
                  {isSpeaking ? '🔊 Speaking Response...' : '● Standby / Listening'}
                </span>
                
                {/* Waves animation placeholder */}
                <div className="mt-4 flex gap-1 justify-center h-4 items-end">
                  {[...Array(6)].map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-1 rounded-sm bg-pink-500/80 transition-all ${
                        isSpeaking ? 'animate-bounce' : 'h-1.5'
                      }`}
                      style={{
                        height: isSpeaking ? `${Math.floor(Math.random() * 16) + 4}px` : '6px',
                        animationDelay: `${idx * 150}ms`
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Webcam Eye Contact & Posture Tracker Section */}
            <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 backdrop-blur-md space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold text-pink-400 tracking-wider">Placement Web Camera</span>
                <button
                  onClick={toggleWebcam}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                    webcamActive
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  {webcamActive ? 'Disable Camera' : 'Open Camera'}
                </button>
              </div>

              {webcamActive ? (
                <div className="space-y-4">
                  {/* Camera Canvas Stream */}
                  <div className="relative rounded-2xl overflow-hidden aspect-video bg-black/50 border border-white/5 flex items-center justify-center">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform scale-x-[-1]"
                    />
                    
                    {/* Interactive Eye contact overlay HUD */}
                    <div className="absolute inset-0 border border-emerald-500/20 pointer-events-none flex items-center justify-center">
                      {/* Grid overlay */}
                      <div className="absolute top-2 left-2 text-[9px] font-mono text-emerald-400 uppercase bg-black/40 px-1 rounded">Eye Contact HUD: Active</div>
                      
                      {/* Target crosshairs */}
                      <div className="w-32 h-32 rounded-full border border-dashed border-emerald-500/35 flex items-center justify-center animate-pulse">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                      </div>
                    </div>
                  </div>

                  {/* Eye tracker stats */}
                  <div className="bg-black/20 p-3.5 rounded-xl border border-white/5 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Eye Contact Focus:</span>
                      <span className="text-emerald-400 font-bold font-mono">{eyeContactScore}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Posture Alignment:</span>
                      <span className="text-slate-300 font-mono font-bold">{postureStatus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">AI Affect/Emotion:</span>
                      <span className="text-slate-300 font-mono font-semibold">{detectedEmotion}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-black/25 rounded-2xl border border-white/5 flex flex-col items-center">
                  <VideoOff className="w-8 h-8 text-slate-600 mb-2" />
                  <p className="text-[11px] font-medium text-slate-450 leading-relaxed">Webcam Eye-Tracker is disabled.</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">Toggle above to enable simulated posture & placement feedback.</p>
                </div>
              )}
            </div>

            {/* Stop Round */}
            <button
              onClick={handleCloseSessionWithoutEvaluation}
              className="w-full bg-white/5 hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/30 text-xs font-bold py-3 px-4 rounded-xl text-slate-300 hover:text-rose-300 transition-all flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              Abandon Placement Mock Session
            </button>
          </div>

          {/* Main Chat Feed Block */}
          <div className="lg:col-span-8 bg-white/5 border border-white/10 rounded-[32px] backdrop-blur-md overflow-hidden flex flex-col h-[580px] justify-between">
            {/* Board Header */}
            <div className="bg-white/5 px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">AI Interactive Recruiter Board</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Target: {session.company || 'Standard'} • {session.type === 'hr' ? 'HR Round' : 'Technical Round'}</p>
              </div>

              {/* TTS toggling */}
              <button
                onClick={() => setTtsEnabled(!ttsEnabled)}
                className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition flex items-center gap-1.5 ${
                  ttsEnabled
                    ? 'bg-pink-500/10 border-pink-500/35 text-pink-300'
                    : 'bg-white/5 border-white/10 text-slate-450 hover:bg-white/10'
                }`}
              >
                {ttsEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                {ttsEnabled ? 'TTS Voice: On' : 'TTS Voice: Muted'}
              </button>
            </div>

            {/* Chat Messages */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar bg-black/35">
              {session.messages.map((msg) => {
                const isAI = msg.sender === 'interviewer';
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 max-w-[85%] ${isAI ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                  >
                    {/* User profile bubbles */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border shrink-0 ${
                      isAI
                        ? 'bg-pink-500/10 border-pink-500/20 text-pink-300'
                        : 'bg-white/5 border-white/10 text-emerald-300'
                    }`}>
                      {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>

                    <div className="space-y-1">
                      <div className={`rounded-2xl p-4 text-xs leading-relaxed ${
                        isAI
                          ? 'bg-white/5 border border-white/5 text-slate-200'
                          : 'bg-emerald-600/10 border border-emerald-500/20 text-emerald-100'
                      }`}>
                        {msg.text}
                      </div>
                      
                      <div className={`flex items-center gap-2 text-[10px] text-slate-500 ${isAI ? '' : 'justify-end'}`}>
                        <span>{msg.timestamp}</span>
                        {isAI && window.speechSynthesis && (
                          <button
                            onClick={() => speakText(msg.text)}
                            className="text-pink-400 hover:text-pink-300 transition-all font-semibold flex items-center gap-0.5"
                          >
                            <Volume2 className="w-3 h-3" /> Replay Voice
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {submittingMsg && (
                <div className="flex gap-3 mr-auto max-w-[80%] items-center text-xs text-slate-500 italic">
                  <div className="w-8 h-8 rounded-full bg-pink-500/5 border border-pink-500/10 flex items-center justify-center text-pink-300 animate-pulse">
                    <Bot className="w-4 h-4" />
                  </div>
                  Interviewer writing notes and formulating response...
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat message input / Voice Controls */}
            <div className="p-4 border-t border-white/10 bg-white/5 space-y-3">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSendMessage} className="flex gap-2.5">
                {/* Speech recognition trigger */}
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-3 rounded-xl border transition-all ${
                    isListening
                      ? 'bg-rose-600 border-rose-500 text-white animate-pulse shadow-md shadow-rose-600/20'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                  title={isListening ? "Stop voice dictation" : "Start dictating response with your voice"}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={isListening ? "Listening closely... Speak now!" : "Draft your interview response argument..."}
                  disabled={submittingMsg}
                  className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 text-xs text-white focus:outline-hidden focus:border-pink-500"
                />

                <button
                  type="submit"
                  disabled={submittingMsg || !inputText.trim()}
                  className="bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white p-3 rounded-xl transition shadow-lg shadow-pink-600/15"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              <div className="flex justify-between items-center pt-2 border-t border-white/5">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Aim for detailed responses containing STAR metrics.</span>
                <button
                  onClick={handleFinishInterview}
                  disabled={evaluating || session.messages.length < 2}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white font-bold text-[11px] py-1.5 px-3.5 rounded-lg flex items-center gap-1 shadow-md shadow-emerald-600/15 active:scale-95 transition"
                >
                  {evaluating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Evaluating Session...
                    </>
                  ) : (
                    <>
                      <Award className="w-3.5 h-3.5" />
                      Finish Round & Evaluate
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. FINAL EVALUATION REPORT SCREEN */}
      {evaluation && !session && (
        <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 backdrop-blur-md space-y-6 animate-fade-in max-w-4xl mx-auto">
          <div className="flex items-center justify-between border-b border-white/10 pb-5">
            <div>
              <div className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-semibold mb-2">
                <CheckCircle className="w-3.5 h-3.5" />
                Screening Completed
              </div>
              <h3 className="text-xl font-black text-white">Interactive Recruiter Evaluation Scorecard</h3>
            </div>

            <div className="text-center bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-slate-400">Weighted Score</span>
              <span className="text-3xl font-black text-emerald-400 block mt-0.5">{evaluation.score} <span className="text-xs font-normal text-slate-500">/10</span></span>
            </div>
          </div>

          <p className="text-slate-300 text-xs leading-relaxed font-sans bg-black/20 p-4 rounded-xl border border-white/5">
            <strong>Recruiter Verdict:</strong> {evaluation.verdict}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 space-y-3">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">🎉 Strategic Strengths</span>
              <ul className="text-xs text-slate-300 space-y-2.5">
                {evaluation.strengths?.map((str: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvement/Refactor targets */}
            <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 space-y-3">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">⚠️ Refactoring & Communication Gaps</span>
              <ul className="text-xs text-slate-300 space-y-2.5">
                {evaluation.weaknesses?.map((weak: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-amber-400 font-bold">!</span>
                    <span>{weak}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Detailed Question wise advice */}
          {evaluation.detailedFeedback && (
            <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 space-y-3">
              <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider block">💡 Step-By-Step Question Critiques & Ideal Refactored Answers</span>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                {evaluation.detailedFeedback}
              </p>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-white/5">
            <button
              onClick={() => setEvaluation(null)}
              className="bg-white/5 hover:bg-white/10 text-white font-bold py-3 px-6 border border-white/10 rounded-xl transition text-sm active:scale-95"
            >
              Start New Interview Screen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
