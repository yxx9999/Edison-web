create extension if not exists pgcrypto;

alter table public.messages
  add column if not exists reply_email text;

alter table public.messages
  drop constraint if exists messages_status_check;

alter table public.messages
  add constraint messages_status_check
  check (status in ('new', 'read', 'replied', 'archived'));

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null,
  category text not null,
  cover_url text,
  content text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  featured boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.message_replies (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  reply_to text not null,
  subject text not null,
  body text not null,
  resend_email_id text,
  sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.admin_action_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  target_type text not null,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.blog_assets (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.blog_posts(id) on delete set null,
  storage_bucket text not null,
  storage_path text not null,
  public_url text not null,
  alt_text text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_blog_posts_status_published_at
  on public.blog_posts (status, published_at desc);

create index if not exists idx_blog_posts_slug
  on public.blog_posts (slug);

create index if not exists idx_messages_reply_email
  on public.messages (reply_email);

create index if not exists idx_message_replies_message_id_created_at
  on public.message_replies (message_id, created_at desc);

create index if not exists idx_admin_action_logs_action_created_at
  on public.admin_action_logs (action, created_at desc);

create index if not exists idx_blog_assets_post_id_created_at
  on public.blog_assets (post_id, created_at desc);

drop trigger if exists trg_blog_posts_touch_updated_at on public.blog_posts;
create trigger trg_blog_posts_touch_updated_at
before update on public.blog_posts
for each row
execute function public.touch_updated_at();

alter table public.blog_posts enable row level security;
alter table public.message_replies enable row level security;
alter table public.admin_action_logs enable row level security;
alter table public.blog_assets enable row level security;

insert into storage.buckets (id, name, public)
values ('blog-assets', 'blog-assets', true)
on conflict (id) do update
set public = true;

insert into public.blog_posts (
  slug,
  title,
  excerpt,
  category,
  cover_url,
  content,
  status,
  featured,
  published_at
)
values
  (
    'agent-workflow-notes',
    '让 Agent 协作真正可审查',
    '复杂任务不是把更多模型堆上去，而是把计划、执行和验证切成可交接、可追责的工作线。',
    'AI 与 Agent',
    './image/blog/sam-altman.jpg',
    '## 为什么要拆角色
复杂任务最常见的问题不是不会做，而是做着做着范围漂移了。

- Planner 负责结构化目标
- Coder 负责在边界内实现
- Reviewer 负责证明这件事真的可交付

## 我关心的不是热闹，而是验证

一个真正可靠的 Agent 工作流，至少要回答三个问题：

1. 计划写在哪里
2. 偏差什么时候停
3. 谁来独立验收',
    'published',
    true,
    '2026-04-14T00:00:00+00:00'
  ),
  (
    'building-personal-site-mvp',
    '先做一个能站住的个人网站 MVP',
    '个人网站不是简历展开页，而是品牌、内容和行动入口的组合体。MVP 的关键不是全，而是骨架要对。',
    '产品与增长',
    './image/blog/steve-jobs.jpg',
    '## MVP 先回答什么
个人网站第一版不需要功能堆满，但要先回答：

- 访问者为什么停下来
- 他怎么快速认识你
- 他怎么继续跟你互动

## 骨架比装饰重要

Start 页吸引，About 页建立信任，Blog 页沉淀内容，Contact 页给出口，Mail 页承接输入。',
    'published',
    true,
    '2026-04-12T00:00:00+00:00'
  ),
  (
    'notes-from-the-field',
    '从球场和现场组织学到的产品节奏',
    '节奏感、站位和复盘方式，不只属于比赛，它们也决定了产品推进是不是顺手。',
    '个人成长与复盘',
    './image/blog/elon-musk.jpg',
    '## 站位

很多时候不是能力不够，而是站位不对。产品和协作也一样。

## 节奏

快不是一直冲，而是知道什么时候推进，什么时候停下来重组。

## 复盘

复盘不是情绪发泄，而是找到下一次能复制的做法。',
    'published',
    false,
    '2026-04-10T00:00:00+00:00'
  )
on conflict (slug) do update
set
  title = excluded.title,
  excerpt = excluded.excerpt,
  category = excluded.category,
  cover_url = excluded.cover_url,
  content = excluded.content,
  status = excluded.status,
  featured = excluded.featured,
  published_at = excluded.published_at;
