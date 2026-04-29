---
name: finance-pulse
description: "Use when the user wants a compact spending pulse, proactive trend check, pacing summary, or anomaly-oriented finance digest. Run the full weekly version only on Mondays; on other days, send only a brief delta update or omit it when there is no new signal."
---

# Finance Pulse

Provide a compact situational-awareness briefing that answers: what needs attention right now, what is running hot or cool, and what trend actually matters.

This is not a ledger and it is not a full financial plan. The goal is a short, useful pulse that surfaces only the signals worth reading.

## Workflow

1. Read `skills/finance-base/SKILL.md` first for shared communication, formatting, delivery, and profile rules.

2. Read `skills/user-profile.md` first. Respect any preferences about categories, thresholds, tone, or things the user does not want flagged.

3. Use the user's local timezone.

4. Determine the mode from the current day in the user's timezone:
   - Monday: weekly pulse for the prior Monday through Sunday, plus current month context
   - Tuesday through Sunday: brief pulse only, focused on new or changed signals since the last useful read

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

9. Use spend-only comparison baselines for category and weekly trend checks.
   - Exclude credits, refunds, and other negative amounts from spend baselines unless the user explicitly wants net-flow framing
   - Compare current category spend against recent category spend, not against mixed net totals
   - If a baseline is thin, noisy, or distorted by one-off reimbursements, soften the wording

10. Cross-check recurring context before treating a charge as a signal.
   - Known recurring charges that post on expected timing and amount are context, not alerts
   - Recurring charges become pulse-worthy when amount, timing, or category behavior materially changed

11. Do arithmetic in the shell for category comparisons, weekly comparisons, anomaly counts, or pacing math. Do not do multi-step aggregation mentally.

## What This Skill Should Answer

Tuesday through Sunday brief pulse:
- Is there any genuinely new insight since the last useful pulse?
- Did a category, merchant, recurring charge, or anomaly materially change?
- If there is no new signal, should the pulse be omitted entirely?

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
- A light budget-pressure check for categories that are already over budget or unusually far along for this point in the month

On Tuesday through Sunday, only surface these if they represent a real change or a clearly new signal. Do not restate stable conditions just to fill space.

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
- Spending is not alarming overall, but one budget category is getting tight earlier than usual

Do not surface low-signal noise just because a number moved.

## Tuesday Through Sunday Mode

If the current day is not Monday in the user's timezone, do not generate the full pulse by default.

In non-Monday mode:
- Prefer a very brief update only when there is a new insight, a meaningful change, or a credible anomaly
- If the picture is materially unchanged, omit the pulse entirely rather than sending a repetitive summary
- Treat this as a delta check, not a daily recap
- Usually mention only 1-2 items, and only if they are new or newly worth attention
- If you omit the pulse, do not add a meta-line explaining that it was omitted

Good reasons to send a non-Monday pulse:
- a recurring charge changed amount
- a duplicate-looking or suspicious charge appeared
- a category crossed from normal into clearly elevated
- a new merchant or pattern materially changed the month trajectory

Good reasons to omit a non-Monday pulse:
- spending remains broadly on track with no new driver
- known categories are behaving as expected
- there are no meaningful anomalies, pacing shifts, or new recurring signals
- budget posture is materially unchanged

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

Known recurring charges that posted normally should not consume one of the limited pulse slots.

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

Monday weekly pulse should usually fit in 5-9 lines and contain:
- a simple Copilot Money heading
- one headline judgment
- one comparison or pacing sentence
- 1-3 short bullets or short lines for the key signals
- one takeaway only if it matters

Tuesday through Sunday brief pulse should usually fit in 2-5 lines and contain only:
- a simple Copilot Money heading if a message is sent
- one short headline or judgment
- at most 1-2 short lines for the new signal
- no filler takeaway

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
- Use budget pressure as supporting context only when it clarifies why a signal matters

Do not:
- List routine categories just to fill space
- Pretend to know free cash flow if the necessary profile data is not there
- Force a warning every time
- Repeat the same category commentary if nothing material changed
- Burn a pulse slot on an expected recurring charge
- Add a budget section when a single phrase would do
- Say that you are omitting the pulse; if there is no new signal, leave it out completely

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

For Tuesday through Sunday, if there is a credible new signal, use a compressed structure like:

```text
Copilot Money Pulse

[Short headline with the new signal.]

- [New or changed signal]
- [Optional second signal]
```

If there is no meaningful new signal on Tuesday through Sunday, omit the pulse entirely.

Formatting guidance:
- Use bullets only when they improve scanability
- If a single short paragraph is cleaner, use that instead
- If emojis help, use them according to `skills/finance-base/SKILL.md`

## Confidence And Quality

Before escalating a pulse signal, check whether confidence is high enough.

Downgrade or omit the signal when:
- the picture depends heavily on pending charges
- the baseline is thin or obviously noisy
- the category signal is driven by `Other` or another likely miscategorized bucket
- the apparent anomaly is explained by a normal recurring charge

When confidence is limited:
- use softer phrasing like `looks elevated`, `starting to drift`, or `so far`
- avoid declaring a durable trend from weak evidence

## Rules

1. This is a situational-awareness skill, not a spending ledger.
2. Keep the pulse short enough to read in under 30 seconds.
3. Prefer category and trend explanations over raw transaction dumps.
4. Monday mode should emphasize weekly patterns and month trajectory.
5. Tuesday through Sunday, omit the pulse entirely if there is no meaningful new insight.
6. If you do send a non-Monday pulse, keep it materially shorter than the Monday weekly version.
7. Use spend-only baselines unless the user explicitly wants net-flow framing.
8. If nothing stands out in Monday mode, say so plainly rather than manufacturing drama.
