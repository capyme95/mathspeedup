# MathSpeedup 2.0 – Phase 4: Extension & Integration

**Goal**: Transform the feature‑complete prototype into a production‑ready, monitored, tested platform that delivers reliable personalised learning for Sebastian (and potentially other students).

## Core Objectives

1. **Deployment & DevOps** – Ensure the application can be deployed automatically, runs reliably, and scales as needed.
2. **Monitoring & Observability** – Capture errors, track performance, and log user interactions for continuous improvement.
3. **User Testing & Feedback** – Gather qualitative and quantitative feedback from Sebastian (and possibly other testers) to validate the learning experience.
4. **Performance Optimisation** – Improve load times, reduce bundle size, and ensure smooth interactions.
5. **Documentation** – Provide clear guidance for both students (how to use the dashboard) and developers (how to maintain/extend the codebase).
6. **Future‑Proofing** – Lay groundwork for potential integrations (LMS, gradebooks, parental dashboards) and feature expansions.

---

## Detailed Tasks

### 1. Deployment Configuration
- **Vercel Setup**
  - Create `vercel.json` with appropriate routing, headers, and environment‑variable mappings.
  - Configure production environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in Vercel dashboard.
  - Set up branch‑based preview deployments (main → production, feature branches → preview).
- **Environment Validation**
  - Add a runtime check in `src/app/page.tsx` that logs a warning if Supabase environment variables are missing.
  - Provide a fallback UI that explains the configuration step when variables are absent.
- **Build Optimisation**
  - Review `next.config.js` (or create one) for optimal image handling, SWC/minification settings.
  - Ensure static assets are served efficiently (Cache‑Control headers, CDN).

### 2. Monitoring & Observability
- **Front‑End Error Boundaries**
  - Create `src/components/ErrorBoundary.tsx` that catches React rendering errors and displays a friendly message.
  - Wrap critical sections (dashboard, feedback engine, retrieval practice) with error boundaries.
- **Error Tracking (Sentry / LogRocket)**
  - Evaluate free‑tier error‑tracking services; if feasible, integrate Sentry for JavaScript error reporting.
  - Log unhandled exceptions, network failures, and component‑level errors.
- **Supabase Logging**
  - Enable Supabase `database.weekly_active_users` and `database.size` monitoring.
  - Create a simple admin view (password‑protected) that shows recent `learning_logs` and system health (optional).
- **Performance Metrics**
  - Use Next.js built‑in Core Web Vitals reporting.
  - Log custom metrics (e.g., “time‑to‑first‑feedback”, “retrieval‑practice completion rate”) to a dedicated `analytics_events` table.

### 3. User Testing & Feedback
- **In‑App Feedback Form**
  - Create `src/components/FeedbackForm.tsx` with a 1‑5 star rating, open‑text comment, and optional email field.
  - Store submissions in a new `user_feedback` table (timestamp, rating, comment, user_id).
  - Display a subtle “Give Feedback” button in the dashboard footer.
- **Usability Testing Protocol**
  - Design a 30‑minute test script for Sebastian: walk through the three task levels (Achieved/Merit/Excellence), use the retrieval‑practice module, adjust cognitive‑load rating, and review personalised feedback.
  - Record observations (screen recording optional) and note any confusion, delight, or friction points.
- **A/B Testing Foundation**
  - Prepare a simple feature‑flag system (e.g., environment‑variable toggles) to enable/disable new components (e.g., “show Mastery Dashboard 2.0” vs. “show old MasteryChart”).

### 4. Performance Optimisation
- **Bundle Analysis**
  - Run `@next/bundle-analyzer` to identify large dependencies.
  - Consider replacing heavy libraries with lighter alternatives (e.g., replace `recharts` with custom SVG – already done).
- **Code Splitting**
  - Split the main page (`src/app/page.tsx`) into lazy‑loaded sections (e.g., `React.lazy` for MasteryDashboard2, CognitiveLoadOptimiser).
  - Ensure critical above‑the‑fold content (Learning Intention, Worked Examples) loads first.
- **Image Optimisation**
  - Convert any static images to WebP/AVIF format.
  - Use Next.js `<Image>` component with `priority` for key visuals.
