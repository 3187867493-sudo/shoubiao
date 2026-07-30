import { createHash } from "node:crypto"
import { connectLambda, getStore } from "@netlify/blobs"

const TASK_STORE = "qigou-analysis-tasks"
const QUOTA_STORE = "qigou-ai-quotas"

export function getAnalysisStore(event) {
  connectLambda(event)
  return getStore(TASK_STORE)
}

function trustedClientAddress(event) {
  return String(
    event.headers?.["x-nf-client-connection-ip"] ||
    event.headers?.["client-ip"] ||
    "anonymous",
  ).trim()
}

function hashIdentifier(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 24)
}

function anonymousClientIds(event) {
  const address = trustedClientAddress(event)
  const presented = String(event.headers?.["x-qigou-client"] || "").trim()
  const browserId = /^[a-zA-Z0-9-]{16,80}$/.test(presented) ? presented : "shared-browser"
  return {
    clientId: hashIdentifier(`${address}:${browserId}`),
    networkId: hashIdentifier(address),
  }
}

async function consumeBucket(store, key, limit, windowMs, now) {
  const current = await store.get(key, { type: "json" })
  const count = Number(current?.count || 0)
  if (count >= limit) return false
  await store.setJSON(key, {
    count: count + 1,
    updatedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + windowMs * 2).toISOString(),
  })
  return true
}

export async function consumeAiQuota(event, scope, options) {
  connectLambda(event)
  const store = getStore(QUOTA_STORE)
  const now = Date.now()
  const { clientId, networkId } = anonymousClientIds(event)
  const clientBucket = Math.floor(now / options.clientWindowMs)
  const networkWindowMs = options.networkWindowMs || options.clientWindowMs
  const networkBucket = Math.floor(now / networkWindowMs)
  const globalBucket = Math.floor(now / options.globalWindowMs)

  const clientAllowed = await consumeBucket(
    store,
    `${scope}/client/${clientId}/${clientBucket}`,
    options.clientLimit,
    options.clientWindowMs,
    now,
  )
  if (!clientAllowed) return { allowed: false, reason: "client" }

  if (options.networkLimit) {
    const networkAllowed = await consumeBucket(
      store,
      `${scope}/network/${networkId}/${networkBucket}`,
      options.networkLimit,
      networkWindowMs,
      now,
    )
    if (!networkAllowed) return { allowed: false, reason: "network" }
  }

  const globalAllowed = await consumeBucket(
    store,
    `${scope}/global/${globalBucket}`,
    options.globalLimit,
    options.globalWindowMs,
    now,
  )
  return globalAllowed ? { allowed: true } : { allowed: false, reason: "global" }
}
