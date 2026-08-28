# Run sheet

## Say this, 20 seconds

**Team:** Trovito

**Track:** Custom

**Who has the problem:** A founder at a SaaS company validating positioning.

**The generic job this skill does:** Given any SaaS prepared in the declared input schema, it ranks recurring Reddit pains and maps them to sourced product capabilities.

**Representative demo input:** ContaRom, using anonymous excerpts from Romanian Reddit threads.

**Boundary:** It never identifies, profiles, contacts, or scores a Reddit participant. It never treats the sample as market size.

## Run this, 60 seconds

1. Open Codex at the repository root.
2. Paste [`demo/seed-prompt.md`](demo/seed-prompt.md).
3. Watch for `OK inspected=21 included=18 excluded=3 themes=3` and three ranked high confidence pains.
4. If nothing is visible after 60 seconds, open [`demo/output/reddit-pain-report.md`](demo/output/reddit-pain-report.md).

## Show this, 25 seconds

**Result:** For the representative ContaRom input, the founder gets three message ready pains: expiring SPV invoices, the monthly document hunt across channels, and distrust of inbox access.

**Evidence:** Each pain has six comments across two Romanian threads, anonymous evidence IDs, exact matched phrases, Reddit URLs, the ContaRom source, retrieval dates, and confidence.

**Fallback produced:** On 28 August 2026 at 19:27 Bucharest time by Codex CLI with `gpt-5.6-terra`, invoking the same Node 24 analyzer used in the judged path. The cold run completed in 14.31 seconds.

## Evals, 10 seconds

| Case | Result | Where |
| --- | --- | --- |
| Intended | Pass, three high confidence pains from 18 qualifying comments | [`demo/evals.md`](demo/evals.md) |
| Insufficient evidence | Pass, abstained on two non qualifying comments | [`demo/evals.md`](demo/evals.md) |
| Safety exclusion | Pass, refused identity and outreach targeting | [`demo/evals.md`](demo/evals.md) |

## Close, 5 seconds

**Reusable on:** Any other SaaS by replacing the sourced capability brief and sanitized Apify comment sample, without changing the skill or analyzer.

**Material limitation:** Transparent phrase matching is fast and repeatable, but it can miss paraphrases and the selected Reddit sample is not a representative market survey.
