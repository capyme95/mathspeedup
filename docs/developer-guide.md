# MathSpeedup 2.0 – Developer Guide

This document explains the technology stack, project structure, and development workflow for the MathSpeedup dashboard. It is intended for developers who need to maintain, extend, or deploy the application.

## Technology Stack

- **Front‑end**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4.
- **Back‑end / Database**: Supabase (PostgreSQL with Row‑Level Security, real‑time subscriptions, REST API).
- **Deployment**: Vercel (automatic Git‑based deployments, environment variables, serverless functions).
- **Monitoring**: Custom error‑boundary logging to Supabase `monitoring_logs` table; optional Sentry integration (future).
- **Analysis**: Next.js bundle analyzer (`@next/bundle‑analyzer`), Lighthouse for performance audits.

## Project Structure

```
mathspeedup/
├── src/
│   ├── app/                    # Next.js App Router
│   │   └── page.tsx            # Main dashboard page (client component)
│   ├── components/             # React components (all client components)
│   │   ├── LearningIntention.tsx
│   │   ├── WorkedExample.tsx
│   │   ├── SelfReportedGrade.tsx
│   │   ├── StructuredFeedback.tsx
│   │   ├── MasteryChart.tsx
│   │   ├── AdaptivePathRecommender.tsx
│   │   ├── RetrievalPractice.tsx
│   │   ├── MasteryDashboard2.tsx
│   │   ├── CognitiveLoadOptimiser.tsx
│   │   ├── PersonalisedFeedbackEngine.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── FeedbackForm.tsx
│   ├── lib/                    # Utility functions
│   │   └── monitoring.ts       # Logging to Supabase
│   └── types/                  # TypeScript interfaces
│       └── index.ts
├── supabase/
│   ├── migrations/             # Database schema migrations
│   │   ├── 20260303_init_schema.sql
│   │   ├── 20260310_phase1_upgrade.sql
│   │   ├── fix_current_issues_v6.sql      # Final fix script
│   │   ├── 20260310_phase4_feedback.sql   # User‑feedback table
│   │   └── 20260310_phase4_monitoring.sql # Monitoring logs table
│   └── config.toml             # Supabase local configuration (if used)
├── docs/                       # Documentation
│   ├── student‑guide.md
│   └── developer‑guide.md
├── public/                     # Static assets
├── scripts/                    # Build/deployment helper scripts
├── vercel.json                 # Vercel deployment configuration
├── next.config.ts              # Next.js configuration (with bundle analyzer)
├── tsconfig.json               # TypeScript configuration
├── package.json
└── README.md
```

## Database Schema

### Core Tables

- `standards` – NCEA standards (id, code, title, credits).
- `learning_logs` – Student learning sessions, with evidence‑based columns (`self_reported_grade`, `prediction_accuracy`, `cognitive_load_rating`, `learning_intention`, `success_criteria`, `timss_domain`).
- `worked_examples` – Step‑by‑step examples linked to standards.
- `feedback_templates` – Reusable feedback snippets with placeholders.
- `student_goals` – Student‑defined learning goals (optional).
- `user_feedback` – In‑app ratings and comments (Phase 4).
- `monitoring_logs` – Front‑end errors and performance metrics (Phase 4).

All tables are secured with Row‑Level Security (RLS). Policies follow the pattern “Users can view/insert/update/delete their own data” (using `auth.uid() = user_id`). The `monitoring_logs` table allows unauthenticated inserts for error reporting.

## Environment Variables

