"use strict";

require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");
const posts = require("../lib/post-catalog");

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  for (const post of posts) {
    const { data: existing, error: selectError } = await supabase
      .from("post_metrics")
      .select("view_count, like_count, comment_count")
      .eq("post_slug", post.slug)
      .maybeSingle();

    if (selectError) {
      throw selectError;
    }

    if (!existing) {
      const { error: insertError } = await supabase.from("post_metrics").insert({
        post_slug: post.slug,
        title: post.title,
        view_count: post.fallbackViews,
        like_count: post.fallbackLikes,
        comment_count: 0
      });

      if (insertError) {
        throw insertError;
      }

      continue;
    }

    const { error: updateError } = await supabase
      .from("post_metrics")
      .update({
        title: post.title,
        view_count: Math.max(existing.view_count || 0, post.fallbackViews),
        like_count: Math.max(existing.like_count || 0, post.fallbackLikes),
        comment_count: existing.comment_count || 0
      })
      .eq("post_slug", post.slug);

    if (updateError) {
      throw updateError;
    }
  }

  console.log(`Seeded ${posts.length} post metric rows without lowering existing counters.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
