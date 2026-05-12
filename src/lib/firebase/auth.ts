import {
  AuthError,
  createUserWithEmailAndPassword,
  getRedirectResult,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  UserCredential,
} from "firebase/auth";
import { browserLocalPersistence } from "firebase/auth";
import { auth } from "./client";
import { firebaseEnabled } from "@/lib/runtime/appMode";
import { clearDemoSession, setDemoSession } from "@/lib/mock/localDb";

const LOGIN_RETURN_TO_KEY = "keihi-pocket-login-return-to";
let redirectResultPromise: Promise<UserCredential | null> | null = null;
let persistencePromise: Promise<void> | null = null;

function prefersRedirectLogin() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent || "";
  return /iPhone|iPad|iPod|Android|Mobile/i.test(ua);
}

async function ensureAuthPersistence() {
  if (!auth) return;
  if (!persistencePromise) {
    persistencePromise = setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.error("auth persistence failed", error);
    });
  }
  await persistencePromise;
}

function mapAuthError(error: unknown, fallback: string) {
  const code = (error as AuthError | undefined)?.code || "";

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-email":
      return "メールアドレスかパスワードを確認してください。";
    case "auth/email-already-in-use":
      return "すでに登録されています。ログインをお試しください。";
    case "auth/weak-password":
      return "パスワードは6文字以上で入力してください。";
    case "auth/popup-closed-by-user":
      return "ログインを中止しました。";
    case "auth/popup-blocked":
      return "ログイン画面を開けませんでした。もう一度お試しください。";
    case "auth/network-request-failed":
      return "通信が不安定です。少し時間をおいてもう一度お試しください。";
    case "auth/too-many-requests":
      return "時間をおいて、もう一度お試しください。";
    case "auth/missing-email":
      return "メールアドレスを入力してください。";
    default:
      return fallback;
  }
}

export function setPostLoginPath(path: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(LOGIN_RETURN_TO_KEY, path || "/dashboard");
}

export function consumePostLoginPath() {
  if (typeof window === "undefined") return "/dashboard";
  const value = window.sessionStorage.getItem(LOGIN_RETURN_TO_KEY) || "/dashboard";
  window.sessionStorage.removeItem(LOGIN_RETURN_TO_KEY);
  return value;
}

export async function startDemoMode() {
  setDemoSession();
}

export async function signInWithGoogle() {
  console.log("login started", { provider: "google", flow: prefersRedirectLogin() ? "redirect" : "popup" });

  if (!firebaseEnabled || !auth) {
    setDemoSession();
    return { mode: "demo" as const };
  }

  await ensureAuthPersistence();

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  if (prefersRedirectLogin()) {
    await signInWithRedirect(auth, provider);
    return { mode: "redirect" as const };
  }

  try {
    const credential = await signInWithPopup(auth, provider);
    clearDemoSession();
    console.log("login success", { provider: "google", flow: "popup", uid: credential.user.uid });
    return { mode: "popup" as const, credential };
  } catch (error) {
    console.error("login failed", error);
    throw new Error(mapAuthError(error, "ログインできませんでした。もう一度お試しください。"));
  }
}

export async function signInWithEmail(email: string, password: string) {
  console.log("login started", { provider: "password" });

  if (!firebaseEnabled || !auth) {
    throw new Error("この環境ではログインを使えません。");
  }

  await ensureAuthPersistence();

  try {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    clearDemoSession();
    console.log("login success", { provider: "password", uid: credential.user.uid });
    return credential;
  } catch (error) {
    console.error("login failed", error);
    throw new Error(mapAuthError(error, "ログインできませんでした。もう一度お試しください。"));
  }
}

export async function registerWithEmail(email: string, password: string) {
  console.log("login started", { provider: "password", action: "register" });

  if (!firebaseEnabled || !auth) {
    throw new Error("この環境では新規登録を使えません。");
  }

  await ensureAuthPersistence();

  try {
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    clearDemoSession();
    console.log("login success", { provider: "password", action: "register", uid: credential.user.uid });
    return credential;
  } catch (error) {
    console.error("login failed", error);
    throw new Error(mapAuthError(error, "登録できませんでした。もう一度お試しください。"));
  }
}

export async function resetPassword(email: string) {
  console.log("login started", { provider: "password", action: "reset" });

  if (!firebaseEnabled || !auth) {
    throw new Error("この環境では再設定メールを送れません。");
  }

  await ensureAuthPersistence();

  try {
    await sendPasswordResetEmail(auth, email.trim());
    console.log("login success", { provider: "password", action: "reset" });
  } catch (error) {
    console.error("login failed", error);
    throw new Error(mapAuthError(error, "再設定メールを送れませんでした。もう一度お試しください。"));
  }
}

export async function checkRedirectResultOnce() {
  if (!firebaseEnabled || !auth) {
    console.log("redirect result checked", { enabled: false });
    return null;
  }

  await ensureAuthPersistence();

  if (!redirectResultPromise) {
    redirectResultPromise = getRedirectResult(auth);
  }

  try {
    const result = await redirectResultPromise;
    console.log("redirect result checked", { hasUser: Boolean(result?.user) });
    if (result?.user) {
      clearDemoSession();
      console.log("login success", { provider: "google", flow: "redirect", uid: result.user.uid });
    }
    return result;
  } catch (error) {
    console.error("login failed", error);
    throw new Error(mapAuthError(error, "ログインできませんでした。もう一度お試しください。"));
  }
}

export async function signOutUser() {
  if (!firebaseEnabled || !auth) {
    clearDemoSession();
    return;
  }
  await signOut(auth);
  setDemoSession();
}
