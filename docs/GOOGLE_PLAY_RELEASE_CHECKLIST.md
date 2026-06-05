# MarketHub Google Play Release Checklist

MarketHub is a Ghana/Africa multi-vendor marketplace for customers, wholesale buyers and approved sellers.

## Android App Bundle Build

- Status: Not complete.
- Build target: Android App Bundle (`.aab`) from a Capacitor Android project.
- Required before upload: install Capacitor, add Android platform, test in Android Studio, generate signed release bundle.

## App Name And Package Name

- App name: MarketHub
- Suggested package ID: `com.markethub.app`
- Confirm ownership of brand name before publishing.

## App Icon

- Placeholder SVG icons exist in `public/icons/`.
- Replace with final 512x512 PNG store icon before release.

## Splash Screen

- PWA theme color is configured.
- Native splash screen requires Capacitor setup and final assets.

## Privacy Policy

- Public page route: `/privacy`
- Replace placeholder copy with lawyer-reviewed production policy before release.

## Terms And Conditions

- Public page route: `/terms`
- Include marketplace rules, seller obligations, buyer conduct, moderation and payment status.

## Data Safety Information

- See `docs/DATA_SAFETY_NOTES.md`.
- Confirm exact collection, sharing, security and deletion answers before Play submission.

## User-Generated Content Rules

- Sellers can upload product titles, descriptions, images and videos.
- Users can submit reports.
- Admins can suspend or remove products and sellers.
- Public policy pages explain prohibited content.

## Product Reporting

- Product details page includes Report Product.
- Store cards include Report Seller.
- Admin dashboard includes moderation workflow.

## Account Deletion

- Public route: `/delete-account`
- Logged-in users can submit deletion requests.
- Admin processing is required for legal and transaction-record review.

## Content Moderation

- Approved sellers can publish immediately.
- Admins can suspend, remove or reinstate products.
- Buyers can report products and sellers.
- Basic prohibited keyword checks are present; deeper automated moderation is still needed.

## App Screenshots

Prepare screenshots for:

- Home marketplace
- Product details with gallery/video
- Seller application
- Seller product upload
- Cart/checkout test-mode notice
- Account/profile
- Report product
- Admin moderation

## Store Listing Text

- See `docs/PLAY_STORE_LISTING_DRAFT.md`.

## Contact Email

- Placeholder: `support@markethub.example`
- Replace with a real monitored support address.

## Support URL

- Placeholder: `https://market-app-like-alibaba.vercel.app/help`

## Testing Checklist

- Create account
- Verify email code
- Log in and refresh session
- Apply as seller
- Approve seller as admin
- Upload product images and optional video
- Publish product immediately
- View product as guest
- Report product
- Admin suspend/remove product
- Request account deletion
- Confirm checkout says test mode

## Production Environment Variables

Required:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Do not expose service-role keys in frontend code.

## Capacitor Android Setup Commands

Capacitor is not installed yet. After approval to add dependencies:

```bash
npm install @capacitor/core @capacitor/cli
npx cap init MarketHub com.markethub.app --web-dir=dist
npm install @capacitor/android
npx cap add android
npm run build
npx cap sync android
npx cap open android
```

Generate the signed Android App Bundle from Android Studio after testing.

