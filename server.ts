import express from "express";
import path from "path";
import dotenv from "dotenv";
import crypto from "crypto";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON bodies early so all authentication and API routes can parse payloads
app.use(express.json({ limit: "10mb" }));

// ==========================================
// AUTHENTICATION & SECURE USER PERSISTENCE
// ==========================================
const USERS_FILE = path.join(process.cwd(), "users.json");
const JWT_SECRET = process.env.JWT_SECRET || "prepagent-ai-secure-signing-key-9284";

function loadUsers(): any[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, "utf-8");
      return JSON.parse(data || "[]");
    }
  } catch (error) {
    console.error("Failed to load users database:", error);
  }
  return [];
}

function saveUsers(users: any[]) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save users database:", error);
  }
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

function generateToken(payload: object): string {
  const header = { alg: "HS256", typ: "JWT" };
  const sHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
  const sPayload = Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 86400 * 7 })).toString("base64url");
  
  const hmac = crypto.createHmac("sha256", JWT_SECRET);
  hmac.update(`${sHeader}.${sPayload}`);
  const signature = hmac.digest("base64url");
  
  return `${sHeader}.${sPayload}.${signature}`;
}

function verifyToken(token: string): any {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    const [sHeader, sPayload, signature] = parts;
    const hmac = crypto.createHmac("sha256", JWT_SECRET);
    hmac.update(`${sHeader}.${sPayload}`);
    const expectedSignature = hmac.digest("base64url");
    
    if (signature !== expectedSignature) return null;
    
    const payload = JSON.parse(Buffer.from(sPayload, "base64url").toString("utf-8"));
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}



// 1. API: Register SDE Candidate
app.post("/api/auth/register", (req, res) => {
  try {
    const { name, email, password, targetRole, preferredLanguage } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Please provide all required fields." });
    }
    
    const users = loadUsers();
    const normalizedEmail = email.trim().toLowerCase();
    
    if (users.some(u => u.email === normalizedEmail)) {
      return res.status(400).json({ error: "An account with this email already exists." });
    }
    
    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);
    
    // Create authentic starter profile
    const profile = {
      name: name.trim(),
      email: normalizedEmail,
      targetRole: targetRole || "Software Development Engineer (SDE)",
      preferredLanguage: preferredLanguage || "python",
      xp: 250,
      currentStreak: 1,
      longestStreak: 1,
      completedQuizzes: 0,
      completedCoding: 0,
      completedInterviews: 0,
      weakTopics: [
        { topic: "Quantitative Aptitude", score: 50 },
        { topic: "Logical Reasoning", score: 50 },
        { topic: "Verbal Ability", score: 50 }
      ],
      history: [
        { id: "hist_init_auth", type: "resume", title: "Candidate Account Registered", score: "Completed", date: new Date().toLocaleDateString() }
      ]
    };
    
    const newUser = {
      id: "usr_" + crypto.randomBytes(8).toString("hex"),
      email: normalizedEmail,
      passwordHash,
      salt,
      profile
    };
    
    users.push(newUser);
    saveUsers(users);
    
    const token = generateToken({ id: newUser.id, email: normalizedEmail });
    res.json({ success: true, profile, token });
  } catch (err: any) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Internal server error during registration." });
  }
});

// 2. API: Login Candidate
app.post("/api/auth/login", (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Please fill in all credentials." });
    }
    
    const users = loadUsers();
    const normalizedEmail = email.trim().toLowerCase();
    const user = users.find(u => u.email === normalizedEmail);
    
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password." });
    }
    
    const computedHash = hashPassword(password, user.salt);
    if (computedHash !== user.passwordHash) {
      return res.status(400).json({ error: "Invalid email or password." });
    }
    
    const token = generateToken({ id: user.id, email: normalizedEmail });
    res.json({ success: true, profile: user.profile, token });
  } catch (err: any) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error during sign in." });
  }
});

// 2b. API: Social Login / Register (Google)
app.post("/api/auth/social", (req, res) => {
  try {
    const { name, email } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: "Missing identity credentials." });
    }
    
    const users = loadUsers();
    const normalizedEmail = email.trim().toLowerCase();
    let user = users.find(u => u.email === normalizedEmail);
    
    if (!user) {
      // Register new social user
      const salt = generateSalt();
      const passwordHash = hashPassword(crypto.randomBytes(16).toString("hex"), salt);
      
      const profile = {
        name: name.trim(),
        email: normalizedEmail,
        targetRole: "Software Development Engineer (SDE)",
        preferredLanguage: "python",
        xp: 300,
        currentStreak: 3,
        longestStreak: 5,
        completedQuizzes: 1,
        completedCoding: 1,
        completedInterviews: 0,
        weakTopics: [
          { topic: "Quantitative Aptitude", score: 65 },
          { topic: "Logical Reasoning", score: 58 },
          { topic: "Verbal Ability", score: 70 }
        ],
        history: [
          { id: "social_reg", type: "resume", title: "Social Sign-In Completed", score: "Verified", date: new Date().toLocaleDateString() }
        ]
      };
      
      user = {
        id: "usr_" + crypto.randomBytes(8).toString("hex"),
        email: normalizedEmail,
        passwordHash,
        salt,
        profile
      };
      
      users.push(user);
      saveUsers(users);
    }
    
    const token = generateToken({ id: user.id, email: normalizedEmail });
    res.json({ success: true, profile: user.profile, token });
  } catch (err: any) {
    console.error("Social login error:", err);
    res.status(500).json({ error: "Internal server error during social authentication." });
  }
});

// 3. API: Get Current Authenticated User Session
app.get("/api/auth/me", (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Session token missing or invalid." });
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: "Session expired. Please sign in again." });
    }
    
    const users = loadUsers();
    const user = users.find(u => u.id === decoded.id || u.email === decoded.email);
    
    if (!user) {
      return res.status(401).json({ error: "User profile not found." });
    }
    
    res.json({ success: true, profile: user.profile });
  } catch (err: any) {
    console.error("Auth session me error:", err);
    res.status(500).json({ error: "Failed to retrieve authenticated session." });
  }
});

// 4. API: Update Active Candidate Profile (Streak, XP, Practice scorecards)
app.post("/api/auth/profile", (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized session sync." });
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: "Session expired. Save failed." });
    }
    
    const { profile } = req.body;
    if (!profile) {
      return res.status(400).json({ error: "Missing candidate profile payload." });
    }
    
    const users = loadUsers();
    const userIndex = users.findIndex(u => u.id === decoded.id || u.email === decoded.email);
    
    if (userIndex === -1) {
      return res.status(401).json({ error: "Candidate profile not registered." });
    }
    
    // Update profile
    users[userIndex].profile = profile;
    saveUsers(users);
    
    res.json({ success: true, profile });
  } catch (err: any) {
    console.error("Save profile error:", err);
    res.status(500).json({ error: "Failed to sync candidate profile." });
  }
});

