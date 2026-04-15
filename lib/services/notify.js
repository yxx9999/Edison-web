"use strict";

const { Resend } = require("resend");
const { getConfig } = require("../config");

let cachedClient = null;

function getResendClient() {
  const config = getConfig();

  if (!config.resendApiKey) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = new Resend(config.resendApiKey);
  }

  return cachedClient;
}

async function sendMessageNotification(messageRecord) {
  const config = getConfig();
  const resend = getResendClient();

  if (!resend || !config.notifyEmail) {
    return {
      sent: false,
      reason: "notification_not_configured"
    };
  }

  const subject = `[Edison Mail] ${messageRecord.topic || "New message"}`;
  const nickname = messageRecord.nickname || "Anonymous";
  const createdAt = messageRecord.created_at || messageRecord.createdAt || new Date().toISOString();

  await resend.emails.send({
    from: config.emailFrom,
    to: config.notifyEmail,
    subject,
    text: [
      `Topic: ${messageRecord.topic || ""}`,
      `Nickname: ${nickname}`,
      `Reply Email: ${messageRecord.reply_email || "Not provided"}`,
      `Created At: ${createdAt}`,
      "",
      String(messageRecord.message || "")
    ].join("\n")
  });

  return {
    sent: true
  };
}

async function sendAdminReply({ to, subject, body }) {
  const config = getConfig();
  const resend = getResendClient();

  if (!resend || !config.notifyEmail) {
    return {
      sent: false,
      reason: "reply_not_configured"
    };
  }

  const response = await resend.emails.send({
    from: config.emailFrom,
    to,
    subject,
    text: body,
    replyTo: config.notifyEmail
  });

  return {
    sent: true,
    id: response && response.data ? response.data.id : null
  };
}

module.exports = {
  sendAdminReply,
  sendMessageNotification
};
