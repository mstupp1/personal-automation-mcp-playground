---
name: finance-pulse
description: "Use when the user wants a compact spending pulse, proactive trend check, pacing summary, or anomaly-oriented finance digest. On Mondays, switch to a weekly pulse focused on the prior week's patterns and current trajectory."
---

# Finance Pulse

Provide a compact situational-awareness briefing that answers: what needs attention right now, what is running hot or cool, and what trend actually matters.

This is not a ledger and it is not a full financial plan. The goal is a short, useful pulse that surfaces only the signals worth reading.

## Workflow

1. Read `skills/finance-base/SKILL.md` first for shared communication, formatting, delivery, and profile rules.

2. Read `skills/user-profile.md` first. Respect any preferences about categories, thresholds, tone, or things the user does not want flagged.

3. Use the user's local timezone.

4. Determine the mode from the current day in the user's timezone:
   - Tuesday through Sunday: normal pulse
   - Monday: weekly pulse for the prior Monday through Sunday, plus current month context

5. Pull current-month transactions with `get_transactions`.
   Use:
   - `start_date` = first day of the current month
   - `end_date` = today
   - `exclude_deleted` = true
   - `exclude_excluded` = true
   - `exclude_transfers` = true
   - a high enough `limit` to avoid truncation

6. Pull comparison history with `get_transactions` for the prior 90 days using the same filters.

7. Pull recurring and subscription context with `get_recurring_transactions`.

8. Pull goals with `get_goals` and budgets with `get_budgets` when that data is available and relevant. Use it to improve pacing or obligation context, but do not invent precision if the profile is incomplete.

9. Do arithmetic in the shell for category comparisons, weekly comparisons, anomaly counts, or pacing math. Do not do multi-step aggregation mentally.

## What This Skill Should Answer

Normal daily pulse:
- Is spending broadly on track or drifting?
- Which category or behavior is the main driver?
- Is there anything unusual or newly worth attention?
- What is the single most useful takeaway right now?

Monday weekly pulse:
- How did last week compare with recent weeks?
- Which categories drove the week?
- Is the month developing in a way that deserves attention?
- What changed versus the recent norm?

## Core Inputs

Always compute:
- Month-to-date spend total
- Month-to-date discretionary-heavy categories, especially categories the user cares about
- A comparison against recent baseline using the prior 90 days
- Any notable new, unknown, or recurring-looking charges that seem worth mentioning
- Pending transaction count if pending items materially affect the picture

Also compute category trend signals where possible:
- Current month category spend versus a recent rolling baseline
- Current week or last week versus recent weekly pattern

## Trend Logic

Prefer simple, defensible heuristics over fake precision.

Category spike defaults:
- Stable categories: flag when >20% above baseline and at least $25 higher
- Medium-variance categories like groceries: flag when >50% above baseline and at least $25 higher
- High-variance categories like dining or entertainment: flag when >100% above baseline and at least $40 higher

Use judgment. If the data is thin or noisy, downgrade the claim.

Good examples of worthwhile pulse signals:
- Dining is running hot early in the month
- Groceries look normal, but frequency is up
- A recurring charge changed amount
- A new merchant appeared that does not fit a known pattern
- Last week was normal overall, but convenience spending crept up

Do not surface low-signal noise just because a number moved.

## Recurring And Anomaly Checks

When useful, look for:
- New recurring-looking charges not already tracked
- Price drift on recurring charges
- Unknown merchants that do not match a familiar pattern
- Duplicate-looking charges

Prioritize:
- Tier 1: always surface if credible
  - duplicate-looking charges
  - recurring amount changes
  - genuinely unfamiliar or suspicious merchants
- Tier 2: surface selectively
  - category pace warnings
  - unknown merchants with low confidence
- Tier 3: digest only
  - mild spending drift

Keep false positives low. If you are not confident, soften the wording or omit it.

## Monday Mode

If the current day is Monday in the user's timezone, switch to a weekly pulse.

In Monday mode:
- Analyze the prior Monday through Sunday as the finished week
- Compare that week against the last 4 completed weeks
- Also include a light month-to-date perspective if it adds signal
- Focus on weekly shape and trend, not on Sunday details

Compute:
- Last week's total spend
- Last week's transaction count
- Top 1-3 category drivers
- Any noteworthy large charge
- Essential versus discretionary mix if it helps explain the week
- Comparison versus recent weekly baseline

Monday mode should feel like a weekly briefing:
- what happened
- whether it matters
- whether the current month is starting to drift

## Output Style

This skill is read-only by default.

The message should usually fit in 5-9 lines and contain:
- a simple Copilot Money heading
- one headline judgment
- one comparison or pacing sentence
- 1-3 short bullets or short lines for the key signals
- one takeaway only if it matters

Good pulse labels:
- `on track`
- `drifting`
- `running hot`
- `calm`
- `mixed`

Avoid labels that sound overly dramatic unless the data supports it.

## Message Rules

Do:
- Be selective
- Surface 1-3 meaningful signals, not a dashboard dump
- Prefer prospective framing when possible, like what is starting to drift or what needs watching
- Mention exact merchants only when they explain the signal
- Use plain lists when listing helps clarity
- Stay conversational when bullets are not necessary

Do not:
- List routine categories just to fill space
- Pretend to know free cash flow if the necessary profile data is not there
- Force a warning every time
- Repeat the same category commentary if nothing material changed

## Output Template

Use this structure and adapt it to the data:

```text
Copilot Money Pulse

You're [on track/drifting/running hot/calm]: [short headline with the main signal].

[One comparison or pacing line.]

- [Key signal 1]
- [Key signal 2]
- [Optional key signal 3]

[Optional meaningful takeaway]
```

In Monday mode, use this structure instead:

```text
Copilot Money Weekly Pulse

Last week was [on track/drifting/running hot/calm]: [short headline with the main weekly signal].

[One weekly comparison line.]

- [Main driver or category trend]
- [Second notable pattern or anomaly]
- [Optional month-to-date context]

[Optional meaningful takeaway]
```

Formatting guidance:
- Use bullets only when they improve scanability
- If a single short paragraph is cleaner, use that instead
- If emojis help, use them according to `skills/finance-base/SKILL.md`

## Rules

1. This is a situational-awareness skill, not a spending ledger.
2. Keep the pulse short enough to read in under 30 seconds.
3. Prefer category and trend explanations over raw transaction dumps.
4. Monday mode should emphasize weekly patterns and month trajectory.
5. If nothing stands out, say so plainly rather than manufacturing drama.
