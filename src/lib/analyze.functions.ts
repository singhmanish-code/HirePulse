import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  resume: z.string().min(20).max(20000),
  jd: z.string().min(20).max(20000),
});

export type Analysis = {
  matchScore: number;
  missingKeywords: string[];
  starBullets: string[];
  interviewQuestions: string[];
};

export const analyzeFit = createServerFn({ method: "POST" })
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data }): Promise<{ result?: Analysis; error?: string }> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { error: "AI is not configured." };
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
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Lovable-API-Key": key, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        instructions:
          "You are an expert technical recruiter and AI interviewer. Compare the resume to the job description. Return matchScore 0-100, missing keywords from the JD, exactly 2 improved resume bullets in STAR format, and exactly 3 likely technical interview questions.",
        input: `RESUME:\n${data.resume}\n\nJOB DESCRIPTION:\n${data.jd}`,
        text: { format: { type: "json_schema", name: "hirepulse_report", strict: true, schema } },
      }),
    });
    if (res.status === 429) return { error: "Too many requests — try again in a moment." };
    if (res.status === 402) return { error: "AI credits exhausted. Add credits in workspace settings." };
    if (!res.ok || !res.body) {
      console.error(res.status, await res.text());
      return { error: "Analysis failed. Please try again." };
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    let args = "";
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
          if (ev.type === "response.output_text.delta") args += ev.delta;
        } catch { /* ignore */ }
      }
    }
    if (!args) return { error: "No result returned." };
    const r = JSON.parse(args) as Analysis;
    return {
      result: {
        matchScore: Math.max(0, Math.min(100, Math.round(r.matchScore))),
        missingKeywords: r.missingKeywords ?? [],
        starBullets: (r.starBullets ?? []).slice(0, 2),
        interviewQuestions: (r.interviewQuestions ?? []).slice(0, 3),
      },
    };
  });
