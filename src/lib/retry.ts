type RetryOptions = {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  label: string,
  operation: () => Promise<T>,
  options: RetryOptions = {}
) {
  const retries = options.retries ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 450;
  const maxDelayMs = options.maxDelayMs ?? 4500;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const shouldRetry = options.shouldRetry?.(error, attempt) ?? attempt < retries;

      if (!shouldRetry || attempt >= retries) break;

      const exponentialDelay = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
      const jitter = Math.floor(Math.random() * 150);
      await sleep(exponentialDelay + jitter);
    }
  }

  throw new Error(`${label} failed after ${retries + 1} attempt(s)`, {
    cause: lastError
  });
}

export async function fetchJsonWithRetry<T>(
  label: string,
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: RetryOptions
) {
  if (process.env.RESEARCH_TLS_INSECURE === "true") {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }

  return withRetry(
    label,
    async () => {
      const response = await fetch(input, init);

      if (!response.ok) {
        const retryable = response.status >= 500;
        const message = await response.text().catch(() => response.statusText);
        const error = new Error(`${label} returned ${response.status}: ${message}`);
        (error as Error & { retryable?: boolean }).retryable = retryable;
        throw error;
      }

      return (await response.json()) as T;
    },
    {
      ...options,
      shouldRetry(error, attempt) {
        const retryable = (error as Error & { retryable?: boolean }).retryable ?? true;
        return retryable && attempt < (options?.retries ?? 3);
      }
    }
  );
}
