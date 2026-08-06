export interface ModelPrediction {
  class_name: string
  confidence: number
}

export interface ModelPredictResponse {
  predictions: ModelPrediction[]
  top_prediction: ModelPrediction
  inference_time_ms: number
}

const MODEL_SERVICE_URL = process.env.MODEL_SERVICE_URL || "http://localhost:3002"
const REQUEST_TIMEOUT_MS = 30000

if (!process.env.MODEL_SERVICE_URL) {
  console.warn(
    "[model-client] MODEL_SERVICE_URL is not set; defaulting to http://localhost:3002. " +
      "Set MODEL_SERVICE_URL on the deployed service (e.g. https://<service>.onrender.com).",
  )
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const res = await fetch(`${MODEL_SERVICE_URL}${path}`, {
      ...init,
      signal: controller.signal,
    })

    if (!res.ok) {
      const body = await res.text()
      throw new ModelServiceError(res.status, body || res.statusText)
    }

    return (await res.json()) as T
  } catch (err) {
    if (err instanceof ModelServiceError) throw err
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ModelServiceError(504, "Model service request timed out")
    }
    throw new ModelServiceError(502, "Model service unavailable")
  } finally {
    clearTimeout(timeout)
  }
}

export class ModelServiceError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message)
    this.name = "ModelServiceError"
  }
}

export async function predict(file: File): Promise<ModelPredictResponse> {
  const formData = new FormData()
  formData.append("file", file)

  return request<ModelPredictResponse>("/predict", {
    method: "POST",
    body: formData,
  })
}
