# Kiro 101 — Supabase startup kit

[All lessons](../README.md) · **Lesson 1 of 2** · [Next: Kiro 102](../kiro-102/README.md)

Edition **1.0.0**
Each student runs the frontend locally and connects to their own Supabase Free project.

**Start with [STUDENT_SETUP_GUIDE.html](STUDENT_SETUP_GUIDE.html)** in your browser, or read [the Markdown guide](STUDENT_SETUP_GUIDE.md). It covers installation, cloud-project creation, SQL, Auth settings, connection values, app startup and troubleshooting.

## Quick reference

1. Install Node.js 24 and Kiro IDE.
2. Create your own Supabase project. Run `supabase/schema.sql` in its SQL Editor before creating an app account.
3. Choose the email-confirmation setting described in the student guide and configure the localhost redirect addresses.
4. Copy `frontend/.env.example` to `frontend/.env.local`; enter your Project URL and publishable key. Never put a secret/service_role key in the frontend.
5. From the repository root containing `package.json`, `frontend` and `supabase` (one folder above this lesson), run `npm ci`, then `npm run dev`. In Windows PowerShell, use `npm.cmd ci` and `npm.cmd run dev`.
6. Open the local URL, check the connection, register and create a test post.

This starter contains no deployed backend and no project-specific credentials. It needs an internet connection to Supabase. You do not need AWS, Docker or a local backend server.

## Included baseline

Email/password signup and login, session restoration, feed, 280-character posts, likes, profiles and follows. Supabase stores the data and enforces access with table grants and Row Level Security. Public profiles do not include email addresses.

The New Post Cancel button and real commenting remain workshop exercises. The existing comment count stays zero until students implement commenting. Other students' separate projects do not share your feed.

## Files

Continue with **[Kiro 102: specs and Jebat MCP](../kiro-102/STUDENT_GUIDE.html)** after setup. The [editable guide](../kiro-102/STUDENT_GUIDE.md) includes a small search-feature spec exercise, MCP setup, reference examples and a student worksheet. The [app design reference](DESIGN_LANGUAGE.md) describes the visual conventions used by both lessons.

| Location | Purpose |
| --- | --- |
| `frontend/src/pages/` | The original workshop page structure, adapted for Supabase |
| `frontend/src/contexts/AuthContext.tsx` | Supabase signup/login/session handling |
| `frontend/src/services/api.ts` | Database calls used by the pages |
| `frontend/src/lib/` | Public configuration, client and data validation |
| `supabase/schema.sql` | Tables, signup trigger, helper functions, grants and access rules |
| `tests/database.test.mjs` | Local Postgres-compatible access-rule tests |
| `tests/domain.test.ts` | Configuration and behavior checks |
| `tests/browser/` | Browser tests using simulated Supabase responses |

## Developer checks

After `npm ci`, run these from the repository root, one folder above this lesson:

```bash
npm run typecheck
npm run lint
npm run build
npm run test:coverage
```

For browser checks, stop any dev server on ports 5173 and 5174, install the test browser once with `npx playwright install chromium`, then run `npm run test:e2e`. The helper starts two temporary local servers and closes them after the tests. It uses synthetic connection values and never accesses a real Supabase project.

The SQL tests run PostgreSQL-compatible PGlite locally with simulated Supabase Auth roles. Passing them is not evidence of a configured cloud project; complete the guide's live manual checks on your own project.
