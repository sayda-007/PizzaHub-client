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

## Scripts

| Script          | Description                              |
| --------------- | ---------------------------------------- |
| `npm run dev`   | Start the development server (Turbopack) |
| `npm run build` | Create a production build (Turbopack)    |
| `npm run start` | Serve the production build               |
| `npm run lint`  | Run ESLint                               |

## Project structure

```text
src/
  app/          App Router routes, layout and global styles
  components/   Shared React components
    layout/     Layout-level components
    ui/         Reusable UI primitives
  lib/          Utilities and helpers
  hooks/        Custom React hooks
  contexts/     React contexts
  config/       Application configuration
public/
  images/       Static imagery
```

> **Note:** This repository contains the initial technical foundation only. The visual identity and full application are implemented in later steps.
