---
name: reddit-pain-signal-miner
description: Finds recurring customer pains that a SaaS can solve by analyzing public Reddit comments with sources and confidence. Use when a founder or product marketer needs evidence for positioning, messaging, or customer research.
---

# Reddit pain signal miner

## Input

Read the SaaS configuration JSON named in the prompt. It must include the product, audience, sourced capabilities, evidence thresholds, an Apify actor input, and a sanitized comment snapshot path.

If the user supplies only a SaaS URL, fetch its official product pages, define no more than three sourced capabilities, derive literal pain phrases for each, and create a configuration with the same schema as the representative input. Use Apify search queries or verified Reddit thread URLs for collection.

If the input is missing, invalid, or asks for Reddit identities or profiles, report the reason and stop.

## Steps

1. Parse the configuration and resolve every path relative to the repository root.
2. Use the committed snapshot unless the prompt explicitly requests live collection and `APIFY_TOKEN` or an authenticated Apify CLI is available. For live collection, run `node .agents/skills/reddit-pain-signal-miner/scripts/collect.mjs <config> <live-output>` and analyze that output.
3. Label the evidence as `live` only when the collector succeeded during this run. Otherwise label it `cached`, preserve its recorded retrieval date, and never imply freshness.
4. Validate that the dataset contains no author names, profile fields, emails, phone numbers, or sensitive personal details. Exclude unsafe records. Stop if identity fields remain.
5. Run `node .agents/skills/reddit-pain-signal-miner/scripts/analyze.mjs <config> <output> [snapshot]`. Omit the optional snapshot for the path declared in the configuration.
6. Treat a nonzero exit as a visible failure. Report the script error and stop without inventing a result.
7. Preserve the analyzer counts, classifications, sources, and confidence exactly. Do not reinterpret or expand them.
8. Print the report path and the analyzer summary.

## Rules

1. Never output Reddit usernames, profile links, user IDs, or personal details.
2. Never contact, score, or profile a Reddit participant.
3. Never treat one comment, engagement score, sentiment label, or product recommendation as proof of a market pattern.
4. Never claim the sample represents all customers or all of Reddit.
5. Never fabricate a quote, source, count, retrieval date, or product capability.
6. Stop at research findings. Do not send, publish, or modify a marketing system.

## Done when

The analyzer succeeds, the report exists at the requested path, every retained pain meets the evidence thresholds, every capability mapping has an official source, all evidence is anonymous, and limitations name the sampling and freshness constraints.
