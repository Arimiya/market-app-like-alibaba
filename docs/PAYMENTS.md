# MarketHub Payment Module

## Recommended Provider

Use Paystack for the first Ghana launch because it supports card payments and Ghana Mobile Money through hosted checkout or secure server-side APIs. Customers should enter card or mobile money details only on Paystack-hosted/secure payment surfaces, not inside MarketHub forms.

## Database Structure

### orders

- id
- order_number
- customer_id
- customer_name
- phone
- delivery_address
- region
- city
- delivery_method
- product_subtotal
- delivery_fee
- service_fee
- total
- currency
- status: Pending, Paid, Processing, Cancelled, Refunded
- created_at

### order_items

- id
- order_id
- product_id
- vendor_id or vendor_name
- product_name
- quantity
- unit_price
- subtotal

### payments

- id
- order_id
- customer_id
- provider: PAYSTACK
- payment_method: MOBILE_MONEY or CARD
- reference
- amount
- currency
- status: PENDING, SUCCESSFUL, FAILED, REFUNDED
- provider_status
- paid_at
- created_at
- updated_at

Do not store card numbers, CVV, expiry dates, mobile money PINs, OTPs, or full provider authorization payloads.

## API Flow

1. Customer validates cart and delivery information.
2. Backend creates an order with status `Pending`.
3. Backend creates a payment record with status `PENDING`.
4. Backend initializes Paystack transaction with amount, currency, email, callback URL, and metadata containing order/payment IDs.
5. Customer completes card or Mobile Money payment through Paystack checkout.
6. Paystack redirects customer to success or failure URL with transaction reference.
7. Backend verifies the reference using Paystack Verify Transaction API before marking payment `SUCCESSFUL`.
8. Backend marks order `Paid` only after successful verification.
9. Paystack webhook also updates payment status, but webhook signature must be verified before trusting the event.

## Environment Variables

Frontend:

- `VITE_PAYSTACK_PUBLIC_KEY`
- `VITE_PAYMENT_PROVIDER`

Backend:

- `PAYSTACK_SECRET_KEY`
- `PAYSTACK_WEBHOOK_SECRET`
- `PAYSTACK_CALLBACK_URL`

## Webhook Security

Paystack webhook handlers should:

- Read the raw request body.
- Compute an HMAC SHA-512 hash using `PAYSTACK_SECRET_KEY`.
- Compare it to the `x-paystack-signature` header.
- Reject unsigned or mismatched requests.
- Ignore duplicate events by payment reference.
- Verify transaction reference server-side before marking an order paid.

