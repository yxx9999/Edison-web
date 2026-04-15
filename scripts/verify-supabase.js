"use strict";

require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");

const requiredTables = [
  ["post_metrics", "post_slug, view_count, like_count, comment_count"],
  ["post_view_events", "id, post_slug, visitor_hash"],
  ["post_like_events", "id, post_slug, visitor_hash"],
  ["comments", "id, post_slug, status"],
  ["messages", "id, topic, status, reply_email"],
  ["analytics_events", "id, event_name"],
  ["blog_posts", "id, slug, title, status, published_at"],
  ["message_replies", "id, message_id, reply_to"],
  ["admin_action_logs", "id, action, target_type"],
  ["blog_assets", "id, storage_bucket, storage_path, public_url"]
];

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  let failed = false;

  for (const [table, columns] of requiredTables) {
    const { error } = await supabase.from(table).select(columns).limit(1);

    if (error) {
      failed = true;
      console.log(`${table} -> ERROR ${error.message}`);
    } else {
      console.log(`${table} -> OK`);
    }
  }

  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  if (bucketError) {
    failed = true;
    console.log(`storage.blog-assets -> ERROR ${bucketError.message}`);
  } else if ((buckets || []).some((bucket) => bucket.name === "blog-assets")) {
    console.log("storage.blog-assets -> OK");
  } else {
    failed = true;
    console.log("storage.blog-assets -> ERROR bucket missing");
  }

  if (failed) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
