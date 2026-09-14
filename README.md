# Airbnb Clone (Next.js)

A full-featured Airbnb clone — browse homes, book stays, list your place, and manage everything from an admin panel.

## What is this?

This is a working replica of [Airbnb](https://www.airbnb.com) built with modern web technology. Visitors can browse rental homes, filter them by category, search by country, save favorites, and book dates on a calendar. Hosts can create listings with photos, pricing, and location. Admins get a dedicated dashboard to manage users, homes, and reservations.

## Features

- **Browse & filter** — scroll through listings, filter by category (Beach, Luxe, Design, Pool, Tiny Home, and more), and search by country and number of guests/rooms/bathrooms.
- **Listing detail pages** — photo carousel, map, host card, and a price card with a live booking calendar.
- **Bookings** — pick a date range on the calendar; already-booked dates are blocked out automatically.
- **Favorites** — heart any home to save it to your personal list.
- **Hosting** — create a listing through a guided 4-step wizard: category → photo → details → location. Add up to 4 photos and edit or delete your homes anytime.
- **Search** — a search dialog on the navbar (country → guests/rooms/bathrooms) plus a category carousel on the homepage.
- **Maps** — interactive location previews powered by OpenStreetMap.
- **Dark mode** — light, dark, or system theme toggle.
- **Admin dashboard** — protected area with stat cards and tables to manage users, homes, and reservations.
- **Toasts** — friendly notifications after key actions (listing created, reservation made, etc.).

## Live demo

Deployed at **https://airbnb-clone-bz.vercel.app**

> Note: the live deployment may be offline if the environment variables aren't configured on the hosting provider. To run it yourself, follow the setup steps below.

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | [Next.js](https://nextjs.org/) 16 (App Router) + React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com/) |
| Database | PostgreSQL via [Prisma](https://www.prisma.io/) ORM |
| Storage | Supabase Storage (listing photos) |
| Auth | [Kinde](https://kinde.com/) (login, register, sessions) |
| Forms & validation | react-hook-form + zod |
| Maps | react-leaflet / Leaflet + OpenStreetMap |
| UI helpers | embla-carousel, Base UI combobox, next-themes, sonner, date-fns, world-countries |

## Project structure

```
app/
  page.tsx            # Homepage: category carousel + listing grid
  create/             # Create-a-home wizard
  home/[id]/          # Listing detail page + booking calendar
  favorites/          # Saved homes
  my-homes/           # Your listings (+ edit page with Photos tab)
  reservations/       # Your bookings
  admin/              # Admin dashboard (users, homes, reservations)
  api/auth/           # Kinde auth + post-login user creation
  actions.ts          # Server actions (mutations)
  lib/                # Auth, db, validation, helpers
components/           # UI + feature components
prisma/schema.prisma  # Database schema
lib/generated/prisma/ # Generated Prisma client
```

## Getting started

### Prerequisites

- Node.js 20+ (uses pnpm, but npm/yarn work too)
- Accounts for: [Kinde](https://kinde.com/) (auth), [Supabase](https://supabase.com/) (image storage), and a PostgreSQL database (e.g. Supabase, Neon, or local)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

| Variable | What it's for | Where to get it |
| --- | --- | --- |
| `DATABASE_URL` | Postgres connection (transaction pooler) | Your database provider |
| `DIRECT_URL` | Postgres connection for Prisma migrations (session pooler) | Your database provider |
| `KINDE_CLIENT_ID` | Kinde app identifier | Kinde dashboard → Apps |
| `KINDE_CLIENT_SECRET` | Kinde app secret | Kinde dashboard → Apps |
| `KINDE_ISSUER_URL` | Your Kinde tenant URL (e.g. `https://yourapp.kinde.com`) | Kinde dashboard |
| `KINDE_SITE_URL` | App URL Kinde redirects to (local: `http://localhost:3000`) | — |
| `KINDE_POST_LOGIN_REDIRECT_URL` | Where users land after login (`.../api/auth/creation`) | — |
| `KINDE_POST_LOGOUT_REDIRECT_URL` | Where users land after logout | — |
| `KINDE_MANAGEMENT_CLIENT_ID` / `KINDE_MANAGEMENT_CLIENT_SECRET` | Optional — lets admins delete users from Kinde too (M2M app with `delete:users`) | Kinde dashboard → Settings → APIs |
| `SUPABASE_URL` | Supabase project URL | Supabase dashboard → Project settings |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key | Supabase dashboard → API keys |
| `SUPABASE_SECRET_KEY` | Supabase service-role key (server-side uploads/deletes) | Supabase dashboard → API keys |
| `SUPABASE_JWKS_URL` | Supabase JWKS endpoint | Supabase dashboard → API keys |
| `SUPABASE_STORAGE_BUCKET` | Storage bucket name (default `airbnb-images`) | Your Supabase storage bucket |

### 3. Set up the database

```bash
npx prisma migrate dev
```

This creates the tables. To create an admin user, set `role = 'ADMIN'` on a user row directly in your database.

### 4. Run the app

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start the production server |
| `pnpm lint` | Run ESLint |
| `pnpm postinstall` | Auto-runs `prisma generate` on install |

## Deployment

The app is set up for [Vercel](https://vercel.com). Push to your repo and connect it to Vercel, then set the same environment variables above in the project settings. Make sure `prisma generate` runs during install (it does via `postinstall`) and your database is reachable from the host.

## License

This project is for learning and demonstration purposes only. It is not affiliated with or endorsed by Airbnb.