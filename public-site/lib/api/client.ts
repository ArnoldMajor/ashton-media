const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

const DEFAULT_TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  /** HTTP status, or null when no response arrived (unconfigured, timeout, network, bad JSON). */
  readonly status: number | null;
  readonly path: string;

  constructor(message: string, status: number | null, path: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ApiError";
    this.status = status;
    this.path = path;
  }
}

export interface ApiFetchInit extends RequestInit {
  /** Defaults to 10s. Raise it for calls that must survive a backend cold start. */
  timeoutMs?: number;
}

/**
 * Typed fetch against the Django API. Always either resolves with parsed JSON
 * or rejects with an ApiError carrying the status and path.
 */
export async function apiFetch<T>(path: string, init: ApiFetchInit = {}): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal, ...rest } = init;

  if (!API_BASE) {
    throw new ApiError("NEXT_PUBLIC_API_URL is not set", null, path);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onCallerAbort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener("abort", onCallerAbort, { once: true });

  try {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}${path}`, {
        ...rest,
        headers: { Accept: "application/json", ...rest.headers },
        signal: controller.signal,
      });
    } catch (cause) {
      const timedOut = controller.signal.aborted && !signal?.aborted;
      throw new ApiError(timedOut ? `Request timed out after ${timeoutMs}ms` : "Network request failed", null, path, { cause });
    }

    if (!res.ok) {
      throw new ApiError(`API responded ${res.status} ${res.statusText}`.trim(), res.status, path);
    }

    try {
      return (await res.json()) as T;
    } catch (cause) {
      throw new ApiError("Response was not valid JSON", res.status, path, { cause });
    }
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onCallerAbort);
  }
}
