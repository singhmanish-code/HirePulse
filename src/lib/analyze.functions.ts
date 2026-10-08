import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CompanyType = z.enum(["startup", "enterprise"]);
const Level = z.enum(["internship", "fresher"]);

const Input = z.object({
  resume: z.string().min(20).max(20000),
  jd: z.string().min(20).max(20000),
  companyType: CompanyType.default("startup"),
  level: Level.default("fresher"),
});

export type Analysis = {
  matchScore: number;
  missingKeywords: string[];
  starBullets: string[];
  interviewQuestions: string[];
};

export type Critique = {
  technicalDepth: number;
  clarity: number;
  starStructure: number;
  tip: string;
};

const COMPANY_LABEL = {
  startup: "a Product Startup / Tech company (values ownership, system design, depth in modern stacks, shipping fast)",
  enterprise: "an IT Services / Enterprise company (values fundamentals, OOP, DBMS, SDLC, communication, aptitude)",
} as const;
const LEVEL_LABEL = {
  internship: "an Internship candidate (expect learning potential, projects, basics)",
  fresher: "an Entry-Level Fresher (expect solid fundamentals and job-ready skills)",
} as const;

async function streamJson<T>(
  instructions: string,
  input: string,
  name: string,
  schema: object,
): Promise<{ data?: T; error?: string }> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) return { error: "AI is not configured." };
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { "Lovable-API-Key": key, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      stream: true,
      store: false,
      reasoning: { effort: "low" },
      instructions,
      input,
      text: { format: { type: "json_schema", name, strict: true, schema } },
    }),
  });
  if (res.status === 429) return { error: "Too many requests — try again in a moment." };
  if (res.status === 402) return { error: "AI credits exhausted. Add credits in workspace settings." };
  if (res.status === 403) return { error: "AI access is currently blocked for this workspace." };
  if (!res.ok || !res.body) {
    console.error(res.status, await res.text());
    return { error: "Request failed. Please try again." };
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let out = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const ev = JSON.parse(payload);
        if (ev.type === "response.output_text.delta") out += ev.delta;
      } catch { /* ignore */ }
    }
  }
  if (!out) return { error: "No result returned." };
  try {
    return { data: JSON.parse(out) as T };
  } catch {
    return { error: "Could not read the AI response." };
  }
}

export const analyzeFit = createServerFn({ method: "POST" })
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data }): Promise<{ result?: Analysis; error?: string }> => {
    const schema = {
      type: "object",
      additionalProperties: false,
      properties: {
        matchScore: { type: "number" },
        missingKeywords: { type: "array", items: { type: "string" } },
        starBullets: { type: "array", items: { type: "string" } },
        interviewQuestions: { type: "array", items: { type: "string" } },
      },
      required: ["matchScore", "missingKeywords", "starBullets", "interviewQuestions"],
    };
    const r = await streamJson<Analysis>(
      `You are an expert technical recruiter and AI interviewer. The candidate is ${LEVEL_LABEL[data.level]} applying to ${COMPANY_LABEL[data.companyType]}. Compare the resume to the job description, calibrating to this company profile and level. Return matchScore 0-100, missing keywords from the JD, exactly 2 improved resume bullets in STAR format, and exactly 3 likely technical interview questions typical for this company type and level.`,
      `RESUME:\n${data.resume}\n\nJOB DESCRIPTION:\n${data.jd}`,
      "hirepulse_report",
      schema,
    );
    if (!r.data) return { error: r.error };
    const d = r.data;
    return {
      result: {
        matchScore: Math.max(0, Math.min(100, Math.round(d.matchScore))),
        missingKeywords: d.missingKeywords ?? [],
        starBullets: (d.starBullets ?? []).slice(0, 2),
        interviewQuestions: (d.interviewQuestions ?? []).slice(0, 3),
      },
    };
  });

const CritiqueInput = z.object({
  question: z.string().min(5).max(2000),
  answer: z.string().min(1).max(8000),
  companyType: CompanyType.default("startup"),
  level: Level.default("fresher"),
});

export const critiqueAnswer = createServerFn({ method: "POST" })
  .inputValidator((d) => CritiqueInput.parse(d))
  .handler(async ({ data }): Promise<{ result?: Critique; error?: string }> => {
    const schema = {
      type: "object",
      additionalProperties: false,
      properties: {
        technicalDepth: { type: "number" },
        clarity: { type: "number" },
        starStructure: { type: "number" },
        tip: { type: "string" },
      },
      required: ["technicalDepth", "clarity", "starStructure", "tip"],
    };
    const r = await streamJson<Critique>(
      `You are a strict but encouraging technical interviewer at ${COMPANY_LABEL[data.companyType]}, interviewing ${LEVEL_LABEL[data.level]}. Score the candidate's answer from 1 to 10 on technicalDepth, clarity, and starStructure (Situation, Task, Action, Result). Give a single-sentence tip (max 25 words) on the most important thing they missed.`,
      `QUESTION:\n${data.question}\n\nCANDIDATE ANSWER:\n${data.answer}`,
      "hirepulse_critique",
      schema,
    );
    if (!r.data) return { error: r.error };
    const c = (n: number) => Math.max(1, Math.min(10, Math.round(n)));
    return {
      result: {
        technicalDepth: c(r.data.technicalDepth),
        clarity: c(r.data.clarity),
        starStructure: c(r.data.starStructure),
        tip: r.data.tip,
      },
    };
  });
