# HirePulse — AI Resume-to-JD Gap Analyzer & Placement Readiness Engine
**Problem Statement No:** 4 (Open Innovation - Student Pain Points)

## What it does
HirePulse is an AI-powered placement preparation platform designed to help students bridge the gap between their generic resumes and specific campus recruitment Job Descriptions (JDs). It performs instant semantic gap analysis, flags missing technical skills, upgrades weak resume bullets into ATS-friendly statements using the STAR method, runs timed technical mock drills, and generates a printable 1-page cheatsheet for last-minute campus waiting-room prep.

## Done / Left / Plan
- **Done:**
  - Company Profile & Experience Level filters (Product Startups vs. IT Services).
  - Preloaded sample dataset for rapid 5-second evaluator testing.
  - Semantic gap analysis engine and ATS keyword mismatch detector.
  - STAR-method resume bullet upgrader.
  - Interactive "Attempt Answer" technical mock drill with a 2-minute timer and instant 3-point scorecard feedback.
  - 1-click printable single-page placement cheatsheet (`@media print` optimized).
- **Left:** Direct drag-and-drop PDF resume parsing and drive history tracking.
- **Plan:** Add PDF upload support and run cross-browser accessibility checks on mobile and desktop before the final build freeze.

## Architecture and why
- **Frontend / Modern Stack:** Built with a React/Vite/TypeScript architecture and Tailwind CSS for instant hot-reloading, zero client lag, and responsive design without heavy external component libraries.
- **AI Inference Integration:** Leverages structured LLM completion prompts with strict JSON schema outputs to guarantee reliable rendering of scores, bullet revisions, and technical questions without formatting breaks.
- **Native Print Engine:** Utilizes CSS `@media print` queries to strip away navigation controls, generating a clean, single-page waiting-room review document directly from the browser without third-party PDF services.
- **Accessibility & Contrast:** Uses high-contrast typography and semantic HTML tags meeting judging accessibility requirements.

## What we added
- **Preloaded Sample Data Trigger:** Evaluators can click "Load Sample Data" to run an immediate, end-to-end evaluation without typing.
- **2-Minute Interactive Mock Drill:** Goes beyond passive reading by letting students practice concise verbal answers to predicted questions under real-time constraints.
- **1-Page Offline Cheatsheet Export:** Solves the waiting-room problem by converting the entire analysis into a clean printable PDF.
- **Company & Role Context Switcher:** Allows the AI to adjust evaluation criteria between deep systems knowledge (Product) and broad fundamental skills (IT Services).

## How to run it
1. Clone the repository:
```bash
git clone https://github.com/singhmanish-code/HirePulse.git