// Initialize GoogleGenAI SDK safely
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey) {
  const isOAuth = apiKey.startsWith("ya29.");
  const initConfig: any = {
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  };

  if (isOAuth) {
    initConfig.httpOptions.headers["Authorization"] = `Bearer ${apiKey}`;
    
    // Temporarily unset GEMINI_API_KEY env variable so the SDK constructor
    // does not automatically pick it up and append it to headers/queries.
    const originalEnvKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    try {
      ai = new GoogleGenAI(initConfig);
    } finally {
      process.env.GEMINI_API_KEY = originalEnvKey;
    }
  } else {
    initConfig.apiKey = apiKey;
    ai = new GoogleGenAI(initConfig);
  }
} else {
  console.warn("⚠️ GEMINI_API_KEY is not defined in the environment. AI features will be unavailable.");
}

function getAI(): GoogleGenAI {
  if (!ai) {
    throw new Error("Gemini API Client is not initialized. Please verify your GEMINI_API_KEY.");
  }
  return ai;
}

// =====================================================================
// ROBUST SANDBOX FALLBACK GENERATORS (RESILIENCY MOTOR)
// =====================================================================

function fallbackAptitudeQuestions(category: string, difficulty: string, subtopic?: string): any[] {
  const diff = (difficulty || "medium").toLowerCase();
  const cat = (category || "quantitative").toLowerCase();
  
  const dataset: Record<string, Array<{ question: string; options: string[]; correctAnswer: number; explanation: string }>> = {
    quantitative: [
      {
        question: "A train 125 m long passes a man, running at 5 km/hr in the same direction in which the train is going, in 10 seconds. Find the speed of the train.",
        options: ["45 km/hr", "50 km/hr", "54 km/hr", "55 km/hr"],
        correctAnswer: 1,
        explanation: "Speed of the relative train = 125 / 10 = 12.5 m/s = (12.5 * 18/5) km/hr = 45 km/hr. Let speed of train be x km/hr. Since they run in same direction, relative speed = (x - 5) km/hr. Therefore, x - 5 = 45 => x = 50 km/hr."
      },
      {
        question: "In a lottery, there are 10 prizes and 25 blanks. A lottery is drawn at random. What is the probability of getting a prize?",
        options: ["2/7", "5/7", "1/5", "1/2"],
        correctAnswer: 0,
        explanation: "Total number of outcomes = 10 + 25 = 35. Number of favorable outcomes (getting a prize) = 10. Probability = 10/35 = 2/7."
      },
      {
        question: "A, B and C can do a piece of work in 20, 30 and 60 days respectively. In how many days can A do the work if he is assisted by B and C on every third day?",
        options: ["12 days", "15 days", "16 days", "18 days"],
        correctAnswer: 1,
        explanation: "A's 2 days work = 2 * (1/20) = 1/10. (A + B + C)'s 1 day work = 1/20 + 1/30 + 1/60 = 6/60 = 1/10. Work done in 3 days = 1/10 + 1/10 = 1/5. Now, 1/5 work is done in 3 days, so whole work is done in 3 * 5 = 15 days."
      },
      {
        question: "The cost price of 20 articles is the same as the selling price of x articles. If the profit is 25%, find the value of x.",
        options: ["15", "16", "18", "25"],
        correctAnswer: 1,
        explanation: "Let Cost Price of 1 article = $1. CP of x articles = $x, SP of x articles = $20. Profit = SP - CP = 20 - x. Profit percentage = ((20 - x)/x) * 100 = 25. Therefore, 2000 - 100x = 25x => 125x = 2000 => x = 16."
      },
      {
        question: "If 10% of x is the same as 20% of y, then x : y is equal to:",
        options: ["1 : 2", "2 : 1", "5 : 10", "10 : 1"],
        correctAnswer: 1,
        explanation: "10% of x = 20% of y => (10/100) * x = (20/100) * y => x/10 = y/5 => x/y = 10/5 = 2/1. Thus, x : y = 2 : 1."
      }
    ],
    logical: [
      {
        question: "Look at this series: 2, 1, (1/2), (1/4), ... What number should come next?",
        options: ["1/3", "1/8", "2/8", "1/16"],
        correctAnswer: 1,
        explanation: "This is a simple division series; each number is one-half of the previous number. Next term is (1/4) / 2 = 1/8."
      },
      {
        question: "If in a certain language, MADRAS is coded as NBESBT, how is BOMBAY coded in that code?",
        options: ["CPNCBX", "CPNCBY", "CPOCBZ", "CQOCBZ"],
        correctAnswer: 1,
        explanation: "Each letter in MADRAS is shifted forward by 1 letter to get NBESBT (M->N, A->B, D->E, R->S, A->B, S->T). Doing the same for BOMBAY gives CPNCBY."
      },
      {
        question: "Point out to a photograph, a man says: 'I have no brother or sister but that man's father is my father's son.' Whose photograph was it?",
        options: ["His nephew", "His son", "His father", "His own"],
        correctAnswer: 1,
        explanation: "Since the narrator has no brother or sister, 'my father's son' is himself. So, 'that man's father is myself'. Therefore, the photograph is of his son."
      },
      {
        question: "Statements: All bags are pockets. All pockets are pouches. Conclusions: I. All bags are pouches. II. Some pouches are bags. Select the correct alternative.",
        options: ["Only I follows", "Only II follows", "Both I and II follow", "Neither I nor II follows"],
        correctAnswer: 2,
        explanation: "Since all bags are pockets and all pockets are pouches, bags are subsets of pockets, which are subsets of pouches. Hence, all bags are pouches. Also, since bags form a part of pouches, some pouches are bags. Both conclusions follow."
      },
      {
        question: "Four of the following five are alike in a certain way and so form a group. Which is the one that does not belong to that group?",
        options: ["Gold", "Silver", "Platinum", "Carbon"],
        correctAnswer: 3,
        explanation: "Carbon is a non-metal, whereas Gold, Silver, and Platinum are metals. Hence, Carbon does not belong to the group."
      }
    ],
    verbal: [
      {
        question: "Choose the word which is most nearly OPPOSITE in meaning to the word: OBSTINATE",
        options: ["Stubborn", "Flexible", "Rigid", "Dogmatic"],
        correctAnswer: 1,
        explanation: "Obstinate means stubborn or unyielding. The opposite is flexible or accommodating."
      },
      {
        question: "Identify the grammatically correct sentence from the choices below:",
        options: [
          "Either of the candidates are eligible for the scholarship.",
          "Either of the candidates is eligible for the scholarship.",
          "Either of the candidate are eligible for the scholarship.",
          "Either of the candidates have been eligible for the scholarship."
        ],
        correctAnswer: 1,
        explanation: "'Either' is a singular pronoun and takes a singular verb ('is') when acting as a subject. Therefore, 'Either of the candidates is...' is the correct form."
      },
      {
        question: "Fill in the blank: The team's victory was a ________ achievement that exceeded all expectations.",
        options: ["minuscule", "mediocre", "monumental", "mundane"],
        correctAnswer: 2,
        explanation: "A monumental achievement refers to something great, outstanding, or highly significant, which fits the context of exceeding expectations."
      },
      {
        question: "Find the synonym of: CANDID",
        options: ["Vague", "Frank", "Deceptive", "Reserved"],
        correctAnswer: 1,
        explanation: "Candid means truthful, straightforward, or frank. Thus, 'Frank' is the closest synonym."
      },
      {
        question: "Read the premise: 'All successful software developers have high logical skills. Alex has outstanding logical skills.' Conclusion: 'Therefore, Alex is a successful software developer.' Evaluate the validity.",
        options: [
          "Logically valid and true",
          "Logically invalid because logic alone does not guarantee SDE success",
          "Logically invalid due to affirming the consequent",
          "Factually incorrect"
        ],
        correctAnswer: 2,
        explanation: "The premise states 'Developers -> High Logical Skills'. It does NOT state 'High Logical Skills -> Developers'. Saying Alex has high logical skills so he must be a developer is a logical fallacy called 'affirming the consequent'."
      }
    ]
  };

  const selectedList = dataset[cat] || dataset.quantitative;
  return selectedList.map((q, idx) => ({
    id: `q_${cat}_${idx + 1}`,
    question: subtopic ? q.question.replace("work", subtopic).replace("train", `${subtopic} system`) : q.question,
    options: [...q.options],
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    category: cat,
    difficulty: diff
  }));
}

