#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"

function asObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`)
  }
  return value
}

function asArray(value, label) {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`)
  return value
}

function asPositiveInteger(value, label) {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${label} must be a positive integer`)
  }
  return value
}

function normalize(value) {
  return value.toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim()
}

function cell(value) {
  return String(value).replace(/\|/g, "\\|").replace(/\s+/g, " ").trim()
}

function matchedPhrase(value, signals) {
  const compact = value.replace(/\s+/g, " ").trim()
  const searchable = normalize(compact)
  const signal = signals.find((candidate) => searchable.includes(candidate))
  if (!signal) return compact.slice(0, 80)
  const index = searchable.indexOf(signal)
  return compact.slice(index, index + signal.length)
}

function confidence(commentCount, threadCount) {
  if (commentCount >= 6 && threadCount >= 2) return "High"
  if (commentCount >= 3 && threadCount >= 2) return "Medium"
  return "Low"
}

async function writeOutput(path, text) {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${text.trim()}\n`, "utf8")
}

async function main() {
  const [configArg, outputArg, snapshotArg] = process.argv.slice(2)
  if (!configArg || !outputArg) {
    throw new Error("Usage: analyze.mjs <config.json> <output.md> [snapshot.json]")
  }

  const configPath = resolve(configArg)
  const outputPath = resolve(outputArg)
  const config = asObject(JSON.parse(await readFile(configPath, "utf8")), "config")
  const research = asObject(config.research, "config.research")
  const snapshotPath = resolve(snapshotArg ?? research.snapshot_path)
  const snapshot = asObject(JSON.parse(await readFile(snapshotPath, "utf8")), "snapshot")

  if (typeof snapshot.request === "string" && /\b(author|identity|profile|username|outreach prospect)\b/i.test(snapshot.request)) {
    await writeOutput(
      outputPath,
      `# Safety refusal

The request was refused because it asks for Reddit identities, profiles, or individual outreach targeting.

This skill only produces anonymous aggregate pain research. It did not inspect or output any participant identity.`,
    )
    console.log(`REFUSED identity request. Wrote ${outputPath}`)
    return
  }

  const collection = asObject(snapshot.collection, "snapshot.collection")
  const comments = asArray(snapshot.comments, "snapshot.comments")
  const capabilities = asArray(config.saas?.capabilities, "config.saas.capabilities")
  const minimumComments = asPositiveInteger(
    research.minimum_included_comments,
    "research.minimum_included_comments",
  )
  const minimumThreads = asPositiveInteger(
    research.minimum_distinct_threads,
    "research.minimum_distinct_threads",
  )
  const themeMinimumComments = asPositiveInteger(
    research.theme_minimum_comments,
    "research.theme_minimum_comments",
  )
  const themeMinimumThreads = asPositiveInteger(
    research.theme_minimum_threads,
    "research.theme_minimum_threads",
  )
  const maximumThemes = asPositiveInteger(research.maximum_themes, "research.maximum_themes")

  const forbiddenKeys = /^(?:author|author_id|profile|profile_url|user|user_id|username)$/i
  const sensitiveText = /\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b|\b(?:linkedin\.com\/in|facebook\.com\/profile)\b|\b(?:\+?\d[\d\s().-]{7,}\d)\b/i

  for (const [index, comment] of comments.entries()) {
    asObject(comment, `snapshot.comments[${index}]`)
    const badKey = Object.keys(comment).find((key) => forbiddenKeys.test(key))
    if (badKey) throw new Error(`Unsafe identity field in comment ${index + 1}: ${badKey}`)
    if (typeof comment.text !== "string" || !comment.text.trim()) {
      throw new Error(`Comment ${index + 1} has no text`)
    }
    if (sensitiveText.test(comment.text)) {
      throw new Error(`Possible personal data in comment ${comment.evidence_id ?? index + 1}`)
    }
    if (typeof comment.thread_url !== "string" || !comment.thread_url.startsWith("https://www.reddit.com/")) {
      throw new Error(`Comment ${comment.evidence_id ?? index + 1} has no public Reddit thread URL`)
    }
  }

  const definitions = capabilities.map((capability, index) => {
    const item = asObject(capability, `capability ${index + 1}`)
    const signals = asArray(item.pain_signals, `capability ${index + 1}.pain_signals`)
      .map((signal) => normalize(String(signal)))
      .filter(Boolean)
    if (!item.pain_name || !item.name || !item.source_url || !item.retrieved_at || signals.length === 0) {
      throw new Error(`Capability ${index + 1} is missing analysis fields or a source`)
    }
    return { ...item, signals }
  })

  const groups = new Map(definitions.map((definition) => [definition.pain_name, []]))
  const excluded = []

  for (const comment of comments) {
    const text = normalize(comment.text)
    const matches = definitions
      .map((definition) => ({
        definition,
        hits: definition.signals.filter((signal) => text.includes(signal)).length,
      }))
      .filter((match) => match.hits > 0)
      .sort((a, b) => b.hits - a.hits)

    if (matches.length === 0) {
      excluded.push(comment)
      continue
    }
    groups.get(matches[0].definition.pain_name).push(comment)
  }

  const included = [...groups.values()].flat()
  const includedThreads = new Set(included.map((comment) => comment.thread_url))
  if (included.length < minimumComments || includedThreads.size < minimumThreads) {
    const text = `# Insufficient evidence

**SaaS:** ${config.saas.name}

**Evidence status:** ${collection.status}

Inspected ${comments.length} anonymous comments. ${included.length} matched a supported pain across ${includedThreads.size} distinct threads.

The configured minimum is ${minimumComments} comments across ${minimumThreads} threads. No pain finding was produced.

**Source:** ${collection.source_url ?? collection.actor_url ?? "Source recorded in the input"}

**Retrieved:** ${collection.retrieved_at}

This is an abstention, not evidence that the pain is absent.`
    await writeOutput(outputPath, text)
    console.log(`INSUFFICIENT inspected=${comments.length} included=${included.length} threads=${includedThreads.size}`)
    console.log(`Wrote ${outputPath}`)
    return
  }

  const themes = definitions
    .map((definition) => {
      const evidence = groups.get(definition.pain_name)
      const threads = new Set(evidence.map((comment) => comment.thread_url))
      return { definition, evidence, threadCount: threads.size }
    })
    .filter(
      (theme) =>
        theme.evidence.length >= themeMinimumComments &&
        theme.threadCount >= themeMinimumThreads &&
        confidence(theme.evidence.length, theme.threadCount) !== "Low",
    )
    .sort((a, b) => b.evidence.length - a.evidence.length)
    .slice(0, maximumThemes)

  if (themes.length === 0) {
    const text = `# Insufficient evidence

**SaaS:** ${config.saas.name}

**Evidence status:** ${collection.status}

Inspected ${comments.length} anonymous comments. ${included.length} matched a supported pain across ${includedThreads.size} distinct threads, but no single pain met the required ${themeMinimumComments} comments across ${themeMinimumThreads} threads.

No pain finding was produced.

**Source:** ${collection.source_url ?? collection.actor_url ?? "Source recorded in the input"}

**Retrieved:** ${collection.retrieved_at}

This is an abstention, not evidence that the pain is absent.`
    await writeOutput(outputPath, text)
    console.log(
      `INSUFFICIENT inspected=${comments.length} included=${included.length} themes=0`,
    )
    console.log(`Wrote ${outputPath}`)
    return
  }

  const sourceRows = []
  const seenSources = new Set()
  if (collection.actor_url) {
    seenSources.add(collection.actor_url)
    sourceRows.push(
      `Apify collection actor | ${cell(collection.actor_url)} | ${cell(collection.retrieved_at)}`,
    )
  }
  for (const capability of capabilities) {
    if (seenSources.has(capability.source_url)) continue
    seenSources.add(capability.source_url)
    sourceRows.push(
      `Product claim | ${cell(capability.source_url)} | ${cell(capability.retrieved_at)}`,
    )
  }
  for (const comment of comments) {
    if (seenSources.has(comment.thread_url)) continue
    seenSources.add(comment.thread_url)
    sourceRows.push(
      `Reddit thread | ${cell(comment.thread_url)} | ${cell(comment.retrieved_at ?? collection.retrieved_at)}`,
    )
  }

  const rankingRows = themes.map((theme, index) => {
    const item = theme.definition
    return `${index + 1} | ${cell(item.pain_name)} | ${theme.evidence.length} comments, ${theme.threadCount} threads | ${cell(item.name)} | ${confidence(theme.evidence.length, theme.threadCount)}`
  })

  const evidenceParagraphs = themes.map((theme, index) => {
    const item = theme.definition
    const ids = theme.evidence.map((comment) => comment.evidence_id).join(", ")
    const excerpts = theme.evidence
      .slice(0, 6)
      .map((comment) => `“${matchedPhrase(comment.text, item.signals)}” (${comment.evidence_id})`)
      .join(", ")
    return `${index + 1}. **${item.pain_name}.** ${ids}. Examples: ${excerpts}. The mapping is supported by [${item.name}](${item.source_url}). Message hypothesis: ${item.message_hypothesis}`
  })

  const excludedIds = excluded.map((comment) => comment.evidence_id).join(", ") || "None"
  const report = `# Reddit pain signal report

**SaaS:** ${config.saas.name}

**Research user:** ${research.user}

**Evidence:** ${collection.status} sanitized Apify snapshot, retrieved ${collection.retrieved_at}

## Method

Matched transparent pain phrases from sourced SaaS capabilities against each anonymous comment. Inspected ${comments.length}, included ${included.length}, and excluded ${excluded.length}. Findings require ${themeMinimumComments} comments across ${themeMinimumThreads} threads.

## Sources

Type | URL | Retrieved
--- | --- | ---
${sourceRows.join("\n")}

## Ranked pains

Rank | Pain | Support | SaaS capability | Confidence
--- | --- | --- | --- | ---
${rankingRows.join("\n")}

## Evidence and message implications

${evidenceParagraphs.join("\n\n")}

## Exclusions and limitations

Excluded ${excluded.length} records with no supported pain phrase: ${excludedIds}. No identity fields were present.

This selected cached sample does not represent all customers or Reddit. Phrase matching can miss paraphrases. Product mappings use the supplied official claims and do not prove purchase intent or market size.${research.domain_disclaimer ? `\n\n${research.domain_disclaimer}` : ""}`

  await writeOutput(outputPath, report)
  console.log(
    `OK inspected=${comments.length} included=${included.length} excluded=${excluded.length} themes=${themes.length}`,
  )
  for (const [index, theme] of themes.entries()) {
    console.log(
      `${index + 1}. ${theme.definition.pain_name} | ${theme.evidence.length} comments | ${theme.threadCount} threads | ${confidence(theme.evidence.length, theme.threadCount)}`,
    )
  }
  console.log(`Wrote ${outputPath}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
