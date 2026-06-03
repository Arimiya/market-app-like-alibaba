export type PaymentProvider = "PAYSTACK";
export type PaymentMethod = "MOBILE_MONEY" | "CARD";
export type PaymentStatus = "PENDING" | "SUCCESSFUL" | "FAILED" | "REFUNDED";

export type PaymentRecord = {
  id: number;
  orderId: number;
  customerId: string;
  provider: PaymentProvider;
  method: PaymentMethod;
  reference: string;
  amount: number;
  currency: "GHS";
  status: PaymentStatus;
  providerStatus?: string;
  createdAt: string;
  paidAt?: string;
};

export function createPaymentReference(orderNumber: string) {
  return `MH-PAY-${orderNumber}-${Date.now()}`;
}

export function getPaymentProviderConfig() {
  return {
    provider: (import.meta.env.VITE_PAYMENT_PROVIDER || "paystack").toUpperCase(),
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || ""
  };
}

export function createPendingPayment(input: {
  orderId: number;
  orderNumber: string;
  customerId: string;
  amount: number;
  method: PaymentMethod;
}): PaymentRecord {
  return {
    id: Date.now(),
    orderId: input.orderId,
    customerId: input.customerId,
    provider: "PAYSTACK",
    method: input.method,
    reference: createPaymentReference(input.orderNumber),
    amount: input.amount,
    currency: "GHS",
    status: "PENDING",
    createdAt: new Date().toLocaleString()
  };
}

export async function simulateBackendPaymentVerification(payment: PaymentRecord, outcome: "success" | "failed") {
  await new Promise((resolve) => window.setTimeout(resolve, 450));
  return {
    reference: payment.reference,
    providerStatus: outcome === "success" ? "success" : "failed",
    status: outcome === "success" ? "SUCCESSFUL" as const : "FAILED" as const
  };
}

export async function verifyPaystackWebhookSignature(rawBody: string, signature: string, secretKey: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secretKey),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const digest = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const expected = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return expected === signature;
}

export async function handleVerifiedPaystackWebhook(input: {
  rawBody: string;
  signature: string;
  secretKey: string;
}) {
  const isValid = await verifyPaystackWebhookSignature(input.rawBody, input.signature, input.secretKey);
  if (!isValid) {
    return { ok: false, status: "FAILED" as PaymentStatus, reason: "Invalid webhook signature" };
  }

  const event = JSON.parse(input.rawBody) as {
    event?: string;
    data?: {
      reference?: string;
      amount?: number;
      currency?: string;
      status?: string;
    };
  };

  const providerStatus = event.data?.status || "unknown";
  const status: PaymentStatus =
    providerStatus === "success"
      ? "SUCCESSFUL"
      : providerStatus === "refunded"
        ? "REFUNDED"
        : providerStatus === "failed"
          ? "FAILED"
          : "PENDING";

  return {
    ok: true,
    reference: event.data?.reference,
    amount: event.data?.amount,
    currency: event.data?.currency,
    providerStatus,
    status
  };
}
