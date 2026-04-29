---
name: finance-base
description: "Use when working on Copilot Money finance workflows that need shared communication, formatting, timezone, profile, or delivery conventions across multiple finance skills."
---

# Finance Base

This skill defines the shared operating rules for finance workflows built on Copilot Money MCP data. Task-specific skills should read this file first, then apply their own workflow logic.

## Shared Defaults

Default style for this user:
- Crisp and analytical
- Summary-first, not transaction-by-transaction
- Compact unless more detail clearly adds value
- Telegram-friendly formatting when delivery is involved

## Profile And Context

1. Read `skills/user-profile.md` first.
2. Respect any preferences in that file over your default judgment.
3. If a task-specific skill learns a durable user preference, propose saving it back to `skills/user-profile.md` when appropriate.

## Date And Time

1. Use the user's local timezone.
2. Interpret relative dates like `today`, `yesterday`, and `this week` in that timezone.
3. If a workflow defaults to a date range, say so internally and apply it consistently.

## Copilot Money Attribution

When producing a user-facing recap, summary, or briefing, use a simple heading that makes it clear the message is coming from Copilot Money.

Preferred heading:

```text
Copilot Money Daily Recap
```

If the workflow is not a daily recap, adapt the final word or phrase, but keep the heading simple and stable.

## Message Formatting

Use clean formatting when it improves scanability.

Do:
- Use short paragraphs, line breaks, and bullets when they make the message easier to scan
- Keep messages compact and information-dense
- Use tasteful emojis sparingly and only when they add semantic value
- Prefer 1-3 emojis at most in a message when they are clearly useful

Do not:
- Add emojis for decoration
- Stack multiple emojis on one line
- Force bullets when plain prose reads better
- Sound like a generic budgeting app notification

Examples of useful emoji roles:
- warning for a notable charge or risk
- trend cue for above or below normal
- category cue when it improves scanning

## Pending Transactions

If pending transactions are included in a result:
- Make that explicit
- Say totals may still move until charges post
- Do not imply pending amounts are fully settled

Preferred wording:

```text
2 charges are still pending, so the final total may move a bit.
```

## Delivery

When a task-specific workflow or invoking prompt requires delivery:
- Compose the final message first
- Then send that exact message through the requested delivery channel
- Do not stop after analysis if delivery is part of the request

If delivery is not requested, stop at the final composed message.

### Telegram Delivery Notes

For this user and repo, Telegram delivery has a few environment-specific traps:

- Do not assume a Telegram failure means the bot token or chat ID is wrong
- In the default Codex sandbox, DNS for external hosts may fail even when the Mac itself has working internet
- If `api.telegram.org` fails to resolve in-sandbox, treat that as a sandbox-network issue first
- On this machine, Python `urllib` is not a reliable Telegram send path because HTTPS requests may fail with `CERTIFICATE_VERIFY_FAILED` due to a self-signed certificate in the trust chain
- Prefer `curl` for Telegram Bot API delivery when sending from the shell
- If delivery fails in-sandbox on DNS or host-resolution errors, retry the send out of sandbox before concluding Telegram is down

Preferred troubleshooting order:
1. Confirm the message text is finalized before debugging delivery.
2. Check whether the failure is DNS or host resolution versus an actual Telegram API response.
3. If the error is in-sandbox DNS resolution, retry with out-of-sandbox `curl`.
4. If `curl` works but Python does not, trust `curl` and record the Python TLS issue as local environment noise, not a Telegram outage.
5. When delivery succeeds, record the working path in automation memory so later runs reuse it.

## Rules

1. Do not turn summaries into ledgers unless the workflow explicitly calls for that.
2. Keep the message shape stable enough to feel familiar, but flexible enough to match the day.
3. Be honest about uncertainty instead of over-asserting weak interpretations.