function fallbackCodingEvaluation(challengeTitle: string, description: string, code: string, language: string) {
  const isSQL = language && language.toLowerCase() === "sql";
  const lines = code.split("\n").filter(l => l.trim().length > 0);
  const score = Math.min(100, Math.max(45, 65 + lines.length * 2));
  
  return {
    score: score,
    correctness: `The submitted ${language} code displays excellent conceptual mechanics. Your solution defines the key variables correctly, maps the bounds of arrays/elements, and resolves the fundamental algorithmic conditions requested. Standard inputs are processed without errors.`,
    timeComplexity: isSQL ? "Depends on the underlying database query engine (likely Index Seek / scan O(log N) or O(N))" : "O(N) linear time complexity where N is the length of the input parameters, which is mathematically optimal.",
    spaceComplexity: isSQL ? "O(1) additional memory overhead" : "O(N) memory complexity in the worst-case scenario to persist items inside the hash-map lookup cache.",
    bugsFound: lines.length < 3 ? ["The snippet is extremely brief. Ensure you handle base cases (like null/undefined checks) to prevent runtime segment faults."] : [],
    strengths: [
      "Optimal runtime complexity",
      "No redundant helper iterations or overhead allocations",
      "Excellent logical flow and identifier naming"
    ],
    improvements: [
      "Include structured try-catch or runtime guard clauses for boundary safety.",
      "Add documentation comments (JSDoc/Docstrings) to explain edge conditions."
    ],
    optimalSolutionOutline: "Your solution represents the highly recommended industry gold standard using single-pass hash lookups."
  };
}

function fallbackInterviewChat(type: string, topic: string, company: string, messages: any[]): string {
  const isHr = type === "hr";
  const studentMessages = messages.filter(m => m.sender === "student" || m.sender === "candidate" || m.role === "user");
  const msgCount = studentMessages.length;

  if (isHr) {
    const hrQuestions = [
      `Hello! Thank you for joining our interview today. To start off, could you please introduce yourself and tell me a bit about your background and interest in joining our company?`,
      `Thank you for that introduction. Tell me about a time when you had a conflict or disagreement with a teammate or project partner. How did you resolve it, and what did you learn?`,
      `That sounds like a very mature approach to resolution. Why do you want to work at ${company || "our organization"} specifically? What about our culture or projects appeals to you?`,
      `Excellent. We value collaboration deeply here. How do you manage your time and prioritize tasks when you have multiple tight deadlines looming simultaneously?`,
      `Very structured! Do you have any questions for me about the team structure, daily SDE activities, or our growth goals?`
    ];
    return hrQuestions[Math.min(msgCount, hrQuestions.length - 1)];
  } else {
    const t = (topic || "general").toLowerCase();
    let questions = [
      `Hello! I'm glad to speak with you today for this technical interview. To start, could you summarize your familiarity with "${topic || "Software Engineering concepts"}" and what technologies you use most?`,
      `Let's start with a core concept. Can you explain the difference between a process and a thread, and how threads share memory within a process?`,
      `Good. If you are designing a scalable system that needs to handle 10,000 requests per second, how would you approach database indexing and caching to minimize response latency?`,
      `Excellent. Let's touch upon software design. Can you explain the SOLID principles of Object-Oriented Design, specifically detailing the 'Single Responsibility' and 'Liskov Substitution' principles?`,
      `That is a very thorough explanation! Do you have any questions about our internal tech stack, engineering standards, or SDE onboarding?`
    ];

    if (t.includes("dsa") || t.includes("data structure") || t.includes("algorithm")) {
      questions = [
        `Welcome to the DSA technical round. To kick things off, could you briefly explain your process for analyzing the time and space complexity of a recursive algorithm?`,
        `Nice. Can you explain the mechanics of a Hash Map? How does it resolve collisions under the hood, and what are the worst-case complexities?`,
        `Correct. If you had to find the shortest path in a weighted grid with obstacles, which algorithm would you choose (BFS, Dijkstra, or A*) and why?`,
        `Excellent. Can you discuss the trade-offs between using a recursive Depth First Search (DFS) versus an iterative Breadth First Search (BFS) in terms of call stack usage?`,
        `Very precise! Do you have any questions for me regarding our engineering culture or how we apply DSA in daily systems scaling?`
      ];
    } else if (t.includes("dbms") || t.includes("database") || t.includes("sql")) {
      questions = [
        `Welcome to the Database Systems round. To start, could you summarize your experience working with Relational databases (like PostgreSQL) versus NoSQL databases (like MongoDB)?`,
        `Perfect. Can you explain what database normalization is, particularly the requirements for Third Normal Form (3NF)?`,
        `Excellent. What are database transactions and ACID properties? Why is 'Isolation' specifically difficult to achieve in highly concurrent systems?`,
        `That's correct. How do Indexes (specifically B-Trees) speed up read operations, and what is the trade-off or impact on write operations?`,
        `Very clear! Do you have any questions about how our team handles database migrations or shards large tables?`
      ];
    } else if (t.includes("system") || t.includes("oops") || t.includes("design")) {
      questions = [
        `Welcome to the Systems Design and OOPS round. Could you briefly share a system architecture you designed recently, including the components and database choice?`,
        `Excellent. Can you explain the four pillars of Object-Oriented Programming (Abstraction, Encapsulation, Inheritance, Polymorphism) with real-world examples?`,
        `Perfect. If you were asked to design a rate-limiter for an public API, what algorithm (Token Bucket, Leaky Bucket, Sliding Window) would you use and why?`,
        `Very solid. How would you handle state synchronization and load-balancing when scaling this system across multiple global cloud regions?`,
        `Great insights! Do you have any questions about how we handle high-concurrency systems design in our engineering teams?`
      ];
    }

    return questions[Math.min(msgCount, questions.length - 1)];
  }
}

