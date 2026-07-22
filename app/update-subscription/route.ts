import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "You must be signed in to update subscription." },
                { status: 401 }
            );
        }

        const { planId, billingCycle, amount, status } = await request.json();

        const allowedPlans = new Set(["free", "pro", "elite"]);
        const allowedCycles = new Set(["monthly", "yearly"]);

        if (!allowedPlans.has(planId)) {
            return NextResponse.json(
                { success: false, message: "Invalid plan selected." },
                { status: 400 }
            );
        }

        if (!allowedCycles.has(billingCycle)) {
            return NextResponse.json(
                { success: false, message: "Invalid billing cycle." },
                { status: 400 }
            );
        }

        const client = await clerkClient();

        await client.users.updateUserMetadata(userId, {
            publicMetadata: {
                subscriptionPlan: planId,
                subscriptionBillingCycle: billingCycle,
                subscriptionStatus: status === "active" ? "active" : "inactive",
                subscriptionAmount: Number(amount) || 0,
                subscriptionActivatedAt: new Date().toISOString(),
            },
        });

        return NextResponse.json({
            success: true,
            message: "Subscription updated.",
        });
    } catch (error) {
        console.error("Failed to update subscription:", error);

        return NextResponse.json(
            { success: false, message: "Unable to update subscription." },
            { status: 500 }
        );
    }
}
