# DORO Live Survey

Real-time classroom survey web app for DORO's robot entrepreneurship lecture.

## Current scope

The app skeleton and Firebase data flow are in place:

- Vite + React + TypeScript project initialized
- Notion-inspired `DESIGN.md` installed
- `AGENTS.md` added for project rules
- Strategy docs added under `docs/strategy`
- HashRouter routes created for:
  - `/`
  - `/student`
  - `/admin`
  - `/display`
- Shared UI primitives and page shells implemented
- Student, Admin, and Display pages implemented with live Firebase-ready flows
- Firebase client bootstrap and auth helper functions added
- `.env.example` added for local configuration
- Firestore session, question, and answer modules added
- Firestore rules and indexes added
- GitHub Pages deployment workflow added

## Project structure

```text
src/
  app/
  components/
    admin/
    common/
    display/
    layout/
    survey/
  data/
  firebase/
  hooks/
  pages/
  styles/
  utils/
```

## Scripts

```bash
npm install
npm run dev
npm run build
```

## Design and rules

- UI design reference: [DESIGN.md](./DESIGN.md)
- Project working rules: [AGENTS.md](./AGENTS.md)
- Strategy summary: [docs/strategy/doro-live-survey-strategy.md](./docs/strategy/doro-live-survey-strategy.md)
- Implementation sequence: [docs/strategy/implementation-prompts.md](./docs/strategy/implementation-prompts.md)

## Next build phase

1. Verify the live Firebase project end-to-end with real credentials
2. Deploy Firestore rules and indexes
3. Push to GitHub and enable Pages
4. Run mobile and classroom rehearsal QA

## Notes

- `vite.config.ts` already uses `base: "/doro-survey/"` for GitHub Pages deployment.
- If Firebase env vars are missing, the app falls back to preview-mode messaging instead of crashing.
- Student and Display pages depend on a seeded Firestore session and a current active question.

## Firestore rules

Starter security files are included:

- [firestore.rules](./firestore.rules)
- [firestore.indexes.json](./firestore.indexes.json)

The default admin allowlist currently includes `awe2478223@gmail.com`. Adjust it before production if needed.

### Deploy rules

If you have not initialized Firebase CLI in this project yet:

```bash
npm install -g firebase-tools
firebase login
firebase init firestore
```

Then deploy the security rules and indexes:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

## GitHub Pages deployment

The workflow file is included here:

- [deploy.yml](./.github/workflows/deploy.yml)

### Repository setup

1. Create a GitHub repository named `doro-survey`
2. Push this project to the repository's `main` branch
3. In GitHub repository settings, open `Pages`
4. Set `Source` to `GitHub Actions`
5. Push to `main` again or run the workflow manually

### Required repository secrets

Add these repository secrets in GitHub:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_DEFAULT_SESSION_ID`
- `VITE_APP_NAME`

Recommended defaults:

- `VITE_DEFAULT_SESSION_ID=robot-startup-2026`
- `VITE_APP_NAME=DORO Live Survey`

### Expected Pages URLs

If the repository is `Jinhan0603/doro-survey`, the Pages entry point will be:

```text
https://Jinhan0603.github.io/doro-survey/
```

Hash routes used by this app:

```text
https://Jinhan0603.github.io/doro-survey/#/student?session=robot-startup-2026
https://Jinhan0603.github.io/doro-survey/#/admin?session=robot-startup-2026
https://Jinhan0603.github.io/doro-survey/#/display?session=robot-startup-2026
```
