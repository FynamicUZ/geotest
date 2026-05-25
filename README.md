# geotest

A small website where anyone can:

- Create a **profile** (username + password).
- Build a **multiple-choice test** manually or by **uploading a JSON file**.
- Attach an **image** to any question (via Cloudinary).
- **Search tests by name**, take them, and land on the **leaderboard**.
- See **correct answers and explanations** after submitting.
- Edit/delete their own tests (password gated).
- Optional per-test **timer** with auto-submit.

## Stack

- Next.js 15 (App Router) + TypeScript
- Prisma + SQLite
- bcryptjs
- Cloudinary (unsigned upload preset, optional — images can also be entered as URLs)
- Tailwind CSS + Zod

## Setup

```bash
npm install
cp .env.example .env
# edit .env — fill in NEXT_PUBLIC_CLOUDINARY_* if you want image uploads
npx prisma db push
npm run dev
```

Open <http://localhost:3000>.

### Cloudinary (optional)

1. Create a free Cloudinary account.
2. In Settings → Upload, add an **Unsigned** upload preset.
3. Put the cloud name and preset name into `.env`.

If Cloudinary is not configured, the image field falls back to a URL input (paste any public image URL).

## JSON test format

See [samples/example-test.json](samples/example-test.json). Schema:

```jsonc
{
  "name": "string",
  "description": "string (optional)",
  "timeLimitSec": 300,               // optional, integer seconds
  "questions": [
    {
      "prompt": "string",
      "imageUrl": "https://… (optional)",
      "explanation": "string (optional, shown after submit)",
      "choices": [
        { "text": "string", "isCorrect": true  },
        { "text": "string", "isCorrect": false }
        // ≥ 2 choices; exactly one must be isCorrect: true
      ]
    }
  ]
}
```

## Notes

- "Sign-in" is a convenience that only stores the username in `localStorage`. The password is re-checked server-side on every write (create/edit/delete) — there is no real session/cookie auth.
- SQLite file lives at `prisma/dev.db` (gitignored).
