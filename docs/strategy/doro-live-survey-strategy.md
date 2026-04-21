# DORO Live Survey V2 Strategy

## Summary

- Product name: `DORO Live Survey`
- Version: V2
- Purpose: Participation design and operation system for DOROSSAEM tech/tool/hands-on classes
- Primary users: DOROSSAEM teachers (수업 설계 + 실시간 운영) and students (모바일 참여)
- Scale: 20–50 students per class

## V2 product direction

V2 shifts from a single-lecture Q&A tool to a reusable **class participation platform**:

- Teachers build **lesson templates** before class, organized by phase
- Templates encode the full class arc: 도입 → 이론 → 실습 → 윤리/활용 사례 → 마무리
- Each phase has **interaction blocks** (survey, quiz, discussion, reflection)
- Admin launches a **live session** from any template in one click
- Live session inherits all questions and phase structure from the template
- All existing real-time ops (student submission, display, answer moderation) are preserved

## Class flow (DORO standard)

```
도입        — Hook, prior knowledge check, warm-up question
이론        — Core concept quiz or comprehension check
실습        — Hands-on activity response, reflection prompt
윤리/활용   — Case discussion, ethical scenario question
마무리      — Summary reflection, takeaway survey
```

## Delivery model

```text
Teacher designs template in Planner
       ↓
Admin launches session from template
       ↓
Student smartphone → QR → GitHub Pages web app
       ↓
Firebase Firestore stores answers in real time
       ↓
Admin and Display screens subscribe in real time
```

## Firestore data model

### Existing (preserved)

```text
sessions/{sessionId}
  title
  activeQuestionId
  accepting
  showResults
  templateId          ← NEW: link to originating template
  currentPhase        ← NEW: active phase label for admin UI
  createdAt
  updatedAt

sessions/{sessionId}/questions/{questionId}
  order
  type
  title
  prompt
  choices
  maxLength
  visible
  phase               ← NEW: which class phase this question belongs to
  interactionType     ← NEW: survey | quiz | discussion | reflection
  visibility          ← NEW: public | teacher-only

sessions/{sessionId}/questions/{questionId}/answers/{uid}
  uid
  nickname
  answer
  answerText
  approved
  hidden
  createdAt
  updatedAt
```

### New: Lesson Templates

```text
lessonTemplates/{templateId}
  title
  subject             — e.g. "로봇과 창업", "AI 활용", "앱 개발"
  description
  phases: [
    {
      id
      type: 도입 | 이론 | 실습 | 윤리 | 마무리
      label
      questions: [
        {
          questionId
          order
          type: choice | text
          interactionType: survey | quiz | discussion | reflection
          visibility: public | teacher-only
          title
          prompt
          choices
          maxLength
        }
      ]
    }
  ]
  createdAt
  updatedAt
```

## Routes

- `/#/` — Home (role cards + template gallery)
- `/#/planner` — Lesson Template Planner (admin-only)
- `/#/student?session=<id>` — Student participation
- `/#/admin?session=<id>` — Admin live operations
- `/#/display?session=<id>` — Projector display

Hash routing required for GitHub Pages.

## Security model

- Students: read sessions/questions, create/update own answers
- Admin: full read/write on sessions, questions, answers, lessonTemplates
- `lessonTemplates` are admin-only write, but readable by all signed-in users
- `approved`, `hidden`: admin-only fields on answers
- `answerText` max length: 300 chars

## Design direction

- Core style: warm minimalism (Notion-inspired)
- Phase indicator in admin: color-coded pill per phase type
- Planner view: horizontal timeline of phases, cards per interaction block
- Student page: unchanged mobile-first single-column flow
- Display page: can optionally show current phase label

## V2 implementation phases

### Phase 1 — Docs and data model (current)
- Update AGENTS.md, strategy docs
- Add V2 Firestore types to `src/firebase/types.ts`
- Add `lessonTemplates.ts` data access module
- Update Firestore rules to allow admin CRUD on `lessonTemplates`

### Phase 2 — Lesson Template Planner
- `/planner` route and `PlannerPage.tsx`
- Template list view (cards per template)
- Template detail: phase timeline + interaction block cards
- Create/edit template form
- "Launch session from template" action

### Phase 3 — Admin V2 upgrades
- Phase indicator in admin header (shows current phase)
- Questions grouped by phase in question list
- Session launched from template pre-populates questions

### Phase 4 — Polish and QA
- Home page: template gallery cards
- Display page: optional phase label
- Full QA checklist run

## QA checklist

- `npm run build` passes
- No TypeScript errors
- Student anonymous sign-in works
- Admin sign-in works
- Active question sync works
- Answer submission works
- Students cannot read others' answers
- Choice aggregation is correct
- Only approved text answers appear on display
- CSV export works
- Lesson template create/edit/delete works (admin)
- Session launch from template creates correct questions
- Phase indicator updates correctly in admin
- GitHub Pages refresh does not break routing
- Mobile layout remains usable

## Preserved functionality

All V1 features are fully preserved:
- Real-time student answer submission
- Admin question control (active question, accepting, showResults)
- Display screen with live chart and answer wall
- QR code in admin
- Answer moderation (approve/hide)
- Response reset (Danger Zone)
- CSV export
- Firebase anonymous + email auth
