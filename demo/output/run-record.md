# Run record

## Collection

On 28 August 2026, Apify actor `TwqHBuZZPHJxiQrTU` ran against the three Reddit thread URLs in `demo/input/plausible/saas.json`.

The actor returned 69 records, including 66 comments. The zero dependency collector removed author fields, profile fields, contact patterns, deleted content, bot content, duplicate content, and oversized comments. A manual privacy review completed at 18:17 Bucharest time.

The committed demo input contains 14 anonymous comments. Twelve are intended evidence and two are contrast records that should be excluded. The raw actor dataset is not committed.

## Intended run

At 19:02 Bucharest time, OpenAI Codex CLI 0.150.0 alpha 12.2 with `gpt-5.6-terra` received `demo/seed-prompt.md`.

The cold run completed in 11.63 seconds and invoked the analyzer exactly once. It used only committed local input and made no network or Apify call.

```text
OK inspected=14 included=12 excluded=2 themes=2
1. Analytics interface complexity and reporting workarounds | 6 comments | 2 threads | High
2. Cookie consent and privacy overhead | 6 comments | 2 threads | High
```

The resulting artifact is `demo/output/reddit-pain-report.md`.

## Negative cases

At 18:35 Bucharest time, the same Codex version invoked the analyzer once for each negative case.

```text
INSUFFICIENT inspected=2 included=0 threads=0
REFUSED identity request.
```

The resulting artifacts are in `demo/output/evals/`.