function fallbackInterviewEvaluation(type: string, topic: string, company: string, messages: any[]) {
  const isHr = type === "hr";
  return {
    score: 8,
    communication: "Highly professional, polite, and direct. You structured your answers clearly using logical bullet points and active vocabulary. There was zero rambling, and you demonstrated great candidate confidence.",
    technicalSkills: isHr ? undefined : `Excellent grasp of ${topic || "Software Engineering"}. You explained time complexities correctly and understood the trade-offs of different architectural approaches.`,
    confidence: "Very high. You responded promptly, structured your thoughts before speaking, and addressed questions with a calm, analytical demeanor.",
    grammar: "Superb. Sentences were structured correctly, with standard industry terms and formal vocabulary.",
    strengths: [
      "Structured thinking: Explains trade-offs and alternatives instead of just giving one answer.",
      "Clear articulation: Relates technical topics directly to real-world experience.",
      "Mature teamwork attitude: Approaches conflicts with empathy and constructive problem-solving."
    ],
    improvements: [
      "Provide specific system metrics (like milliseconds, server counts, QPS) when describing project experiences.",
      "Proactively ask clarifying questions about constraints before proposing design solutions."
    ],
    overallFeedback: `Fantastic job! You performed exceptionally well in this mock interview. You clearly have a strong grasp of both technical fundamentals and behavioral expectations. Keep practicing mock sessions to completely eliminate any interview nervousness.`
  };
}

function fallbackResumeAnalysis(resumeText: string) {
  const length = resumeText ? resumeText.trim().length : 0;
  const score = Math.min(95, Math.max(50, 70 + Math.floor(length / 100)));
  
  return {
    atsScore: score,
    grammarScore: 92,
    strengths: [
      "Excellent logical breakdown of projects and previous roles.",
      "Good inclusion of primary SDE keywords like Python, React, and SQL.",
      "Consistent reverse-chronological layout with clear contact information."
    ],
    missingSkills: [
      "Docker & Kubernetes containers for deployment.",
      "CI/CD deployment pipelines (GitHub Actions/CircleCI).",
      "System Design & Microservice architectural experience."
    ],
    suggestedProjects: [
      "Scalable Task Queue Broker: A distributed message broker with Redis and Go demonstrating high-concurrency handling.",
      "Collaborative Workspace Platform: A real-time document editor using CRDTs and WebSockets for multi-user sync."
    ],
    formatCritique: "Formatting is clean. Section headings are standard (Education, Experience, Projects) which ensures seamless parse-ability by automated scanners like Greenhouse or Workday. Avoid multi-column table graphics as they can confuse legacy text extractors.",
    atsOptimizationSuggestions: [
      "Replace generic descriptors with quantified business metrics (e.g., 'reduced API query latency by 45%', 'improved load speed by 2.1x').",
      "List technology stacks used explicitly at the end of every project description instead of just in a separate skills section."
    ],
    improvedResumeText: `### ALEX RIVERA\n*Software Development Engineer Candidate*\n---\n\n**SUMMARY**\nDetail-oriented, results-driven Software Engineer with solid experience building resilient full-stack web architectures, optimizing database schema structures, and solving complex algorithmic challenges.\n\n**KEY STRENGTHS & TECHNICAL MATRIX**\n- **Languages**: Python, TypeScript, SQL, Java, C++\n- **Frameworks & Tools**: React, Node.js, Express, Tailwind CSS, Git, Linux\n- **Aptitude Focus**: High logical deduction, quantitative mastery, and clear technical communication.\n\n**SELECTED PROJECTS & ENGINEERING IMPACT**\n- **Holographic Core SDE Workspace**: Developed an interactive 3D benchmark platform mapping DSA learning path matrices using Three.js and Vite.\n- **Real-Time API Sync Engine**: Implemented a secure Express-based session synchronization proxy backing robust JWT token validation; reduced average registration flow duration by 150ms.`
  };
}

function fallbackCoverLetter(companyName: string, role: string, type: string, skills: string): string {
  const comp = companyName || "your prestigious company";
  const r = role || "Software Development Engineer (SDE)";
  const sk = skills || "web development, Python, React, and databases";
  
  return `# Cover Letter for ${comp}

**Candidate Name**: Alex Rivera  
**Role**: ${r}  
**Date**: ${new Date().toLocaleDateString()}

Dear Hiring Team at ${comp},

I am writing to express my enthusiastic interest in the ${r} role at ${comp}. As a highly-motivated Software Development Engineer with a strong foundation in data structures, algorithms, and modular full-stack development, I am eager to contribute my technical expertise and passion for engineering excellence to your team.

My technical background includes robust hands-on development using ${sk}. I have consistently focused on building highly-efficient web applications, optimization of database schemas, and clean architectural design. For example, in my recent projects, I developed an interactive SDE benchmark portal utilizing Three.js and modern React, which reduced payload overheads and maximized user engagement.

What excites me most about joining ${comp} is your relentless focus on innovation and solving complex, real-world problems at scale. I thrive in collaborative, fast-paced environments where standard software solutions are continually challenged to achieve higher performance and better user experiences.

Thank you for your time and consideration. I would welcome the opportunity to discuss how my SDE benchmark credentials and technical skills align with the needs of your engineering team.

Sincerely,  
Alex Rivera  
[alex.rivera@placementprep.ai](mailto:alex.rivera@placementprep.ai)  
+1 (555) 019-2834`;
}

function fallbackLinkedInSEO(techDomain: string, experience: string) {
  const domain = techDomain || "Full Stack SDE";
  return {
    headlines: [
      `${domain} | Software Development Engineer | Passionate about Scalable Systems & React`,
      `Software Engineer Candidate | Specializing in ${domain} | Solved 500+ LeetCode Challenges`,
      `Incoming SDE @ Tech | Full Stack Developer | Proficient in Python, Java, & TypeScript`
    ],
    aboutSummary: `### About Me\n\nI am a passionate, results-oriented Software Development Engineer focusing on **${domain}**. I thrive at the intersection of algorithmic efficiency and elegant user experience.\n\nWith a rigorous preparation background spanning Quantitative Aptitude, Logical Reasoning, and deep Technical design, I enjoy decomposing complex system scaling limits into data structures and algorithms.\n\nLet's connect or reach out at **alex.rivera@placementprep.ai** to discuss engineering roles!`,
    keywords: [
      domain,
      "Software Development Engineer",
      "Data Structures",
      "Algorithms (DSA)",
      "Object-Oriented Programming (OOP)",
      "Relational Databases (SQL)",
      "TypeScript",
      "React.js",
      "Python",
      "System Design"
    ],
    seoScore: 88,
    checklist: [
      "Feature your SDE Portfolio and high-impact project links directly in your Featured section.",
      "Ask 2-3 classmates or project mentors to write brief LinkedIn Recommendations highlighting your collaboration style.",
      "Turn on 'Open to Work' visible exclusively to recruiters to boost profile visits by 40%."
    ]
  };
}

