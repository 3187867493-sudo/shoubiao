import { API_BASE, apiKey, headers, response, safeJson } from "./_yinhe.mjs"

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return response(204, {})
  if (event.httpMethod !== "GET") return response(405, { error: "仅支持 GET 请求" })

  const key = apiKey()
  if (!key) return response(503, { error: "图像生成服务尚未配置 API_KEY" })
  const taskId = String(event.queryStringParameters?.task_id || "")
  if (!/^\d+$/.test(taskId)) return response(400, { error: "缺少有效的 task_id" })

  try {
    const upstream = await fetch(`${API_BASE}/v1/skills/task-status?task_id=${encodeURIComponent(taskId)}`, { headers: headers(key) })
    const payload = await safeJson(upstream)
    if (!upstream.ok) return response(upstream.status, { error: payload.error || payload.detail || payload.status || "无法查询生成任务" })
    return response(200, {
      task_id: payload.task_id,
      state: payload.state,
      status: payload.status,
      status_group: payload.status_group,
      progress: payload.progress,
      is_final: payload.is_final,
      result_url: payload.result_url,
      error: payload.error,
      duration_seconds: payload.duration_seconds,
    })
  } catch (error) {
    return response(500, { error: error instanceof Error ? error.message : "无法查询生成任务" })
  }
}
