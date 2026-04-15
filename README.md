# Edison Website

This repository contains Edison personal website with static pages plus a lightweight Node backend for phase-two dynamic features.

## Pages

- `index.html` - Start page with four symbolic entry objects
- `about.html` - formal profile, experience, and project sections
- `blog.html` - blog list/detail view powered by local post data
- `contact.html` - profile links and friends section
- `mail.html` - anonymous mail page backed by the lightweight `/api/messages` service

## Run Locally

Install dependencies and run the local service from the repository root:

```powershell
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Notes

- Blog data lives in `scripts/posts.js`
- Shared interactions and front-end API wiring live in `scripts/site.js`
- Shared styling lives in `styles/site.css`
- Lightweight backend routes live behind `/api/*`
- Supabase schema lives in `supabase/schema.sql`
- Mail submissions, comments, likes, views, and analytics use in-memory fallback until environment secrets are configured
- Copy `.env.example` to `.env` and fill Supabase / Resend keys when ready
