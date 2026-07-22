import Razorpay from "razorpay";

const getRazorpayCredentials = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay keys are missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  }

  return { keyId, keySecret };
};

let razorpayInstance: Razorpay | null = null;

export const getRazorpayInstance = () => {
  if (razorpayInstance) return razorpayInstance;

  const { keyId, keySecret } = getRazorpayCredentials();

  // Reuse a single server-side instance for order creation requests.
  razorpayInstance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  return razorpayInstance;
};

export const getRazorpayKeyId = () => getRazorpayCredentials().keyId;

export const getRazorpayKeySecret = () => getRazorpayCredentials().keySecret;
