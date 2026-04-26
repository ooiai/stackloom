# signin

Use the current sign-in flow as the reference for auth-page work.

## Current structure

```text
frontend/app/(auth)/signin/page.tsx
frontend/components/auth/signin-form.tsx
frontend/components/auth/captcha-slider.tsx
frontend/components/auth/select-tenant-dialog.tsx
```

## Current page shape

- Two-column layout on large screens
- Left column:
    - logo
    - centered sign-in form
- Right column:
    - auth illustration
    - localized title and description

## Current sign-in flow

The sign-in form is not a demo form. It currently includes:

1. account + password input
2. local client validation with Zod
3. slider captcha
4. org-unit query after captcha verification
5. tenant selection dialog when multiple orgs are available
6. account auth request
7. token persistence
8. redirect to `/upms/users`

## Rules

- Preserve the captcha + tenant selection flow when modifying sign-in.
- Keep sign-in copy localized with `useI18n()`.
- Keep token persistence logic in the sign-in form flow unless authentication architecture is explicitly being redesigned.
- Keep auth page visuals aligned with the current branded layout, including:
    - `/svg/logo.svg`
    - `/svg/auth.svg`
- Prefer updating the existing auth components over replacing them with generic template markup.

## Do not

- Do not replace the page with a basic single-card sample form.
- Do not remove captcha or tenant selection as a shortcut.
- Do not hardcode translated text inside the sign-in page once i18n exists.