Required variables (set in Vercel dashboard and locally via `.env.local`):

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon‑key>
```

Optional (for future integrations):

```
NEXT_PUBLIC_SENTRY_DSN=<dsn>
ANALYZE=true           # Enables bundle‑analyzer report
```

## Development Workflow

### Local Setup

1.  Clone the repository.
2.  Install dependencies: `npm install`.
3.  Copy `.env.example` to `.env.local` and fill in Supabase credentials.
4.  Run the dev server: `npm run dev`.
5.  Open http://localhost:3000.

### Database Changes

1.  Create a new migration file in `supabase/migrations/` following the naming convention `YYYYMMDD_description.sql`.
2.  Write idempotent SQL (use `CREATE TABLE IF NOT EXISTS`, `DO` blocks for conditional logic).
3.  Test locally with Supabase CLI (`supabase db reset`).
4.  Apply to production via Supabase Dashboard SQL Editor or CI/CD pipeline.

### Adding a New Component

1.  Create the component in `src/components/`.
2.  Define its TypeScript interface in `src/types/index.ts` if needed.
3.  Import it in `src/app/page.tsx` (or lazy‑load with `React.lazy`).
4.  Wrap it with `<ErrorBoundary>` and `<Suspense>` if it’s large or may fail.
5.  Add any required data‑fetching to the `fetchData` function in `page.tsx`.

### Code Quality

- **TypeScript**: Strict mode enabled; run `npx tsc --noEmit` before commits.
- **ESLint**: Configured with Next.js rules; run `npm run lint`.
- **Formatting**: Use Prettier (not yet configured; consider adding `.prettierrc`).
- **Bundle size**: Run `npm run analyze` to inspect bundle composition.

## Deployment

### Vercel

The project is configured for automatic Vercel deployment:

- `vercel.json` maps environment variables and sets basic headers.
- Each push to `main` triggers a production deployment.
- Preview deployments are created for pull requests.

### Manual Deployment

1.  Ensure all environment variables are set in Vercel.
2.  Run `npm run build` locally to verify no errors.
3.  Push to `main` (or use `vercel --prod` if using Vercel CLI).

## Monitoring & Observability

- **Error boundaries**: `ErrorBoundary.tsx` catches React rendering errors and logs them to `monitoring_logs`.
- **Custom logging**: Use `logError`, `logPerformance`, `logAnalytics` from `src/lib/monitoring.ts`.
- **Supabase logs**: Monitor database performance and RLS violations via Supabase Dashboard.
- **Performance**: Use Next.js Core Web Vitals reporting; consider integrating Sentry for deeper error tracking.

## Performance Optimisation

- **Code splitting**: Heavy components (MasteryDashboard2, CognitiveLoadOptimiser, etc.) are lazy‑loaded with `React.lazy`.
- **Bundle analysis**: Run `npm run analyze` to identify large dependencies.
- **Image optimisation**: Use Next.js `<Image>` component; convert static images to WebP/AVIF.
- **Caching**: Supabase queries are not yet cached; consider adding `swr` or `react‑query` if data freshness requirements allow.

## Future‑Proofing Considerations

- **LMS integration**: Research LTI (Learning Tools Interoperability) for embedding in platforms like Google Classroom, Canvas.
- **Parent dashboard**: Design a read‑only view for parents/guardians.
- **Export functionality**: Allow students to download their learning logs as CSV/JSON.
- **A/B testing**: Implement feature‑flags via environment variables to toggle experimental components.
- **Multi‑student support**: Extend RLS policies to handle classroom‑level permissions (teacher vs. student).

## Troubleshooting

### “Column does not exist” after migration
- Ensure the migration script ran successfully in Supabase Dashboard.
- Check that the column name matches the TypeScript interface.

### RLS policy blocking inserts/selects
- Verify that the policy uses the correct expression (`auth.uid() = user_id`).
- For tables that allow unauthenticated inserts (e.g., `monitoring_logs`), use `WITH CHECK (true)`.

### Bundle analyzer not generating report
- Pass the `--webpack` flag to `next build` (already configured in `package.json`).
- Ensure `ANALYZE=true` is set in the environment.

### TypeScript errors after adding a new component
- Run `npx tsc --noEmit` to see all errors.
- Update `src/types/index.ts` if new interfaces are needed.

## Contributing

1.  Fork the repository.
2.  Create a feature branch.
3.  Write tests if applicable (test suite not yet set up).
4.  Ensure TypeScript and ESLint pass.
5.  Submit a pull request with a clear description of changes.

## License

Proprietary – see repository owner for licensing details.

---

*This guide is a living document. Update it as the project evolves.*