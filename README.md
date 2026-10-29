# Pet TV — running app

The full Next.js project for Pet TV. This is the **v2** code (real play/pause
and mute, plus Favorites) in a complete project that actually runs — the
single files one folder up (`../pet-tv-page.tsx`, `../pet-tv-page-v2.tsx`)
are the earlier standalone copies.

## Run it

You need a computer with Node.js 18 or newer (built and tested here on
Node 24).

```bash
npm install
npm run build
npm run start
```

Then open http://localhost:3000

For editing / development instead:

```bash
npm run dev
```

Then open http://localhost:3000 — changes reload as you save.

## What's inside

- `app/page.tsx` — the whole Pet TV app: 8 channels, Cats/Dogs filter,
  auto-stop timer, floating decorations, real YouTube play/pause + mute,
  and Favorites.
- `app/layout.tsx`, `app/globals.css` — page shell and Tailwind styles.
- `components/ui/` — Button, Card, Badge (the parts the page imports),
  plus a small Toaster.
- `hooks/use-toast.ts` — the tiny toast the page uses.

Favorites are saved in the browser you open it in (localStorage,
`pet-tv-favorites`). No accounts, no database, no cost.
