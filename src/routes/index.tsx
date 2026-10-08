import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { analyzeFit, critiqueAnswer, type Analysis, type Critique } from "@/lib/analyze.functions";
import { analyzeLocal, critiqueLocal } from "@/lib/local-analyze";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HirePulse — AI Resume & Job Match" },
      { name: "description", content: "Paste your resume and a job description to get a match score, missing keywords, STAR bullets, mock interview drills and a printable cheatsheet." },
      { property: "og:title", content: "HirePulse — AI Resume & Job Match" },
      { property: "og:description", content: "Match score, missing keywords, STAR bullets, mock answer critiques and a 1-page placement cheatsheet." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type CompanyType = "startup" | "enterprise";
type Level = "internship" | "fresher";

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

const COMPANY_OPTS = [
  { value: "startup", label: "Product Startup / Tech" },
  { value: "enterprise", label: "IT Services / Enterprise" },
] as const;
const LEVEL_OPTS = [
  { value: "internship", label: "Internship" },
  { value: "fresher", label: "Entry-Level Fresher" },
] as const;

function Index() {
  const analyze = useServerFn(analyzeFit);
  const [resume, setResume] = useState("");
  const [jd, setJd] = useState("");
  const [companyType, setCompanyType] = useState<CompanyType>("startup");
  const [level, setLevel] = useState<Level>("fresher");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Analysis | null>(null);
  const [profile, setProfile] = useState<{ companyType: CompanyType; level: Level } | null>(null);

  async function run() {
    setError(null);
    if (resume.trim().length < 20 || jd.trim().length < 20) {
      setError("Please paste both a resume and a job description.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      let out: Analysis;
      try {
        const r = await analyze({ data: { resume, jd, companyType, level } });
        out = r.result ?? analyzeLocal(resume, jd, companyType, level);
      } catch {
        out = analyzeLocal(resume, jd, companyType, level);
      }
      setResult(out);
      setProfile({ companyType, level });
    } finally {
      setLoading(false);
    }
  }

  const profileLabel = profile
    ? `${COMPANY_OPTS.find((o) => o.value === profile.companyType)?.label} · ${LEVEL_OPTS.find((o) => o.value === profile.level)?.label}`
    : "";

  return (
    <div className="min-h-screen">
      <div className="banner" role="status">
        <span className="pulse-dot" aria-hidden="true" /> AI Interviewer Active (PS4)
      </div>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-5 sm:py-12">
        <header className="mb-8 no-print">
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl">
            Hire<span className="text-primary">Pulse</span>
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Paste your resume and a job description. Get your match score, gaps, sharper bullets, and the questions you'll likely face.
          </p>
        </header>

        <div className="no-print">
          <div className="mb-5 grid gap-4 sm:grid-cols-2">
            <Segmented label="Company Type" name="company" options={COMPANY_OPTS} value={companyType} onChange={(v) => setCompanyType(v as CompanyType)} disabled={loading} />
            <Segmented label="Experience Level" name="level" options={LEVEL_OPTS} value={level} onChange={(v) => setLevel(v as Level)} disabled={loading} />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Your Resume" value={resume} onChange={setResume} placeholder="Paste your resume text..." />
            <Field label="Job Description" value={jd} onChange={setJd} placeholder="Paste the job description..." />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button className="btn-primary inline-flex items-center gap-2" onClick={run} disabled={loading} aria-busy={loading}>
              {loading && <span className="spinner" aria-hidden="true" />}
              {loading ? "Analyzing…" : "Analyze Fit"}
            </button>
            <button className="btn-ghost" onClick={() => { setResume(SAMPLE_RESUME); setJd(SAMPLE_JD); }} disabled={loading}>
              Load Sample Data
            </button>
          </div>
          <div aria-live="polite">
            {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
          </div>
        </div>

        {loading && (
          <div className="mt-12 grid gap-5 md:grid-cols-3 no-print" aria-hidden="true">
            <div className="card skeleton h-48" />
            <div className="card skeleton h-48 md:col-span-2" />
            <div className="card skeleton h-32 md:col-span-3" />
          </div>
        )}

        {result && profile && (
          <section className="mt-12 fade-in print-area" aria-label="Analysis results">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl">Your Fit Report</h2>
                <p className="text-sm text-muted-foreground">{profileLabel}</p>
              </div>
              <button className="btn-primary no-print" onClick={() => window.print()}>
                Export 1-Page Cheatsheet
              </button>
            </div>
            <div className="grid gap-5 md:grid-cols-3 print-grid">
              <div className="card flex flex-col items-center justify-center text-center">
                <h3 className="card-title">Match Score</h3>
                <div className="score" style={{ ["--p" as string]: result.matchScore }} role="img" aria-label={`Match score ${result.matchScore} out of 100`}>
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
                    <li key={i} className="flex gap-3"><span className="text-primary font-bold" aria-hidden="true">▸</span><span>{b}</span></li>
                  ))}
                </ul>
              </div>
              <div className="card md:col-span-3">
                <h3 className="card-title">Likely Technical Questions</h3>
                <ol className="space-y-4">
                  {result.interviewQuestions.map((q, i) => (
                    <QuestionItem key={`${i}-${q}`} index={i} question={q} companyType={profile.companyType} level={profile.level} />
                  ))}
                </ol>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function Segmented({ label, name, options, value, onChange, disabled }: {
  label: string; name: string; options: readonly { value: string; label: string }[]; value: string; onChange: (v: string) => void; disabled?: boolean;
}) {
  return (
    <fieldset>
      <legend className="card-title">{label}</legend>
      <div className="segmented" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <label key={o.value} className={`seg-opt ${value === o.value ? "active" : ""}`}>
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} disabled={disabled} className="sr-only" />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const DRILL_SECONDS = 120;

function QuestionItem({ index, question, companyType, level }: { index: number; question: string; companyType: CompanyType; level: Level }) {
  const critique = useServerFn(critiqueAnswer);
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState("");
  const [left, setLeft] = useState(DRILL_SECONDS);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [fb, setFb] = useState<Critique | null>(null);

  const running = open && !fb && !submitting && left > 0;
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [running]);

  function start() {
    setOpen(true); setLeft(DRILL_SECONDS); setFb(null); setErr(null); setAnswer("");
  }

  async function submit() {
    if (!answer.trim()) { setErr("Type an answer first."); return; }
    setErr(null); setSubmitting(true);
    try {
      try {
        const r = await critique({ data: { question, answer, companyType, level } });
        setFb(r.result ?? critiqueLocal(question, answer));
      } catch {
        setFb(critiqueLocal(question, answer));
      }
    } finally {
      setSubmitting(false);
    }
  }

  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, "0");
  const id = `drill-${index}`;

  return (
    <li>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex flex-1 gap-3"><span className="num">{index + 1}</span><span>{question}</span></div>
        <button className="btn-small no-print self-start" onClick={open ? () => setOpen(false) : start} aria-expanded={open} aria-controls={id}>
          {open ? "Close" : "Attempt Answer"}
        </button>
      </div>
      {open && (
        <div id={id} className="drill no-print fade-in">
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor={`${id}-ta`} className="text-sm font-semibold">Your answer</label>
            <span className={`timer ${left <= 20 ? "timer-low" : ""}`} aria-live="off" aria-label={`${mm} minutes ${ss} seconds left`}>
              ⏱ {mm}:{ss}
            </span>
          </div>
          <textarea id={`${id}-ta`} className="input-area h-36" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Talk it through as you would in the interview…" disabled={submitting} />
          {left === 0 && !fb && <p className="mt-2 text-sm text-muted-foreground">Time's up — submit what you have.</p>}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button className="btn-primary inline-flex items-center gap-2" onClick={submit} disabled={submitting} aria-busy={submitting}>
              {submitting && <span className="spinner" aria-hidden="true" />}
              {submitting ? "Reviewing…" : "Submit for Review"}
            </button>
            {fb && <button className="btn-ghost" onClick={start}>Try Again</button>}
          </div>
          <div aria-live="polite">
            {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
            {fb && (
              <div className="mt-4 fade-in">
                <div className="grid grid-cols-3 gap-3">
                  <Score label="Technical Depth" v={fb.technicalDepth} />
                  <Score label="Clarity" v={fb.clarity} />
                  <Score label="STAR Structure" v={fb.starStructure} />
                </div>
                <p className="tip"><strong>Interviewer Tip:</strong> {fb.tip}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

function Score({ label, v }: { label: string; v: number }) {
  return (
    <div className="mini-score">
      <span className="text-2xl font-display">{v}<span className="text-sm text-muted-foreground">/10</span></span>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="bar"><span style={{ width: `${v * 10}%` }} /></span>
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
