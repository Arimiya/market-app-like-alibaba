# MarketHub Data Safety Notes

Use this file to prepare Google Play Data Safety answers. Review with legal/compliance before production release.

| Data | Why Collected | Shared? | Required? | Deletion |
| --- | --- | --- | --- | --- |
| Name | Account profile, orders, seller identity | Not sold; may be visible in marketplace/account workflows | Required for account use | User can request deletion |
| Email | Login, verification, support, notifications | Not sold; used by Supabase Auth | Required | User can request deletion |
| Phone number | Delivery, seller contact, account profile | Not sold; used for marketplace operations | Optional for some users, required for sellers | User can request deletion where legally possible |
| Address | Delivery and seller business location | Shared only for order/delivery operations when implemented | Required for delivery/seller applications | User can request deletion where legally possible |
| Profile information | Personalization and account management | Not sold | Required for account | User can request deletion |
| Seller business details | Seller approval and storefronts | Storefront details may be public; verification documents are private | Required for sellers | Retained where required for legal/safety review |
| Product uploads | Marketplace listings | Public when product is published | Required for sellers | Seller/admin can remove products |
| Product images/videos | Buyer product review and listing display | Public for published products | Required images, optional videos | Seller/admin can remove media |
| Orders | Purchase and delivery records | Shared with buyer/seller/order operations | Required when checkout is live | Legal records may be retained |
| Payment references | Payment reconciliation when payments are live | Shared with payment provider only when integrated | Required for paid orders | Legal/payment records may be retained |
| Messages | Buyer-seller communication | Visible only to conversation participants | Optional | Deletion subject to dispute/legal retention |
| Reports | Safety moderation | Admin review only | Optional | Retained for safety and abuse prevention |
| Device/app usage analytics | App quality and fraud prevention if added | Not currently implemented | Not currently collected | Depends on analytics provider if added |

Current status:

- Payments are test mode only.
- Payouts and live settlement are not active.
- Verification documents use private Supabase Storage.
- Account deletion is a request workflow for admin processing.

