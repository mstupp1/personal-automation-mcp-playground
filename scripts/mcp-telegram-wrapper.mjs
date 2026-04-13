#!/opt/homebrew/bin/node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const DEFAULT_CHAT_ID = process.env.TELEGRAM_DEFAULT_CHAT_ID;
const API_BASE = BOT_TOKEN ? `https://api.telegram.org/bot${BOT_TOKEN}` : null;

function logError(...args) {
  console.error(...args);
}

function requireBotToken() {
  if (!BOT_TOKEN || !API_BASE) {
    throw new Error(
      "TELEGRAM_BOT_TOKEN is not configured. Set it in the MCP server environment.",
    );
  }
}

function resolveChatId(chatId) {
  if (chatId !== undefined && chatId !== null && chatId !== "") {
    return chatId;
  }

  if (DEFAULT_CHAT_ID) {
    const numeric = Number(DEFAULT_CHAT_ID);
    return Number.isNaN(numeric) ? DEFAULT_CHAT_ID : numeric;
  }

  throw new Error(
    "chatId is required unless TELEGRAM_DEFAULT_CHAT_ID is configured.",
  );
}

async function callTelegram(method, payload) {
  requireBotToken();

  const response = await fetch(`${API_BASE}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await response.json();
  if (!response.ok || !json.ok) {
    throw new Error(
      json?.description || `Telegram API request failed for ${method}`,
    );
  }

  return json.result;
}

function textResult(text) {
  return {
    content: [{ type: "text", text }],
  };
}

const server = new McpServer({
  name: "telegram-codex-wrapper",
  version: "1.0.0",
});

server.registerTool(
  "SEND_MESSAGE",
  {
    description:
      "Send a Telegram message. If chatId is omitted, TELEGRAM_DEFAULT_CHAT_ID is used.",
    inputSchema: {
      chatId: z
        .union([z.string(), z.number()])
        .optional()
        .describe(
          "Telegram chat ID or username. Optional when TELEGRAM_DEFAULT_CHAT_ID is configured.",
        ),
      text: z.string().min(1).describe("Message text to send."),
      topicId: z
        .number()
        .optional()
        .describe("Forum topic ID for topic-enabled chats."),
    },
  },
  async ({ chatId, text, topicId }) => {
    const targetChatId = resolveChatId(chatId);
    const message = await callTelegram("sendMessage", {
      chat_id: targetChatId,
      text,
      ...(topicId !== undefined ? { message_thread_id: topicId } : {}),
    });

    return textResult(
      [
        "Message sent successfully!",
        "",
        `Message ID: ${message.message_id}`,
        `Chat ID: ${message.chat.id}`,
        `Sent at: ${new Date(message.date * 1000).toISOString()}`,
        `Text: ${message.text ?? text}`,
      ].join("\n"),
    );
  },
);

server.registerTool(
  "GET_CHANNEL_INFO",
  {
    description:
      "Get Telegram chat information. If channelId is omitted, TELEGRAM_DEFAULT_CHAT_ID is used.",
    inputSchema: {
      channelId: z
        .union([z.string(), z.number()])
        .optional()
        .describe(
          "Telegram chat ID or username. Optional when TELEGRAM_DEFAULT_CHAT_ID is configured.",
        ),
    },
  },
  async ({ channelId }) => {
    const chat = await callTelegram("getChat", {
      chat_id: resolveChatId(channelId),
    });

    return textResult(JSON.stringify(chat, null, 2));
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  logError("Telegram MCP wrapper failed:", error);
  process.exit(1);
});
