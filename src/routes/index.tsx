import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { analyzeFit, type Analysis } from "@/lib/analyze.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HirePulse — AI Resume & Job Match" },
      { name: "description", content: "Paste your resume and a job description to get a match score, missing keywords, STAR bullets and interview questions." },
      { property: "og:title", content: "HirePulse — AI Resume & Job Match" },
      { property: "og:description", content: "Match score, missing keywords, STAR bullets and likely interview questions in seconds." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const SAMPLE_RESUME = `Jane Doe — Computer Science Student, State University (GPA 3.7)
Skills: Python, JavaScript, React, SQL, Git
Experience:
- Software Intern, Acme Corp (Summer 2025): Built internal dashboard in React; fixed bugs in Flask API.
- Teaching Assistant, Data Structures: Held office hours for 40 students.
Projects:
- Campus Eats: Food ordering web app using React and Firebase.
- Stock Predictor: Python script using pandas to analyze stock prices.`;

const SAMPLE_JD = `Junior Backend Engineer — FinTech Startup
We're looking for a backend engineer to build scalable APIs.
Requirements:
- Strong Python or Go; experience with REST APIs (FastAPI/Django)
- PostgreSQL, Docker, and CI/CD pipelines
- Familiarity with AWS (Lambda, S3) and unit testing (pytest)
- Understanding of system design, caching (Redis) and message queues (Kafka)
Nice to have: Kubernetes, microservices experience.`;

function Index() {
  const analyze = useServerFn(analyzeFit);
  const [resume, setResume] = useState("");
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Analysis | null>(null);

  async function run() {
    setError(null);
    if (resume.trim().length < 20 || jd.trim().length < 20) {
      setError("Please paste both a resume and a job description.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const r = await analyze({ data: { resume, jd } });
      if (r.error) setError(r.error);
      else setResult(r.result ?? null);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <div className="banner">
        <span className="pulse-dot" /> AI Interviewer Active (PS4)
      </div>
      <main className="mx-auto max-w-6xl px-5 py-12">
        <header className="mb-10">
          <h1 className="font-display text-5xl md:text-6xl">
            Hire<span className="text-primary">Pulse</span>
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Paste your resume and a job description. Get your match score, gaps, sharper bullets, and the questions you'll likely face.
          </p>
        </header>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Your Resume" value={resume} onChange={setResume} placeholder="Paste your resume text..." />
          <Field label="Job Description" value={jd} onChange={setJd} placeholder="Paste the job description..." />
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button className="btn-primary" onClick={run} disabled={loading}>
            {loading ? "Analyzing…" : "Analyze Fit"}
          </button>
          <button className="btn-ghost" onClick={() => { setResume(SAMPLE_RESUME); setJd(SAMPLE_JD); }} disabled={loading}>
            Load Sample Data
          </button>
        </div>
        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        {result && (
          <section className="mt-12 grid gap-5 md:grid-cols-3">
            <div className="card flex flex-col items-center justify-center text-center">
              <h3 className="card-title">Match Score</h3>
              <div className="score" style={{ ["--p" as string]: result.matchScore }}>
                <span>{result.matchScore}</span>
              </div>
            </div>
            <div className="card md:col-span-2">
              <h3 className="card-title">Missing Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {result.missingKeywords.length ? result.missingKeywords.map((k) => (
                  <span key={k} className="chip">{k}</span>
                )) : <p className="text-muted-foreground">None — great coverage!</p>}
              </div>
            </div>
            <div className="card md:col-span-3">
              <h3 className="card-title">Improved STAR Bullets</h3>
              <ul className="space-y-3">
                {result.starBullets.map((b, i) => (
                  <li key={i} className="flex gap-3"><span className="text-primary font-bold">▸</span><span>{b}</span></li>
                ))}
              </ul>
            </div>
            <div className="card md:col-span-3">
              <h3 className="card-title">Likely Technical Questions</h3>
              <ol className="space-y-3">
                {result.interviewQuestions.map((q, i) => (
                  <li key={i} className="flex gap-3"><span className="num">{i + 1}</span><span>{q}</span></li>
                ))}
              </ol>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="block">
      <span className="card-title">{label}</span>
      <textarea className="input-area" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  );
}
