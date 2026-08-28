#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { spawn } from "node:child_process"

const ACTOR_API = "https://api.apify.com/v2/acts"

function requiredObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`)
  }
  return value
}

function cleanText(value) {
  return value
    .replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "[link removed]")
    .replace(/\b(?:[\w-]+\.)+(?:ai|app|com|dev|io|net|org)\b/gi, "[site removed]")
    .replace(/\s+/g, " ")
    .trim()
}

function hasSensitiveText(value) {
  const patterns = [
    /\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b/,
    /\b(?:\+?\d[\d\s().-]{7,}\d)\b/,
    /\b(?:linkedin\.com\/in|facebook\.com\/profile|instagram\.com\/)[^\s]*/i,
    /\b(?:my full name is|my address is|call me at|text me at)\b/i,
    /\b(?:linkedin|connection request|recruiter interest|engineering blog)\b/i,
  ]
  return patterns.some((pattern) => pattern.test(value))
}

function asThreadUrl(item, posts) {
  if (typeof item.postUrl === "string" && item.postUrl.startsWith("https://www.reddit.com/")) {
    return item.postUrl
  }
  const post = posts.get(String(item.postId ?? "").replace(/^t3_/, ""))
  if (post) return post.canonical_url ?? post.url ?? null
  return null
}

function parseDatasetOutput(value) {
  const clean = value.replace(/\u001b\[[0-9;]*m/g, "").trim()
  const isDataset = (parsed) =>
    Array.isArray(parsed) &&
    parsed.some((item) => item && ["post", "comment"].includes(item.kind ?? item.type))
  try {
    const parsed = JSON.parse(clean)
    if (Array.isArray(parsed) && (parsed.length === 0 || isDataset(parsed))) return parsed
  } catch {
    // Continue to framed array detection.
  }

  for (let start = clean.indexOf("["); start >= 0; start = clean.indexOf("[", start + 1)) {
    let depth = 0
    let inString = false
    let escaped = false

    for (let index = start; index < clean.length; index += 1) {
      const character = clean[index]
      if (inString) {
        if (escaped) escaped = false
        else if (character === "\\") escaped = true
        else if (character === '"') inString = false
        continue
      }
      if (character === '"') {
        inString = true
        continue
      }
      if (character === "[") depth += 1
      if (character !== "]") continue
      depth -= 1
      if (depth !== 0) continue

      try {
        const parsed = JSON.parse(clean.slice(start, index + 1))
        if (isDataset(parsed)) return parsed
      } catch {
        break
      }
    }
  }
  throw new Error("Apify CLI did not return a valid JSON dataset array")
}

async function collectWithApi(token, actorId, actorInput) {
  const endpoint = `${ACTOR_API}/${actorId}/run-sync-get-dataset-items?format=json&clean=true&timeout=120`
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(actorInput),
    signal: AbortSignal.timeout(130_000),
  })

  if (!response.ok) {
    const detail = (await response.text()).replace(/\s+/g, " ").slice(0, 300)
    throw new Error(`Apify returned HTTP ${response.status}: ${detail}`)
  }
  return response.json()
}

function collectWithCli(actorId, actorInput) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(
      "apify",
      ["call", actorId, "--input-file", "-", "--output-dataset", "--silent", "--timeout", "120"],
      { stdio: ["pipe", "pipe", "pipe"] },
    )
    let stdout = ""
    let stderr = ""

    child.stdout.on("data", (chunk) => {
      stdout += chunk
    })
    child.stderr.on("data", (chunk) => {
      stderr += chunk
    })
    child.on("error", () => {
      reject(new Error("Neither APIFY_TOKEN nor an authenticated Apify CLI is available"))
    })
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Apify CLI failed: ${stderr.replace(/\s+/g, " ").slice(0, 300)}`))
        return
      }
      try {
        resolvePromise(parseDatasetOutput(stdout))
      } catch (error) {
        reject(error)
      }
    })
    child.stdin.end(JSON.stringify(actorInput))
  })
}