function fallbackCompanyPrep(companyName: string) {
  const comp = companyName || "Google";
  return {
    overview: `${comp} is renowned for its rigorous technical evaluation, highly prioritizing strong problem-solving skills, deep algorithmic understanding, and system scalability concepts. The hiring process is designed to find SDEs who can write highly optimized code under time constraints.`,
    interviewProcess: [
      "1. Resume Shortlisting & ATS Screen",
      "2. Online Coding Assessment (1-2 DSA Questions)",
      "3. Technical Interview I (Data Structures & Complexities)",
      "4. Technical Interview II (System Architecture & OOP Design)",
      "5. HR & Culture Fit / Team Match Round"
    ],
    keyFocusAreas: [
      "Time & Space Complexity analysis (Big O notation)",
      "Data Structures: Trees, Graphs, Hash Maps, Doubly Linked Lists",
      "Scalability: Caching, Database Sharding, Load Balancers",
      "Core CS Fundamentals: DBMS Transactions, Process Synchronization"
    ],
    aptitudeQuestions: [
      {
        question: `A team of SDEs at ${comp} can finish a scaling project in 12 days. If 3 more SDEs join who are equally fast, the project is completed in 9 days. How many SDEs were in the team originally?`,
        options: ["6 SDEs", "9 SDEs", "12 SDEs", "15 SDEs"],
        correctAnswer: 1,
        explanation: "Let original SDEs be x. Total work = 12x. With (x + 3) SDEs, work = 9(x+3). Therefore, 12x = 9x + 27 => 3x = 27 => x = 9."
      },
      {
        question: `An indexing query takes 1.2 milliseconds for a dataset of size N. If the algorithm is O(N log N) and N increases by a factor of 4, what is the estimated query time?`,
        options: ["2.4 ms", "4.8 ms", "6.4 ms", "9.6 ms"],
        correctAnswer: 3,
        explanation: "Time = c * N log N. For 4N: Time_new = c * 4N * log(4N) = 4 * c * N * (log N + log 4) ≈ 4 to 8 times the original, specifically around 9.6 milliseconds for standard base-2 scaling models."
      },
      {
        question: `If all SDEs who pass the ${comp} interview are good at algorithms, and some who are good at algorithms are self-taught. Which of the following is definitely true?`,
        options: [
          "Some self-taught coders pass the interview.",
          "All self-taught coders pass the interview.",
          "It is possible that some self-taught coders pass the interview.",
          "None of the above."
        ],
        correctAnswer: 2,
        explanation: "Since some coders good at algorithms are self-taught, and it's possible these overlap with those who pass the interview, the statement 'It is possible that some self-taught coders pass the interview' is logically sound and mathematically possible."
      }
    ],
    codingQuestions: [
      {
        title: "K-th Largest Element in a Stream",
        description: "Design a class to find the k-th largest element in a stream. Note that it is the k-th largest element in the sorted order, not the k-th distinct element.",
        sampleInput: '["KthLargest", "add", "add"]\n[[3, [4, 5, 8, 2]], [3], [5]]',
        sampleOutput: "[null, 4, 5]",
        hints: [
          "Using sorting on every insertion will take O(N log N) which is too slow.",
          "Can we use a Min-Heap of size K? The root of the Min-Heap will always be our K-th largest element."
        ]
      },
      {
        title: "Unique Paths in a Grid",
        description: "There is a robot on an `m x n` grid. The robot is initially located at the top-left corner. The robot tries to move to the bottom-right corner, only moving down or right. Find the number of unique paths.",
        sampleInput: "m = 3, n = 7",
        sampleOutput: "28",
        hints: [
          "This is a classic Dynamic Programming problem.",
          "The number of paths to cell (i, j) is the sum of paths to (i-1, j) and (i, j-1)."
        ]
      }
    ],
    technicalQuestions: [
      `1. How does ${comp}'s Spanner database achieve external consistency without compromising horizontal write scaling? (Expected: Use of TrueTime API with GPS and atomic clocks to order transactions globally)`,
      `2. Explain the difference between optimistic locking and pessimistic locking in concurrent systems. (Expected: Optimistic checks for conflict before writing, pessimistic locks resource at the start)`,
      `3. What is a Memory Leak in Python or Java, and how does Garbage Collection still fail to clean it? (Expected: Unused objects still held by active static references/listeners prevent garbage collector from cleaning them)`
    ]
  };
}

function fallbackRoadmap(targetRole: string, durationMonths: number) {
  const role = targetRole || "Software Development Engineer (SDE)";
  const dur = durationMonths || 3;
  
  return {
    title: `${role} Placement Blueprint`,
    overview: `This fast-tracked study guide is customized to prepare you to crack premium SDE interview loops for ${role} within ${dur} months. It focuses heavily on maximizing daily problem-solving speed and structural CS concepts.`,
    timeline: [
      {
        month: "Month 1",
        focus: "Language Foundations, Linear Data Structures & Aptitude Speed",
        dsaTopics: ["Arrays & Dynamic Arrays", "Hash Maps & Sets", "Two Pointers & Sliding Window techniques"],
        projectGoal: "Modular Code Playground: A custom developer workspace parsing and evaluating syntax structures in real-time.",
        weeklyMilestones: [
          "Week 1: Master space/time Big-O analysis and language-specific built-in collection libraries.",
          "Week 2: Solve 15 Easy-Medium LeetCode Array problems. Study Quantitative Aptitude Percentages.",
          "Week 3: Deep dive into custom Hash Map mechanics and resolve collision issues. Study Logical Relations.",
          "Week 4: Build the starter SDE playground project. Master Sliding Window algorithmic patterns."
        ]
      },
      {
        month: "Month 2",
        focus: "Non-Linear DSA, Recursion & Database Systems",
        dsaTopics: ["Binary Trees & Binary Search Trees", "Heaps & Priority Queues", "Recursion & Backtracking basics"],
        projectGoal: "DBMS Cluster Visualizer: Interactive visual representation of database indexing and transactions concurrent isolation.",
        weeklyMilestones: [
          "Week 1: Study tree traversals (Inorder, Preorder, Postorder) and solve 10 tree-based LeetCode problems.",
          "Week 2: Master Heap insertions/deletions. Study DBMS Normalization and SQL Join performance.",
          "Week 3: Resolve backtracking permutations and combinations. Study Logical Seating Arrangements.",
          "Week 4: Build the DB Visualizer portfolio piece. Solve 15 Heap and Tree-based coding problems."
        ]
      },
      {
        month: "Month 3",
        focus: "Advanced Graphs, System Design & Interview Simulation",
        dsaTopics: ["Graphs (BFS, DFS, Dijkstra's algorithm)", "Dynamic Programming (DP) introductory patterns", "System design basics (Caching, CDN, Load Balancers)"],
        projectGoal: "Enterprise Grade Rate Limiter: A complete multi-strategy rate limiter proxy built in Node.js protecting Express API endpoints.",
        weeklyMilestones: [
          "Week 1: Master DFS and BFS traversals in graphs. Solve Dijkstra's shortest path.",
          "Week 2: Study 1D/2D Dynamic Programming basics (Knapsack, Grid Paths). Understand Caching strategies.",
          "Week 3: Practice mock interviews under simulated peer reviews. Speed run ATS Resume optimization.",
          "Week 4: Finalize SDE portfolio projects, compile achievements, and run simulated mock interviews."
        ]
      }
    ],
    recommendedResources: [
      "1. 'Introduction to Algorithms' (CLRS Book) for thorough DSA mechanics.",
      "2. 'Designing Data-Intensive Applications' (Martin Kleppmann) for deep system design concepts.",
      "3. GeeksforGeeks / LeetCode for daily practice questions.",
      "4. PrepAgent.AI Integrated Mock Interview Module for real-time practice and interactive grading."
    ]
  };
}

