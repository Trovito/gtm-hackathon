# Input

`contarom/saas.json` is the representative SaaS configuration. It contains sourced product capabilities, evidence thresholds, the Apify actor input, and the committed snapshot path. Collection is a preparation step and is not part of the timed demo.

`contarom/reddit-comments.json` is a privacy reviewed sample from an Apify run completed on 28 August 2026. The actor returned 123 records, including 117 comments from six verified Romanian threads. The collector removed identity fields and unsafe records. Twenty one short anonymous verbatim excerpts were retained for the demo.

To use another SaaS without changing the skill:

1. Copy the configuration and replace the product, audience, official capability sources, pain names, literal pain signals, and message hypotheses.
2. Set the Apify actor input to relevant search queries or verified Reddit thread URLs.
3. Run `node .agents/skills/reddit-pain-signal-miner/scripts/collect.mjs <config> <output>`.
4. Review the output for personal data before committing any snapshot.
5. Run `node .agents/skills/reddit-pain-signal-miner/scripts/analyze.mjs <config> <report> [snapshot]`.

The collector accepts either `APIFY_TOKEN` or an authenticated Apify CLI. The analyzer needs only Node 24 and local files.
