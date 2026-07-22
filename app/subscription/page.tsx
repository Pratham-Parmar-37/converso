"use client";

import Script from "next/script";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

type BillingCycle = "monthly" | "yearly";
type PlanId = "free" | "pro" | "elite";
type PaymentMethod = "card" | "upi" | "netbanking" | "wallets";

interface Plan {
  id: PlanId;
  name: string;
  monthlyPrice: number;
  companionLimit: string;
  badge?: string;
  features: string[];
  disabledFeatures: string[];
}

interface PaymentFormState {
  cardNumber: string;
  cardholderName: string;
  expiry: string;
  cvv: string;
  upiId: string;
  selectedUpiApp: string;
  selectedBank: string;
  selectedWallet: string;
}

interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
}

interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void | Promise<void>;
  modal?: {
    ondismiss?: () => void;
  };
  prefill?: {
    name?: string;
  };
  theme?: {
    color?: string;
  };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, callback: (response: unknown) => void) => void;
}

interface SubscriptionSnapshot {
  planId: PlanId;
  billingCycle: BillingCycle;
  status: "active" | "inactive";
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    companionLimit: "3 companions",
    features: ["10 sessions / month", "Math & Science subjects", "Community support"],
    disabledFeatures: ["Transcript downloads", "Skill Tree", "All subjects"],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 829,
    companionLimit: "20 companions",
    badge: "Most Popular",
    features: ["Unlimited sessions", "All 6 subjects", "Transcript downloads", "Voice mode", "Priority support"],
    disabledFeatures: ["Skill Tree", "API access"],
  },
  {
    id: "elite",
    name: "Elite",
    monthlyPrice: 2079,
    companionLimit: "Unlimited companions",
    badge: "Best Value",
    features: [
      "All Pro features",
      "Skill Tree progress tracking",
      "Advanced analytics",
      "API access",
      "Dedicated onboarding",
    ],
    disabledFeatures: [],
  },
];

const upiApps = ["GPay", "PhonePe", "Paytm", "BHIM"];
const banks = ["SBI", "HDFC", "ICICI", "Axis", "Kotak", "Yes Bank", "PNB", "Bank of Baroda"];
const wallets = ["Paytm", "Mobikwik", "Freecharge"];

const formatINR = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const getAnnualPrice = (monthlyPrice: number) => Math.round(monthlyPrice * 12 * 0.8);

const normalizePlanId = (value: string | undefined): PlanId | null =>
  value === "free" || value === "pro" || value === "elite" ? value : null;

const normalizeBillingCycle = (value: string | undefined): BillingCycle | null =>
  value === "monthly" || value === "yearly" ? value : null;