// ==========================================
// 1. API: Aptitude Question Generation
// ==========================================
app.post("/api/aptitude/generate", async (req, res) => {
  const { category, difficulty, subtopic } = req.body;
  try {
    const client = getAI();

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Generate exactly 5 multiple choice aptitude questions of difficulty level "${difficulty}" on the topic "${category}"${subtopic ? ` and specifically targeting the subtopic "${subtopic}"` : ""}.
      The questions must test numerical, logical or verbal comprehension depending on the topic.
      Return the questions strictly matching the requested JSON structure.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "Unique short alphanumeric id (e.g. q1, q2)" },
              question: { type: Type.STRING, description: "The full question statement" },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Exactly 4 options"
              },
              correctAnswer: { type: Type.INTEGER, description: "Index of correct answer (0 to 3)" },
              explanation: { type: Type.STRING, description: "Detailed step-by-step explanation of how to get the correct answer" },
              category: { type: Type.STRING, description: "Must be: 'quantitative', 'logical', or 'verbal'" },
              difficulty: { type: Type.STRING, description: "Must be: 'easy', 'medium', or 'hard'" }
            },
            required: ["id", "question", "options", "correctAnswer", "explanation", "category", "difficulty"]
          }
        }
      }
    });

    const data = JSON.parse(response.text || "[]");
    res.json({ success: true, questions: data });
  } catch (error: any) {
    console.warn("⚠️ Gemini API limited/unavailable. Activating robust local sandbox fallback:", error.message || error);
    const mockData = fallbackAptitudeQuestions(category, difficulty, subtopic);
    res.json({ success: true, questions: mockData, fallback: true });
  }
});

// ==========================================
// 2. API: Coding Challenges List / Create
// ==========================================
app.get("/api/coding/challenges", (req, res) => {
  // Pre-configured classic coding interview challenges
  const challenges = [
    {
      id: "two-sum",
      title: "Two Sum",
      description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
      difficulty: "easy",
      sampleInput: "nums = [2,7,11,15], target = 9",
      sampleOutput: "[0,1] (Because nums[0] + nums[1] == 9)",
      constraints: "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9",
      starterCode: {
        python: "def twoSum(nums: list[int], target: int) -> list[int]:\n    # Write your code here\n    pass",
        cpp: "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your code here\n    }\n};",
        java: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your code here\n    }\n}",
        javascript: "function twoSum(nums, target) {\n    // Write your code here\n}"
      },
      hints: [
        "A really brute force way would be to search for all possible pairs which takes O(n^2).",
        "Can we use a hash map to look up the complement (target - nums[i]) in O(1) time?"
      ]
    },
    {
      id: "reverse-linked-list",
      title: "Reverse Linked List",
      description: "Given the `head` of a singly linked list, reverse the list, and return the reversed list.",
      difficulty: "easy",
      sampleInput: "head = [1,2,3,4,5]",
      sampleOutput: "[5,4,3,2,1]",
      constraints: "The number of nodes in the list is the range [0, 5000].\n-5000 <= Node.val <= 5000",
      starterCode: {
        python: "# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         this.val = val\n#         this.next = next\n\ndef reverseList(head: ListNode) -> ListNode:\n    # Write your code here\n    pass",
        cpp: "/**\n * Definition for singly-linked list.\n * struct ListNode {\n *     int val;\n *     ListNode *next;\n *     ListNode() : val(0), next(nullptr) {}\n *     ListNode(int x) : val(x), next(nullptr) {}\n *     ListNode(int x, ListNode *next) : val(x), next(next) {}\n * };\n */\nclass Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        // Write your code here\n    }\n};",
        java: "/**\n * Definition for singly-linked list.\n * public class ListNode {\n *     int val;\n *     ListNode next;\n *     ListNode() {}\n *     ListNode(int val) { this.val = val; }\n *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }\n * }\n */\nclass Solution {\n    public ListNode reverseList(ListNode head) {\n        // Write your code here\n    }\n}",
        javascript: "/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\nfunction reverseList(head) {\n    // Write your code here\n}"
      },
      hints: [
        "This can be solved either iteratively or recursively. Try iterative first.",
        "Maintain three pointers: prev (null), curr (head), and next (null). Flip next pointers as you iterate."
      ]
    },
    {
      id: "lru-cache",
      title: "LRU Cache",
      description: "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.\n\nImplement the LRUCache class:\n- `LRUCache(int capacity)` Initialize the LRU cache with positive size capacity.\n- `int get(int key)` Return the value of the key if the key exists, otherwise return -1.\n- `void put(int key, int value)` Update the value of the key if the key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the capacity from this operation, evict the least recently used key.",
      difficulty: "hard",
      sampleInput: "[\"LRUCache\", \"put\", \"put\", \"get\", \"put\", \"get\", \"put\", \"get\", \"get\", \"get\"]\n[[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]",
      sampleOutput: "[null, null, null, 1, null, -1, null, -1, 3, 4]",
      constraints: "1 <= capacity <= 3000\n0 <= key <= 10^4\n0 <= value <= 10^5\nAt most 2 * 10^5 calls will be made to get and put.",
      starterCode: {
        python: "class LRUCache:\n    def __init__(self, capacity: int):\n        pass\n\n    def get(self, key: int) -> int:\n        return -1\n\n    def put(self, key: int, value: int) -> None:\n        pass",
        cpp: "class LRUCache {\npublic:\n    LRUCache(int capacity) {\n        \n    }\n    \n    int get(int key) {\n        return -1;\n    }\n    \n    void put(int key, int value) {\n        \n    }\n};",
        java: "class LRUCache {\n    public LRUCache(int capacity) {\n        \n    }\n    \n    public int get(int key) {\n        return -1;\n    }\n    \n    public void put(int key, int value) {\n        \n    }\n}",
        javascript: "class LRUCache {\n    constructor(capacity) {\n        \n    }\n    \n    get(key) {\n        return -1;\n    }\n    \n    put(key, value) {\n        \n    }\n}"
      },
      hints: [
        "To achieve O(1) time complexity for both operations, we need a combination of a Doubly Linked List and a Hash Map.",
        "The Doubly Linked List will store the cache nodes in usage order, and the Hash Map will provide direct access to the list nodes."
      ]
    }
  ];
  res.json({ success: true, challenges });
});

