const ASIN_PATTERN = /(?:\/dp\/|\/d\/|\/gp\/aw\/d\/|\/gp\/product\/|\/product\/|asin=|ASIN=)([A-Z0-9]{10})/i;
const BARE_ASIN_PATTERN = /\b([A-Z0-9]{10})\b/;

export function normalizeAmazonUrl(rawValue: string) {
  const value = rawValue.trim();

  if (/^https?:\/\//i.test(value)) return value;
  if (/^(www\.)?(amazon\.|amzn\.to|a\.co)/i.test(value)) return `https://${value}`;

  return value;
}

export function extractAsinFromUrl(rawValue: string) {
  const value = normalizeAmazonUrl(rawValue);
  const decoded = decodeURIComponent(value);
  const directMatch = decoded.match(ASIN_PATTERN);

  if (directMatch?.[1]) return directMatch[1];

  try {
    const url = new URL(decoded);
    const pathMatch = url.pathname.match(BARE_ASIN_PATTERN);
    const queryMatch = url.search.match(BARE_ASIN_PATTERN);

    return pathMatch?.[1] ?? queryMatch?.[1] ?? null;
  } catch {
    return decoded.match(BARE_ASIN_PATTERN)?.[1] ?? null;
  }
}

export async function resolveShortAmazonLink(rawUrl: string) {
  const normalizedUrl = normalizeAmazonUrl(rawUrl);
  const url = new URL(normalizedUrl);
  const isShortLink = ["amzn.to", "a.co"].includes(url.hostname.replace(/^www\./, ""));

  if (!isShortLink) return normalizedUrl;

  const response = await fetch(normalizedUrl, {
    method: "HEAD",
    redirect: "follow"
  });

  return response.url || rawUrl;
}
