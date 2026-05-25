# Geotest — AI Handbook

A web app where users can **create**, **take**, and **analyse** multiple-choice tests, with leaderboards and optional image support.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router), React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS (dark theme, custom utility classes) |
| ORM | Prisma 5 |
| Database | SQLite (`prisma/dev.db`) |
| Auth | bcryptjs (password hashing), localStorage (client state) |
| Validation | Zod |
| Images | Cloudinary (optional, unsigned upload) |

---

## Project Structure

```
app/
  api/
    profiles/
      route.ts           POST: register
      signin/route.ts    POST: verify credentials
    tests/
      route.ts           GET: search tests  |  POST: create test
      [id]/
        route.ts         GET: fetch test  |  PATCH: edit  |  DELETE: delete
        submit/route.ts  POST: submit attempt & score
        leaderboard/route.ts  GET: top 50 attempts
  layout.tsx             Root layout (header/footer)
  page.tsx               Home page (hero + search)
  profile/
    new/page.tsx         Create account
    signin/page.tsx      Sign in
  tests/
    page.tsx             Browse / search tests
    new/page.tsx         Create test
    [id]/
      page.tsx           Test overview + leaderboard
      take/page.tsx      Take test (nickname entry)
      edit/page.tsx      Edit test (password-gated)
      result/page.tsx    Show results after submission

components/
  TestRunner.tsx    Interactive test UI (timer, answers, auto-submit)
  TestEditor.tsx    Create/edit test form (manual + JSON import)
  Leaderboard.tsx   Ranked attempts table
  SearchBar.tsx     Real-time test search
  NavUser.tsx       Header nav (auth state)

lib/
  db.ts            Prisma client singleton
  auth.ts          Server-side password hash/verify
  clientAuth.ts    Client-side localStorage helpers
  cloudinary.ts    Image upload
  validators.ts    Zod schemas for all API payloads

prisma/
  schema.prisma    Data models

samples/
  example-test.json  Sample JSON import format
```

---

## Database Schema

```
Profile          — username (unique), passwordHash
  └── Test[]     — name, description, timeLimitSec?, authorId
        └── Question[]  — prompt, imageUrl?, explanation?, order
              └── Choice[]   — text, isCorrect, order
        └── Attempt[]   — nickname, score, total, durationSec
```

All relations use **cascade delete**. One `Choice` per `Question` must have `isCorrect: true`.

Indexes: `Test.name` (search), `[Attempt.testId, Attempt.score]` (leaderboard sorting).

---

## Authentication Model

- **No sessions or cookies.** Username is stored in `localStorage` under the key `geotest:username`.
- Password is **never stored client-side**. Every write operation (create/edit/delete test) sends the password to the server, which re-verifies it via `verifyProfile(username, password)` in `lib/auth.ts`.
- Password hashing: bcryptjs, 10 salt rounds.

---

## Key API Contracts

### Register
```
POST /api/profiles
{ username, password }
→ { profile: { id, username, createdAt } }
```

### Sign In (verify)
```
POST /api/profiles/signin
{ username, password }
→ { ok: true } | 401
```

### Create Test
```
POST /api/tests
{ username, password, test: { name, description?, timeLimitSec?, questions[] } }
Each question: { prompt, imageUrl?, explanation?, choices: [{ text, isCorrect }] }
→ { test: { id, name } }
```

### Submit Attempt
```
POST /api/tests/[id]/submit
{ nickname, durationSec?, answers: [{ questionId, choiceId | null }] }
→ { score, total, correctMap, explanations }
Result stored in sessionStorage, user routed to /tests/[id]/result
```

### Search Tests
```
GET /api/tests?q=keyword
→ { tests: [{ id, name, description, timeLimitSec, author, _count }] }
```

### Leaderboard
```
GET /api/tests/[id]/leaderboard
→ { attempts[] } — top 50, sorted: score DESC, durationSec ASC, createdAt ASC
```

---

## Data Flow

**Create a test:**
1. `/tests/new` → `TestEditor` component
2. `POST /api/tests` (credentials + test data)
3. Zod validation + `verifyProfile` + Prisma write
4. Redirect to `/tests/[id]`

**Take a test:**
1. `/tests/[id]` → click Take Test → `/tests/[id]/take`
2. `TestRunner` handles nickname entry, countdown timer, answer tracking
3. Auto-submits at 0s or on manual submit → `POST /api/tests/[id]/submit`
4. Score stored in `sessionStorage` → redirected to `/tests/[id]/result`

**Edit/Delete a test:**
- Password-gated; server re-verifies credentials on every `PATCH`/`DELETE`

---

## Validation Rules (Zod — `lib/validators.ts`)

| Field | Rule |
|-------|------|
| username | 2–40 chars, alphanumeric + `_ . -` |
| password | min 4 chars |
| test name | 1–200 chars |
| description | max 2000 chars |
| timeLimitSec | positive integer or null |
| nickname | 1–40 chars, alphanumeric + `_ . - space` |
| durationSec | 0–86400 |
| questions | min 1 |
| choices per question | min 2, exactly one `isCorrect: true` |

---

## Styling Conventions

- Dark theme via CSS custom properties in `app/tests/globals.css`
- Custom Tailwind utilities: `.btn-primary`, `.btn-ghost`, `.card`, `.input`, `.label`, `.error`
- Max-width container: `max-w-5xl` with horizontal padding
- Images: Cloudinary domain (`res.cloudinary.com`) whitelisted in `next.config.mjs`

---

## Dev Commands

```bash
npm run dev          # Start dev server (:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run db:push      # Sync Prisma schema → SQLite (creates dev.db)
npm run db:generate  # Regenerate Prisma client after schema changes
```

---

## Environment Variables (`.env`)

```
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=...
```

Cloudinary is optional — image fields accept any valid URL or can be left blank.

---

## Important Constraints

- SQLite is file-based (`prisma/dev.db`) — not suitable for multi-instance deployments without switching to Postgres/MySQL.
- Auth is stateless by design; upgrading to JWT/session cookies would require an auth library (e.g., NextAuth, Lucia).
- Cascade deletes mean deleting a `Profile` wipes all their tests, questions, choices, and attempts.
- The `TestEditor` supports bulk import via JSON (see `samples/example-test.json` for the expected format).
- `TestRunner` auto-submits when the timer hits zero; unanswered questions are submitted with `choiceId: null` and scored as incorrect.
