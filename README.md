# DECKR

**Swipe. Create. Plan.** DECKR is a creator productivity app for discovering content ideas, turning ideas into short-form scripts, and organizing planned posts in a content calendar.

> DECKR is under active development. Features, availability, and setup instructions may change as the project evolves.

## What it does

- **Discover ideas:** browse content prompts and save ideas worth developing.
- **Create scripts:** work from an idea to a structured script with a hook, body, call to action, and delivery tip.
- **Plan content:** organize saved ideas with scheduled dates in a calendar.
- **Personalize:** configure creator niches, publishing platforms, and posting frequency.
- **Account-backed data:** uses Supabase for authentication and application data.

The application is built as a mobile-first React experience and includes a web app manifest and service-worker registration for supported browser installs.

## Tech stack

- React 18 + TypeScript
- Vite
- Tailwind CSS and Radix UI
- React Router and TanStack Query
- Supabase JavaScript client
- Vitest and Testing Library

## Getting started

### Requirements

- Node.js 20 or newer
- npm
- A Supabase project configured for this application

### Install

```bash
git clone https://github.com/DhruvRanna/deckrapp.git
cd deckrapp
npm ci
```

### Configure environment

Create a local `.env` file in the project root:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

Use your own Supabase project values. These Vite variables are exposed to the browser bundle; **never put a Supabase service-role key, database password, or other server secret in a `VITE_*` variable.** Configure Row Level Security (RLS) policies for every exposed table and verify that users can access only their own records before deploying.

The repository contains generated Supabase database types under `src/integrations/supabase/types.ts`. Keep them in sync with the schema you deploy.

### Run locally

```bash
npm run dev
```

Vite prints the local development URL in the terminal.

## Quality checks

Run the checks available in the repository:

```bash
npm run lint
npm test
npm run build
```

The GitHub Actions workflow runs these checks for pushes and pull requests targeting `main`.

## Project structure

```text
src/
  components/       Shared UI and application components
  context/          Application state and providers
  integrations/     Supabase client and generated database types
  pages/            Route-level screens
  test/             Test setup and utilities
public/             Static assets, manifest, and service worker
supabase/           Supabase project configuration
```

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening an issue or pull request. For security-sensitive reports, follow [SECURITY.md](SECURITY.md) rather than posting details publicly.

## License

DECKR is released under the [MIT License](LICENSE).
