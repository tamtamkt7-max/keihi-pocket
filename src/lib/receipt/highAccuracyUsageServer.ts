import { createSign } from "crypto";

type UsageRecord = {
  uid: string;
  dateKey: string;
  count: number;
  createdAt: string;
  updatedAt: string;
};

function getProjectId() {
  return process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "";
}

function getApiKey() {
  return process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";
}

function getServiceAccountConfig() {
  const clientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || getProjectId();
  if (!clientEmail || !privateKey || !projectId) return null;
  return { clientEmail, privateKey, projectId };
}

export function highAccuracyEnabled() {
  return process.env.HIGH_ACCURACY_ENABLED !== "false";
}

export function getHighAccuracyDailyLimit() {
  const value = Number(process.env.HIGH_ACCURACY_DAILY_LIMIT || 3);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 3;
}

export function getDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

export async function verifyFirebaseIdToken(idToken: string) {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!response.ok) return null;

  const data = await response.json();
  const user = data?.users?.[0];
  return typeof user?.localId === "string" ? user.localId : null;
}

function usageDocumentUrl(uid: string, dateKey: string) {
  const projectId = getProjectId();
  const docId = `receiptAi_${dateKey}`;
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${encodeURIComponent(uid)}/usage/${docId}`;
}

function encodeBase64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function getGoogleAccessToken() {
  const config = getServiceAccountConfig();
  if (!config) return null;

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claimSet = {
    iss: config.clientEmail,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const unsignedToken = `${encodeBase64Url(JSON.stringify(header))}.${encodeBase64Url(JSON.stringify(claimSet))}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsignedToken);
  const assertion = `${unsignedToken}.${encodeBase64Url(signer.sign(config.privateKey))}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    cache: "no-store",
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { access_token?: string };
  return data.access_token || null;
}

async function getFirestoreAccessToken(idToken: string) {
  return (await getGoogleAccessToken()) || idToken;
}

function fromFirestore(data: any): UsageRecord | null {
  const fields = data?.fields;
  if (!fields) return null;
  return {
    uid: fields.uid?.stringValue || "",
    dateKey: fields.dateKey?.stringValue || "",
    count: Number(fields.count?.integerValue || fields.count?.doubleValue || 0),
    createdAt: fields.createdAt?.timestampValue || new Date().toISOString(),
    updatedAt: fields.updatedAt?.timestampValue || new Date().toISOString(),
  };
}

function toFirestoreFields(record: UsageRecord) {
  return {
    fields: {
      uid: { stringValue: record.uid },
      dateKey: { stringValue: record.dateKey },
      count: { integerValue: String(record.count) },
      createdAt: { timestampValue: record.createdAt },
      updatedAt: { timestampValue: record.updatedAt },
    },
  };
}

async function fetchUsage(uid: string, dateKey: string, idToken: string) {
  const accessToken = await getFirestoreAccessToken(idToken);
  const response = await fetch(usageDocumentUrl(uid, dateKey), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`usage read failed: ${response.status}`);
  return fromFirestore(await response.json());
}

async function saveUsage(record: UsageRecord, idToken: string) {
  const accessToken = await getFirestoreAccessToken(idToken);
  const response = await fetch(usageDocumentUrl(record.uid, record.dateKey), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(toFirestoreFields(record)),
  });
  if (!response.ok) throw new Error(`usage write failed: ${response.status}`);
}

export async function reserveHighAccuracyUsage(uid: string, idToken: string) {
  const dateKey = getDateKey();
  const limit = getHighAccuracyDailyLimit();
  const now = new Date().toISOString();
  const current = await fetchUsage(uid, dateKey, idToken);
  const count = current?.count || 0;

  if (count >= limit) {
    return { ok: false, count, limit, dateKey };
  }

  await saveUsage(
    {
      uid,
      dateKey,
      count: count + 1,
      createdAt: current?.createdAt || now,
      updatedAt: now,
    },
    idToken
  );
  return { ok: true, count: count + 1, limit, dateKey };
}
