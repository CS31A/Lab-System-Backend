# Lab System Backend

This project uses **bun** as the package manager instead of npm.

## Installation

```txt
bun install
```

## Development

```txt
bun run dev
```

## Deployment

```txt
bun run deploy
```

## Type Generation

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
bun run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiation `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```
