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
