# MarketHub App Store Release Checklist

Use this checklist for both Google Play Store and Apple App Store submission.

## Android App Bundle

- Status: Missing.
- Required: Capacitor Android project and signed `.aab`.
- Command path: `npm run build`, `npx cap add android`, `npx cap sync android`, `npx cap open android`.

## iOS Archive

- Status: Missing.
- Required: macOS, Xcode, Apple Developer account and archived iOS build.
- Command path: `npm run build`, `npx cap add ios`, `npx cap sync ios`, `npx cap open ios`.

## App Icon

- Status: In Progress.
- Placeholder SVG icons exist.
- Required: final production icons for Android and iOS.

## Splash Screen

- Status: In Progress.
- PWA theme exists.
- Required: native splash assets after Capacitor setup.

## Store Screenshots

- Status: Missing.
- Capture Home, Categories, Product Details, Seller Upload, Account, Report Product and Admin Moderation.

## Short Description

Buy and sell products across Ghana with trusted sellers.

## Full Description

Use `docs/STORE_LISTING_DRAFT.md` as the starting point.

## Privacy Policy

- Public route: `/privacy`.
- Must be reviewed and finalized before release.

## Terms And Conditions

- Public route: `/terms`.
- Must cover buyer conduct, seller rules, moderation and current payment status.

## Data Safety Information

- See `docs/DATA_SAFETY_NOTES.md`.
- Confirm actual data collection, sharing and deletion answers before submission.

## Account Deletion

- Public route: `/delete-account`.
- Logged-in users can submit deletion requests for admin review.

## User-Generated Content Policy

- Sellers upload descriptions, images and videos.
- Buyers/guests can report unsafe products and sellers.
- Admins can moderate reports.

## Product Reporting

- Product details include Report Product.
- Store page includes Report Seller.

## Seller Policy

- Public route: `/seller-policy`.
- Sellers must publish lawful, accurate listings only.

## Prohibited-Items Policy

- Public route: `/prohibited-items`.
- Prohibits illegal goods, weapons, drugs, stolen goods, counterfeit goods, adult explicit content, hate/violent content, dangerous chemicals and fraudulent listings.

## Moderation Tools

- Product reports table.
- Seller reports table.
- Admin dispute/moderation panel.
- Admin can suspend/remove products and suspend sellers.

## Test Accounts For Reviewers

Prepare safe demo accounts before submission:

- Customer reviewer account.
- Approved seller reviewer account.
- Optional limited admin account if requested by store review.

Do not include real private customer data in reviewer accounts.

## Contact / Support Email

- Placeholder: `support@markethub.example`.
- Replace with a real monitored address.

## Payment Status

- Status: Test Mode.
- Online payments are not active yet.
- Do not claim live payment processing, payouts or bank settlement.

## Final QA Checklist

- Guest browsing works.
- Signup/login works.
- Profile update works.
- Account deletion request works.
- Seller application works.
- Approved seller can publish immediately.
- Product media appears on cards/details.
- Reports submit correctly.
- Admin moderation works.
- Checkout clearly says test mode.
- Mobile bottom navigation works.
- App icons/splash/screenshots finalized.

