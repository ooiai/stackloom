---
name: frontend
description: A skill for frontend development, including React, Next.js, and Tailwind CSS. This skill can be used to create user interfaces, build web applications, and implement responsive designs.
user-invocable: false
allowed-tools: Bash(pnpm dlx shadcn@latest *)
---

# frontend

Stackloom's frontend skill provides capabilities for frontend development, including React, Next.js, and Tailwind CSS. This skill can be used to create user interfaces, build web applications, and implement responsive designs.

> **IMPORTANT:** This skill is intended for use by Stackloom and is not designed to be directly invoked by users. It provides capabilities for frontend development, which can be utilized by agents to create user interfaces and web applications as needed.

## Frontend Structure

frontend/
├── app/
│ ├── (auth)/ # authentication-related pages
│ │ ├── layout.tsx # authentication layout
│ │ ├── signin/ # sign-in
│ │ │ ├── page.tsx # sign-in page
│ │ ├── signup/ # sign-up
│ │ │ ├── page.tsx # sign-up page
│ │ ├── apply/ # apply for access
│ │ │ ├── page.tsx # apply for access page
│ ├── (base)/ # admin dashboard and related pages
│ │ ├── layout.tsx # admin dashboard layout
│ │ ├── upms/ # user, permission, role management pages
│ │ │ ├── users # user management
│ │ │ │ ├── page.tsx # user management page
│ │ │ ├── permissions # permission management
│ │ │ │ ├── page.tsx # permission management page
│ │ │ ├── roles # role management
│ │ │ │ ├── page.tsx # role management page
│ │ │ ├── menus # menu management
│ │ │ │ ├── page.tsx # menu management page
│ │ │ ├── tenants # tenant management
│ │ │ │ ├── page.tsx # tenant management page
│ │ ├── tools/ # various tools and utilities pages
│ │ │ ├── dicts # dicts management
│ │ │ │ ├── page.tsx # dicts management page
│ ├── (web)/ # main website pages
│ │ ├── layout.tsx # main website layout
│ │ ├── page.tsx # main website page
│ │ ├── dashboard/ # user dashboard pages
│ │ │ ├── page.tsx # user dashboard page
│ │ ├── settings/ # setting pages
│ │ ├── layout.tsx # settings layout
│ │ │ ├── page.tsx # settings page
│ ├── favicon.ico
│ ├── globals.css
│ ├── layout.tsx
│ ├── page.tsx
├── components/
│ ├── ui/ # shadcn/ui components
│ ├── theme-provider.tsx
├── hooks/ # custom React hooks
│ │ ├── setup-axios.ts # hook for setting up Axios interceptors
│ │ ├── use-aws-s3.tsx # hook for setting up AWS S3 interactions
│ │ ├── use-copy-to-clipboard.ts # hook for copying text to clipboard
│ │ ├── use-crypto.ts # hook for cryptographic operations
│ │ ├── use-persisted-state.ts # hook for managing persisted state
├── lib/ # utility functions and libraries
│ ├── config/ # configuration files
│ │ ├── constants.ts # application constants
│ │ ├── enums.ts # enumerations
│ ├── utils.ts # utility functions
│ ├── http/ # HTTP-related utilities
│ │ ├── axios.ts # Axios instance configuration
│ │ ├── axios-validate.ts # Axios instance configuration with validation
│ │ ├── status.ts # HTTP status codes
├── providers/ # context providers
│ │ ├── dialog-providers.tsx # provider for managing dialog state
│ │ ├── query-providers.tsx # provider for managing Tanstack Query state
├── public/ # public assets
│ ├── images/ #
│ ├── fonts/ #
│ ├── svgs/ #
├── stores/ # state management stores
│ │ ├── auth-api.ts # authentication API store
│ │ ├── auth-store.ts # authentication state store
│ │ ├── base-api.ts # base API store
│ │ ├── base-store.ts # base state store
│ │ ├── system-api.ts # system API store
│ │ ├── system-store.ts # system state store
│ │ ├── web-api.ts # web API store
│ │ ├── web-store.ts # wev state store
├── types/ # TypeScript types
│ │ ├── auth.types.ts # authentication-related types
│ │ ├── base.types.ts # base types
│ │ ├── system.types.ts # system-related types
│ │ ├── web.types.ts # web-related types
.gitignore
.prettierrc
components.json
eslint.config.mjs
next.config.mjs
package.json
postcss.config.mjs
README.md
tsconfig.json

