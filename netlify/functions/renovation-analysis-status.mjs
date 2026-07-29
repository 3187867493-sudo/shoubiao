import { response } from "./_yinhe.mjs"
import { getAnalysisStore } from "./_netlify-state.mjs"

const taskPattern = /^[a-zA-Z0-9-]{16,80}$/

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return response(204, {})
  if (event.httpMethod !== "GET") return response(405, { error: "仅支持 GET 请求" })

  const taskId = String(event.queryStringParameters?.task_id || "")
  if (!taskPattern.test(taskId)) return response(400, { error: "缺少有效的分析任务编号" })

  try {
    const store = getAnalysisStore(event)
    const task = await store.get(`tasks/${taskId}`, { type: "json" })
    if (!task) return response(202, { task_id: taskId, status: "pending" })

    if (task.expiresAt && Date.parse(task.expiresAt) < Date.now()) {
      await store.delete(`tasks/${taskId}`)
      return response(410, { task_id: taskId, status: "error", error: "分析结果已过期，请重新运行" })
    }

    if (task.status === "complete" && task.result) {
      return response(200, { task_id: taskId, status: "complete", result: task.result })
    }
    if (task.status === "error") {
      return response(200, { task_id: taskId, status: "error", error: task.error || "分析任务失败" })
    }
    return response(202, { task_id: taskId, status: task.status || "processing" })
  } catch (error) {
    return response(500, { error: error instanceof Error ? error.message : "无法查询分析任务" })
  }
}
