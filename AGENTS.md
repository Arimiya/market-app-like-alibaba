# AGENTS.md

## Project

**MarketHub** — a multi-vendor e-commerce marketplace for African customers and sellers.

## Main User Roles

- Admin
- Vendor
- Customer

## Development Rules

- Inspect existing code before creating new components.
- Reuse current UI components and design system where possible.
- Do not remove existing working features without explaining why.
- Keep pages responsive for desktop, tablet and mobile.
- Validate all form inputs on both frontend and backend.
- Protect routes by user role.
- Never expose secrets, payment keys or private documents.
- Never calculate sensitive payment or commission totals only in the browser.
- Use clear loading, empty, success and error states.
- Use real database data instead of placeholder statistics.
- Run linting, type checking and available tests after each completed feature.
- Report every file changed and any setup commands the user needs to run.

## Preferred Delivery Approach

- Work on one feature at a time.
- Explain the plan before making large architectural changes.
- Ask before installing major new production dependencies.
