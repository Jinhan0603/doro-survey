# AGENTS.md

## Project
DORO Live Survey is a real-time classroom survey web app for a 2-hour lecture called "로봇으로 창업하기".

## Product goals
- Students join from a QR code on mobile.
- Admin controls the active question during a live lecture.
- Student, admin, and display screens update in real time.
- The v1 target is a reliable MVP for a 20-person lecture.

## Tech stack
- Vite
- React
- TypeScript
- Firebase Authentication
- Firebase Firestore
- GitHub Pages
- React Router HashRouter
- Recharts
- qrcode.react

## Design
Use DESIGN.md in the project root.
The chosen design is Notion-inspired: warm minimalism, soft surfaces, calm typography, card-based layouts.
Do not copy Notion branding, logos, or trademarks.
Use DORO as the product brand.

## Routes
Use HashRouter because this app will be deployed to GitHub Pages.

Routes:
- `/`
- `/student?session=robot-startup-2026`
- `/admin?session=robot-startup-2026`
- `/display?session=robot-startup-2026`

## Firebase rules
- Students sign in anonymously.
- Admin signs in with Firebase Email/Password.
- Students can read session and question documents.
- Students can create and update only their own answer document.
- Students cannot read other students' answers.
- Admin can read and write sessions, questions, and answers.
- Display page requires admin auth in v1.

## Security
- Never store admin passwords in frontend code.
- Do not use `dangerouslySetInnerHTML`.
- Limit text answers to 300 characters.
- Trim input.
- Escape display output.
- Do not add Cloud Functions or a backend server for v1.

## UX principles
- Student page must be mobile-first.
- Buttons must be large enough for smartphone use.
- Admin page must be efficient during a live lecture.
- Display page must be clean for a projector.
- The QR code should be visible in Admin.
- Results should update in real time.

## Build checks
Before finishing each task:
- Run `npm run build`.
- Fix TypeScript errors.
- Keep code simple and readable.
