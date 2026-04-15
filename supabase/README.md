# Supabase Setup

The project is already configured to use Supabase credentials from `.env`, but the remote project does not yet contain the required tables.

## Apply Schema

1. Open the Supabase dashboard for the Edison project.
2. Go to `SQL Editor`.
3. Open [schema.sql](/C:/Users/lenovo/Desktop/Edison_web/supabase/schema.sql).
4. Copy the SQL into the editor and run it.

## What This Creates

- `post_metrics`
- `post_view_events`
- `post_like_events`
- `comments`
- `messages`
- `analytics_events`
- helper functions for incrementing metric counters

## After Running

Run the local server again:

```powershell
npm run dev
```

Then verify:

```powershell
npm run db:verify
npm run db:seed
npm run smoke
```

The `/api/health` response should report `storage: "supabase"` once the schema exists and the service stops falling back to memory.

## Phase Three Schema

Before building the admin CMS UI, apply [phase-three-schema.sql](/C:/Users/lenovo/Desktop/Edison_web/supabase/phase-three-schema.sql) in the Supabase SQL Editor.

This adds:

- `blog_posts`
- `blog_assets`
- `message_replies`
- `admin_action_logs`
- optional `messages.reply_email`
- `blog-assets` Storage bucket

## Moderation

Use [admin-queries.sql](/C:/Users/lenovo/Desktop/Edison_web/supabase/admin-queries.sql) for common moderation queries:

- review anonymous messages
- mark messages as read
- review pending comments
- publish or hide comments
- inspect blog metrics and analytics events
