# MarketHub Supabase Email PIN Setup

MarketHub now supports entering a 6-digit email verification code in the app at `/verify-email`.

The PIN is generated and verified by Supabase Auth. Do not generate or store confirmation codes in React.

## Supabase Dashboard Steps

1. Open Supabase Dashboard.
2. Go to Authentication.
3. Open Email Templates.
4. Select the Confirm signup template.
5. Use this subject:

```text
Your MarketHub verification code
```

6. Use this body:

```text
Your MarketHub verification code is: {{ .Token }}

Enter this code in MarketHub to verify your email address.

If you did not create a MarketHub account, you can ignore this email.
```

You may keep a fallback confirmation link in the template if needed, but the main visible instruction should show `{{ .Token }}` clearly.

## Redirect URLs

Add these URLs in Supabase Authentication URL Configuration:

```text
https://market-app-like-alibaba.vercel.app/verify-email
https://market-app-like-alibaba.vercel.app/reset-password
http://localhost:5173/verify-email
http://localhost:5173/reset-password
```