const SubscriptionPage = () => {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [step, setStep] = useState(0);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>("pro");
  const [liveSubscription, setLiveSubscription] = useState<SubscriptionSnapshot | null>(null);
  const [hasFetchedSubscription, setHasFetchedSubscription] = useState(false);
  const [isInitializedFromProfile, setIsInitializedFromProfile] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<PaymentFormState>({
    cardNumber: "",
    cardholderName: "",
    expiry: "",
    cvv: "",
    upiId: "",
    selectedUpiApp: "",
    selectedBank: "",
    selectedWallet: "",
  });

  const metadataPlan = user?.publicMetadata?.subscriptionPlan as string | undefined;
  const metadataBilling = user?.publicMetadata?.subscriptionBillingCycle as string | undefined;
  const metadataStatus = user?.publicMetadata?.subscriptionStatus as string | undefined;

  const metadataPlanId = normalizePlanId(metadataPlan);
  const metadataBillingCycle = normalizeBillingCycle(metadataBilling);

  const activePlanId = liveSubscription?.planId ?? metadataPlanId;
  const activeBillingCycle = liveSubscription?.billingCycle ?? metadataBillingCycle;
  const activeStatus = liveSubscription?.status ?? (metadataStatus === "active" ? "active" : "inactive");

  const refreshSubscriptionState = useCallback(async () => {
    try {
      const response = await fetch("/api/subscription-status", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) return;

      const payload = (await response.json()) as {
        success?: boolean;
        subscription?: { planId?: string; billingCycle?: string; status?: string };
      };

      if (!payload.success || !payload.subscription) return;

      const normalizedPlan = normalizePlanId(payload.subscription.planId);
      const normalizedCycle = normalizeBillingCycle(payload.subscription.billingCycle);
      const normalizedStatus =
        payload.subscription.status === "active" ? "active" : "inactive";

      if (!normalizedPlan || !normalizedCycle) return;

      setLiveSubscription({
        planId: normalizedPlan,
        billingCycle: normalizedCycle,
        status: normalizedStatus,
      });
    } catch {
      // If the refresh fails we keep the best-known local state.
    } finally {
      setHasFetchedSubscription(true);
    }
  }, []);

  const ensureRazorpayLoaded = useCallback(async () => {
    if (typeof window === "undefined") return false;

    if (window.Razorpay) {
      setIsRazorpayLoaded(true);
      return true;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-razorpay-checkout="true"]'
    );

    if (existingScript) {
      return new Promise<boolean>((resolve) => {
        const timeoutId = window.setTimeout(() => {
          resolve(Boolean(window.Razorpay));
        }, 10000);

        const complete = () => {
          window.clearTimeout(timeoutId);
          const loaded = Boolean(window.Razorpay);
          setIsRazorpayLoaded(loaded);
          resolve(loaded);
        };

        existingScript.addEventListener("load", complete, { once: true });
        existingScript.addEventListener("error", complete, { once: true });
      });
    }

    return new Promise<boolean>((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.dataset.razorpayCheckout = "true";

      const timeoutId = window.setTimeout(() => {
        setIsRazorpayLoaded(Boolean(window.Razorpay));
        resolve(Boolean(window.Razorpay));
      }, 10000);

      script.onload = () => {
        window.clearTimeout(timeoutId);
        setIsRazorpayLoaded(true);
        resolve(true);
      };

      script.onerror = () => {
        window.clearTimeout(timeoutId);
        setIsRazorpayLoaded(false);
        resolve(false);
      };

      document.body.appendChild(script);
    });
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    void refreshSubscriptionState();
  }, [isLoaded, refreshSubscriptionState]);

  useEffect(() => {
    if (!isLoaded) return;

    const handleFocus = () => {
      void refreshSubscriptionState();
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [isLoaded, refreshSubscriptionState]);

  useEffect(() => {
    if (!isLoaded || !hasFetchedSubscription || isInitializedFromProfile) return;

    if (activePlanId) {
      setSelectedPlanId(activePlanId);
    }

    if (activeBillingCycle) {
      setBillingCycle(activeBillingCycle);
    }

    setIsInitializedFromProfile(true);
  }, [
    isLoaded,
    hasFetchedSubscription,
    isInitializedFromProfile,
    activePlanId,
    activeBillingCycle,
  ]);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) ?? plans[1],
    [selectedPlanId]
  );

  const payableAmount =
    billingCycle === "monthly"
      ? selectedPlan.monthlyPrice
      : getAnnualPrice(selectedPlan.monthlyPrice);

  const priceLabel =
    billingCycle === "monthly"
      ? `${formatINR(selectedPlan.monthlyPrice)}/month`
      : `${formatINR(getAnnualPrice(selectedPlan.monthlyPrice))}/year`;

  const updateCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    const grouped = digits.replace(/(.{4})/g, "$1 ").trim();
    setForm((prev) => ({ ...prev, cardNumber: grouped }));
  };

  const updateExpiry = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    const formatted = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    setForm((prev) => ({ ...prev, expiry: formatted }));
  };

  const handleContinueToPayment = () => {
    setStep(1);
    setPaymentError("");
    router.replace("/subscription");
  };

  const handleStepChange = (nextStep: number) => {
    // Success step is only available after a completed action.
    if (nextStep === 2 && step !== 2) return;

    setIsProcessing(false);
    setPaymentError("");
    if (nextStep === 0) setErrors({});
    setStep(nextStep);
    router.replace("/subscription");
  };

  const handleBackToPlans = () => {
    setStep(0);
    setErrors({});
    setPaymentError("");
    router.replace("/subscription");
  };

  const handlePay = async () => {
    setPaymentError("");

    if (isFreePlan) {
      setIsProcessing(true);

      try {
        const updateResponse = await fetch("/update-subscription", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            planId: selectedPlan.id,
            billingCycle,
            amount: 0,
            status: "active",
          }),
        });

        const updatePayload = await updateResponse.json();

        if (!updateResponse.ok || !updatePayload.success) {
          throw new Error(updatePayload.message || "Failed to update free plan.");
        }

        await refreshSubscriptionState();
        await user?.reload();
        router.refresh();

        setStep(2);
        router.replace("/subscription");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to switch to free plan.";
        setPaymentError(message);
      } finally {
        setIsProcessing(false);
      }

      return;
    }

    const checkoutReady = await ensureRazorpayLoaded();

    if (!checkoutReady || typeof window === "undefined" || !window.Razorpay) {
      setPaymentError(
        "Unable to load Razorpay checkout right now. Check your connection/ad blockers and try again."
      );
      return;
    }

    setIsProcessing(true);

    try {
      const orderResponse = await fetch("/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: payableAmount,
          billingCycle,
          planId: selectedPlan.id,
        }),
      });

      const orderPayload = await orderResponse.json();

      if (!orderResponse.ok || !orderPayload.success) {
        throw new Error(orderPayload.message || "Failed to create Razorpay order.");
      }

      const order = orderPayload.order as RazorpayOrder;

      const razorpay = new window.Razorpay({
        key: orderPayload.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Converso",
        description: `${selectedPlan.name} plan (${billingCycle})`,
        order_id: order.id,
        prefill: {
          name: form.cardholderName.trim(),
        },
        theme: {
          color: "#f59e0b",
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
        handler: async (response) => {
          try {
            const verifyResponse = await fetch("/verify-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                ...response,
                planId: selectedPlan.id,
                billingCycle,
                amount: payableAmount,
              }),
            });

            const verifyPayload = await verifyResponse.json();

            if (!verifyResponse.ok || !verifyPayload.success) {
              throw new Error(verifyPayload.message || "Payment verification failed.");
            }

            await refreshSubscriptionState();
            await user?.reload();
            router.refresh();
            setStep(2);
            router.replace("/subscription");
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Payment verification failed.";
            setPaymentError(message);
          } finally {
            setIsProcessing(false);
          }
        },
      });

      razorpay.on("payment.failed", () => {
        setPaymentError("Payment was not completed. Please try the Razorpay test flow again.");
        setIsProcessing(false);
      });

      razorpay.open();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start payment.";
      setPaymentError(message);
      setIsProcessing(false);
    }
  };

  const isFreePlan = selectedPlan.id === "free";

  return (
    <main className="w-full max-w-6xl px-4 py-8 md:px-8 md:py-12">
      <Script
        id="razorpay-checkout-script"
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        data-razorpay-checkout="true"
        onLoad={() => setIsRazorpayLoaded(true)}
        onError={() => {
          setIsRazorpayLoaded(false);
          setPaymentError("Unable to load Razorpay checkout script.");
        }}
      />

      <section className="rounded-3xl border border-white/10 bg-[#080b12] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)] md:p-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 inline-flex rounded-full border border-amber-400/40 bg-amber-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">
              Subscription
            </p>
            <h1 className="bg-none text-3xl font-bold text-white md:text-4xl">Choose Your Converso Plan</h1>
            <p className="mt-2 text-sm text-white/65 md:text-base">
              Upgrade anytime. Pay securely with Razorpay in test mode before going live.
            </p>
            {isLoaded && (
              <p className="mt-3 inline-flex w-fit items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-semibold tracking-wide text-amber-300">
                <span>{activeStatus === "active" ? "Current Active Plan" : "Current Plan"}</span>
                <span className="text-white">
                  {(activePlanId ?? "free").toUpperCase()}
                  {activeBillingCycle ? ` (${activeBillingCycle})` : ""}
                </span>
              </p>
            )}
          </div>
          <div className="grid grid-cols-3 overflow-hidden rounded-full border border-white/10 bg-white/5 p-1 text-sm">
            {["Plans", "Payment", "Success"].map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => handleStepChange(index)}
                disabled={index === 2 && step !== 2}
                className={`rounded-full px-3 py-2 text-center transition ${step >= index ? "bg-amber-500 text-black" : "text-white/60"
                  } ${index === 2 && step !== 2 ? "cursor-not-allowed opacity-60" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {step === 0 && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
                <button
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition ${billingCycle === "monthly"
                    ? "bg-amber-500 text-black"
                    : "text-white/70 hover:text-white"
                    }`}
                  onClick={() => setBillingCycle("monthly")}
                >
                  Monthly
                </button>
                <button
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition ${billingCycle === "yearly"
                    ? "bg-amber-500 text-black"
                    : "text-white/70 hover:text-white"
                    }`}
                  onClick={() => setBillingCycle("yearly")}
                >
                  Yearly
                  <span className="ml-2 rounded-full bg-amber-300 px-2 py-0.5 text-[11px] font-bold text-black">
                    20% OFF
                  </span>
                </button>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {plans.map((plan) => {
                const planPrice =
                  billingCycle === "monthly"
                    ? plan.monthlyPrice
                    : getAnnualPrice(plan.monthlyPrice);
                const isSelected = plan.id === selectedPlanId;

                return (
                  <article
                    key={plan.id}
                    className={`relative flex flex-col rounded-2xl border p-5 transition ${isSelected
                      ? "border-amber-400 bg-amber-400/10 shadow-[0_0_0_1px_rgba(245,158,11,0.35)]"
                      : "border-white/10 bg-white/[0.02] hover:border-white/25"
                      }`}
                  >
                    {plan.badge && (
                      <span className="absolute right-4 top-4 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-black">
                        {plan.badge}
                      </span>
                    )}
                    <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                    <p className="mt-2 text-3xl font-extrabold text-amber-300">
                      {formatINR(planPrice)}
                      <span className="ml-1 text-base font-semibold text-white/70">
                        /{billingCycle === "monthly" ? "month" : "year"}
                      </span>
                    </p>
                    <p className="mt-2 text-sm text-white/80">{plan.companionLimit}</p>
                    <div className="mt-5 space-y-2 text-sm">
                      {plan.features.map((feature) => (
                        <p key={feature} className="flex items-center gap-2 text-white/90">
                          <span className="text-amber-300">✓</span>
                          {feature}
                        </p>
                      ))}
                      {plan.disabledFeatures.map((feature) => (
                        <p key={feature} className="flex items-center gap-2 text-white/40 line-through">
                          <span className="text-white/30">✕</span>
                          {feature}
                        </p>
                      ))}
                    </div>
                    <button
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`mt-auto w-full rounded-xl px-4 py-3 text-sm font-semibold transition ${isSelected
                        ? "bg-amber-500 text-black"
                        : "border border-white/20 bg-transparent text-white hover:border-white/35"
                        }`}
                    >
                      {isSelected ? "Selected" : "Choose Plan"}
                    </button>
                  </article>
                );
              })}
            </div>

            <div className="flex justify-end">
              <button onClick={handleContinueToPayment} className="btn-primary min-w-44 justify-center">
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <h2 className="text-2xl font-bold text-white">Complete Payment</h2>
              <p className="mt-1 text-sm text-white/60">
                Click the button below to securely pay via Razorpay.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={handleBackToPlans}
                  className="rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-white/85 transition hover:border-white/35"
                >
                  Back
                </button>
                <button
                  onClick={handlePay}
                  disabled={isProcessing}
                  className="btn-primary min-w-44 justify-center disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black/70 border-t-transparent" />
                      {isFreePlan ? "Switching plan..." : "Processing..."}
                    </span>
                  ) : isFreePlan ? (
                    "Switch to Free Plan"
                  ) : (
                    `Pay Now ${formatINR(payableAmount)}`
                  )}
                </button>
              </div>
              {paymentError && <p className="mt-3 text-sm text-red-400">{paymentError}</p>}
            </section>

            <aside className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <h3 className="text-xl font-bold text-white">Order Summary</h3>
              <div className="mt-4 space-y-3 text-sm text-white/80">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span>Plan</span>
                  <span className="font-semibold">{selectedPlan.name}</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span>Billing</span>
                  <span className="font-semibold capitalize">{billingCycle}</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span>Companion Limit</span>
                  <span className="font-semibold">{selectedPlan.companionLimit}</span>
                </div>
                {billingCycle === "yearly" && (
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span>Yearly Discount</span>
                    <span className="font-semibold text-amber-300">20% applied</span>
                  </div>
                )}
              </div>
              <div className="mt-5 rounded-xl bg-[#0d1118] p-4">
                <p className="text-sm text-white/60">Total payable</p>
                <p className="mt-1 text-3xl font-extrabold text-amber-300">{priceLabel}</p>
              </div>
            </aside>
          </div>
        )}

        {step === 2 && (
          <div className="mx-auto flex max-w-2xl flex-col items-center rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-10 text-center">
            <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-amber-500/20">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400/30" />
              <span className="relative text-4xl text-amber-300">✓</span>
            </div>
            <h2 className="text-3xl font-extrabold text-white">
              Welcome to Converso {selectedPlan.name}!
            </h2>
            <p className="mt-3 text-white/75">
              {selectedPlan.id === "free"
                ? "Your plan was updated successfully."
                : "Payment successful in Razorpay test mode. Your plan is now active and ready to use."}
            </p>
            <div className="mt-6 w-full rounded-xl border border-white/10 bg-[#0d1118] p-4 text-left">
              <p className="text-sm text-white/60">Billing Summary</p>
              <p className="mt-2 text-white">Plan: {selectedPlan.name}</p>
              <p className="text-white">Cycle: {billingCycle}</p>
              <p className="text-white">Amount: {priceLabel}</p>
            </div>
            <button
              onClick={() => router.push("/companions")}
              className="btn-primary mt-7 min-w-52 justify-center"
            >
              Start Learning Now
            </button>
          </div>
        )}
      </section>
    </main>
  );
};

export default SubscriptionPage;
