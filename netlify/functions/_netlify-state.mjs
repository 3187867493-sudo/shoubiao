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

function anonymousClientId(event) {
  return createHash("sha256").update(trustedClientAddress(event)).digest("hex").slice(0, 24)
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
  const clientId = anonymousClientId(event)
  const clientBucket = Math.floor(now / options.clientWindowMs)
  const globalBucket = Math.floor(now / options.globalWindowMs)

  const clientAllowed = await consumeBucket(
    store,
    `${scope}/client/${clientId}/${clientBucket}`,
    options.clientLimit,
    options.clientWindowMs,
    now,
  )
  if (!clientAllowed) return { allowed: false, reason: "client" }

  const globalAllowed = await consumeBucket(
    store,
    `${scope}/global/${globalBucket}`,
    options.globalLimit,
    options.globalWindowMs,
    now,
  )
  return globalAllowed ? { allowed: true } : { allowed: false, reason: "global" }
}
