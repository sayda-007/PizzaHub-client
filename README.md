# PizzaHub Client

Frontend for **PizzaHub — Pizza Ordering & Delivery Platform**.

The application is built with Next.js (App Router), React, JavaScript and Tailwind CSS, using the `src/` directory and the `@/*` import alias. Turbopack is the default bundler for development and production builds.

The backend lives in a separate repository: [PizzaHub-server](https://github.com/sayda-007/PizzaHub-server).

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

`PIZZAHUB_BACKEND_URL` is optional and server-only. It defaults to `https://pizzahub-server-xi.vercel.app`. A bare origin, an origin with a trailing slash, or an accidentally supplied `/api/menu` URL all resolve to the same backend origin. The Next.js rewrite forwards every same-origin `/api/*` request there, so browser code never reads this variable or a backend credential. Do not prefix it with `NEXT_PUBLIC_`.

The Better Auth client pins its base URL to the live browser origin plus `/api/auth`, so a stray public auth environment variable cannot bypass that rewrite. On the backend, `BETTER_AUTH_URL` and `CLIENT_URL` must both be the public frontend origin for this deployment style.

## Scripts

| Script          | Description                              |
| --------------- | ---------------------------------------- |
| `npm run dev`   | Start the development server (Turbopack) |
| `npm run build` | Create a production build (Turbopack)    |
| `npm run start` | Serve the production build               |
| `npm run lint`  | Run ESLint                               |
| `npm test`      | Run dependency-free Node regression tests |

## Project structure

```text
src/
  app/          App Router routes, layout and global styles
  components/   Shared and feature-specific React components
    layout/     Site shell, navigation and theme controls
    dashboard/  Role dashboards and shared states
    orders/     Customer order history and details
    vendor/     Vendor menu, order and subscription tools
    admin/      Admin moderation and management tools
    ui/         Reusable UI primitives
  lib/          API, auth, formatting and validation helpers
public/
  images/       Static imagery
```

The app includes the public catalog and ordering flow, Better Auth sign-in/sign-up, role-aware customer/vendor/admin dashboards, profile settings, Stripe subscription return handling, and dark theme support. The backend remains the authority for roles, ownership, validation, moderation and payment state.
