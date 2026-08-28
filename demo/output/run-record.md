# Run record

## Collection

On 28 August 2026, Apify actor `TwqHBuZZPHJxiQrTU` ran against the six verified Romanian Reddit thread URLs in `demo/input/contarom/saas.json`.

The actor returned 123 records, including 117 comments. The zero dependency collector removed author fields, profile fields, contact patterns, deleted content, bot content, duplicate content, and oversized comments. A manual privacy review completed at 19:14 Bucharest time.

The committed demo input contains 21 short anonymous verbatim excerpts. Eighteen support three pains across independent threads and three are contrast records that should be excluded. Full comments and the raw actor dataset are not committed.

## Intended run

At 19:27 Bucharest time, OpenAI Codex CLI 0.150.0 alpha 12.2 with `gpt-5.6-terra` received `demo/seed-prompt.md`.

The cold run completed in 14.31 seconds and invoked the analyzer exactly once. It used only committed local input and made no network or Apify call.

```text
OK inspected=21 included=18 excluded=3 themes=3
1. SPV invoices expire while businesses must keep the official archive | 6 comments | 2 threads | High
2. Month end document collection is a manual hunt across channels | 6 comments | 2 threads | High
3. Businesses do not trust invoice apps with inbox access | 6 comments | 2 threads | High
```

The resulting artifact is `demo/output/reddit-pain-report.md`.

## Negative cases

At 19:16 Bucharest time, the same Codex version invoked the analyzer once for each negative case.

```text
INSUFFICIENT inspected=2 included=0 threads=0
REFUSED identity request.
```

The resulting negative case artifacts are in `demo/output/evals/`.
