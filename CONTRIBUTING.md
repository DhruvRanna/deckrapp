# Contributing to DECKR

Thanks for considering a contribution.

## Before you start

- Check existing issues and pull requests to avoid duplicate work.
- For a substantial change, open an issue first to discuss the proposed approach.
- Keep changes focused and explain the user-facing problem they solve.
- Never commit credentials, personal data, production exports, or local environment files.

## Development setup

1. Install Node.js 20+ and npm.
2. Clone the repository and run `npm ci`.
3. Create a local `.env` with the two browser-side Supabase settings documented in the README.
4. Run `npm run dev`.

## Before opening a pull request

Run all available checks:

```bash
npm run lint
npm test
npm run build
```

Include a clear summary, the reason for the change, testing performed, and screenshots for visible UI changes. Mention any required Supabase schema or configuration changes. Do not include secrets in screenshots or logs.

## Pull request expectations

- Use a descriptive title and keep the diff focused.
- Preserve existing conventions and accessible interaction patterns.
- Add or update tests when behavior changes.
- Update documentation when setup or user-facing behavior changes.
- Do not claim a check passed unless you ran it successfully.
