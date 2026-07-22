import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export const runtime = "nodejs";

export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "You must be signed in." },
                { status: 401 }
            );
        }

        const client = await clerkClient();
        const user = await client.users.getUser(userId);

        const planId = user.publicMetadata?.subscriptionPlan;
        const billingCycle = user.publicMetadata?.subscriptionBillingCycle;
        const status = user.publicMetadata?.subscriptionStatus;

        return NextResponse.json({
            success: true,
            subscription: {
                planId: typeof planId === "string" ? planId : "free",
                billingCycle: billingCycle === "yearly" ? "yearly" : "monthly",
                status: status === "active" ? "active" : "inactive",
            },
        });
    } catch (error) {
        console.error("Failed to fetch subscription status:", error);

        return NextResponse.json(
            { success: false, message: "Unable to fetch subscription status." },
            { status: 500 }
        );
    }
}
