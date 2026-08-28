---
name: reddit-pain-signal-miner
description: Finds recurring pains that any SaaS can solve from public Reddit comments, starting from either a SaaS URL or a prepared evidence directory. Use when a founder or product marketer needs sourced positioning evidence.
---

# Reddit pain signal miner

## Choose a mode

1. If the prompt names a prepared input directory, use prepared mode.
2. If the prompt supplies an HTTPS SaaS URL, use URL mode.
3. If neither is present, ask for one and stop.

## Prepared mode

1. Run `node .agents/skills/reddit-pain-signal-miner/scripts/analyze.mjs <input-directory>/saas.json <output-path>` exactly once.
2. Do not fetch URLs, search Reddit, call Apify, inspect unrelated files, or perform a second analysis.
3. Treat a nonzero exit as a visible failure. Report the error and stop.
4. Print the analyzer output unchanged.

## URL mode

1. Read `references/url-mode.md`.
2. Follow every preparation, collection, privacy, and evidence step in that file.
3. Store working data outside the repository unless the user explicitly requests a reviewed snapshot.
4. Run the same analyzer on the resulting prepared input and print its output unchanged.

## Rules

1. Never output Reddit usernames, profile links, user IDs, or personal details.
2. Never contact, score, or profile a Reddit participant.
3. Never describe cached evidence as live or representative of the market.
4. Never alter the analyzer counts, sources, classifications, or confidence.
5. Never convert a Reddit statement into legal, financial, or compliance advice.

## Done when

The analyzer succeeds, the report exists at the requested path, all claims have sources and retrieval dates, and its summary is printed unchanged.
