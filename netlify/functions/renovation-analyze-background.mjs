import { AnalysisServiceError, analyzeRenovation, DEFAULT_KNOWLEDGE_BASE_ID } from "../../server/analysis.ts"
import { apiKey, response } from "./_yinhe.mjs"
import { consumeAiQuota, getAnalysisStore } from "./_netlify-state.mjs"

const taskPattern = /^[a-zA-Z0-9-]{16,80}$/

function parseBody(event) {
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body || "", "base64").toString("utf8")
    : (event.body || "")
  if (Buffer.byteLength(rawBody, "utf8") > 6 * 1024 * 1024) {
    throw new AnalysisServiceError(413, "空间图片数据过大，请压缩后重试")
  }
  try {
    return JSON.parse(rawBody)
  } catch {
    throw new AnalysisServiceError(400, "空间分析请求格式无效")
  }
}

async function save(store, taskId, value) {
  await store.setJSON(`tasks/${taskId}`, {
    taskId,
    ...value,
    updatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  })
}

export const handler = async (event) => {
  let store
  let taskId = ""
  try {
    store = getAnalysisStore(event)
    if (event.httpMethod !== "POST") return response(405, { error: "仅支持 POST 请求" })

    const body = parseBody(event)
    taskId = String(body.taskId || "")
    if (!taskPattern.test(taskId)) return response(400, { error: "缺少有效的分析任务编号" })
    if (typeof body.input?.mission !== "string" || body.input.mission.trim().length < 12) {
      await save(store, taskId, { status: "error", error: "请至少用 12 个字描述真实需求" })
      return response(400, { task_id: taskId, error: "请至少用 12 个字描述真实需求" })
    }

    const existing = await store.get(`tasks/${taskId}`, { type: "json" })
    if (existing?.status === "processing" || existing?.status === "complete") {
      return response(202, { task_id: taskId, status: existing.status })
    }

    const quota = await consumeAiQuota(event, "analysis", {
      clientLimit: 3,
      clientWindowMs: 30 * 60 * 1000,
      globalLimit: 40,
      globalWindowMs: 24 * 60 * 60 * 1000,
    })
    if (!quota.allowed) {
      const message = quota.reason === "global"
        ? "今日公网 AI 分析额度已用完，请明天再试"
        : "分析请求较频繁，请 30 分钟后再试"
      await save(store, taskId, { status: "error", error: message })
      return response(429, { task_id: taskId, error: message })
    }

    const key = apiKey()
    if (!key) {
      await save(store, taskId, { status: "error", error: "GPT-5.6 分析服务尚未配置" })
      return response(503, { task_id: taskId, error: "GPT-5.6 分析服务尚未配置" })
    }

    await save(store, taskId, { status: "processing", startedAt: new Date().toISOString() })
    const result = await analyzeRenovation(body, {
      apiKey: key,
      model: process.env.GPT_ANALYSIS_MODEL || "gpt-5.6-terra",
      bailianApiKey: process.env.BAILIAN_API_KEY || "",
      knowledgeBaseId: process.env.BAILIAN_KNOWLEDGE_BASE_ID || DEFAULT_KNOWLEDGE_BASE_ID,
    })
    await save(store, taskId, { status: "complete", completedAt: new Date().toISOString(), result })
    return response(200, { task_id: taskId, status: "complete" })
  } catch (error) {
    const message = error instanceof Error ? error.message : "GPT-5.6 分析服务发生未知错误"
    if (store && taskPattern.test(taskId)) {
      try {
        await save(store, taskId, { status: "error", error: message })
      } catch {
        // The original error is still the most useful diagnostic.
      }
    }
    const status = error instanceof AnalysisServiceError ? error.status : 500
    return response(status, { task_id: taskId || undefined, error: message })
  }
}
