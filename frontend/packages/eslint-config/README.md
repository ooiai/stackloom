# @stackloom/eslint-config

Shared ESLint config for Stackloom projects.

## Install

```
npm i -D @stackloom/eslint-config eslint @eslint/js @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-react eslint-plugin-react-hooks @next/eslint-plugin-next
```

# or with pnpm

```
pnpm add -D @stackloom/eslint-config eslint @eslint/js @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-react eslint-plugin-react-hooks @next/eslint-plugin-next
```

# or with yarn

```
yarn add -D @stackloom/eslint-config eslint @eslint/js @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-react eslint-plugin-react-hooks @next/eslint-plugin-next
```

## Usage

```
// Base (JS/TS) - .eslintrc.json
{
  "extends": ["@stackloom/eslint-config/base"]
}
```

```
// Base (JS/TS) - eslint.config.js (flat config)
export default [
  {
    extends: ["@stackloom/eslint-config/base"]
  }
]
```

```
// Next.js (App/Pages) - .eslintrc.json
{
  "extends": ["@stackloom/eslint-config/next-js"]
}
```

```
// Next.js (App/Pages) - eslint.config.js (flat config)
export default [
  {
    extends: ["@stackloom/eslint-config/next-js"]
  }
]
```

```
// React internal - .eslintrc.json
{
  "extends": ["@stackloom/eslint-config/react-internal"]
}
```

```
// React internal - eslint.config.js (flat config)
export default [
  {
    extends: ["@stackloom/eslint-config/react-internal"]
  }
]
```

## Version compatibility

- Requires ESLint 9.x and TypeScript 5.x (tested with the versions listed in package peerDependencies).
- Next.js config targets Next.js 14+ and 15+, and works with 15/16 when using the official `@next/eslint-plugin-next`.
- React rules target `react` and `react-hooks` plugins in their recent stable versions.

## Notes

- This package exposes multiple entry points via exports:
  - "@stackloom/eslint-config/base"
  - "@stackloom/eslint-config/next-js"
  - "@stackloom/eslint-config/react-internal"
- If using ESLint’s flat config, ensure your environment supports ESM and use `eslint.config.js` with `export default`.
- Some rules may assume modern tooling (e.g., TypeScript project references or Next.js app router); adjust overrides as needed in your project.
