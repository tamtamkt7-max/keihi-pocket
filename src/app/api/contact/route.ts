import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Firebase Adminの初期化
if (getApps().length === 0) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      : undefined;

    if (serviceAccount) {
      initializeApp({
        credential: cert(serviceAccount),
      });
    } else {
      initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    }
  } catch (err) {
    console.error("Firebase admin initialization failed in contact API:", err);
  }
}

const adminDb = getApps().length > 0 ? getFirestore() : null;

// カテゴリ名の日本語マッピング
const categoryLabels: Record<string, string> = {
  general: "使い方について",
  plus: "プラスプランについて",
  bug: "不具合・改善のご要望",
  other: "その他",
};

export async function POST(req: Request) {
  try {
    const { name, email, category, message, deviceInfo } = await req.json();

    if (!email || !message) {
      return NextResponse.json({ error: "Email and message are required" }, { status: 400 });
    }

    const now = new Date().toISOString();

    // 1. Firestoreにバックアップ保存
    let firestoreSaved = false;
    if (adminDb) {
      try {
        await adminDb.collection("contacts").add({
          name: name || "",
          email,
          category,
          message,
          deviceInfo: deviceInfo || "",
          createdAt: now,
        });
        firestoreSaved = true;
      } catch (fsError) {
        console.error("Failed to save contact to Firestore:", fsError);
      }
    }

    // 2. nodemailer でメール送信
    const smtpHost = process.env.EMAIL_SMTP_HOST;
    const smtpPort = Number(process.env.EMAIL_SMTP_PORT || 587);
    const smtpUser = process.env.EMAIL_SMTP_USER;
    const smtpPass = process.env.EMAIL_SMTP_PASSWORD;
    const fromAddress = process.env.EMAIL_FROM_ADDRESS || "no-reply@example.com";

    let emailSent = false;
    let emailError = "";

    if (smtpHost && smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465, // 465ポートは通常SSL/TLS
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        const categoryText = categoryLabels[category] || category || "その他";
        const emailSubject = `【経費ポケット】お問い合わせ: ${categoryText}`;
        const emailBody = `
「経費ポケット」のアプリ内フォームから、以下のお問い合わせがありました。

--------------------------------------------------
■ お名前
${name || "未入力"}

■ 返信用メールアドレス
${email}

■ お問い合わせの種類
${categoryText}

■ お問い合わせ内容
${message}

■ クライアント情報
${deviceInfo || "取得できませんでした"}

■ 送信日時
${now}
--------------------------------------------------
※このメールは「経費ポケット」お問い合わせフォームから自動送信されました。
        `.trim();

        await transporter.sendMail({
          from: `"経費ポケット 問い合わせ" <${fromAddress}>`,
          to: "toiawase.kt7@gmail.com",
          replyTo: email,
          subject: emailSubject,
          text: emailBody,
        });

        emailSent = true;
      } catch (mailError: any) {
        console.error("Nodemailer sendMail failed:", mailError);
        emailError = mailError.message;
      }
    } else {
      console.warn("SMTP settings are missing. Simulating mail send.");
      emailSent = true;
    }

    if (!emailSent && !firestoreSaved) {
      return NextResponse.json({
        error: `Failed to save or send message. Mail Error: ${emailError}`
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      emailSent,
      firestoreSaved,
      simulated: !smtpHost,
    });
  } catch (error: any) {
    console.error("Contact API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
