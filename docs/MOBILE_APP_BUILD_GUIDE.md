# MarketHub Mobile App Build Guide

MarketHub is currently a React/Vite web app deployed on Vercel. Google Play Store and Apple App Store require packaged mobile apps, not only a website URL. This guide prepares MarketHub for Capacitor-based Android and iOS packaging.

## Current Status

- Framework: React + Vite + TypeScript.
- App name: MarketHub.
- Package ID / Bundle ID suggestion: `com.markethub.app`.
- Web build output: `dist`.
- Capacitor config file: `capacitor.config.json`.
- Capacitor dependencies: not installed yet. Install them only after approving the dependency addition.
- Payments: test mode only. Do not claim live payment support in store review notes.

## Required Developer Accounts

- Google Play Console developer account for Android release.
- Apple Developer Program membership for iOS release.
- Apple development machine with macOS and Xcode for iOS builds.

## Install Capacitor After Approval

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android
npm install @capacitor/ios
```

## Android Setup

```bash
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

## Generate Android App Bundle (.aab)

1. Open Android Studio with `npx cap open android`.
2. Confirm application ID is `com.markethub.app`.
3. Add final adaptive app icons and splash assets.
4. Configure release signing in Android Studio.
5. Build `Build > Generate Signed Bundle / APK`.
6. Select `Android App Bundle`.
7. Upload the generated `.aab` to Google Play Console.

## iOS Setup

Run these commands on macOS with Xcode installed:

```bash
npm run build
npx cap add ios
npx cap sync ios
npx cap open ios
```

## iOS Archive

1. Open the iOS project in Xcode with `npx cap open ios`.
2. Confirm bundle identifier is `com.markethub.app`.
3. Select the correct Apple Team.
4. Add final app icons and launch screen assets.
5. Test on an iPhone simulator and physical device.
6. Use `Product > Archive`.
7. Upload through Xcode Organizer or Transporter.

## Required App Assets

- Final 1024x1024 App Store icon.
- Android adaptive icon foreground/background.
- Native splash screen artwork.
- Phone screenshots for Google Play and App Store.
- Tablet screenshots if tablet support is claimed.

## Required Public URLs

Use production URLs after deployment:

- Privacy Policy: `https://market-app-like-alibaba.vercel.app/privacy`
- Terms: `https://market-app-like-alibaba.vercel.app/terms`
- Delete Account: `https://market-app-like-alibaba.vercel.app/delete-account`
- Seller Policy: `https://market-app-like-alibaba.vercel.app/seller-policy`
- Prohibited Items: `https://market-app-like-alibaba.vercel.app/prohibited-items`
- Contact: `https://market-app-like-alibaba.vercel.app/contact`
- Help Center: `https://market-app-like-alibaba.vercel.app/help`

## Support And Reviewer Information

Before submission, prepare:

- Real support email, for example `support@yourdomain.com`.
- Support URL.
- Privacy Policy URL.
- Test customer account for reviewers.
- Test approved seller account for reviewers.
- Test admin account only if required for moderation review, with limited demo data.
- Clear reviewer note that payments are not live and checkout is test mode only.

## Production Build And Sync

```bash
npm run build
npx cap sync android
npx cap sync ios
```

## Final Mobile QA

- Open app fresh as guest.
- Browse Home, Categories, Stores, Deals and Product Details.
- Create account and log in.
- Request account deletion.
- Apply as seller.
- Upload product images and optional video as approved seller.
- Publish product immediately.
- Report product and seller.
- Confirm admin can review/suspend/remove.
- Confirm checkout says online payments are not active.

