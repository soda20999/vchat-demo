# Findings: Login Page Plan

## Project Facts

- Project uses `next@16.2.4`, React `19.2.4`, and App Router under `src/app`.
- `AGENTS.md` requires reading local Next.js docs in `node_modules/next/dist/docs/` before code changes.
- Relevant local docs confirm:
  - App Router pages are file-system routes under `app`.
  - `page.tsx` makes a route segment public.
  - In Next.js 16, Middleware is now called Proxy.
  - `proxy.ts` belongs at project root or under `src` when using a `src` app folder.

## Existing Auth Surface

- `src/app/auth/page.tsx` already exists and implements login/register mode switching.
- `src/app/api/auth/login/route.ts` exists and:
  - validates `email` and `password`
  - verifies password
  - creates access and refresh tokens
  - sets `access_token` and `refresh_token` HTTP-only cookies
- `src/app/api/auth/register/route.ts` exists and:
  - validates `username`, `email`, and `password`
  - checks username/email uniqueness
  - creates the user
- `src/app/api/auth/refresh/route.ts` and `logout` also exist.
- `src/lib/validators.ts` defines:
  - `loginSchema`: email + password
  - `registerSchema`: username + email + password

## Routing And Protection

- `src/proxy.ts` already protects non-public routes.
- `/auth`, `/_next`, `/favicon`, and `/api/auth` are public.
- Authenticated users hitting `/auth` are redirected to `/`.
- Unauthenticated page requests redirect to `/auth`.
- Unauthenticated API requests outside `/api/auth` return 401 JSON.

## UI/Layout Concerns

- `src/app/layout.tsx` currently renders `RootLayoutInitializer`, `Sidebar`, and `<main>` for every route.
- Because `/auth` is inside the same root layout, the auth page will inherit the app sidebar.
- A route group for authenticated app routes is the cleanest way to keep `/auth` visually separate.

## Existing Issue

- `src/app/auth/page.tsx` contains mojibake text and comments.
- The username input placeholder appears broken in the captured content, so the current page may fail compile or render incorrectly.

## 2026-05-25 Refresh

- Current package versions: `next@16.2.4`, `react@19.2.4`, Tailwind CSS v4 via `@tailwindcss/postcss`.
- Local Next.js 16 docs read before implementation planning:
  - `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`
  - `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route-groups.md`
  - `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`
  - `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`
- Docs confirm:
  - `app/layout.tsx` root layout is required and must contain `html` and `body`.
  - Nested layouts wrap child pages.
  - Route groups such as `(app)` do not affect URL paths and can opt selected routes into a shared layout.
  - `proxy.ts` may live in `src` when the app folder is also under `src`.
  - Next 16 renamed Middleware to Proxy; the named export should be `proxy`.
- Current `src/proxy.ts` already exposes `/auth` and `/api/auth/*` as public and redirects authenticated `/auth` users to `/`.
- Current root layout renders `RootLayoutInitializer`, `Sidebar`, and `<main>` for every route. This makes `/auth` visually depend on app chrome unless the app shell moves into a route group.
- `RootLayoutInitializer` and `Sidebar` both contain path-specific `/auth` exceptions. Moving them into an authenticated app route group lets us remove the need for auth-page layout exceptions later, but the first implementation can leave their defensive checks in place to avoid unrelated churn.
- Existing reusable UI components are limited and dark-app oriented:
  - `Button` is full-width and gray/blue, not suitable as-is for a polished auth form primary/secondary button.
  - `SidebarButton` is sidebar-specific.
  - `FormTag` currently maps unrelated prompt field names.
  The auth page should use Tailwind directly for scoped form controls instead of stretching these components beyond their purpose.
- `src/app/auth/page.tsx` is currently syntactically broken around the username placeholder and contains mojibake UI copy.
- PowerShell note: paths containing `[id]` must be read with `-LiteralPath`, e.g. `src\app\conversation\[id]\page.tsx`.
- Project preference added to `AGENTS.md`: do not proactively fix existing Chinese mojibake/comments/encoding issues unless they block compile/runtime behavior; new user-facing copy should still be normal Chinese.

---

# Findings: Secure Markdown HTML Rendering

## Project Facts

- Project uses `next@16.2.4`, React `19.2.4`, App Router under `src/app`, Tailwind CSS v4, and `markdown-it`.
- Local Next.js 16 docs read before planning:
  - `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
  - `node_modules/next/dist/docs/01-app/02-guides/third-party-libraries.md`
- Relevant doc conclusions:
  - Components that use browser-only APIs or client-side third-party libraries should be Client Components.
  - A file marked `'use client'` defines a client boundary; imports used by that component are part of the client bundle.
- `src/components/Ui/MarkdownBlock.tsx` is already a Client Component.

## Markdown Rendering Path

- `src/components/Chat/MessageBubble.tsx` dynamically imports `MarkdownBlock`.
- `src/components/Ui/MarkdownBlock.tsx`:
  - creates a shared `MarkdownIt` parser
  - enables `html: true`, `breaks: true`, and `linkify: true`
  - applies table styles through `applyMarkdownTableStyles`
  - renders Markdown to HTML with `markdownParser.render(deferredContent)`
  - appends a streaming cursor HTML span when status is `streaming`
  - sends the final string directly to `dangerouslySetInnerHTML`
- `src/components/Ui/Table.tsx` injects table wrapper and cell classes by overriding markdown-it renderer rules.

## Dependency State

- `markdown-it` and `@types/markdown-it` are installed.
- `dompurify` is not currently installed.
- No existing sanitizer was found via `rg` for `DOMPurify`, `sanitize`, or related terms.

## Security Requirement

- Markdown must be parsed first, then sanitized before HTML insertion.
- Sanitization must use a whitelist approach.
- Scripts, event attributes, and dangerous protocols must be blocked.
- Only safe tags and attributes should remain.
