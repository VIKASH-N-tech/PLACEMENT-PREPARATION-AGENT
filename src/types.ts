export type Difficulty = 'easy' | 'medium' | 'hard';

export interface AptitudeQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // Index 0-3
  explanation: string;
  category: 'quantitative' | 'logical' | 'verbal';
  difficulty: Difficulty;
}

export interface CodingChallenge {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  sampleInput: string;
  sampleOutput: string;
  constraints: string;
  starterCode: {
    python: string;
    cpp: string;
    java: string;
    javascript: string;
  };
  hints: string[];
}

export interface Message {
  id: string;
  sender: 'student' | 'interviewer';
  text: string;
  timestamp: string;
}

export interface InterviewSession {
  id: string;
  type: 'hr' | 'technical';
  topic?: string; // DSA, OOPS, DBMS, OS, CN (for Technical)
  company?: string; // e.g. "Google", "Amazon" (if company prep mode)
  messages: Message[];
  status: 'active' | 'completed';
  score?: number; // Out of 10
  evaluation?: {
    communication: string;
    technicalSkills?: string;
    confidence: string;
    grammar: string;
    strengths: string[];
    improvements: string[];
    overallFeedback: string;
  };
}

export interface ResumeAnalysis {
  atsScore: number;
  grammarScore: number;
  strengths: string[];
  missingSkills: string[];
  suggestedProjects: string[];
  formatCritique: string;
  atsOptimizationSuggestions: string[];
  improvedResumeText: string;
}

export interface UserProfile {
  name: string;
  email: string;
  targetRole: string;
  preferredLanguage: string;
  currentStreak: number;
  longestStreak: number;
  xp: number;
  completedQuizzes: number;
  completedCoding: number;
  completedInterviews: number;
  theme?: 'dark' | 'light';
  studySchedule?: {
    aptitudeGoal: number;
    codingGoal: number;
    aptitudeDone: number;
    codingDone: number;
  };
  weeklyProgress?: { day: string; xp: number }[];
  weakTopics: { topic: string; score: number }[];
  history: {
    id: string;
    type: 'aptitude' | 'coding' | 'interview' | 'resume';
    title: string;
    score?: string | number;
    date: string;
  }[];
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  email: string;
  xp: number;
  streak: number;
  isCurrentUser?: boolean;
}
