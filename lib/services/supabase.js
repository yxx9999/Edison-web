"use strict";

const { createClient } = require("@supabase/supabase-js");
const { getConfig } = require("../config");

let cachedClient = null;

function getSupabaseClient() {
  const config = getConfig();

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }

  return cachedClient;
}

module.exports = {
  getSupabaseClient
};
