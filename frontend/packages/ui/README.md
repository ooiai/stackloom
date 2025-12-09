# @stackloom/ui

Reusable React UI components built on Radix UI and Tailwind CSS.

## Install

npm i @stackloom/ui

Peer dependencies (project-level):

- react, react-dom
- tailwindcss (v4)

## Styles

Import global styles once (e.g., in your root layout or App):

```
import "@stackloom/ui/globals.css"
```

## Usage

Example:

```
import { Button } from "@stackloom/ui/components/button"
// or import utility functions and hooks
import { cn } from "@stackloom/ui/lib/utils"
import { useSomething } from "@stackloom/ui/hooks/use-something"

export function Demo() {
  return <Button className={cn("px-4")}>Click</Button>
}
```

## Exports

- Styles: "@stackloom/ui/globals.css"
- PostCSS config: "@stackloom/ui/postcss.config"
- Lib utilities: "@stackloom/ui/lib/\*"
- Components: "@stackloom/ui/components/\*"
- Hooks: "@stackloom/ui/hooks/\*"

## Notes

- Ensure Tailwind CSS v4 is configured in your app.
- Components rely on Radix UI; install specific Radix packages if you use advanced patterns.
