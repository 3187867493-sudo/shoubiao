import { API_BASE, apiKey, headers, response, safeJson } from "./_yinhe.mjs"
import { consumeAiQuota } from "./_netlify-state.mjs"

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return response(204, {})
  if (event.httpMethod !== "POST") return response(405, { error: "仅支持 POST 请求" })

  const key = apiKey()
  if (!key) return response(503, { error: "图像生成服务尚未配置 API_KEY" })

  try {
    const rawBody = event.isBase64Encoded ? Buffer.from(event.body || "", "base64").toString("utf8") : (event.body || "")
    if (Buffer.byteLength(rawBody, "utf8") > 6 * 1024 * 1024) return response(413, { error: "图片数据过大，请重新上传" })
    const body = JSON.parse(rawBody)
    if (!body.prompt || body.prompt.length < 40 || body.prompt.length > 8000) return response(400, { error: "改造提示词长度无效" })
    if (!String(body.image || "").startsWith("data:image/")) return response(400, { error: "请上传有效的空间图片" })

    const quota = await consumeAiQuota(event, "image", {
      clientLimit: 2,
      clientWindowMs: 60 * 60 * 1000,
      globalLimit: 20,
      globalWindowMs: 24 * 60 * 60 * 1000,
    })
    if (!quota.allowed) {
      return response(429, {
        error: quota.reason === "global" ? "今日公网效果图额度已用完，请明天再试" : "效果图生成较频繁，请一小时后再试",
      })
    }

    const authHeaders = headers(key)
    const balanceResponse = await fetch(`${API_BASE}/v1/skills/balance`, { headers: authHeaders })
    const balance = await safeJson(balanceResponse)
    if (!balanceResponse.ok) return response(balanceResponse.status, { error: balance.error || balance.detail || "无法检查图像生成余额" })
    if (Number(balance.balance || 0) <= 0) return response(402, { error: "图像生成算力余额不足" })

    const allowedSizes = ["1024x1024", "1024x1536", "1536x1024", "960x1280", "1280x960", "1920x1088"]
    const allowedQualities = ["low", "medium", "high", "auto"]
    const payload = {
      model: "gpt-image-2",
      prompt: body.prompt,
      params: {
        prompt: body.prompt,
        images: [body.image],
        size: allowedSizes.includes(body.size) ? body.size : "1536x1024",
        quality: allowedQualities.includes(body.quality) ? body.quality : "medium",
      },
    }

    const upstream = await fetch(`${API_BASE}/v1/media/generate`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify(payload),
    })
    const result = await safeJson(upstream)
    const taskId = result?.data?.task_id
    if (!upstream.ok || !taskId) return response(upstream.status || 502, { error: result.error || result.detail || result.msg || "图像任务提交失败" })
    return response(200, { task_id: taskId, model: payload.model, balance: balance.balance })
  } catch (error) {
    return response(500, { error: error instanceof Error ? error.message : "图像生成服务发生未知错误" })
  }
}
