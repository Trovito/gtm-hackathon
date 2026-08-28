---
name: reddit-pain-signal-miner
description: Produces a sourced SaaS pain report from a prepared anonymous Apify Reddit comment sample. Use when a founder or product marketer needs fast evidence for positioning or messaging.
---

# Reddit pain signal miner

## Input

Use the input directory named in the prompt. It must contain `saas.json` with sourced capabilities and thresholds, plus the anonymous comment snapshot declared by that configuration.

## Steps

1. Run `node .agents/skills/reddit-pain-signal-miner/scripts/analyze.mjs <input-directory>/saas.json <output-path>` exactly once.
2. Do not fetch URLs, search Reddit, call Apify, inspect unrelated files, or perform a second analysis.
3. Treat a nonzero exit as a visible failure. Report the error and stop.
4. Print the analyzer output unchanged.

## Rules

1. Never output Reddit usernames, profile links, user IDs, or personal details.
2. Never contact, score, or profile a Reddit participant.
3. Never describe cached evidence as live or representative of the market.
4. Never alter the analyzer counts, sources, classifications, or confidence.

## Done when

The analyzer succeeds, the report exists at the requested path, and its summary is printed unchanged.
