let token: string | null = null

export function setToken(t: string | null) {
  token = t
  if (t) {
    try { sessionStorage.setItem("token", t) } catch {}
  } else {
    try { sessionStorage.removeItem("token") } catch {}
  }
}

export function getToken(): string | null {
  if (token) return token
  try {
    const stored = sessionStorage.getItem("token")
    if (stored) token = stored
    return stored
  } catch {
    return null
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string>),
  }
  const t = getToken()
  if (t) headers["Authorization"] = `Bearer ${t}`

  const res = await fetch(path, { ...init, headers })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.error || res.statusText, body.code)
  }

  const json = await res.json()
  return json.data as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  upload: <T>(path: string, formData: FormData) =>
    request<T>(path, { method: "POST", body: formData }),
}
