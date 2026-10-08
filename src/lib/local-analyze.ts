// Built-in, zero-config analyzer used when no AI key is available.
// Pure functions: safe to run in the browser or on the server.
import type { Analysis, Critique } from "./analyze.functions";

type CompanyType = "startup" | "enterprise";
type Level = "internship" | "fresher";

const TERMS: { term: string; aliases?: string[]; topic: string }[] = [
  { term: "Python", topic: "lang" }, { term: "Go", aliases: ["golang"], topic: "lang" },
  { term: "Java", topic: "lang" }, { term: "JavaScript", aliases: ["js"], topic: "lang" },
  { term: "TypeScript", aliases: ["ts"], topic: "lang" }, { term: "C++", topic: "lang" },
  { term: "C#", topic: "lang" }, { term: "Rust", topic: "lang" }, { term: "Kotlin", topic: "lang" },
  { term: "SQL", topic: "db" }, { term: "PostgreSQL", aliases: ["postgres"], topic: "db" },
  { term: "MySQL", topic: "db" }, { term: "MongoDB", topic: "db" }, { term: "Redis", topic: "cache" },
  { term: "Kafka", topic: "queue" }, { term: "RabbitMQ", topic: "queue" },
  { term: "React", topic: "fe" }, { term: "Next.js", aliases: ["nextjs"], topic: "fe" },
  { term: "Angular", topic: "fe" }, { term: "Vue", topic: "fe" }, { term: "Node.js", aliases: ["node", "nodejs"], topic: "be" },
  { term: "Express", topic: "be" }, { term: "FastAPI", topic: "be" }, { term: "Django", topic: "be" },
  { term: "Flask", topic: "be" }, { term: "Spring Boot", aliases: ["spring"], topic: "be" },
  { term: "REST APIs", aliases: ["rest", "restful", "rest api"], topic: "api" }, { term: "GraphQL", topic: "api" },
  { term: "Microservices", aliases: ["microservice"], topic: "arch" }, { term: "System Design", topic: "arch" },
  { term: "Docker", topic: "ops" }, { term: "Kubernetes", aliases: ["k8s"], topic: "ops" },
  { term: "CI/CD", aliases: ["ci", "cd", "github actions", "jenkins"], topic: "ops" },
  { term: "AWS", topic: "cloud" }, { term: "Lambda", topic: "cloud" }, { term: "S3", topic: "cloud" },
  { term: "GCP", topic: "cloud" }, { term: "Azure", topic: "cloud" },
  { term: "Unit Testing", aliases: ["testing", "tests"], topic: "test" }, { term: "pytest", topic: "test" },
  { term: "Jest", topic: "test" }, { term: "Git", topic: "tools" }, { term: "Linux", topic: "tools" },
  { term: "Caching", aliases: ["cache"], topic: "cache" }, { term: "Message Queues", aliases: ["message queue", "queues"], topic: "queue" },
  { term: "Data Structures", aliases: ["dsa", "algorithms"], topic: "cs" }, { term: "OOP", aliases: ["object oriented"], topic: "cs" },
  { term: "DBMS", topic: "db" }, { term: "Machine Learning", aliases: ["ml"], topic: "ml" },
  { term: "pandas", topic: "ml" }, { term: "Agile", aliases: ["scrum"], topic: "process" },
];

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function has(text: string, t: (typeof TERMS)[number]) {
  return [t.term, ...(t.aliases ?? [])].some((w) =>
    new RegExp(`(^|[^a-z0-9+#])${esc(w.toLowerCase())}($|[^a-z0-9+#])`).test(text),
  );
}

const QUESTIONS: Record<string, (c: CompanyType) => string> = {
  cache: () => "How would you add a Redis cache in front of a slow database query? Explain cache-aside, TTLs and how you'd handle invalidation.",
  queue: () => "When would you use a message queue like Kafka between two services, and how do you guarantee a message is processed exactly once?",
  db: (c) => c === "enterprise" ? "Explain database normalization up to 3NF and when you'd denormalize. Give an example with indexes." : "Design the PostgreSQL schema for an orders service. Which indexes would you add and why?",
  api: () => "Walk me through designing a REST endpoint end-to-end: routing, input validation, status codes, error handling and tests.",
  ops: () => "How would you containerize this service with Docker and set up a CI/CD pipeline that runs tests before deploying?",
  cloud: () => "Describe how you'd build a serverless file-upload flow using AWS Lambda and S3. What are the cold-start and security concerns?",
  arch: (c) => c === "startup" ? "Design a URL shortener that handles 10k requests per second. Walk through the components and bottlenecks." : "Explain the difference between monolithic and microservices architecture and the trade-offs for a large enterprise client.",
  test: () => "How do you decide what to unit test versus integration test? Show how you'd mock a database call in pytest or Jest.",
  lang: (c) => c === "enterprise" ? "Explain the four pillars of OOP with a real example from one of your projects." : "What happens under the hood when your language handles concurrent requests (threads, async/event loop)?",
  fe: () => "How does React decide when to re-render, and how would you fix a component that re-renders too often?",
  be: () => "How would you structure a backend project so it stays maintainable as it grows? Talk about layers and dependency boundaries.",
  cs: () => "Given a stream of user events, how would you find the top-K most frequent users efficiently? State the time complexity.",
};

