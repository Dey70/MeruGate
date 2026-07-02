# MeeruGate

A study tracker for GATE CSE exam prep with social accountability — syllabus planner with streaks, invite-code squads, per-topic notes, weekly/monthly goals, and a Claude-powered doubt-solving/quiz chatbox.

Built with Next.js (App Router), Supabase (Postgres + Auth), Tailwind + shadcn/ui, and the Anthropic API.

## Setup

### 1. Create a Supabase project

Create a project at [supabase.com](https://supabase.com). From **Project Settings > API**, copy:

- Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server-only; not currently used by the app, kept for future admin scripts)

### 2. Run the database migrations

In the Supabase dashboard, open **SQL Editor > New query** and run these files **in order**, each as its own query:

1. `supabase/migrations/0001_schema.sql` — tables, indexes, RLS policies, helper functions
2. `supabase/migrations/0002_seed_gate_cse.sql` — GATE CSE syllabus topics (separate from schema so other syllabi can be seeded later)
3. `supabase/migrations/0003_seed_squad.sql` — pre-seeds the one squad + invite code `MEERUGATE2026` for the initial 3-person team

### 3. Configure auth

In **Authentication > URL Configuration**:

- Site URL: `http://localhost:3000` (update to your production domain after deploying)
- Redirect URLs: add `http://localhost:3000/auth/callback` (and the production equivalent)

Magic link auth works out of the box. For **Google OAuth**, go to **Authentication > Providers > Google**, enable it, and supply a Client ID/Secret from a Google Cloud OAuth client (Web application type) — set its authorized redirect URI to `https://<your-project-ref>.supabase.co/auth/v1/callback`.

### 4. Get an Anthropic API key

Create a key at [platform.claude.com](https://platform.claude.com) and set `ANTHROPIC_API_KEY`.

### 5. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in the values from steps 1–4.

### 6. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in, then join the pre-seeded squad from `/squad` using invite code `MEERUGATE2026` (or create your own squad).

## Project structure

- `supabase/migrations/` — hand-authored SQL, run manually in Supabase Studio (no Supabase CLI/Docker dependency)
- `app/(marketing)/` — landing page, login, OAuth callback (public)
- `app/(app)/` — dashboard, planner, squad, notes, goals, chat (auth-protected)
- `app/api/chat/` — streaming Anthropic route
- `lib/supabase/` — browser/server Supabase clients + session-refresh helper used by `proxy.ts`
- `lib/queries/` — server-side data fetchers
- `lib/streaks.ts` — streak computation from completion activity
- `components/glass/` — glassmorphism UI primitives (`GlassCard`)

Note: this is Next.js 16, which renamed `middleware.ts` to `proxy.ts` — that's not a typo.

## Deploying

Deploy to [Vercel](https://vercel.com/new). Set the same environment variables from `.env.local` in the Vercel project settings, then update the Supabase Site URL/redirect URLs to your production domain.
