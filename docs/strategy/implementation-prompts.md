# Implementation Prompts

## Prompt 1

Create the initial project skeleton.

- Read `AGENTS.md` and `DESIGN.md`
- Restructure `src` according to the agreed layout
- Set up React Router `HashRouter`
- Create `HomePage`, `StudentPage`, `AdminPage`, `DisplayPage`, `NotFoundPage`
- Build the Notion-inspired layout and basic UI primitives
- Do not implement Firebase yet
- Ensure `npm run build` passes

## Prompt 2

Implement the Firebase bootstrap layer.

- Create `src/firebase/client.ts`
- Use `VITE_FIREBASE_*` env values
- Create `.env.example`
- Add:
  - `signInStudentAnonymously()`
  - `signInAdminWithEmail(email, password)`
  - `signOutUser()`
  - `subscribeAuthState(callback)`
- Show friendly configuration errors when Firebase env is missing

## Prompt 3

Implement the Firestore data model.

- Create `Session`, `Question`, and `Answer` types
- Create `src/data/seedQuestions.ts`
- Add `sessions.ts`, `questions.ts`, `answers.ts`
- Add `seedSession`
- Upsert answers to `answers/{uid}`

## Prompt 4

Implement the student page.

- Anonymous sign-in on entry
- Store nickname in `localStorage`
- Subscribe to `activeQuestionId`
- Render current question in real time
- Honor `accepting`
- Choice buttons for multiple choice
- Textarea for text questions
- Upsert answers
- Show submission state
- Keep the experience mobile-first

## Prompt 5

Implement the admin page.

- Email/password sign-in
- Ordered question list
- Active question controls
- `accepting` toggle
- `showResults` toggle
- Seed upload
- Realtime answers
- Text approval toggle
- QR panel
- CSV export

## Prompt 6

Implement the display page.

- Admin-auth-only in v1
- Large question view
- Collection state while results are hidden
- Recharts bar chart for choice questions
- Only approved and visible text answers
- Large response count
- Presentation-ready 16:9 layout

## Prompt 7

Write `firestore.rules`.

- Admin emails in one top-level array
- Students can only write their own answer document
- Students cannot read other answers
- Students can read sessions and questions
- Admin has full read/write access
- Enforce text answer length
- Restrict `approved` and `hidden` to admins
- Document the rules clearly

## Prompt 8

Set up GitHub Pages deployment.

- Set Vite base to `/doro-survey/`
- Add GitHub Actions workflow
- Deploy from `main`
- Document Pages setup
- Document GitHub Secrets and env setup

## Prompt 9

Run project QA.

- Build passes
- TypeScript clean
- Auth flows work
- Realtime active question sync works
- Students cannot read others' answers
- Aggregation is correct
- Display filtering is correct
- CSV works
- Hash routing works on GitHub Pages
- Mobile layout remains usable
