# HirePulse — AI Resume-to-JD Gap Analyzer & Placement Sprint
**Problem Statement No:** 4 (Open Innovation - Student Pain Points)

## What it does
HirePulse is an AI-powered placement preparation platform designed to help students bridge the gap between their generic resumes and specific campus recruitment Job Descriptions (JDs). It performs instant semantic gap analysis, flags missing technical skills, generates ATS-friendly bullet points using the STAR method, and predicts the exact technical cross-examination questions an interviewer will ask.

## Done / Left / Plan
- **Done:** Single-page responsive interface, preloaded sample dataset for rapid 5-second evaluator testing, ATS keyword mismatch detector, and company-specific interview question generator.
- **Left:** Direct drag-and-drop PDF resume parsing and history tracking for multiple job applications.
- **Plan:** Complete the PDF parsing module before the final build freeze and run cross-browser accessibility checks on mobile and desktop.

## Architecture and why
- **Frontend / Modern Stack:** Built with a React/Vite-based modern architecture and Tailwind CSS for instant hot-reloading, zero-latency interactions, and strict mobile responsiveness without heavy external layout overhead.
- **AI Inference Integration:** Leverages structured LLM completion prompts returning strict JSON schema to guarantee reliable rendering of match scores, bullet revisions, and technical questions without conversational filler.
- **Design System:** Uses Tailwind CSS and accessible component patterns with clear ARIA labels and color contrast to satisfy placement drive accessibility standards.

## What we added
- **Preloaded Sample Data Trigger:** Evaluators can click "Load Sample Data" to instantly test the end-to-end evaluation pipeline without manually writing or copying large blocks of text.
- **Targeted Cross-Examination Radar:** Instead of generic interview prep, it predicts the high-risk technical trap questions derived directly from the delta between the student's background and the JD.

## How to run it
1. Clone the repository:
   ```bash
   git clone [https://github.com/singhmanish-code/HirePulse.git](https://github.com/singhmanish-code/HirePulse.git)
