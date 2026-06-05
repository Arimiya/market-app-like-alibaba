# MarketHub Capacitor Android Setup

Capacitor is not installed in this repository yet. Install it only after approving the dependency addition.

## Suggested App Identity

- App name: `MarketHub`
- Package ID: `com.markethub.app`
- Web output directory: `dist`

## Install And Initialize

```bash
npm install @capacitor/core @capacitor/cli
npx cap init MarketHub com.markethub.app --web-dir=dist
npm install @capacitor/android
npx cap add android
```

## Build And Sync

```bash
npm run build
npx cap sync android
npx cap open android
```

## Android Studio Release

1. Open the Android project with `npx cap open android`.
2. Set final app icon and splash assets.
3. Configure signing credentials.
4. Build a signed Android App Bundle (`.aab`).
5. Test on physical Android devices before uploading to Google Play.

## Important Before Release

- Use production Supabase environment variables.
- Confirm all policy URLs are live.
- Keep checkout labelled test mode until live payment verification exists.
- Replace placeholder support email and icons.
- Verify account deletion request workflow.