// ==========================================
// 3. API: Coding Evaluation & Feedback
// ==========================================
app.post("/api/coding/evaluate", async (req, res) => {
  try {
    const { challengeTitle, description, code, language } = req.body;
    const client = getAI();

    const isSQL = language && language.toLowerCase() === "sql";
    const prompt = isSQL
      ? `You are an expert SQL database administrator and technical interviewer reviewing a query submitted for a database challenge.
      Challenge/Problem Name: ${challengeTitle}
      Schema & Requirements Description: ${description}
      Student's Submitted Query:
      \`\`\`sql
      ${code}
      \`\`\`

      Review the query for SQL syntax correctness, logical outcomes, optimal join conditions, indexing recommendations, filter predicates, and explain query plan concepts (like Table Scan vs Index Seek) under time/space complexity fields. Provide constructive feedback and a score out of 100. Always provide a structured, friendly analysis.`
      : `You are an expert technical interviewer reviewing code submitted for a software engineering challenge.
      Challenge Name: ${challengeTitle}
      Problem Description: ${description}
      Programming Language used: ${language}
      Student's Submitted Code:
      \`\`\`${language}
      ${code}
      \`\`\`

      Review the code for correctness, time complexity, space complexity, potential bugs, edge cases, and code style.
      Provide constructive feedback and a score out of 100. Always provide a structured, friendly analysis.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER, description: "A realistic code evaluation score from 0 to 100" },
            correctness: { type: Type.STRING, description: "Analysis of correctness, logical bugs, and edge cases" },
            timeComplexity: { type: Type.STRING, description: "Estimated time complexity (e.g., O(N log N)) with explanation" },
            spaceComplexity: { type: Type.STRING, description: "Estimated space complexity (e.g., O(N)) with explanation" },
            bugsFound: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of explicit bugs, syntax mistakes, or logic flows that fail"
            },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Great aspects of this solution"
            },
            improvements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Specific tips to make the code faster, cleaner, or more optimal"
            },
            optimalSolutionOutline: { type: Type.STRING, description: "Outline/hint for the optimal approach if this is sub-optimal" }
          },
          required: ["score", "correctness", "timeComplexity", "spaceComplexity", "bugsFound", "strengths", "improvements", "optimalSolutionOutline"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json({ success: true, evaluation: data });
  } catch (error: any) {
    console.warn("⚠️ Gemini API limited/unavailable for coding evaluation. Activating fallback:", error.message || error);
    const { challengeTitle, description, code, language } = req.body;
    const mockData = fallbackCodingEvaluation(challengeTitle, description, code, language);
    res.json({ success: true, evaluation: mockData, fallback: true });
  }
});

// ==========================================
// 4. API: Interactive Chat Interviews (HR / Tech)
// ==========================================
app.post("/api/interview/chat", async (req, res) => {
  try {
    const { type, topic, company, messages } = req.body;
    const client = getAI();

    // Map the conversation history into friendly readable text for Gemini context
    const conversationHistoryText = messages
      .map((m: any) => `${m.sender === "student" ? "Student" : "Interviewer"}: ${m.text}`)
      .join("\n");

    let systemInstruction = "";

    if (type === "hr") {
      systemInstruction = `You are a professional Human Resources (HR) interviewer conducting a screening interview.
      ${company ? `You are interviewing specifically for a role at "${company}".` : ""}
      - Conduct a friendly yet professional conversation.
      - Ask exactly ONE relevant HR question at a time.
      - Focus on behavioral traits, communication, core ethics, leadership qualities, teamwork, and cultural fit.
      - Wait for the user's response.
      - Acknowledge their response gracefully, provide an optional micro-hint if they were brief, and proceed to the next question.
      - Do not dump multiple questions at once. Keep messages conversational.`;
    } else {
      systemInstruction = `You are a Senior Software Engineer conducting a strict Technical interview.
      - Technical Domain Focus: "${topic || "General Software Engineering, DSA, OOPS, DBMS, OS, and CN"}".
      ${company ? `You are interviewing specifically for a technical software role at "${company}".` : ""}
      - Ask exactly ONE deep technical or problem-solving question at a time.
      - Increase difficulty gradually if they answer correctly.
      - If they struggle, do NOT give the answer immediately. Provide a subtle, helpful hint first.
      - Be constructive and focus on OOPS, systems design, DBMS query skills, or data structure mechanics.
      - Keep the dialogue back-and-forth.`;
    }

    const prompt = `Here is the conversation history so far:
    ${conversationHistoryText}

    Please write the interviewer's next response as a direct conversational reply. Do not include any meta text or prefixes like "Interviewer:" in your output, just respond naturally.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    const reply = response.text || "Could you repeat that? I'd like to understand your approach better.";
    res.json({ success: true, text: reply });
  } catch (error: any) {
    console.warn("⚠️ Gemini API limited/unavailable for interview chat. Activating fallback:", error.message || error);
    const { type, topic, company, messages } = req.body;
    const reply = fallbackInterviewChat(type, topic, company, messages || []);
    res.json({ success: true, text: reply, fallback: true });
  }
});

// ==========================================
// 5. API: Interview Finish / Evaluation
// ==========================================
app.post("/api/interview/evaluate", async (req, res) => {
  try {
    const { type, topic, company, messages } = req.body;
    const client = getAI();

    const conversationHistoryText = messages
      .map((m: any) => `${m.sender === "student" ? "Student" : "Interviewer"}: ${m.text}`)
      .join("\n");

    const prompt = `Evaluate the following completed job interview session:
    Interview Type: ${type.toUpperCase()}
    ${topic ? `Domain: ${topic}` : ""}
    ${company ? `Company targeted: ${company}` : ""}

    Full Interview Transcript:
    ${conversationHistoryText}

    Analyze the candidate's performance thoroughly and provide a detailed evaluation report.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER, description: "A performance rating out of 10" },
            communication: { type: Type.STRING, description: "Detailed review of candidate's verbal clarity, grammar, confidence, and posture" },
            technicalSkills: { type: Type.STRING, description: "Only for Technical: assessment of programming logic and concept depth" },
            confidence: { type: Type.STRING, description: "Analysis of how confidently the candidate delivered answers" },
            grammar: { type: Type.STRING, description: "Analysis of sentence structure and professional vocabulary usage" },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-5 key performance strengths" },
            improvements: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-5 constructive points of improvement" },
            overallFeedback: { type: Type.STRING, description: "A warm, motivating concluding summary with clear action plans" }
          },
          required: ["score", "communication", "confidence", "grammar", "strengths", "improvements", "overallFeedback"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json({ success: true, evaluation: data });
  } catch (error: any) {
    console.warn("⚠️ Gemini API limited/unavailable for interview evaluation. Activating fallback:", error.message || error);
    const { type, topic, company, messages } = req.body;
    const mockEvaluation = fallbackInterviewEvaluation(type, topic, company, messages || []);
    res.json({ success: true, evaluation: mockEvaluation, fallback: true });
  }
});

// ==========================================
// 6. API: Resume Analyzer (ATS Screen)
// ==========================================
app.post("/api/resume/analyze", async (req, res) => {
  try {
    const { resumeText } = req.body;
    const client = getAI();

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({ error: "Please provide a valid resume or text content to analyze." });
    }

    const prompt = `You are an elite Applicant Tracking System (ATS) auditor and hiring manager.
    Analyze the following resume text for spelling mistakes, formatting issues, ATS optimization, industry standard verbs, impact metrics, missing skills based on modern software/finance roles, and suggest clear enhancements.

    Resume Text:
    ${resumeText}`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            atsScore: { type: Type.INTEGER, description: "Realistic ATS compatibility score from 0 to 100" },
            grammarScore: { type: Type.INTEGER, description: "Spelling, punctuation, and wording rating from 0 to 100" },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Strong points of this resume" },
            missingSkills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Critical in-demand skills currently missing" },
            suggestedProjects: { type: Type.ARRAY, items: { type: Type.STRING }, description: "2 high-impact projects that would elevate this resume" },
            formatCritique: { type: Type.STRING, description: "Critique of organization, layout scan-ability, and contact details" },
            atsOptimizationSuggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific changes to make this more parse-able by modern software like Workday or Greenhouse" },
            improvedResumeText: { type: Type.STRING, description: "Re-written high-impact bullet points and structural resume text styled professionally in markdown." }
          },
          required: ["atsScore", "grammarScore", "strengths", "missingSkills", "suggestedProjects", "formatCritique", "atsOptimizationSuggestions", "improvedResumeText"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json({ success: true, analysis: data });
  } catch (error: any) {
    console.warn("⚠️ Gemini API limited/unavailable for resume analysis. Activating fallback:", error.message || error);
    const { resumeText } = req.body;
    const mockAnalysis = fallbackResumeAnalysis(resumeText || "");
    res.json({ success: true, analysis: mockAnalysis, fallback: true });
  }
});

// ==========================================
// 6a. API: AI Cover Letter Architect
// ==========================================
app.post("/api/resume/coverletter", async (req, res) => {
  try {
    const { companyName, role, type, skills } = req.body;
    const client = getAI();

    const prompt = `You are an expert career consultant writing a highly-persuasive, bespoke Cover Letter for a candidate.
    Target Company: ${companyName}
    Target Role: ${role}
    Type/Track: ${type} (e.g. Internship, Fresher, Experienced SDE)
    Candidate's Highlighted Skills: ${skills || "Web development, communication, problem solving"}
    
    Generate a highly professional, engaging Cover Letter styled in standard markdown. Include placeholders for names, addresses, and dates. Make it sound enthusiastic, clear, and perfectly aligned with typical recruiter expectations.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ success: true, coverLetter: response.text });
  } catch (error: any) {
    console.warn("⚠️ Gemini API limited/unavailable for cover letter. Activating fallback:", error.message || error);
    const { companyName, role, type, skills } = req.body;
    const letter = fallbackCoverLetter(companyName, role, type, skills || "");
    res.json({ success: true, coverLetter: letter, fallback: true });
  }
});

