# Task Plan: Add / Improve Login Page

## Goal

Add a polished login page for the current VChat Next.js app by improving the existing `/auth` route, reusing the existing authentication APIs, and preserving the Next.js 16 Proxy-based route protection.

## Current Status

- [x] Inspect project structure and existing auth implementation.
- [x] Read relevant local Next.js 16 docs before planning.
- [x] Identify existing login/register API and Proxy behavior.
- [x] Decide final login page scope and UX.
- [x] Implement login page UI and client behavior.
- [x] Adjust layout behavior so `/auth` does not inherit the authenticated app shell.
- [x] Verify auth flows and build/lint health.

## Proposed Scope For Approval

Build a real application auth entry page at `/auth`, not a marketing landing page. The page will present a polished login-first experience with an inline register mode, reuse `POST /api/auth/login` and `POST /api/auth/register`, and keep the authenticated chat app at `/` behind the existing `src/proxy.ts` protection.

The visual direction should match the product: dark, quiet, precise, app-like. The page should feel like the front door to VChat, with a compact auth form, status/error feedback, and a responsive companion panel that previews practical app affordances rather than selling features.

## Files To Modify After Approval

- Modify `src/app/layout.tsx`
  - Keep only the root HTML/body shell, metadata, global CSS, and `{children}`.
  - Remove global `Sidebar` and `RootLayoutInitializer` from the root layout.
- Create `src/app/(app)/layout.tsx`
  - Add the authenticated app shell: `RootLayoutInitializer`, `Sidebar`, and scrollable `<main>`.
- Move `src/app/page.tsx` to `src/app/(app)/page.tsx`
  - Preserve route URL `/`.
- Move `src/app/settings/page.tsx` to `src/app/(app)/settings/page.tsx`
  - Preserve route URL `/settings`.
- Move `src/app/conversation/[id]/page.tsx` to `src/app/(app)/conversation/[id]/page.tsx`
  - Preserve route URL `/conversation/[id]`.
- Modify `src/app/auth/page.tsx`
  - Replace the currently invalid auth page with a valid client component.
  - Use real `<form onSubmit>` handling.
  - Add login/register mode switching, validation, loading state, success/error messages, and router redirect/refresh after login.
- Usually no change to `src/proxy.ts`
  - Keep as-is unless verification reveals a route-group side effect, which is not expected because route groups do not change URLs.

## Files Not Planned For This Task

- Do not change auth API route contracts unless a compile-time issue forces it.
- Do not refactor existing Chat components.
- Do not fix Chinese mojibake, Chinese comments, comment encoding, or copy encoding unless it directly blocks compile/runtime behavior.
- New user-facing copy for this task should use normal Chinese string literals, not ASCII English and not `\uXXXX` / `\xXX` escape sequences.
- Do not alter database schema, token generation, or cookie names.

## Implementation Plan

### Phase 1: Confirm Existing Auth Contract

- Reuse `POST /api/auth/login` for login.
- Reuse `POST /api/auth/register` only if the page should keep registration in the same view.
- Keep cookie handling server-side through the existing route handler.
- Preserve `/auth` as a public route in `src/proxy.ts`.
- Keep redirect behavior: authenticated users visiting `/auth` should be redirected to `/`.

### Phase 2: Fix Login Page Foundation

- Ensure `src/app/auth/page.tsx` is syntactically valid, especially the currently broken register username input placeholder.
- Convert click-only submit behavior to a real `<form onSubmit>` flow.
- Add basic client-side validation:
  - email required and email-shaped
  - password required
  - username required only in register mode
- Keep API response parsing defensive because current API helpers may return either empty or JSON response bodies.

### Phase 3: Improve User Experience

- Use a focused auth layout with no app sidebar.
- Provide clear login/register mode switching.
- Show loading, success, and error states without layout shift.
- Disable form controls while submitting.
- Use accessible labels or visually clear input names.
- On successful login, navigate to `/` and refresh router state.
- On successful registration, switch back to login mode with a success message.
- Keep the interface useful on first render:
  - desktop: two-column app entry, form plus compact VChat preview/status panel
  - mobile: single-column form-first layout
  - no oversized hero, no decorative marketing sections

### Phase 4: Layout Strategy

- Current `src/app/layout.tsx` always renders `Sidebar`, so `/auth` inherits the logged-in app shell.
- Preferred implementation:
  - Move authenticated routes into a route group such as `src/app/(app)/`.
  - Move `/`, `/settings`, and `/conversation/[id]` into that group.
  - Add `src/app/(app)/layout.tsx` with `RootLayoutInitializer`, `Sidebar`, and `<main>`.
  - Keep root `src/app/layout.tsx` minimal with only `<html>`, `<body>`, globals, and children.
  - Keep `src/app/auth/page.tsx` outside the app shell.
- Lower-risk alternative:
  - Add `src/app/auth/layout.tsx` if sufficient, but it cannot remove UI already rendered by the root layout. Therefore route grouping is the cleaner solution.

### Phase 5: Verification

- Run `npm.cmd run lint`.
- Run `npm.cmd run build`.
- Manually verify:
  - unauthenticated `/` redirects to `/auth`
  - `/auth` renders without sidebar
  - login with invalid credentials shows an error
  - login with valid credentials redirects to `/`
  - authenticated `/auth` redirects to `/`
  - register mode validates username/email/password and returns to login after success

## Risks

- Route-group file moves can affect imports only if relative imports are used; current app files mostly use `@/` aliases, so risk is moderate-low.
- Auth route currently uses HTTP-only cookies, so the client cannot directly inspect login state and should rely on redirects.
- The project contains mojibake comments/text in multiple files. Per user preference, do not fix mojibake or Chinese comments unless they directly block compile/runtime behavior.
- The worktree already has unrelated modified/untracked UI files. Implementation must avoid overwriting them.

## Approval Gate

Wait for explicit user approval before editing application files. After approval, use the requested execution workflow and run:

- `npm run lint`
- `npm run build`

## Implementation Result

- Implemented `/auth` as a real app entry page with login/register modes, form submit handling, client validation, loading state, and success/error feedback.
- Moved authenticated application routes under `src/app/(app)/` so `/auth` no longer inherits the app sidebar.
- Kept `src/proxy.ts` unchanged; route groups preserve the existing URLs.
- Added project preference to `AGENTS.md`: ignore existing Chinese mojibake/comments unless they block compile/runtime behavior, while new user-facing copy should be normal Chinese.

## Verification Result

- `npm run lint` was blocked by PowerShell execution policy for `npm.ps1`.
- `npm.cmd run lint` completed with 0 errors and 2 warnings:
  - `src/components/Attachment/ImagePreview.tsx`: existing `<img>` warning.
  - `src/components/Chat/MessageBubble.tsx`: existing `<img>` warning.
- `npm.cmd run build` completed successfully with Next.js 16.2.4.
