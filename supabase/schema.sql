create extension if not exists pgcrypto;

create table if not exists public.post_metrics (
  post_slug text primary key,
  title text not null,
  view_count integer not null default 0,
  like_count integer not null default 0,
  comment_count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.post_view_events (
  id uuid primary key default gen_random_uuid(),
  post_slug text not null references public.post_metrics(post_slug) on delete cascade,
  visitor_hash text not null,
  session_id text,
  user_agent text,
  viewed_on date not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (post_slug, visitor_hash, viewed_on)
);

create table if not exists public.post_like_events (
  id uuid primary key default gen_random_uuid(),
  post_slug text not null references public.post_metrics(post_slug) on delete cascade,
  visitor_hash text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (post_slug, visitor_hash)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_slug text not null references public.post_metrics(post_slug) on delete cascade,
  nickname text not null,
  content text not null,
  status text not null default 'pending' check (status in ('pending', 'published', 'hidden')),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  nickname text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'archived')),
  session_id text,
  visitor_hash text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  page text,
  post_slug text,
  session_id text,
  visitor_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_post_view_events_slug_created_at
  on public.post_view_events (post_slug, created_at desc);

create index if not exists idx_post_like_events_slug_created_at
  on public.post_like_events (post_slug, created_at desc);

create index if not exists idx_comments_slug_status_created_at
  on public.comments (post_slug, status, created_at desc);

create index if not exists idx_messages_status_created_at
  on public.messages (status, created_at desc);

create index if not exists idx_analytics_events_event_created_at
  on public.analytics_events (event_name, created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_post_metrics_touch_updated_at on public.post_metrics;
create trigger trg_post_metrics_touch_updated_at
before update on public.post_metrics
for each row
execute function public.touch_updated_at();

create or replace function public.increment_post_view_count(target_slug text)
returns void
language sql
as $$
  update public.post_metrics
  set view_count = view_count + 1
  where post_slug = target_slug;
$$;

create or replace function public.increment_post_like_count(target_slug text)
returns void
language sql
as $$
  update public.post_metrics
  set like_count = like_count + 1
  where post_slug = target_slug;
$$;

create or replace function public.increment_post_comment_count(target_slug text)
returns void
language sql
as $$
  update public.post_metrics
  set comment_count = comment_count + 1
  where post_slug = target_slug;
$$;

alter table public.post_metrics enable row level security;
alter table public.post_view_events enable row level security;
alter table public.post_like_events enable row level security;
alter table public.comments enable row level security;
alter table public.messages enable row level security;
alter table public.analytics_events enable row level security;

insert into public.post_metrics (post_slug, title, view_count, like_count, comment_count)
values
  ('agent-workflow-notes', '让 Agent 协作真正可审查', 128, 24, 0),
  ('building-personal-site-mvp', '先做一个能站住的个人网站 MVP', 92, 17, 0),
  ('notes-from-the-field', '从球场和现场组织学到的产品节奏', 64, 11, 0)
on conflict (post_slug) do update
set
  title = excluded.title,
  view_count = greatest(public.post_metrics.view_count, excluded.view_count),
  like_count = greatest(public.post_metrics.like_count, excluded.like_count);
