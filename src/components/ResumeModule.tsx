import React, { useState } from 'react';
import { Upload, Sparkles, Award, FileText, CheckCircle, AlertCircle, RefreshCw, Clipboard, Check, HelpCircle, Download, Linkedin, Mail } from 'lucide-react';
import { UserProfile, ResumeAnalysis } from '../types';
import { jsPDF } from 'jspdf';

interface ResumeModuleProps {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
  onAddHistory: (item: { type: 'aptitude' | 'coding' | 'interview' | 'resume'; title: string; score?: string | number }) => void;
}

export default function ResumeModule({ profile, setProfile, onAddHistory }: ResumeModuleProps) {
  const [activeTab, setActiveTab] = useState<'resume' | 'coverletter' | 'linkedin'>('resume');

  // -------------------------------------------------------------
  // 1. ATS Resume States
  // -------------------------------------------------------------
  const [resumeText, setResumeText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  // -------------------------------------------------------------
  // 2. Cover Letter States
  // -------------------------------------------------------------
  const [clCompany, setClCompany] = useState('');
  const [clRole, setClRole] = useState('');
  const [clType, setClType] = useState('Internship Cover Letter');
  const [clSkills, setClSkills] = useState('');
  const [generatingCl, setGeneratingCl] = useState(false);
  const [generatedCl, setGeneratedCl] = useState('');
  const [clError, setClError] = useState('');
  const [clCopied, setClCopied] = useState(false);

  // -------------------------------------------------------------
  // 3. LinkedIn States
  // -------------------------------------------------------------
  const [liDomain, setLiDomain] = useState('');
  const [liExperience, setLiExperience] = useState('Entry-level');
  const [generatingLi, setGeneratingLi] = useState(false);
  const [liOptimization, setLiOptimization] = useState<any>(null);
  const [liError, setLiError] = useState('');
  const [liCopied, setLiCopied] = useState(false);

  // -------------------------------------------------------------
  // ATS Resume Actions
  // -------------------------------------------------------------
  const handleTextPaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setResumeText(e.target.value);
  };

  const handleAnalyzeResume = async () => {
    if (!resumeText.trim() || resumeText.trim().length < 50) {
      setError('Please provide a complete resume (at least 50 characters) to yield a meaningful audit.');
      return;
    }

    setAnalyzing(true);
    setError('');
    setAnalysis(null);

    try {
      const res = await fetch('/api/resume/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText }),
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        setAnalysis(data.analysis);

        // Award XP on successful audit
        const ats = data.analysis.atsScore || 65;
        const xpGained = ats * 2; // ATS rating * 2 XP

        setProfile({
          ...profile,
          xp: profile.xp + xpGained,
          currentStreak: profile.currentStreak === 0 ? 1 : profile.currentStreak,
        });

        onAddHistory({
          type: 'resume',
          title: 'ATS Resume Review',
          score: `${ats}/100 Score`
        });
      } else {
        setError(data.error || 'Failed to parse and analyze your resume.');
      }
    } catch (err) {
      setError('Connection interrupted. Please verify your internet connection.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setResumeText(event.target.result as string);
          }
        };
        reader.readAsText(file);
      } else {
        alert('Format not supported directly. Please copy-paste the text of your PDF/Word resume below for optimal results!');
      }
    }
  };

  const handleCopyToClipboard = () => {
    if (!analysis) return;
    navigator.clipboard.writeText(analysis.improvedResumeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    if (!analysis) return;
    const element = document.createElement("a");
    const file = new Blob([analysis.improvedResumeText], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = "optimized_resume.md";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleExportPDF = () => {
    if (!analysis) return;
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    let y = 15;

    // Helper to add page headers & footers
    const addPageDecoration = (pageNum: number) => {
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text("PrepAgent.AI - Recruiter-First Resume Audit Report", margin, 8);
      doc.text(`Page ${pageNum}`, pageWidth - margin - 10, 8);
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, 10, pageWidth - margin, 10);
    };

    let currentPage = 1;
    addPageDecoration(currentPage);

    // Title Block
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("ATS Resume Audit & Optimization Report", margin, y + 5);
    
    // Sub-header
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(`Generated on ${new Date().toLocaleDateString()} for ${profile.name} (${profile.email})`, margin, y + 15);
    
    // Draw a divider line
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.line(margin, y + 20, pageWidth - margin, y + 20);
    
    y += 27;

    // Section 1: Benchmarking Scores
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("1. ATS Grade & Score Card", margin, y);
    y += 6;

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(`Overall ATS Match Score: ${analysis.atsScore} / 100`, margin + 5, y);
    doc.text(`Grammar & Impact Score: ${analysis.grammarScore}%`, margin + 90, y);
    y += 8;

    // Section 2: Missing Skill Criteria
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("2. Missing Skill Criteria & Gaps", margin, y);
    y += 6;

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    const skillsText = analysis.missingSkills && analysis.missingSkills.length > 0 
      ? analysis.missingSkills.join(', ') 
      : "No critical skill gaps detected!";
    const splitSkills = doc.splitTextToSize(`Identified Gaps: ${skillsText}`, contentWidth - 10);
    doc.text(splitSkills, margin + 5, y);
    y += (splitSkills.length * 5) + 4;

    // Section 3: Formatting critique
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("3. ATS Architecture & Format Critique", margin, y);
    y += 6;

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    const splitCritique = doc.splitTextToSize(analysis.formatCritique || "Format is optimized for parsing standards.", contentWidth - 10);
    doc.text(splitCritique, margin + 5, y);
    y += (splitCritique.length * 5) + 6;

    // Add another page for the optimized text
    doc.addPage();
    currentPage++;
    addPageDecoration(currentPage);
    y = 20;

    // Section 4: Improved Resume Title
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("4. AI-Optimized Resume Text (Markdown Structure)", margin, y);
    y += 8;

    // Resume Text (Courier/Monospace)
    doc.setFont("Courier", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85); // slate-700
    
    const lines = doc.splitTextToSize(analysis.improvedResumeText, contentWidth - 5);
    
    for (let i = 0; i < lines.length; i++) {
      if (y > pageHeight - 15) {
        doc.addPage();
        currentPage++;
        addPageDecoration(currentPage);
        doc.setFont("Courier", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        y = 20;
      }
      doc.text(lines[i], margin + 2, y);
      y += 4.2;
    }

    doc.save(`PrepAgent_Resume_Evaluation_${profile.name.replace(/\s+/g, '_')}.pdf`);
  };

  // -------------------------------------------------------------
  // Cover Letter Actions
  // -------------------------------------------------------------
  const handleGenerateCoverLetter = async () => {
    if (!clCompany.trim() || !clRole.trim()) {
      setClError('Please provide both the Target Company and Target Role.');
      return;
    }
    setGeneratingCl(true);
    setClError('');
    setGeneratedCl('');
    try {
      const res = await fetch('/api/resume/coverletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: clCompany, role: clRole, type: clType, skills: clSkills }),
      });
      const data = await res.json();
      if (data.success && data.coverLetter) {
        setGeneratedCl(data.coverLetter);
        setProfile({
          ...profile,
          xp: profile.xp + 100
        });
        onAddHistory({
          type: 'resume',
          title: `Cover Letter: ${clCompany} (${clRole})`,
          score: 'Generated'
        });
      } else {
        setClError(data.error || 'Failed to generate cover letter.');
      }
    } catch (err) {
      setClError('Connection timeout. Please retry.');
    } finally {
      setGeneratingCl(false);
    }
  };

  const handleCopyClToClipboard = () => {
    if (!generatedCl) return;
    navigator.clipboard.writeText(generatedCl);
    setClCopied(true);
    setTimeout(() => setClCopied(false), 2000);
  };

  const handleDownloadClMarkdown = () => {
    if (!generatedCl) return;
    const element = document.createElement("a");
    const file = new Blob([generatedCl], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = `cover_letter_${clCompany.toLowerCase().replace(/\s+/g, '_')}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // -------------------------------------------------------------
  // LinkedIn Actions
  // -------------------------------------------------------------
  const handleOptimizeLinkedIn = async () => {
    if (!liDomain.trim()) {
      setLiError('Please provide your target Tech Domain.');
      return;
    }
    setGeneratingLi(true);
    setLiError('');
    setLiOptimization(null);
    try {
      const res = await fetch('/api/resume/linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ techDomain: liDomain, experience: liExperience }),
      });
      const data = await res.json();
      if (data.success && data.optimization) {
        setLiOptimization(data.optimization);
        setProfile({
          ...profile,
          xp: profile.xp + 100
        });
        onAddHistory({
          type: 'resume',
          title: `LinkedIn Upgrade: ${liDomain}`,
          score: `${data.optimization.seoScore}/100 Score`
        });
      } else {
        setLiError(data.error || 'Failed to optimize profile.');
      }
    } catch (err) {
      setLiError('Connection timeout. Please retry.');
    } finally {
      setGeneratingLi(false);
    }
  };

  const handleCopyLiAbout = () => {
    if (!liOptimization) return;
    navigator.clipboard.writeText(liOptimization.aboutSummary);
    setLiCopied(true);
    setTimeout(() => setLiCopied(false), 2000);
  };

  return (
    <div id="resume-module" className="space-y-6 animate-fade-in">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white/5 border border-white/10 rounded-[32px] p-8 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-[-40px] right-[-40px] w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-semibold mb-3">
            <FileText className="w-3.5 h-3.5" />
            AI Career Suite
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Recruiter-First Optimization Deck</h2>
          <p className="mt-2 text-slate-400 text-sm max-w-2xl">
            Upgrade your applicant assets. Scan CV keyword gaps against standard ATS trackers, generate bespoke cover letters, and maximize your LinkedIn search visibility.
          </p>
        </div>
      </div>

      {/* Sub tabs navigation */}
      <div className="flex border-b border-white/10 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('resume')}
          className={`px-5 py-3 text-xs font-bold rounded-t-xl border-t border-x transition flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'resume'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-transparent border-transparent text-slate-450 hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          ATS Resume Audit
        </button>
        <button
          onClick={() => setActiveTab('coverletter')}
          className={`px-5 py-3 text-xs font-bold rounded-t-xl border-t border-x transition flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'coverletter'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-transparent border-transparent text-slate-450 hover:text-white'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          AI Cover Letter Architect
        </button>
        <button
          onClick={() => setActiveTab('linkedin')}
          className={`px-5 py-3 text-xs font-bold rounded-t-xl border-t border-x transition flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'linkedin'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-transparent border-transparent text-slate-450 hover:text-white'
          }`}
        >
          <Linkedin className="w-3.5 h-3.5" />
          LinkedIn Profile SEO
        </button>
      </div>

      {/* -------------------------------------------------------------
          TAB 1: ATS RESUME SCANNER
          ------------------------------------------------------------- */}
      {activeTab === 'resume' && (
        <>
          {!analysis && !analyzing && (
            <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 backdrop-blur-md space-y-6">
              <h3 className="text-lg font-bold text-slate-200">Submit Your Resume Text</h3>
              
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition ${
                  isDragActive
                    ? 'border-emerald-500 bg-emerald-500/5'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <Upload className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                <p className="text-xs text-slate-350 font-semibold">
                  Drag and drop your text-based resume (.txt, .md) file here
                </p>
                <p className="text-[10px] text-slate-500 mt-1.5">
                  Or use the direct text paste workspace below (Highly recommended for PDF/Word files)
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-450 uppercase tracking-widest">Paste Full Resume Text</label>
                <textarea
                  value={resumeText}
                  onChange={handleTextPaste}
                  placeholder="Paste your standard resume content here (e.g. Education, Projects, Tech stack, Work Experience)..."
                  className="w-full h-64 bg-slate-950/80 border border-white/10 rounded-2xl p-4 text-xs text-white placeholder-slate-600 focus:outline-hidden focus:border-emerald-500 focus:bg-slate-900 transition leading-relaxed custom-scrollbar"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleAnalyzeResume}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg shadow-emerald-500/25 active:scale-95 transition text-sm flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Convene ATS Audit Scanner
                </button>
              </div>
            </div>
          )}

          {analyzing && (
            <div className="bg-white/5 border border-white/10 rounded-[32px] p-16 text-center flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <Sparkles className="w-5 h-5 text-emerald-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-200">Simulating ATS Evaluation Pipeline...</h4>
                <p className="text-[10px] text-slate-500 mt-1">Extracting terms, identifying missing keywords, grading syntax</p>
              </div>
            </div>
          )}

          {analysis && !analyzing && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Sidebar stats panel */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 backdrop-blur-md text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Overall ATS Match Score</span>
                  <div className="mt-4 relative inline-flex items-center justify-center">
                    <div className="w-28 h-28 rounded-full border-4 border-emerald-500/10 flex items-center justify-center">
                      <span className="text-4xl font-black text-emerald-400">{analysis.atsScore} <span className="text-xs font-normal text-slate-500">/100</span></span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-3 italic leading-relaxed">
                    Higher scores reflect stronger compatibility with Greenhouse & Workday algorithms.
                  </p>
                </div>

                {/* Score indicators */}
                <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 backdrop-blur-md space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                    <span className="text-xs text-slate-450 font-bold">Grammar & Impact Wording</span>
                    <span className="text-xs text-emerald-300 font-bold">{analysis.grammarScore}%</span>
                  </div>

                  {/* Missing Keywords */}
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider">Missing Skill Criteria</span>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.missingSkills?.map((skill, idx) => (
                        <span key={idx} className="bg-red-500/10 border border-red-500/20 text-red-300 px-2.5 py-1 rounded-lg text-[10px] font-semibold">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Suggested Projects */}
                  <div className="space-y-2 border-t border-white/5 pt-3.5">
                    <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Project Additions Needed</span>
                    <div className="space-y-2">
                      {analysis.suggestedProjects?.map((proj, idx) => (
                        <div key={idx} className="bg-white/5 p-2.5 rounded-xl border border-white/5 text-[11px] text-slate-300 leading-normal">
                          💡 {proj}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Main rewritten content frame */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                <div className="bg-white/5 border border-white/10 rounded-[32px] backdrop-blur-md overflow-hidden flex flex-col flex-1">
                  <div className="bg-white/5 px-6 py-4 border-b border-white/10 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">AI-Optimized High-Impact Resume Text</h4>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Markdown structure with action verbs</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyToClipboard}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Clipboard className="w-3.5 h-3.5" />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                      <button
                        onClick={handleDownloadMarkdown}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </button>
                      <button
                        id="btn-export-pdf"
                        onClick={handleExportPDF}
                        className="bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/30 text-xs text-white py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition shadow-sm font-semibold cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Export PDF
                      </button>
                    </div>
                  </div>

                  <div className="p-6 bg-black/30 overflow-y-auto max-h-[500px] custom-scrollbar text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {analysis.improvedResumeText}
                  </div>
                </div>

                {/* Formatting Critique */}
                <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 backdrop-blur-md">
                  <h4 className="text-sm font-bold text-white mb-2">Structure & File Scanner Critique</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{analysis.formatCritique}</p>
                  
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {analysis.atsOptimizationSuggestions?.map((sug, idx) => (
                      <div key={idx} className="bg-white/5 p-3 rounded-xl border border-white/5 flex items-start gap-2 text-slate-300">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span className="text-[11px] leading-relaxed">{sug}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end mt-6">
                    <button
                      onClick={() => setAnalysis(null)}
                      className="bg-white/5 hover:bg-white/10 text-white font-semibold py-2.5 px-6 border border-white/10 rounded-xl transition text-sm active:scale-95"
                    >
                      Analyze Different Resume
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* -------------------------------------------------------------
          TAB 2: AI COVER LETTER GENERATOR
          ------------------------------------------------------------- */}
      {activeTab === 'coverletter' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Inputs */}
          <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-[32px] p-6 backdrop-blur-md space-y-5">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-white/5 pb-2">Configure Cover Letter</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-450 uppercase">Target Company</label>
                <input
                  type="text"
                  value={clCompany}
                  onChange={(e) => setClCompany(e.target.value)}
                  placeholder="e.g. Amazon"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-450 uppercase">Target Role</label>
                <input
                  type="text"
                  value={clRole}
                  onChange={(e) => setClRole(e.target.value)}
                  placeholder="e.g. Software Intern"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-450 uppercase">Document Style Track</label>
              <select
                value={clType}
                onChange={(e) => setClType(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500"
              >
                <option value="Internship Cover Letter">🎯 Internship Cover Letter (Fresher focus)</option>
                <option value="Fresher Entry Role">🎓 Entry-Level SDE (Concepts & projects focus)</option>
                <option value="Experienced SDE">🚀 Experienced SDE (Leadership & scale focus)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-450 uppercase">Your Highlighted Skills (Optional)</label>
              <textarea
                value={clSkills}
                onChange={(e) => setClSkills(e.target.value)}
                placeholder="e.g., React, Node.js, DSA competitive coding, team projects..."
                className="w-full h-24 bg-slate-900 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-hidden focus:border-emerald-500 resize-none"
              />
            </div>

            {clError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {clError}
              </div>
            )}

            <button
              onClick={handleGenerateCoverLetter}
              disabled={generatingCl}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition text-xs flex items-center justify-center gap-2"
            >
              {generatingCl ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Drafting Cover Letter...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Draft Custom Cover Letter
                </>
              )}
            </button>
          </div>

          {/* Results preview */}
          <div className="lg:col-span-7 space-y-4">
            {generatedCl ? (
              <div className="bg-white/5 border border-white/10 rounded-[32px] overflow-hidden flex flex-col">
                <div className="bg-white/5 px-6 py-4 border-b border-white/10 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">AI Generated Cover Letter</h4>
                    <p className="text-[10px] text-slate-400">Perfect recruiter template pitch</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyClToClipboard}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-slate-300 py-1 px-2.5 rounded-lg flex items-center gap-1 transition"
                    >
                      {clCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Clipboard className="w-3.5 h-3.5" />}
                      {clCopied ? 'Copied' : 'Copy'}
                    </button>
                    <button
                      onClick={handleDownloadClMarkdown}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-slate-300 py-1 px-2.5 rounded-lg flex items-center gap-1 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                  </div>
                </div>
                <div className="p-6 bg-black/45 text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap max-h-[460px] overflow-y-auto custom-scrollbar">
                  {generatedCl}
                </div>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-[32px] p-16 text-center text-slate-500 border-dashed flex flex-col items-center justify-center">
                <Mail className="w-12 h-12 text-slate-600 mb-3" />
                <p className="text-xs font-semibold">Ready to draft your persuasive target cover letter.</p>
                <p className="text-[10px] text-slate-600 mt-1">Configure the company and target role on the left and submit.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB 3: LINKEDIN PROFILE SEO UPGRADE
          ------------------------------------------------------------- */}
      {activeTab === 'linkedin' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Inputs */}
          <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-[32px] p-6 backdrop-blur-md space-y-5">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-white/5 pb-2">Profile Configuration</h3>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-450 uppercase">Primary Technical Domain Focus</label>
              <input
                type="text"
                value={liDomain}
                onChange={(e) => setLiDomain(e.target.value)}
                placeholder="e.g. Full Stack React / Node SDE"
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-450 uppercase">Experience Bucket</label>
              <select
                value={liExperience}
                onChange={(e) => setLiExperience(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500"
              >
                <option value="Final-Year / SDE Aspirant">🎓 Final Year Student (Projects focus)</option>
                <option value="Entry-level (0-2 years)">🌱 Entry-Level Professional (Skills focus)</option>
                <option value="Senior Professional (3+ years)">🚀 Senior SDE (Architecture & leadership focus)</option>
              </select>
            </div>

            {liError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {liError}
              </div>
            )}

            <button
              onClick={handleOptimizeLinkedIn}
              disabled={generatingLi}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition text-xs flex items-center justify-center gap-2"
            >
              {generatingLi ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating Profile Strategy...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Upgrade LinkedIn SEO
                </>
              )}
            </button>
          </div>

          {/* Results preview */}
          <div className="lg:col-span-7 space-y-6">
            {liOptimization ? (
              <div className="space-y-6">
                {/* Score and summary widget */}
                <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 backdrop-blur-md flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">LinkedIn Strength Index</span>
                    <h4 className="text-base font-bold text-white">Algorithm Relevance</h4>
                    <p className="text-[10px] text-slate-400">Your custom upgrade delivers premium search placement.</p>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 px-5 py-2.5 rounded-2xl text-center">
                    <span className="text-[9px] uppercase font-bold text-slate-400">SEO Score</span>
                    <span className="text-2xl font-black text-emerald-400 block mt-0.5">{liOptimization.seoScore}</span>
                  </div>
                </div>

                {/* Headlines */}
                <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 backdrop-blur-md space-y-3.5">
                  <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">🔥 SEO Headlines (Choose one)</span>
                  <div className="space-y-2 text-xs">
                    {liOptimization.headlines?.map((headline: string, idx: number) => (
                      <div key={idx} className="bg-black/25 p-3 rounded-xl border border-white/5 text-slate-300 font-medium font-sans">
                        {headline}
                      </div>
                    ))}
                  </div>
                </div>

                {/* About block */}
                <div className="bg-white/5 border border-white/10 rounded-[32px] overflow-hidden">
                  <div className="bg-white/5 px-6 py-4 border-b border-white/10 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">👤 Story-Driven Summary (About Section)</span>
                    <button
                      onClick={handleCopyLiAbout}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-slate-300 py-1 px-2.5 rounded-lg flex items-center gap-1 transition"
                    >
                      {liCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Clipboard className="w-3.5 h-3.5" />}
                      {liCopied ? 'Copied' : 'Copy About'}
                    </button>
                  </div>
                  <div className="p-6 bg-black/45 text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap max-h-[300px] overflow-y-auto custom-scrollbar">
                    {liOptimization.aboutSummary}
                  </div>
                </div>

                {/* Keywords & Actions checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 backdrop-blur-md space-y-3">
                    <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">🏷️ SEO Keywords to Inject</span>
                    <div className="flex flex-wrap gap-1.5">
                      {liOptimization.keywords?.map((kw: string, idx: number) => (
                        <span key={idx} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 backdrop-blur-md space-y-3">
                    <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">💡 Checklist Tasks</span>
                    <ul className="text-[11px] text-slate-400 space-y-1.5 list-disc list-inside">
                      {liOptimization.checklist?.map((check: string, idx: number) => (
                        <li key={idx} className="leading-relaxed">{check}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-[32px] p-16 text-center text-slate-500 border-dashed flex flex-col items-center justify-center">
                <Linkedin className="w-12 h-12 text-slate-600 mb-3" />
                <p className="text-xs font-semibold">LinkedIn SEO Strategy Board</p>
                <p className="text-[10px] text-slate-600 mt-1">Configure your domain on the left to activate algorithmic tuning suggestions.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
