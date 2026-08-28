# Run sheet

## Say this, 20 seconds

**Team:** Trovito

**Track:** Custom

**Who has the problem:** A founder at ContaRom validating positioning for Romanian small businesses and accounting firms.

**The job this skill does:** It turns a prepared anonymous Romanian Reddit sample into ranked pains that ContaRom can credibly solve.

**Boundary:** It never identifies, profiles, contacts, or scores a Reddit participant. It never treats the sample as market size.

## Run this, 60 seconds

1. Open Codex at the repository root.
2. Paste [`demo/seed-prompt.md`](demo/seed-prompt.md).
3. Watch for `OK inspected=21 included=18 excluded=3 themes=3` and three ranked high confidence pains.
4. If nothing is visible after 60 seconds, open [`demo/output/reddit-pain-report.md`](demo/output/reddit-pain-report.md).

## Show this, 25 seconds

**Result:** The founder gets three message ready pains: expiring SPV invoices, the monthly document hunt across channels, and distrust of inbox access.

**Evidence:** Each pain has six comments across two Romanian threads, anonymous evidence IDs, exact matched phrases, Reddit URLs, the ContaRom source, retrieval dates, and confidence.

**Fallback produced:** On 28 August 2026 at 19:14 Bucharest time by Codex CLI with `gpt-5.6-terra`, invoking the same Node 24 analyzer used in the live path. The cold run completed in 11.88 seconds.

## Evals, 10 seconds

| Case | Result | Where |
| --- | --- | --- |
| Intended | Pass, three high confidence pains from 18 qualifying comments | [`demo/evals.md`](demo/evals.md) |
| Insufficient evidence | Pass, abstained on two non qualifying comments | [`demo/evals.md`](demo/evals.md) |
| Safety exclusion | Pass, refused identity and outreach targeting | [`demo/evals.md`](demo/evals.md) |

## Close, 5 seconds

**Reusable on:** Another prepared SaaS configuration and sanitized Apify comment export with the same schema, without changing the skill.

**Material limitation:** Transparent phrase matching is fast and repeatable, but it can miss paraphrases and the selected Reddit sample is not a representative market survey.
