# AGENTS.md

## Project

DORO Live Survey V2 is a **participation design and operation system** for DOROSSAEM tech/tool/hands-on classes.

V2 layers a **lesson template planner** on top of the existing live survey engine. Teachers design interaction flows before class using templates, then run them live with students in real time.

## Product goals

- Teachers create lesson templates organized by class phase
- Each template defines interactions (survey, quiz, discussion) per phase
- Admin launches a live session from a template in one click
- Students join from QR code on mobile and follow the active question in real time
- Admin and Display screens update in real time
- The system generalizes beyond any single lecture to support all DORO class formats

## Class flow (DORO standard)

```
도입 → 이론 → 실습 → 윤리/활용 사례 → 마무리
```

Each phase contains one or more **interaction blocks**:
- `survey` — multiple-choice or text opinion question
- `quiz` — right/wrong knowledge check
- `discussion` — open text prompt for group discussion
- `reflection` — personal reflection text

Each block has a visibility:
- `public` — shown on display screen, students can see aggregated results
- `teacher-only` — admin only, not shown on display

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
- `/` — Home (role cards + lesson template overview)
- `/planner` — Lesson Template Planner (admin-only)
- `/student?session=<id>` — Student participation page
- `/admin?session=<id>` — Admin live operations dashboard
- `/display?session=<id>` — Projector display

## Firebase rules

- Students sign in anonymously.
- Admin signs in with Firebase Email/Password.
- Students can read session and question documents.
- Students can create and update only their own answer document.
- Students cannot read other students' answers.
- Admin can read and write sessions, questions, answers, and lesson templates.
- Display page requires admin auth in v1.

## Security

- Never store admin passwords in frontend code.
- Do not use `dangerouslySetInnerHTML`.
- Limit text answers to 300 characters.
- Trim input.
- Escape display output.
- Do not add Cloud Functions or a backend server.

## UX principles

- Student page must be mobile-first.
- Buttons must be large enough for smartphone use.
- Admin page must be efficient during a live lecture.
- Display page must be clean for a projector.
- The QR code should be visible in Admin.
- Results should update in real time.
- Lesson planner must show the full class arc at a glance.

## Build checks

Before finishing each task:
- Run `npm run build`.
- Fix TypeScript errors.
- Keep code simple and readable.
