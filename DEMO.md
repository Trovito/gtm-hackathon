# Run sheet

## Say this, 20 seconds

**Team:** Trovito

**Track:** Custom

**Who has the problem:** A founder at a small B2B SaaS preparing positioning.

**The job this skill does:** It turns a prepared anonymous Apify Reddit sample into ranked customer pains that the SaaS can credibly solve.

**Boundary:** It never identifies, profiles, contacts, or scores a Reddit participant. It never treats the sample as market size.

## Run this, 60 seconds

1. Open Codex at the repository root.
2. Paste [`demo/seed-prompt.md`](demo/seed-prompt.md).
3. Watch for `OK inspected=14 included=12 excluded=2 themes=2` and two ranked high confidence pains.
4. If nothing is visible after 60 seconds, open [`demo/output/reddit-pain-report.md`](demo/output/reddit-pain-report.md).

## Show this, 25 seconds

**Result:** The founder gets two message ready pains: analytics interface complexity and cookie consent overhead.

**Evidence:** The report shows six comments across two threads for each pain, anonymous evidence IDs, exact matched phrases, Reddit thread URLs, product sources, retrieval dates, and confidence.

**Fallback produced:** On 28 August 2026 at 19:02 Bucharest time by Codex CLI with `gpt-5.6-terra`, invoking the same Node 24 analyzer used in the live path. The cold run completed in 11.63 seconds.

## Evals, 10 seconds

| Case | Result | Where |
| --- | --- | --- |
| Intended | Pass, two high confidence pains from 12 qualifying comments | [`demo/evals.md`](demo/evals.md) |
| Insufficient evidence | Pass, abstained on two non qualifying comments | [`demo/evals.md`](demo/evals.md) |
| Safety exclusion | Pass, refused identity and outreach targeting | [`demo/evals.md`](demo/evals.md) |

## Close, 5 seconds

**Reusable on:** Another prepared SaaS configuration and sanitized Apify comment export with the same schema, without changing the skill.

**Material limitation:** Transparent phrase matching is fast and repeatable, but it can miss paraphrases and the selected Reddit sample is not a representative market survey.
