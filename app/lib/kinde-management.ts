type TokenCache = { token: string; expiresAt: number };
let cached: TokenCache | null = null;

const AUDIENCE_SUFFIXES = ["", "/api/v1", "/api"] as const;
type AudienceSuffix = (typeof AUDIENCE_SUFFIXES)[number];

function getKindeIssuer(): string {
  const issuer = process.env.KINDE_ISSUER_URL;
  if (!issuer) {
    throw new Error("KINDE_ISSUER_URL is not set.");
  }
  return issuer.replace(/\/+$/, "");
}

// Audience candidates to try, in order:
//   1. Explicit override via KINDE_MANAGEMENT_AUDIENCE
//   2. <issuer>/api/v1 (Kinde's spec for Management API v1)
//   3. <issuer>/api     (some Kinde setups whitelist this instead)
//   4. <issuer>         (legacy setups)
function candidateAudiences(): string[] {
  const issuer = getKindeIssuer();
  const override = process.env.KINDE_MANAGEMENT_AUDIENCE?.trim();
  const list: string[] = [];
  if (override) list.push(override);
  for (const suffix of AUDIENCE_SUFFIXES) {
    const candidate = `${issuer}${suffix}`;
    if (!list.includes(candidate)) list.push(candidate);
  }
  return list;
}

function getM2MCredentials() {
  const clientId = process.env.KINDE_MANAGEMENT_CLIENT_ID;
  const clientSecret = process.env.KINDE_MANAGEMENT_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

async function fetchAccessToken(): Promise<string> {
  if (cached && cached.expiresAt > Date.now() + 30_000) {
    return cached.token;
  }

  const creds = getM2MCredentials();
  if (!creds) {
    throw new Error(
      "KINDE_MANAGEMENT_CLIENT_ID / KINDE_MANAGEMENT_CLIENT_SECRET are not set.",
    );
  }

  const issuer = getKindeIssuer();
  const audiences = candidateAudiences();
  let lastError: Error | null = null;

  for (const audience of audiences) {
    const res = await fetch(`${issuer}/oauth2/token`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: creds.clientId,
        client_secret: creds.clientSecret,
        audience,
        scope: "delete:users",
      }),
    });

    if (res.ok) {
      const json = (await res.json()) as {
        access_token: string;
        expires_in: number;
      };
      cached = {
        token: json.access_token,
        expiresAt: Date.now() + json.expires_in * 1000,
      };
      return cached.token;
    }

    const text = await res.text().catch(() => "");
    lastError = new Error(
      `audience=${audience} → ${res.status}: ${text.slice(0, 300)}`,
    );

    // Only retry on the whitelisting error; anything else is fatal.
    if (!/whitelisted/i.test(text)) break;
  }

  throw new Error(
    `Failed to obtain Kinde M2M token. ${lastError?.message ?? ""}\n` +
      `Fix: Kinde dashboard → M2M app → API → enable the Kinde Management API and add your issuer (or ${audiences.join(", ")}) to the allowed audiences.`,
  );
}

export function kindeManagementEnabled(): boolean {
  return getM2MCredentials() !== null;
}

export async function deleteKindeUser(userId: string): Promise<void> {
  const issuer = getKindeIssuer();
  const token = await fetchAccessToken();
  const url = `${issuer}/api/v1/user?id=${encodeURIComponent(userId)}`;

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      accept: "application/json",
    },
  });

  // Success: any 2xx (Kinde returns 200 with a JSON body
  // {"code":"OK","message":"User successfully deleted"}, spec says 204).
  // Already gone: 404.
  if (res.ok || res.status === 404) {
    return;
  }

  const text = await res.text().catch(() => "");
  throw new Error(
    `Kinde delete failed (${res.status} ${res.statusText}) for user ${userId}: ${text.slice(0, 500)}`,
  );
}
