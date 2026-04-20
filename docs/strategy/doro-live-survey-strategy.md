# DORO Live Survey Strategy

## Summary

- Product name: `DORO Live Survey`
- Purpose: real-time question, quiz, and discussion system for DORO's robot startup lecture
- Primary usage: 2-hour lecture MVP for about 20 students
- Delivery model:

```text
Student smartphone
-> QR entry
-> GitHub Pages web app
-> Firebase Firestore stores answers
-> Admin and Display screens subscribe in real time
```

## Design direction

- Core style: Notion-inspired
- Tone: warm minimalism, soft cards, calm typography, clear hierarchy
- DORO branding: use DORO colors only as accent points
- Screen-specific priorities:
  - Student: simple, large tap targets, one-question focus
  - Admin: dense but calm operational dashboard
  - Display: projector-friendly, large text, no control clutter

## MVP goals

- Students scan once and enter quickly
- Admin changes the active question during the lecture
- Student screens follow the active question in real time
- Students submit choice or text answers
- Admin sees responses immediately
- Display screen shows safe, presentation-ready results

## Main routes

- `/#/`
- `/#/student?session=robot-startup-2026`
- `/#/admin?session=robot-startup-2026`
- `/#/display?session=robot-startup-2026`

Hash routing is required for GitHub Pages deployment stability.

## Page requirements

### Student

- Nickname input
- Current question auto-load
- Choice answer submission
- Text answer submission
- Submitted state confirmation
- Waiting state between questions
- Mobile-first layout

### Admin

- Email/password sign-in
- Question list
- Change active question
- Open/close response collection
- Show/hide results
- Real-time response counts
- Approve/hide text answers
- Export CSV
- Show QR code
- Seed questions into Firestore

### Display

- Admin-auth-only in v1
- Large current question view
- Collection-in-progress state
- Bar chart for choice results
- Approved text answers only
- Large response count
- Presentation-first layout

## Technical stack

- Frontend: Vite + React + TypeScript
- Routing: React Router `HashRouter`
- Realtime data: Firebase Firestore
- Auth:
  - student -> Firebase Anonymous Auth
  - admin -> Firebase Email/Password Auth
- Charts: Recharts
- QR: qrcode.react
- Hosting: GitHub Pages

## Firestore model

```text
sessions
  /{sessionId}
    title
    activeQuestionId
    accepting
    showResults
    createdAt
    updatedAt

sessions/{sessionId}/questions
  /{questionId}
    order
    type
    title
    prompt
    choices
    maxLength
    visible

sessions/{sessionId}/questions/{questionId}/answers
  /{uid}
    uid
    nickname
    answer
    answerText
    approved
    hidden
    createdAt
    updatedAt
```

### Key rule

- Answer document id should be the student's Firebase `uid`.
- That gives a simple upsert model per student per question.

## Security model

- Students can read sessions and questions
- Students can create or update only `answers/{uid}` where the uid matches auth uid
- Students cannot read other students' answers
- Admin can read and write sessions, questions, and answers
- `approved` and `hidden` are admin-only fields
- `answerText` max length: `300`
- Never hardcode admin passwords in frontend code

## Environment variables

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

VITE_DEFAULT_SESSION_ID=robot-startup-2026
VITE_APP_NAME=DORO Live Survey
```

## Required structure

```text
doro-survey
├─ .github/workflows/deploy.yml
├─ public/favicon.svg
├─ src/app
├─ src/components/layout
├─ src/components/survey
├─ src/components/admin
├─ src/components/display
├─ src/components/common
├─ src/data
├─ src/firebase
├─ src/hooks
├─ src/pages
├─ src/utils
├─ src/styles
├─ DESIGN.md
├─ AGENTS.md
├─ firestore.rules
├─ firestore.indexes.json
├─ .env.example
├─ .env.local
├─ vite.config.ts
├─ package.json
└─ README.md
```

## Seed question plan

Initial lecture content should follow the real DORO startup lecture arc:

- choosing robotics entrepreneurship
- what matters first in a startup
- personal identity and ambition
- practical item selection
- running a robot event without robots
- final prep before an event
- monetization
- first revenue
- earning from your own experience
- DORO revenue structure
- mistakes and missed timing
- 7-day challenge

## Development sequence

### Phase 1

- Initialize Vite React TypeScript project
- Install dependencies
- Add `AGENTS.md`
- Add `DESIGN.md`
- Build app shell, router, common components, and empty pages

### Phase 2

- Add Firebase client bootstrap
- Add env handling
- Add auth layer

### Phase 3

- Add Firestore types and data access modules
- Add seed question data and admin seeding

### Phase 4

- Implement student page
- Implement admin page
- Implement display page

### Phase 5

- Add Firestore rules
- Add deployment workflow
- Run QA and rehearsal checks

## QA checklist

- `npm run build` passes
- no TypeScript errors
- student anonymous sign-in works
- admin sign-in works
- active question sync works
- answer submission works
- students cannot read others' answers
- choice aggregation is correct
- only approved text answers appear on display
- CSV export works
- GitHub Pages refresh does not break routing
- mobile layout remains usable

## Business extension

This can later evolve into a broader DORO classroom operations product:

- live quizzes
- live discussion and reactions
- instructor reports
- engagement analytics
- post-class satisfaction flow
- institution-facing reports
