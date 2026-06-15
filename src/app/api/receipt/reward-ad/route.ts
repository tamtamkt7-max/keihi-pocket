import { NextRequest, NextResponse } from "next/server";
import { grantRewardAdBonus, verifyFirebaseIdToken } from "@/lib/receipt/highAccuracyUsageServer";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : "";
    const uid = idToken ? await verifyFirebaseIdToken(idToken) : null;

    if (!uid) {
      return NextResponse.json(
        { available: false, message: "通常の入力はこのまま使えます。" },
        { status: 401 }
      );
    }

    const result = await grantRewardAdBonus(uid, idToken);
    if (!result.ok) {
      return NextResponse.json(
        {
          available: false,
          message: "今日はここまでです。手入力できます。",
          rewardAdWatchedCount: result.rewardAdWatchedCount,
          rewardAdDailyLimit: result.rewardAdDailyLimit,
          rewardBonusReads: result.rewardBonusReads,
          rewardBonusRemaining: result.rewardBonusRemaining,
        },
        { status: 429 }
      );
    }

    return NextResponse.json({
      available: true,
      message: `あと${result.rewardBonusReads}件読み取れます。`,
      rewardAdWatchedCount: result.rewardAdWatchedCount,
      rewardAdDailyLimit: result.rewardAdDailyLimit,
      rewardBonusReads: result.rewardBonusReads,
      rewardBonusRemaining: result.rewardBonusRemaining,
    });
  } catch (error) {
    console.warn("[receipt-reward-ad] failed", error);
    return NextResponse.json(
      { available: false, message: "手入力もできます。" },
      { status: 502 }
    );
  }
}
