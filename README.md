# Hixhame Tina

Production website for **Hixhame Tina**, a women-only hijama and cupping
therapy service in Kolovice, Prishtina.

## Live website

[hixhametina.com](https://hixhametina.com)

## Locales

- Albanian: `/sq/`
- English: `/en/`
- German: `/de/`
- French: `/fr/`
- Turkish: `/tr/`
- Italian: `/it/`

## Development

```bash
npm ci
npm run dev
```

## Quality checks

```bash
npm run i18n:audit
npm run lint
npx tsc --noEmit
npm run build
npm run qa
```

The production build is exported to `.next-production`.

## Hosting

The production domain is served by Cloudflare Pages. The `main` branch is the
source of truth for the website.