- **Caching Strategy**
  - Implement stale‑while‑revalidate for Supabase fetches (e.g., `swr` or `react‑query` if complexity increases).

### 5. Documentation
- **Student Guide** (`docs/student‑guide.md`)
  - Explain the dashboard’s purpose, how to read learning intentions, how to submit self‑reported grades, how to interpret personalised feedback.
  - Include screenshots and a glossary of terms (TIMSS domains, cognitive load, prediction accuracy).
- **Developer Guide** (`docs/developer‑guide.md`)
  - Project structure, technology stack, environment setup, database schema, component architecture.
  - Contribution guidelines, testing approach, deployment instructions.
- **Research Bibliography**
  - Maintain a `docs/references.md` with links to Hattie’s Visible Learning, TIMSS frameworks, Cognitive Load Theory, Testing Effect studies – to justify design decisions.

### 6. Future‑Proofing & Integration
- **LMS Integration (Future)**
  - Research LTI (Learning Tools Interoperability) standard for embedding MathSpeedup into platforms like Google Classroom, Canvas, Moodle.
  - Design a “teacher view” that aggregates class‑level mastery data (anonymous).
- **Parent Dashboard (Future)**
  - Sketch a read‑only dashboard for parents/guardians that shows progress without exposing detailed logic fingerprints.
- **Export & Portability**
  - Allow students to download their learning logs as CSV/JSON for personal records.
  - Provide a “reset progress” option for starting a new academic year.

---

## Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Deployment Uptime | >99.5% | Vercel analytics |
| Page Load Time (LCP) | <2.5s | Web Vitals |
| Error Rate (front‑end) | <0.1% | Sentry/error‑boundary logs |
| User‑Feedback Score (avg) | ≥4/5 stars | `user_feedback` table |
| Daily Active Sessions | ≥1 (Sebastian) | Supabase `learning_logs` count |
| Retention (7‑day) | 100% (Sebastian) | Weekly login count |
| Bundle Size (main JS) | <200KB | Bundle analyzer |

---

## Risks & Mitigations

- **Risk**: Over‑engineering monitoring – adding too many tools before validating core functionality.
  - **Mitigation**: Start with simple error boundaries and console logging; add external services only after confirming they provide actionable insights.
- **Risk**: User‑testing burden on Sebastian – too much feedback may reduce engagement.
  - **Mitigation**: Keep feedback requests minimal (one‑time 30‑minute session + optional in‑app form). Reward participation (e.g., unlock a “beta tester” badge).
- **Risk**: Deployment complexity – environment‑variable mismatches between local and production.
  - **Mitigation**: Use `vercel env pull` for local development, add a runtime validation script that fails gracefully.
- **Risk**: Performance regressions from new features.
  - **Mitigation**: Run bundle‑size and Lighthouse checks before each merge; set up a performance budget.

---

## Timeline (Approximate)

- **Week 1** (2026‑03‑11 – 2026‑03‑17)
  - Deployment configuration (`vercel.json`, environment validation)
  - Error boundaries & basic monitoring
  - Create `FeedbackForm` component
- **Week 2** (2026‑03‑18 – 2026‑03‑24)
  - Conduct first user‑test session with Sebastian
  - Analyse bundle size, implement code‑splitting
  - Write student & developer guides
- **Week 3** (2026‑03‑25 – 2026‑03‑31)
  - Integrate error‑tracking service (Sentry)
  - Set up GitHub Actions for CI/CD
  - Review performance metrics, iterate on feedback
- **Week 4** (2026‑04‑01 – 2026‑04‑07)
  - Future‑proofing research (LMS, parent dashboard)
  - Final polish, documentation updates, retrospective

---

## Next Immediate Steps

1.  Create `vercel.json` and validate environment variables.
2.  Implement `ErrorBoundary.tsx` and wrap critical components.
3.  Build `FeedbackForm.tsx` and integrate into the dashboard footer.
4.  Run a full Lighthouse audit and address any critical issues.

---

**Status**: Phase 4 design approved; implementation begins 2026‑03‑10 23:50 UTC.