**IMPORTANT: Never change code the components in the frontend/components/ui directory and frontend/components/reui directory and frontend/components/ai-elements directory, as they are shared components used across the entire application. If you need to modify or add new components, please create them in a separate directory to avoid conflicts and ensure maintainability.**

**IMPORTANT: If you use shadcn/ui, use shandcn skills to generate components. If you use reui, use Reui Components or [reui components](https://reui.io/components) to generate components. Do not mix them together.**

## IMPORTANT

- **Follow the project structure and coding conventions strictly.** Do not change the established architecture, directory layout, or implementation patterns arbitrarily.
- **Keep `page.tsx` files minimal and focused on page composition.** Move UI sections and page-specific presentation logic into `@/components/[module-name]`.
- **Prefer hooks for reusable stateful logic.** When logic can be shared or isolated cleanly, extract it into custom hooks instead of keeping it inside pages or components.
- **Extract algorithms and non-UI business logic into `@/lib/**`.\*\* Avoid placing calculation, transformation, parsing, or other reusable logic directly inside pages or components.
- **Use existing providers whenever possible, and create new providers when appropriate.** Shared cross-page state, app-wide behaviors, and context-based capabilities should be managed through providers rather than duplicated locally.
- **Prioritize code reuse at all times.** Avoid duplication across pages, components, hooks, and utilities by abstracting common logic into reusable modules.

## Frontend Dependencies

The frontend skill relies on the following dependencies:

- [Next.js](https://nextjs.org/): A React framework for building server-side rendered applications.
- [TypeScript](https://www.typescriptlang.org/): A statically typed superset of JavaScript that adds type safety to the codebase.
- [Shadcn/ui](https://ui.shadcn.com/docs): shadcn/ui is a set of beautifully-designed, accessible components and a code distribution platform. Works with your favorite frameworks and AI models.
- [reui](https://reui.io/docs): ReUI is a first-class shadcn registry offering a large collection of open-source components and blocks built for shadcn and compatible with Base UI, Radix UI, and Tailwind CSS. Designed for developers and AI.
- [reui components](https://reui.io/components): A collection of open-source components and blocks built for shadcn and compatible with Base UI, Radix UI, and Tailwind CSS. Designed for developers and AI.
- [AI Elements](https://ai-elements.com/): A collection of AI-powered UI components and tools designed to enhance user experience and streamline interactions with AI models.
- [lucide-react](https://lucide.dev/): Beautiful & consistent icons
- [Tailwind CSS](https://tailwindcss.com/): A utility-first CSS framework for rapidly building custom user interfaces.
- [ESLint](https://eslint.org/): A tool for identifying and fixing problems in JavaScript code.
- [Prettier](https://prettier.io/): An opinionated code formatter that ensures consistent code style across the codebase.
- [Tanstack Query](https://tanstack.com/query/latest): A powerful data-fetching library for React applications that simplifies server state management.
- [Tanstack Table](https://tanstack.com/table/latest): A headless UI library for building tables in React applications, providing flexibility and customization options.
- [Tanstack Virtual](https://tanstack.com/virtual/latest): A library for efficiently rendering large lists and tables in React applications by virtualizing the DOM.
- [Tanstack Form](https://tanstack.com/form/latest): A library for managing form state and validation in React applications, providing a simple and intuitive API.
- [Tanstack Router](https://tanstack.com/router/latest): A routing library for React applications that provides a simple and flexible way to manage navigation and routing in React applications.website: https://tanstack.com/router/latest
- [Tanstack Placer](https://tanstack.com/placer/latest): Framework agnostic debouncing, throttling, rate limiting, queuing, and batching utilities.Optimize your application's performance with TanStack Pacer's core primitives: Debouncing, Throttling, Rate Limiting, Queuing, and Batching.
- [Axios](https://axios-http.com/): Axios is a simple promise based HTTP client for the browser and node.js. Axios provides a simple to use library in a small package with a very extensible interface.
- [Zod](https://zod.dev/): TypeScript-first schema validation with static type inference
- [Lodash](https://lodash.com/): A modern JavaScript utility library delivering modularity, performance & extras.
- [clsx](https://github.com/lukeed/clsx): A tiny (239B) utility for constructing className strings conditionally.
  Also serves as a faster & smaller drop-in replacement for the classnames module.
- [dayjs](https://day.js.org/): Day.js is a minimalist JavaScript library that parses, validates, manipulates, and displays dates and times for modern browsers with a largely Moment.js-compatible API.
- [sonner](https://ui.shadcn.com/docs/components/radix/sonner): A React library for creating toast notifications, providing a simple and customizable way to display messages to users in a non-intrusive manner.
- [shadcn-hooks](https://shadcn-hooks.com/docs/introduction): Shadcn Hooks is a carefully curated collection of modern React hooks designed to enhance your development experience. Built with the same philosophy as Shadcn UI, this collection provides high-quality, TypeScript-first hooks that are production-ready and follow React best practices.
- [recharts](https://ui.shadcn.com/charts/area): A collection of ready-to-use chart components built with Recharts. From basic charts to rich data displays, copy and paste into your apps.
- [crypto-js](https://crypto-js.com/): A JavaScript library for performing cryptographic operations, such as hashing and encryption, providing a simple and secure way to handle sensitive data in JavaScript applications.
- [hashids](https://github.com/hashids): Hashids is a small library that generates short unique IDs from numbers. By now, it supports implementations in many different programming languages.
- [pako](https://github.com/nodeca/pako): zlib port to javascript, very fast!.
- [rc-slider-captcha](https://github.com/caijf/rc-slider-captcha): A React component for creating slider captchas, providing a simple and effective way to prevent automated bots from submitting forms in React applications.

## Frontend Style Guide

## frontend/stores instructions

The `frontend/stores` directory contains state management stores for the frontend application. These stores are responsible for managing the state of various aspects of the application, such as authentication, system settings, and web-related data.

When creating a new store in the `frontend/stores` directory, follow these guidelines:

**auth-api.ts**

```ts
import { AccountAuthParam, AuthTokenResult } from "@/types/auth.types";

export const signinApi = {
    accountAuth: async (parmas: AccountAuthParam): Promise<AuthTokenResult> => {
        return post("/api/auth/signin/account", parmas, {
            headers: {
                Authorization: `Basic ${CryptUtil.encodeBase64Double(HTTP_REQUEST_ENUM.BASIC_AUTH)}`,
            },
        });
    },
};
```

**auth-store.ts**

```ts
import { SharedStore } from "@/types/edu-store.types";
import { EduUserInfo } from "@/types/edu.types";
import { create } from "zustand";

export const useSharedStore = create<SharedStore>()((set, get) => ({
    userInfo: null,
    setUserInfo: (userInfo: EduUserInfo | null) => set({ userInfo }),
    getUserInfo: () => get().userInfo,
}));
```

## frontend/types instructions

The `frontend/types` directory contains TypeScript type definitions for the frontend application. These types are used to define the shape of data and ensure type safety throughout the codebase.

When creating new types in the `frontend/types` directory, follow these guidelines:

- **All id fields exposed to the frontend are hashid strings produced by the backend.** Treat ids in frontend request/response types, page params, search params, component props, table rows, form values, and store state as `string` unless there is a clearly documented non-id numeric field.
- **Do not model backend entity ids as `number` in frontend code.** Even if the backend stores ids internally as integers, the HTTP boundary returns hashid values, so frontend types must use `string`.
- **When naming typed fields such as `id`, `userId`, `courseId`, `chapterId`, `parentId`, or arrays such as `ids`, prefer `string` and `string[]` consistently.**

**auth.types.ts**

```ts
export interface MobileAuthParam {
    phone: string;
    code: string;
}

export interface MobileAuth {
    phone: string;
}

// Example id typing rule:
// export interface UserProfile {
//   id: string;
//   orgId: string;
//   roleIds: string[];
// }
```

**IMPORTANT:The Entity use `MobileAuth` and Parameter use `MobileAuthParam`**

## frontend/providers instructions

The `frontend/providers` directory contains context providers for the frontend application. These providers are responsible for managing shared state and behaviors across the application, such as dialog state and query state.

When creating a new provider in the `frontend/providers` directory, follow these guidelines:

In `Layout.tsx`:

```tsx
import { DialogProvider } from "@/providers/dialog-providers";
import { QueryProvider } from "@/providers/query-providers";
import { AxiosErrorHandler } from "@/hooks/setup-axios";
import { Toaster } from "@/components/ui/sonner";

<AlertDialogProvider>
  <QueryProviders>{children}</QueryProviders>
</AlertDialogProvider>
<AxiosErrorHandler />
<Toaster richColors />
```

You can create new providers as needed to manage additional shared state or behaviors in the application. Make sure to wrap the necessary components with the appropriate providers to ensure that the context is available where needed.

## frontend/lib instructions

The `frontend/lib` directory contains utility functions and libraries for the frontend application. These utilities are used to perform common tasks, such as making HTTP requests, managing configuration, and providing helper functions.

When creating new utilities in the `frontend/lib` directory, follow these guidelines:

**config/constants.ts**

```ts
export const HTTP_REQUEST_ENUM = {
    BASIC_AUTH: "smartlaw:smartlaw",
};
```

**utils.ts usage**

```ts
import { format } from "dayjs";
const date = new Date();
formate(date, "YYYY-MM-DD");
```

You can create new utility functions as needed to perform common tasks throughout the application. Make sure to keep these utilities organized and reusable to promote code maintainability and reduce duplication.

## frontend/hooks instructions

The `frontend/hooks` directory contains custom React hooks for the frontend application. These hooks are used to encapsulate reusable stateful logic and side effects, making it easier to manage complex behaviors and interactions in the application.

When creating new hooks in the `frontend/hooks` directory, follow these guidelines:

**use-copy-to-clipboard.ts**

```ts
useCopyToClipboard("Hello, world!");
```

**use-persisted-state.ts**

```ts
const [value, setValue] = usePersistedState("myKey", "defaultValue");
```

You can create new hooks as needed to manage reusable stateful logic and side effects in the application. Make sure to keep these hooks focused and reusable, and consider extracting complex logic into separate utility functions if necessary.

## frontend/components instructions

The `frontend/components` directory contains React components for the frontend application. These components are used to build the user interface and implement various features and functionalities.

When creating new components in the `frontend/components` directory, follow these guidelines:

- **Use shadcn/ui components for UI elements.** If you need to create new UI components, use the shadcn/ui library to ensure consistency and maintainability across the application.
- **Use reui components for additional UI elements.** If you need to create new UI components that are not available in shadcn/ui, use the reui library to ensure consistency and maintainability across the application.
- **Use AI Elements for AI-powered components.** If you need to create new components that leverage AI capabilities, use the AI Elements library to ensure consistency and maintainability across the application.
- **Do not mix shadcn/ui, reui, and AI Elements components together.** Keep components from different libraries separate to maintain clarity and avoid conflicts in styling and functionality.
- **Do not modify components in the `frontend/components/ui`, `frontend/components/reui`, and `frontend/components/ai-elements` directories.** These directories contain shared components that are used across the entire application. If you need to modify or add new components, create them in a separate directory to avoid conflicts and ensure maintainability.
- **Create new components in a separate directory if they are not part of the shared libraries.** If you need to create new components that are specific to a certain feature or module, create them in a separate directory within `frontend/components` to keep the code organized and maintainable.

## frontend/app instructions

The `frontend/app` directory contains the main application code for the frontend application. This includes the page components, layouts, and other related files.

When creating new pages or layouts in the `frontend/app` directory, follow these guidelines:

- **Keep `page.tsx` files minimal and focused on page composition.** Move UI sections and page-specific presentation logic into `@/components/[module-name]` to promote separation of concerns and maintainability.
- **Use hooks for reusable stateful logic.** When logic can be shared or isolated cleanly, extract it into custom hooks instead of keeping it inside pages or components. This promotes code reuse and makes it easier to manage complex behaviors and interactions in the application.
- **Extract algorithms and non-UI business logic into `@/lib/**`.** Avoid placing calculation, transformation, parsing, or other reusable logic directly inside pages or components. Instead, create utility functions in the `frontend/lib` directory to keep the code organized and maintainable.
- **Use existing providers whenever possible, and create new providers when appropriate.** Shared cross-page state, app-wide behaviors, and context-based capabilities should be managed through providers rather than duplicated locally. This promotes code reuse and makes it easier to manage shared state and behaviors across the application.
- **Prioritize code reuse at all times.** Avoid duplication across pages, components, hooks, and utilities by abstracting common logic into reusable modules. This promotes maintainability and reduces the likelihood of bugs and inconsistencies in the codebase. Always look for opportunities to reuse existing code before creating new implementations, and consider how new code can be structured to maximize reuse across the application.
- **Organize pages and layouts according to the established directory structure.** Follow the existing organization of pages and layouts in the `frontend/app` directory to maintain consistency and make it easier for other developers to navigate the codebase. Create new directories as needed to group related pages and layouts together, but avoid deviating from the overall structure without a clear reason.
- **Use descriptive names for pages and layouts.** Choose names that clearly indicate the purpose and content of the page or layout to improve readability and maintainability. Avoid generic names that do not provide context about the functionality or content of the page or layout.
- **Follow the established coding conventions and style guidelines.** Adhere to the coding standards and style guidelines used throughout the codebase to maintain consistency and improve readability. This includes naming conventions, formatting, and organization of code within pages and layouts.

**Layout.tsx**

```tsx
import { fontVariables } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { AlertDialogProvider } from "@/providers/dialog-providers";
import { QueryProviders } from "@/providers/query-providers";
import { Toaster } from "@/components/ui/sonner";
import "../globals.css";
import { AxiosErrorHandler } from "@/hooks/setup-axios";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "",
    description: "",
    keywords: [],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="zh-CN" suppressHydrationWarning>
            <head>
                <meta charSet="utf-8" />
                <meta name="theme-color" content="#FFFFFF" />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta
                    name="apple-mobile-web-app-status-bar-style"
                    content="default"
                />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no"
                />
            </head>
            <body className={cn(fontVariables, "antialiased font-sans")}>
                <AlertDialogProvider>
                    <QueryProviders>{children}</QueryProviders>
                </AlertDialogProvider>
                <AxiosErrorHandler />
                <Toaster richColors />
            </body>
        </html>
    );
}
```

**page.tsx**

```tsx
"use client";

export default function Home() {
    return <div>Home</div>;
}
```

**components/[module-name]/index.tsx**

```tsx
import { Button } from "@/components/ui/button";

const MyComponent = () => {
    return <Button>Click me</Button>;
};

export default MyComponent;
```

## Sigin Page

Create a new page for user sign-in in the `frontend/app/(auth)/signin/page.tsx` file. This page will allow users to enter their credentials and sign in to the application.

**Instructions:**
[sigin.md](./rules/sigin.md)
