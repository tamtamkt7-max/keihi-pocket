export const firebaseEnabled = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID &&
  process.env.NEXT_PUBLIC_FIREBASE_APP_ID
);

export const cloudImageSaveEnabled = Boolean(
  firebaseEnabled &&
  process.env.NEXT_PUBLIC_ENABLE_CLOUD_IMAGES === "true" &&
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
);

export const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";

export const adsenseEnabled = Boolean(
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true" &&
  adsenseClient
);

export const adSlots = {
  "home-bottom": process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_BOTTOM || "",
  "reports-bottom": process.env.NEXT_PUBLIC_ADSENSE_SLOT_REPORTS_BOTTOM || "",
  settings: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SETTINGS || "",
} as const;

export const appModeLabel = firebaseEnabled ? "firebase" : "demo";
