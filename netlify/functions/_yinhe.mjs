export const API_BASE = "https://api.lk888.ai/api"

export function response(statusCode, payload) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(payload),
  }
}
export function apiKey() {
  return String(process.env.IMAGE_API_KEY || process.env.YINHE_API_KEY || process.env.API_KEY || "").trim()
}

export function headers(key) {
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  }
}

export async function safeJson(upstream) {
  const text = await upstream.text()
  try {
    return JSON.parse(text)
  } catch {
    return { error: text.slice(0, 300) || `HTTP ${upstream.status}` }
  }
}
