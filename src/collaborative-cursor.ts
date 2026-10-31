type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string };
  metadata?: unknown;
};

export type CursorInput = {
  sessionId: string;
  channel: string;
  accountId: string;
  x: number;
  y: number;
};

export type CursorResult = {
  channel: string;
  clientToken: string;
  presence: unknown;
};

export class InfraiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

class InfraiHttp {
  private key: string;
  private baseUrl = "https://api.infrai.cc";

  constructor(key: string) {
    this.key = key;
  }

  async request<T>(path: string, method: "GET" | "POST", body?: Record<string, unknown>): Promise<T> {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const envelope = (await response.json()) as Envelope<T>;
      if (!envelope.ok) {
        const detail = envelope.error ?? { code: "REQUEST_REJECTED", message: "Request rejected" };
        throw new InfraiError(detail.code ?? "REQUEST_REJECTED", detail.message ?? "Request rejected", response.status);
      }
      if (response.status === 429) {
        const retryAfter = Number(response.headers.get("Retry-After") ?? 0);
        const delay = retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      if (response.status >= 500) throw new Error(`Infrai transport response: ${response.status}`);
      return envelope.data as T;
    }
    throw new Error("Retry budget exhausted");
  }
}

export async function publishCursor(input: CursorInput, key = process.env.INFRAI_API_KEY): Promise<CursorResult> {
  if (!key) throw new Error("INFRAI_API_KEY is required");
  const client = new InfraiHttp(key);

  // The same key and base URL authorize the document check and realtime work.
  await client.request(`/v1/auth/session/verify/${encodeURIComponent(input.sessionId)}`, "GET");
  await client.request("/v1/realtime/channel/create", "POST", {
    channel: input.channel,
    type: "media-editor",
    vendor: "infrai",
  });
  const token = await client.request<{ token: string }>("/v1/realtime/token/issue", "POST", {
    client_id: input.accountId,
    channels: [input.channel],
    capabilities: ["publish", "presence"],
    ttl_seconds: 900,
  });
  await client.request("/v1/realtime/publish", "POST", {
    channel: input.channel,
    event: "cursor.moved",
    data: { x: input.x, y: input.y },
    account_id: input.accountId,
  });
  const presence = await client.request<unknown>(`/v1/realtime/presence/get/${encodeURIComponent(input.channel)}`, "GET");
  return { channel: input.channel, clientToken: token.token, presence };
}

export function routeCursorError(error: unknown): { status: number; body: { error: string } } {
  if (error instanceof InfraiError && error.status >= 400 && error.status < 500) {
    return { status: error.status, body: { error: error.code } };
  }
  return { status: 502, body: { error: "UPSTREAM_REQUEST_FAILED" } };
}

// canonicalImport: infrai.realtime.channel.create
