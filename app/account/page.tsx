import { UserProfile } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import DisabilitySelector from "@/components/DisabilitySelector";
import Link from "next/link";

export default async function AccountPage() {
  const user = await currentUser();

  const subscriptionPlan = (user?.publicMetadata?.subscriptionPlan as string | undefined) ?? "free";
  const subscriptionBillingCycle = user?.publicMetadata?.subscriptionBillingCycle as string | undefined;
  const isActiveSubscription = (user?.publicMetadata?.subscriptionStatus as string | undefined) === "active";
  const planLabel = `${subscriptionPlan.toUpperCase()}${subscriptionBillingCycle ? ` (${subscriptionBillingCycle})` : ""}`;

  return (
    <div style={{ padding: "40px" }}>
      <Link href="/subscription" style={{ textDecoration: "none" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "16px",
            padding: "6px 12px",
            borderRadius: "9999px",
            border: "1px solid rgba(251, 191, 36, 0.35)",
            background: "rgba(251, 191, 36, 0.1)",
            color: "#fcd34d",
            fontSize: "12px",
            fontWeight: 600,
            letterSpacing: "0.02em",
            cursor: "pointer",
          }}
          title="Manage subscription"
        >
          <span>{isActiveSubscription ? "Active Plan" : "Current Plan"}</span>
          <span style={{ color: "#ffffff" }}>{planLabel}</span>
        </div>
      </Link>
      <UserProfile />
      <DisabilitySelector />
    </div>
  );
}