async function main() {
  const [configArg, outputArg, datasetArg] = process.argv.slice(2)
  if (!configArg || !outputArg) {
    throw new Error("Usage: collect.mjs <config.json> <output.json> [actor-dataset.json]")
  }

  const configPath = resolve(configArg)
  const outputPath = resolve(outputArg)
  const config = requiredObject(JSON.parse(await readFile(configPath, "utf8")), "config")
  const apify = requiredObject(config.apify, "config.apify")
  const actorInput = requiredObject(apify.input, "config.apify.input")

  if (typeof apify.actor_id !== "string" || !/^[A-Za-z0-9]+$/.test(apify.actor_id)) {
    throw new Error("config.apify.actor_id is invalid")
  }

  const urlSeedCount = Array.isArray(actorInput.urls) ? actorInput.urls.length : 0
  const querySeedCount = Array.isArray(actorInput.queries) ? actorInput.queries.length : 0
  const seedCount = urlSeedCount > 0 ? urlSeedCount : querySeedCount
  const maxPosts = Number(actorInput.maxPosts)
  const maxComments = actorInput.scrapeComments ? Number(actorInput.maxComments) : 0
  const estimatedMaximumRecords = seedCount * maxPosts * (maxComments + 1)
  if (
    !Number.isInteger(seedCount) ||
    seedCount < 1 ||
    !Number.isInteger(maxPosts) ||
    maxPosts < 1 ||
    !Number.isInteger(maxComments) ||
    maxComments < 0 ||
    estimatedMaximumRecords > 500
  ) {
    throw new Error("Apify input must define a positive bounded run with at most 500 estimated records")
  }

  const records = datasetArg
    ? JSON.parse(await readFile(resolve(datasetArg), "utf8"))
    : process.env.APIFY_TOKEN
      ? await collectWithApi(process.env.APIFY_TOKEN, apify.actor_id, actorInput)
      : await collectWithCli(apify.actor_id, actorInput)
  if (!Array.isArray(records)) {
    throw new Error("Apify did not return a dataset item array")
  }

  const posts = new Map(
    records
      .filter((item) => (item.kind ?? item.type) === "post" && item.id)
      .map((item) => [String(item.id), item]),
  )

  const limit = Number(config.research?.max_comments ?? 30)
  const candidatesByThread = new Map()
  let excludedCount = 0
  const seen = new Set()

  for (const item of records) {
    if ((item.kind ?? item.type) !== "comment") continue
    const body = typeof item.body === "string" ? item.body.trim() : ""
    const author = typeof item.author === "string" ? item.author : ""
    const threadUrl = asThreadUrl(item, posts)
    const unsafe =
      !body ||
      body === "[deleted]" ||
      body === "[removed]" ||
      item.is_deleted_or_removed === true ||
      /bot$/i.test(author) ||
      author === "AutoModerator" ||
      body.length < 20 ||
      body.length > 1200 ||
      hasSensitiveText(body) ||
      !threadUrl

    if (unsafe) {
      excludedCount += 1
      continue
    }

    const text = cleanText(body)
    if (text.length < 20 || /^\[(?:link|site) removed\]$/.test(text)) {
      excludedCount += 1
      continue
    }
    const key = `${threadUrl}\n${text}`
    if (seen.has(key)) {
      excludedCount += 1
      continue
    }
    seen.add(key)

    const candidate = {
      text,
      thread_url: threadUrl,
      subreddit: item.subreddit ?? null,
      created_at: item.created_utc ?? null,
      retrieved_at: item.retrieved_at ?? new Date().toISOString(),
      score_at_collection: Number.isFinite(item.score) ? item.score : null,
    }
    const threadCandidates = candidatesByThread.get(threadUrl) ?? []
    threadCandidates.push(candidate)
    candidatesByThread.set(threadUrl, threadCandidates)
  }

  const comments = []
  const queues = [...candidatesByThread.values()]
  while (comments.length < limit && queues.some((queue) => queue.length > 0)) {
    for (const queue of queues) {
      const candidate = queue.shift()
      if (!candidate) continue
      comments.push({
        evidence_id: `C${String(comments.length + 1).padStart(3, "0")}`,
        ...candidate,
      })
      if (comments.length >= limit) break
    }
  }

  const output = {
    schema_version: 1,
    collection: {
      status: "live",
      provider: "Apify",
      actor_id: apify.actor_id,
      actor_url: apify.actor_url,
      retrieved_at: new Date().toISOString(),
      authors_removed: true,
      privacy_review_required_before_commit: true,
      records_received: records.length,
      records_excluded_automatically: excludedCount,
      eligible_records_not_sampled: [...candidatesByThread.values()].reduce(
        (sum, queue) => sum + queue.length,
        0,
      ),
    },
    comments,
  }

  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8")
  console.log(`Wrote ${comments.length} anonymous comments to ${outputPath}`)
  console.log("Review the file for personal data before using or committing it.")
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
