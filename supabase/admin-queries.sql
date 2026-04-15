-- Recent anonymous messages
select
  id,
  topic,
  nickname,
  status,
  created_at,
  left(message, 160) as preview
from public.messages
order by created_at desc
limit 50;

-- Mark a message as read
-- update public.messages
-- set status = 'read'
-- where id = '<message-id>';

-- Pending comments for moderation
select
  id,
  post_slug,
  nickname,
  status,
  created_at,
  content
from public.comments
where status = 'pending'
order by created_at desc
limit 50;

-- Publish a comment
-- update public.comments
-- set status = 'published'
-- where id = '<comment-id>';

-- Hide a comment
-- update public.comments
-- set status = 'hidden'
-- where id = '<comment-id>';

-- Blog metrics overview
select
  post_slug,
  title,
  view_count,
  like_count,
  comment_count,
  updated_at
from public.post_metrics
order by updated_at desc;

-- Recent analytics events
select
  event_name,
  page,
  post_slug,
  metadata,
  created_at
from public.analytics_events
order by created_at desc
limit 100;