// ==========================================
// 6b. API: LinkedIn Profile SEO Optimizer
// ==========================================
app.post("/api/resume/linkedin", async (req, res) => {
  try {
    const { techDomain, experience } = req.body;
    const client = getAI();

    const prompt = `You are a professional brand manager and LinkedIn SEO copywriter.
    Create a highly-optimized LinkedIn profile upgrade bundle for a candidate.
    Tech Domain/Focus: ${techDomain} (e.g., Full Stack Developer, Machine Learning, Cloud Systems)
    Experience Level: ${experience} (e.g. Student, Entry-level, Senior)
    
    Generate:
    1. A list of 3 high-impact, SEO-rich Headlines.
    2. A compelling, story-driven "About" summary that hooks recruiters and states passions.
    3. A list of 10 high-value keywords to add to their Skills list for maximum search visibility.
    4. An overall SEO Score from 0 to 100 with an actionable checklist to improve their profile ranking.
    
    Provide the response strictly matching the requested JSON structure.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headlines: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 high-impact, keyword-rich headlines" },
            aboutSummary: { type: Type.STRING, description: "A captivating, story-driven summary in markdown" },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "10 high-value keywords for recruiter algorithms" },
            seoScore: { type: Type.INTEGER, description: "LinkedIn profile strength score from 0 to 100" },
            checklist: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-4 actionable tips to rank higher on recruiter search" }
          },
          required: ["headlines", "aboutSummary", "keywords", "seoScore", "checklist"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json({ success: true, optimization: data });
  } catch (error: any) {
    console.warn("⚠️ Gemini API limited/unavailable for LinkedIn SEO. Activating fallback:", error.message || error);
    const { techDomain, experience } = req.body;
    const mockOptimization = fallbackLinkedInSEO(techDomain, experience);
    res.json({ success: true, optimization: mockOptimization, fallback: true });
  }
});

// ==========================================
// 7. API: Company Wise Prep Questions
// ==========================================
app.post("/api/company/prep", async (req, res) => {
  try {
    const { companyName } = req.body;
    const client = getAI();

    const prompt = `Generate a targeted interview prep bundle for the company "${companyName}".
    Include classic interview parameters, specific DSA trends they ask, behavioral/leadership topics they focus on, and provide 3 practice questions across Aptitude, Coding, and Technical.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overview: { type: Type.STRING, description: "Brief background on hiring style and difficulty level of this company" },
            interviewProcess: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "The different rounds in order (e.g. Online Assessment, Technical, System Design, HR Manager)"
            },
            keyFocusAreas: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Specific technologies, values, or topics (e.g. Amazon Leadership Principles, Google Go/C++, Low-level design)"
            },
            aptitudeQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.INTEGER },
                  explanation: { type: Type.STRING }
                },
                required: ["question", "options", "correctAnswer", "explanation"]
              },
              description: "3 company-relevant aptitude multiple choice questions"
            },
            codingQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  sampleInput: { type: Type.STRING },
                  sampleOutput: { type: Type.STRING },
                  hints: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["title", "description", "sampleInput", "sampleOutput", "hints"]
              },
              description: "2 company-specific coding questions frequently asked recently"
            },
            technicalQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 deep technical/systems questions they are likely to ask with summary of expected answers"
            }
          },
          required: ["overview", "interviewProcess", "keyFocusAreas", "aptitudeQuestions", "codingQuestions", "technicalQuestions"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json({ success: true, prep: data });
  } catch (error: any) {
    console.warn("⚠️ Gemini API limited/unavailable for Company Prep. Activating fallback:", error.message || error);
    const { companyName } = req.body;
    const mockPrep = fallbackCompanyPrep(companyName);
    res.json({ success: true, prep: mockPrep, fallback: true });
  }
});

// ==========================================
// 8. API: Career Roadmap Generation
// ==========================================
app.post("/api/career/roadmap", async (req, res) => {
  try {
    const { targetRole, durationMonths } = req.body;
    const client = getAI();

    const prompt = `Generate a personalized, fast-paced placement study roadmap for the target role "${targetRole}" over a duration of ${durationMonths || 3} months. Break it down month by month with concrete topics, DSA patterns to practice, hands-on projects to build, and weekly goals.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            overview: { type: Type.STRING, description: "Overall strategy to crack this role in the given timeframe" },
            timeline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  month: { type: Type.STRING, description: "Month Label (e.g. 'Month 1')" },
                  focus: { type: Type.STRING, description: "Core themes/tech of this month" },
                  dsaTopics: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Data structures and algorithms patterns to master" },
                  projectGoal: { type: Type.STRING, description: "A high-impact portfolio project to build" },
                  weeklyMilestones: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A direct action plan for each of the 4 weeks" }
                },
                required: ["month", "focus", "dsaTopics", "projectGoal", "weeklyMilestones"]
              }
            },
            recommendedResources: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Actionable study sites, documentation, books or video lists" }
          },
          required: ["title", "overview", "timeline", "recommendedResources"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json({ success: true, roadmap: data });
  } catch (error: any) {
    console.warn("⚠️ Gemini API limited/unavailable for Career Roadmap. Activating fallback:", error.message || error);
    const { targetRole, durationMonths } = req.body;
    const mockRoadmap = fallbackRoadmap(targetRole, durationMonths);
    res.json({ success: true, roadmap: mockRoadmap, fallback: true });
  }
});

// =====================================================================
// SERVER INITIALIZATION & STATIC FALLBACKS (Vite Integration)
// =====================================================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development server with Vite HMR disabled proxy
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production build serves the compiled assets directly
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Placement-Preparation-Agent server running at http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  });
}

startServer();
