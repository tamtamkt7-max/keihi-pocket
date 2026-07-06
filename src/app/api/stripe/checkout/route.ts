import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy", {
  apiVersion: "2025-02-27-preview" as any,
});

export async function POST(req: Request) {
  try {
    const { userId, email } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    if (!process.env.STRIPE_SECRET_KEY || !process.env.NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
    }

    // 呼び出し元のオリジンURLを取得
    const referer = req.headers.get("referer");
    const origin = referer ? new URL(referer).origin : "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: "subscription",
      customer_email: email || undefined,
      metadata: {
        userId,
      },
      success_url: `${origin}/settings?stripe=success`,
      cancel_url: `${origin}/settings?stripe=cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
