# MathSpeedup 2.0 – Phase 3 Design: Advanced Optimisation

**Status**: Draft  
**Date**: 2026‑03‑10 (UTC)  
**Owner**: WombatBot  

## Overview

Phase 3 integrates evidence‑based learning strategies at a deeper level, moving from static components to **adaptive, personalised learning pathways**. It leverages data collected in Phase 1‑2 to optimise cognitive load, increase retention, and accelerate mastery.

## Core Components

### 1. Adaptive Learning Paths (ALP)
- **Goal**: Dynamically adjust task sequencing based on student’s real‑time performance, cognitive load, and self‑reported confidence.
- **Mechanism**:
  - Use `learning_logs` data (timss_domain, prediction_accuracy, cognitive_load_rating) to infer strengths/weaknesses.
  - Implement a simple **decision tree** or **Bayesian knowledge tracing** to recommend next task difficulty & domain.
  - Integrate **spaced repetition** (Ebbinghaus forgetting curve) for review scheduling.
- **UI**: A “Next Recommended Task” card that appears after each submission, suggesting a follow‑up activity (e.g., “Try a harder Reasoning problem” or “Review this Achieved‑level concept”).

### 2. Personalised Feedback Engine
- **Goal**: Generate contextual feedback that adapts to the student’s current mental model.
- **Mechanism**:
  - Extend `feedback_templates` with **conditional placeholders** (e.g., `{if prediction_accuracy < 0.7 then "Let’s revisit the steps..."}`).
  - Use **natural‑language generation** (via LLM or rule‑based) to combine template fragments.
  - Incorporate **metacognitive prompts** (e.g., “What assumption did you make here?”) based on error patterns.
- **UI**: Enhanced `StructuredFeedback` component that shows personalised suggestions, not just static templates.

### 3. Mastery Dashboard 2.0
- **Goal**: Visualise long‑term progress and predict time‑to‑mastery.
- **Mechanism**:
  - Compute **mastery trajectories** using simple linear regression on `learning_logs` scores per TIMSS domain.
  - Introduce **confidence intervals** around progress bars (showing uncertainty).
  - Add **comparative benchmarks** (e.g., “You are progressing faster than 60% of students at this level”).
- **UI**: Upgrade `MasteryChart` to interactive line charts (via a lightweight library like `recharts` or `victory`), with hover details and trend forecasts.

### 4. Test‑Effect & Retrieval Practice
- **Goal**: Harness the **testing effect** (retrieval practice) to boost long‑term retention.
- **Mechanism**:
  - Periodically inject **unannounced mini‑quizzes** that revisit previously mastered standards.
  - Use **confidence‑based scoring** (students rate how sure they are before seeing answer).
  - Schedule reviews using a **spaced‑repetition algorithm** (SM‑2 variant).
- **UI**: A “Retrieval Practice” module that appears as a pop‑up or sidebar, with quick 2‑3 question sets.

### 5. Cognitive‑Load Optimiser
- **Goal**: Actively reduce extraneous cognitive load by adjusting UI complexity.
- **Mechanism**:
  - Monitor `cognitive_load_rating` (self‑reported) and correlate with UI events (e.g., too many animations, dense text).
  - Implement **progressive disclosure** – hide advanced options until the student reaches a certain mastery threshold.
  - Offer **“simplified view”** toggle that strips away decorative elements.
- **UI**: A subtle “Load Level” indicator (like a brain icon with 1‑7 dots) that students can click to adjust UI density.

## Technical Implementation

### Database Extensions
- New table `adaptive_paths` storing recommendation rules & student‑path mappings.
- New table `retrieval_sessions` tracking mini‑quiz performance.
- Extend `learning_logs` with `retrieval_score` and `ui_complexity_preference`.

### Front‑End Additions
- `AdaptivePathRecommender.tsx` – component that suggests next task.
- `RetrievalPractice.tsx` – pop‑up quiz interface.
- `MasteryDashboard.tsx` – upgraded charts with forecasting.
- `CognitiveLoadToggle.tsx` – UI‑complexity controller.

### Back‑End Services
- Lightweight **recommendation engine** (could be a Supabase Edge Function or a simple Node.js microservice).
- **Spaced‑repetition scheduler** (cron job that pushes review notifications).

## Research Foundations
- **Testing Effect** (Roediger & Karpicke, 2006): Retrieval practice enhances long‑term retention more than re‑studying.
- **Spaced Repetition** (Ebbinghaus, 1885): Information is better retained when reviews are spaced over time.
- **Bayesian Knowledge Tracing** (Corbett & Anderson, 1995): Models student knowledge state based on performance history.
- **Cognitive Load Theory** (Sweller, 1988): Optimise intrinsic load, reduce extraneous load.

## Success Metrics
- **Engagement**: Increase in daily active sessions (>20%).
- **Accuracy**: Improvement in prediction‑accuracy calibration (reduce over‑confidence).
- **Retention**: Higher scores on delayed post‑tests (effect size d>0.5).
- **Usability**: Lower cognitive‑load ratings (average <4/7).

## Risks & Mitigations
- **Over‑engineering**: Start with simple rule‑based adaptation, not full ML.
- **Privacy**: All adaptive data stays on‑device or in the student’s own Supabase row.
- **Performance**: Keep charts lightweight; avoid blocking the main thread.

## Timeline
- **Week 1**: Design & prototype Adaptive Path Recommender.
- **Week 2**: Implement Retrieval Practice module.
- **Week 3**: Upgrade Mastery Dashboard with forecasting.
- **Week 4**: Integrate Cognitive‑Load Optimiser & A/B testing.

---

**Next Step**: Await Phase 2 sign‑off, then begin implementation of Adaptive Learning Paths (first component).