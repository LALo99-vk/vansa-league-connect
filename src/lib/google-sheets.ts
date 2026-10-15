/**
 * Minimal Google Sheets client for the registration backend.
 *
 * Dependency-free: the service-account JWT is signed with WebCrypto. Server-only —
 * it reads the private key from the environment.
 */
declare const process: { env: Record<string, string | undefined> };

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const REQUEST_TIMEOUT_MS = 15_000;

type Config = { spreadsheetId: string; clientEmail: string; privateKey: string };

function readConfig(): Config {
  const spreadsheetId = process.env["GOOGLE_SHEETS_ID"]?.trim();
  const clientEmail = process.env["GOOGLE_SA_EMAIL"]?.trim();
  const rawKey = process.env["GOOGLE_SA_PRIVATE_KEY"];
  if (!spreadsheetId || !clientEmail || !rawKey) {
    throw new Error("Google Sheets is not configured: set GOOGLE_SHEETS_ID, GOOGLE_SA_EMAIL and GOOGLE_SA_PRIVATE_KEY.");
  }
  // Env files store the PEM with literal "\n" and sometimes wrap it in quotes.
  return { spreadsheetId, clientEmail, privateKey: rawKey.trim().replace(/^["']|["']$/g, "").replace(/\\n/g, "\n") };
}

export class SheetsError extends Error {
  readonly status: number | undefined;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "SheetsError";
    this.status = status;
  }
  /** Rate limits, server errors and network failures are worth another attempt. */
  get retryable() {
    return this.status === undefined || this.status === 429 || this.status >= 500;
  }
}

function base64Url(bytes: ArrayBuffer | string) {
  const binary = typeof bytes === "string" ? bytes : String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToDer(pem: string): ArrayBuffer {
  const body = pem.replace(/-----BEGIN [^-]+-----/, "").replace(/-----END [^-]+-----/, "").replace(/\s+/g, "");
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

let cachedToken: { value: string; expiresAt: number } | undefined;

async function accessToken(config: Config): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${base64Url(
    JSON.stringify({ iss: config.clientEmail, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }),
  )}`;
  const key = await crypto.subtle.importKey("pkcs8", pemToDer(config.privateKey), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const response = await send(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${unsigned}.${base64Url(signature)}`,
  });
  const json = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return json.access_token;
}

async function send(url: string, init: RequestInit): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch (error) {
    throw new SheetsError(`Network error talking to Google: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!response.ok) throw new SheetsError(`Google returned ${response.status}: ${(await response.text()).slice(0, 300)}`, response.status);
  return response;
}

/** Calls the Sheets API for the configured spreadsheet. `path` starts after the spreadsheet id. */
export async function sheetsApi<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const config = readConfig();
  const token = await accessToken(config);
  const response = await send(`${SHEETS_API}/${config.spreadsheetId}${path}`, {
    method: init.method ?? "GET",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: init.body === undefined ? null : JSON.stringify(init.body),
  });
  return (await response.json()) as T;
}

/** A1 range for a tab, quoted so names with spaces and brackets work. */
export const tabRange = (tab: string, cells: string) => encodeURIComponent(`'${tab.replace(/'/g, "''")}'!${cells}`);

/** Retries an operation on transient failures: 3 attempts, backing off 0.5s then 1.5s. */
export async function withRetry<T>(operation: () => Promise<T>, attempts = 3): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const retryable = error instanceof SheetsError && error.retryable;
      if (!retryable || attempt >= attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, attempt === 1 ? 500 : 1500));
    }
  }
}