export function analyzeLocal(resume: string, jd: string, companyType: CompanyType = "startup", level: Level = "fresher"): Analysis {
  const r = resume.toLowerCase();
  const j = jd.toLowerCase();
  const inJd = TERMS.filter((t) => has(j, t));
  const matched = inJd.filter((t) => has(r, t));
  const missing = inJd.filter((t) => !has(r, t));

  // Generic word overlap as a secondary signal
  const words = (s: string) => new Set(s.match(/[a-z][a-z+#.]{3,}/g) ?? []);
  const jw = words(j), rw = words(r);
  let common = 0; jw.forEach((w) => rw.has(w) && common++);
  const wordRatio = jw.size ? common / jw.size : 0;
  const kwRatio = inJd.length ? matched.length / inJd.length : wordRatio;
  let score = 70 + Math.round((kwRatio * 0.75 + wordRatio * 0.25) * 15);
  if (level === "internship") score += 2;
  if (companyType === "startup" && missing.some((m) => m.topic === "arch")) score -= 1;
  score = Math.max(70, Math.min(85, score));

  // Pick resume lines to rewrite
  const lines = resume.split("\n").map((l) => l.replace(/^[\s\-•*▸]+/, "").trim()).filter((l) => l.length > 25 && !/^skills?:/i.test(l));
  const stack = (missing.length ? missing : inJd).slice(0, 3).map((t) => t.term);
  const stackStr = stack.length ? stack.join(", ") : "the required stack";
  const pick = [lines[0] ?? "Built a web application project", lines[1] ?? "Collaborated with a team on coursework"];
  const metrics = ["cutting average response time by 35%", "reducing reported defects by 40% across 3 release cycles"];
  const starBullets = pick.map((l, i) => {
    const base = l.replace(/\.$/, "").split(/[:;]/).pop()!.trim();
    const ctx = l.split(/[:;]/)[0]!.trim();
    return `Situation/Task: ${ctx === base ? "Facing a need for a faster, more reliable workflow" : `As ${ctx}`}, owned the goal to ${base.charAt(0).toLowerCase() + base.slice(1)}. Action: Applied ${stack[i] ?? stackStr} with clean, tested code and code reviews. Result: Delivered on schedule, ${metrics[i]}.`;
  });

  // Questions targeting the gaps first
  const topics: string[] = [];
  for (const t of [...missing, ...matched]) if (QUESTIONS[t.topic] && !topics.includes(t.topic)) topics.push(t.topic);
  for (const f of companyType === "enterprise" ? ["lang", "db", "cs"] : ["arch", "api", "cs"]) if (!topics.includes(f)) topics.push(f);
  const interviewQuestions = topics.slice(0, 3).map((t) => QUESTIONS[t]!(companyType));

  return {
    matchScore: score,
    missingKeywords: missing.map((t) => t.term),
    starBullets,
    interviewQuestions,
  };
}

export function critiqueLocal(question: string, answer: string): Critique {
  const a = answer.toLowerCase();
  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
  const qTerms = TERMS.filter((t) => has(question.toLowerCase(), t));
  const hits = qTerms.filter((t) => has(a, t)).length + TERMS.filter((t) => has(a, t)).length * 0.3;
  const technicalDepth = Math.round(Math.min(10, 2 + hits * 1.5 + Math.min(3, wordCount / 40)));
  const sentences = answer.split(/[.!?]+/).filter((s) => s.trim().length > 3).length;
  const connectors = (a.match(/\b(first|then|next|because|so|finally|for example|therefore)\b/g) ?? []).length;
  const clarity = Math.round(Math.min(10, 3 + Math.min(3, sentences / 2) + Math.min(3, connectors) + (wordCount > 30 ? 1 : 0)));
  const star = ["situation", "task", "action", "result"].filter((k) => a.includes(k)).length
    + (/\b(when i|at my|during|in my project|internship)\b/.test(a) ? 1 : 0)
    + (/\d+%|\b\d+x\b|reduced|improved|increased/.test(a) ? 2 : 0);
  const starStructure = Math.max(1, Math.min(10, 1 + star * 1.5 | 0));
  const missedTerm = qTerms.find((t) => !has(a, t));
  const tip = wordCount < 25
    ? "Expand your answer: aim for 60–90 seconds covering the approach, trade-offs and a concrete example."
    : missedTerm
      ? `You didn't address ${missedTerm.term} directly — tie it to a real project and explain the trade-offs.`
      : starStructure < 5
        ? "Anchor it in a real project: state the situation, your action, and end with a measurable result."
        : "Solid — close with a quantified result and one trade-off you considered to stand out.";
  return { technicalDepth: Math.max(1, technicalDepth), clarity: Math.max(1, clarity), starStructure, tip };
}
