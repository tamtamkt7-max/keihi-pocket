import { createSign } from "crypto";

type UsageRecord = {
  uid: string;
  dateKey: string;
  count: number;
  freeUsedCount: number;
  rewardAdWatchedCount: number;
  rewardBonusRemaining: number;
  totalHighAccuracyUsedCount: number;
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

export function getRewardAdBonusReads() {
  const value = Number(process.env.REWARD_AD_BONUS_READS || 3);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 3;
}

export function getRewardAdDailyLimit() {
  const value = Number(process.env.REWARD_AD_DAILY_LIMIT || 3);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 3;
}

export function rewardAdsEnabled() {
  return process.env.REWARD_ADS_ENABLED === "true";
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
  const legacyCount = Number(fields.count?.integerValue || fields.count?.doubleValue || 0);
  const totalHighAccuracyUsedCount = Number(
    fields.totalHighAccuracyUsedCount?.integerValue ||
      fields.totalHighAccuracyUsedCount?.doubleValue ||
      legacyCount
  );
  const freeUsedCount = Number(fields.freeUsedCount?.integerValue || fields.freeUsedCount?.doubleValue || legacyCount);
  return {
    uid: fields.uid?.stringValue || "",
    dateKey: fields.dateKey?.stringValue || "",
    count: legacyCount,
    freeUsedCount,
    rewardAdWatchedCount: Number(fields.rewardAdWatchedCount?.integerValue || fields.rewardAdWatchedCount?.doubleValue || 0),
    rewardBonusRemaining: Number(fields.rewardBonusRemaining?.integerValue || fields.rewardBonusRemaining?.doubleValue || 0),
    totalHighAccuracyUsedCount,
    createdAt: fields.createdAt?.timestampValue || new Date().toISOString(),
    updatedAt: fields.updatedAt?.timestampValue || new Date().toISOString(),
  };
}

function toFirestoreFields(record: UsageRecord) {
  return {
    fields: {
      uid: { stringValue: record.uid },
      dateKey: { stringValue: record.dateKey },
      count: { integerValue: String(record.totalHighAccuracyUsedCount) },
      freeUsedCount: { integerValue: String(record.freeUsedCount) },
      rewardAdWatchedCount: { integerValue: String(record.rewardAdWatchedCount) },
      rewardBonusRemaining: { integerValue: String(record.rewardBonusRemaining) },
      totalHighAccuracyUsedCount: { integerValue: String(record.totalHighAccuracyUsedCount) },
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
  const freeLimit = getHighAccuracyDailyLimit();
  const rewardAdDailyLimit = getRewardAdDailyLimit();
  const rewardBonusReads = getRewardAdBonusReads();
  const now = new Date().toISOString();
  const current = await fetchUsage(uid, dateKey, idToken);
  const record: UsageRecord = {
    uid,
    dateKey,
    count: current?.count || current?.totalHighAccuracyUsedCount || 0,
    freeUsedCount: current?.freeUsedCount || 0,
    rewardAdWatchedCount: current?.rewardAdWatchedCount || 0,
    rewardBonusRemaining: current?.rewardBonusRemaining || 0,
    totalHighAccuracyUsedCount: current?.totalHighAccuracyUsedCount || current?.count || 0,
    createdAt: current?.createdAt || now,
    updatedAt: now,
  };

  if (record.freeUsedCount < freeLimit) {
    record.freeUsedCount += 1;
    record.totalHighAccuracyUsedCount += 1;
    await saveUsage(record, idToken);
    return {
      ok: true,
      source: "free" as const,
      dateKey,
      freeUsedCount: record.freeUsedCount,
      freeLimit,
      rewardBonusRemaining: record.rewardBonusRemaining,
      rewardAdWatchedCount: record.rewardAdWatchedCount,
      rewardAdDailyLimit,
      rewardBonusReads,
      totalHighAccuracyUsedCount: record.totalHighAccuracyUsedCount,
    };
  }

  if (record.rewardBonusRemaining > 0) {
    record.rewardBonusRemaining -= 1;
    record.totalHighAccuracyUsedCount += 1;
    await saveUsage(record, idToken);
    return {
      ok: true,
      source: "reward" as const,
      dateKey,
      freeUsedCount: record.freeUsedCount,
      freeLimit,
      rewardBonusRemaining: record.rewardBonusRemaining,
      rewardAdWatchedCount: record.rewardAdWatchedCount,
      rewardAdDailyLimit,
      rewardBonusReads,
      totalHighAccuracyUsedCount: record.totalHighAccuracyUsedCount,
    };
  }

  return {
    ok: false,
    reason: "daily_limit" as const,
    dateKey,
    freeUsedCount: record.freeUsedCount,
    freeLimit,
    rewardBonusRemaining: record.rewardBonusRemaining,
    rewardAdWatchedCount: record.rewardAdWatchedCount,
    rewardAdDailyLimit,
    rewardBonusReads,
    rewardAdAvailable: rewardAdsEnabled() && record.rewardAdWatchedCount < rewardAdDailyLimit,
    totalHighAccuracyUsedCount: record.totalHighAccuracyUsedCount,
  };
}

export async function grantRewardAdBonus(uid: string, idToken: string) {
  const dateKey = getDateKey();
  const rewardAdDailyLimit = getRewardAdDailyLimit();
  const rewardBonusReads = getRewardAdBonusReads();
  const now = new Date().toISOString();
  const current = await fetchUsage(uid, dateKey, idToken);
  const record: UsageRecord = {
    uid,
    dateKey,
    count: current?.count || current?.totalHighAccuracyUsedCount || 0,
    freeUsedCount: current?.freeUsedCount || 0,
    rewardAdWatchedCount: current?.rewardAdWatchedCount || 0,
    rewardBonusRemaining: current?.rewardBonusRemaining || 0,
    totalHighAccuracyUsedCount: current?.totalHighAccuracyUsedCount || current?.count || 0,
    createdAt: current?.createdAt || now,
    updatedAt: now,
  };

  if (!rewardAdsEnabled() || record.rewardAdWatchedCount >= rewardAdDailyLimit) {
    return {
      ok: false,
      dateKey,
      rewardAdWatchedCount: record.rewardAdWatchedCount,
      rewardAdDailyLimit,
      rewardBonusReads,
      rewardBonusRemaining: record.rewardBonusRemaining,
    };
  }

  record.rewardAdWatchedCount += 1;
  record.rewardBonusRemaining += rewardBonusReads;
  await saveUsage(record, idToken);

  return {
    ok: true,
    dateKey,
    rewardAdWatchedCount: record.rewardAdWatchedCount,
    rewardAdDailyLimit,
    rewardBonusReads,
    rewardBonusRemaining: record.rewardBonusRemaining,
  };
}
