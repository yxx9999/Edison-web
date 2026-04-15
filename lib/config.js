"use strict";

const dotenv = require("dotenv");

dotenv.config();

function getConfig() {
  return {
    port: Number(process.env.PORT || 3000),
    supabaseUrl: process.env.SUPABASE_URL || "",
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    resendApiKey: process.env.RESEND_API_KEY || "",
    notifyEmail: process.env.NOTIFY_EMAIL || "",
    emailFrom: process.env.EMAIL_FROM || "Edison Website <onboarding@resend.dev>",
    autoPublishComments: process.env.EDISON_AUTO_PUBLISH_COMMENTS === "true",
    adminPassword: process.env.ADMIN_PASSWORD || "",
    adminSessionSecret: process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  };
}

module.exports = {
  getConfig
};
