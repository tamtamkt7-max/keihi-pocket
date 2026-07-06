import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy", {
  apiVersion: "2025-02-27-preview" as any,
});

// Firebase Admin SDKの初期化
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
      // プロジェクトIDのみで初期化
      initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    }
  } catch (err) {
    console.error("Firebase admin initialization failed in stripe webhook:", err);
  }
}

const adminDb = getApps().length > 0 ? getFirestore() : null;

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") || "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      console.warn("Webhook running without signature verification");
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    if (!adminDb) {
      console.error("Firestore Admin is not available");
      return NextResponse.json({ error: "Firestore Admin is not available" }, { status: 500 });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const stripeCustomerId = session.customer as string;
        const stripeSubscriptionId = session.subscription as string;

        if (userId) {
          await adminDb.collection("users").doc(userId).set({
            plan: "plus",
            subscriptionStatus: "active",
            stripeCustomerId,
            stripeSubscriptionId,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
          console.log(`User ${userId} successfully subscribed to plus plan (checkout).`);
        }
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as any;
        const stripeCustomerId = invoice.customer as string;
        const stripeSubscriptionId = invoice.subscription as string;

        const usersSnap = await adminDb.collection("users")
          .where("stripeCustomerId", "==", stripeCustomerId)
          .limit(1)
          .get();

        if (!usersSnap.empty) {
          const userDoc = usersSnap.docs[0];
          await userDoc.ref.set({
            plan: "plus",
            subscriptionStatus: "active",
            stripeSubscriptionId,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
          console.log(`Invoice paid for customer ${stripeCustomerId}. Plan state verified/updated to active plus.`);
        }
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeCustomerId = subscription.customer as string;
        const status = subscription.status;

        const usersSnap = await adminDb.collection("users")
          .where("stripeCustomerId", "==", stripeCustomerId)
          .limit(1)
          .get();

        if (!usersSnap.empty) {
          const userDoc = usersSnap.docs[0];
          const isPlus = status === "active";
          await userDoc.ref.set({
            plan: isPlus ? "plus" : "free",
            subscriptionStatus: isPlus ? "active" : "inactive",
            updatedAt: new Date().toISOString(),
          }, { merge: true });
          console.log(`Subscription updated for customer ${stripeCustomerId}: isPlus=${isPlus}`);
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeCustomerId = subscription.customer as string;

        const usersSnap = await adminDb.collection("users")
          .where("stripeCustomerId", "==", stripeCustomerId)
          .limit(1)
          .get();

        if (!usersSnap.empty) {
          const userDoc = usersSnap.docs[0];
          await userDoc.ref.set({
            plan: "free",
            subscriptionStatus: "inactive",
            stripeSubscriptionId: null,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
          console.log(`Subscription deleted for customer ${stripeCustomerId}. Downgraded to free.`);
        }
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
