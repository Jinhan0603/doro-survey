# DORO Live Survey V2

> DOROSSAEM 기술/툴/실습형 수업을 위한 참여 설계 + 실시간 운영 시스템

DORO Live Survey V2는 기존 실시간 설문 엔진 위에 **lesson template planner**를 얹은 제품입니다.
강사는 수업 전에 phase별 interaction 흐름을 템플릿으로 설계하고, 수업 중에는 Student/Admin/Display 화면으로 그대로 운영할 수 있습니다.

이 프로젝트는 특정 강연이나 단일 주제 전용이 아니라, DOROSSAEM의 다양한 기술 수업 포맷을 공통 구조로 다루는 것을 목표로 합니다.

---

## Overview

V2의 핵심은 아래 흐름을 한 제품 안에서 연결한 것입니다.

1. `Library`에서 내 템플릿과 공유 템플릿을 관리합니다.
2. `Builder`에서 phase별 slides와 interaction block을 설계합니다.
3. `Session New`에서 템플릿 기반 live session을 생성합니다.
4. `Admin`에서 수업 중 질문 전환과 결과 공개를 운영합니다.
5. `Student`는 모바일에서 현재 질문에 응답합니다.
6. `Display`는 공개 가능한 결과만 프로젝터 화면에 보여줍니다.

---

## Version Notes

README에는 V1과 V2의 운영 맥락을 계속 남깁니다.

### V1 Live Survey

- Student/Admin/Display 중심의 실시간 설문 엔진
- `sessions/{sessionId}/questions/{questionId}/answers/{uid}` 구조
- 로봇 창업 강의(`robot-startup-2026`)에서 사용한 과거 질문 세트 유지
- Admin의 seed 선택에서 `과거 로봇 창업 강의 질문`으로 다시 업로드 가능

### V2 Lesson Template Planner

- V1 실시간 엔진 위에 lesson template planner를 추가
- 수업 phase, slide, interaction block, visibility를 사전 설계
- DOROSSAEM 기술/툴/실습형 수업에 공통 적용하는 현재 질문 세트 유지
- Admin의 seed 선택에서 `현재 기술 수업 질문`으로 업로드 가능

---

## V2 Scope

이번 V2 범위는 아래 8개 축으로 구성됩니다.

1. startup 전용 문구를 일반적인 **실시간 기술 수업 시스템** 관점으로 정리
2. `lessonTemplates` 기반 데이터 구조 추가
3. `Library / Builder / Session New` 화면 및 라우트 추가
4. 브라우저 전용 PPTX 추출 + phase 분류
5. 외부 AI 없이 동작하는 규칙 기반 interaction generator
6. `choice / text / multi / scale / status` 런타임 지원
7. `public / teacher-only / hidden` 결과 visibility 분리
8. admin allowlist를 유지한 채 `teacher` role과 조직 공유 모델 확장

---

## Class Flow

DORO 표준 수업 arc는 다음과 같습니다.

```text
도입 → 이론 → 실습 → 윤리/활용 사례 → 마무리
```

각 phase에는 하나 이상의 interaction block이 들어갑니다.

- `prior-knowledge`
- `prediction`
- `concept-check`
- `confidence-check`
- `readiness-check`
- `progress-check`
- `troubleshoot`
- `ethics-case`
- `exit-ticket`

Builder에서는 자주 쓰는 DORO 기본 버튼도 제공합니다.

- 도입 질문 추가
- 이론 체크 추가
- 실습 준비 체크 추가
- 실습 중간 체크 추가
- 윤리 질문 추가
- 마무리 질문 추가

---

## Main Screens

### Home

- 제품 개요와 역할별 진입점 제공
- Student/Admin/Display/Library 동선 요약
- `lesson template 만들기` 버튼과 `세션 만들기` 버튼 제공

### Library

- 내 lesson template 목록
- 조직/공유 template 목록
- 새 lesson template 만들기
- 복제하기
- visibility 변경
- session 생성 진입

### Builder

- lesson template 제목/설명/대상학년/과목유형/사용툴 편집
- phase별 섹션 UI
- slides 목록 편집
- interaction block 추가/수정/삭제/정렬
- `interactionType / purpose / resultVisibility / inputType` 편집
- `presenterNote / timingLabel` 편집
- PPTX 업로드 기반 slides 추출/phase 분류
- 규칙 기반 interaction 초안 생성

### Session New

- 템플릿 선택
- `sessionId` 입력
- `title` 입력
- `createSessionFromLessonTemplate` 실행
- 생성 후 Student/Admin/Display 링크와 QR 제공

### Student

- 모바일 우선 참여 화면
- 익명 로그인 유지
- 현재 질문에 응답
- 새 질문이 열리면 자동 갱신

### Admin

- 강사용 운영 화면
- 현재 질문 선택
- seed 질문 세트 선택: `현재 기술 수업 질문` / `과거 로봇 창업 강의 질문`
- 응답 열기/마감
- 공개 가능한 질문만 Display 공개
- teacher-only 결과는 Admin에서만 집계
- CSV export 지원

### Display

- 프로젝터용 결과 화면
- `public` 질문만 표시
- `teacher-only / hidden` 질문은 표시하지 않음

---

## PPTX Import

Builder는 PPTX 원본 파일을 **브라우저에서만** 읽습니다.

- 서버 저장 금지
- Firebase Storage 사용 금지
- 추출된 슬라이드 메타데이터만 템플릿에 반영

사용 패키지:

- `jszip`
- `fast-xml-parser`

추출 유틸:

- [src/utils/pptx.ts](</C:/Users/User/Documents/Jindex/doro-survey/src/utils/pptx.ts>)
- `extractSlidesFromPptx(file: File): Promise<ExtractedSlide[]>`

`ExtractedSlide`는 다음 정보를 제공합니다.

- `slideNumber`
- `title`
- `text`
- `rawTexts`
- `detectedPhase`
- `phaseConfidence`

phase 분류 규칙:

- `intro`: 도입, 목표, 왜, 문제, 궁금, 해볼까요
- `theory`: 원리, 개념, 구조, 설명, 특징, 문법, 알고리즘
- `practice`: 실습, 따라하기, 조립, 코딩, 설정, 만들기, 미션, 활동
- `ethics`: 윤리, 사례, 활용, 저작권, 개인정보, 안전, 책임, 오용, 한계
- `wrapup`: 정리, 회고, 퀴즈, 발표, 오늘 배운 것, 다음 시간

강사는 Builder에서 자동 분류 결과를 수동으로 수정할 수 있습니다.

---

## Interaction Generator

외부 AI API는 사용하지 않습니다.
interaction 초안은 브라우저에서 **규칙 기반**으로 생성되며, 생성 후 강사가 직접 수정할 수 있습니다.

생성 유틸:

- [src/utils/interactionGenerator.ts](</C:/Users/User/Documents/Jindex/doro-survey/src/utils/interactionGenerator.ts>)
- `generateInteractionsFromSlides(slides, options)`

옵션:

- `subjectType`: `ai | robot | making | coding | mixed`
- `audienceLevel`: `elementary | middle | high | university`
- `density`: `low | medium | high`

대표 규칙:

- `intro`에서 prior-knowledge / prediction / confidence-check 생성
- `theory`에서 concept-check / confidence-check 생성
- `practice` 시작 전 readiness-check 자동 생성
- practice slide가 3장 이상이면 progress-check 자동 생성
- ethics slide가 있으면 ethics-case 자동 생성
- 마지막 2~3장을 기준으로 exit-ticket 생성

---

## Runtime Model

기존 `choice / text` 질문은 그대로 유지하면서 V2 타입을 확장합니다.

지원 input type:

- `choice`
- `text`
- `multi`
- `scale`
- `status`

답변 저장 구조:

- 기존 `answer`, `answerText` 유지
- V2 optional 필드 추가:
  - `answerKind`
  - `answerValue`
  - `answerValues`
  - `displayAnswer`

하위 호환성 원칙:

- 기존 answer docs export 가능
- 기존 Student/Admin/Display 흐름 유지
- V1 question doc도 fallback으로 동작

관련 파일:

- [src/firebase/types.ts](</C:/Users/User/Documents/Jindex/doro-survey/src/firebase/types.ts>)
- [src/firebase/answers.ts](</C:/Users/User/Documents/Jindex/doro-survey/src/firebase/answers.ts>)
- [src/utils/questionRuntime.ts](</C:/Users/User/Documents/Jindex/doro-survey/src/utils/questionRuntime.ts>)
- [src/utils/stats.ts](</C:/Users/User/Documents/Jindex/doro-survey/src/utils/stats.ts>)

---

## Visibility Model

질문 결과 visibility는 다음 3단계입니다.

- `public`
- `teacher-only`
- `hidden`

동작 원칙:

- `public`: Display에 표시 가능
- `teacher-only`: Admin에서만 집계
- `hidden`: Display 비노출

예시:

- intro/theory 기본값은 `public`
- readiness-check, progress-check, troubleshoot 기본값은 `teacher-only`
- exit-ticket은 기본적으로 `hidden` 또는 강사 판단에 따라 조정 가능

---

## Sharing And Permissions

V2는 기존 **admin allowlist** 구조를 유지하면서 `teacher` role을 추가합니다.

### admin

- Firebase Email/Password 로그인
- allowlist 이메일 기준 전역 관리자
- 전체 `users`, `lessonTemplates`, `sessions`, `answers` read/write/delete 가능

### teacher

- Firebase Email/Password 로그인
- `users/{uid}`에 `role: "teacher"` 프로필 저장
- 자기 lesson template 생성/수정/삭제 가능
- 같은 조직의 `org` template와 전체 `shared` template read 가능
- 자기 session read/write 가능
- 자기 session answer read 가능
- 응답 숨김/삭제 같은 전역 moderation은 admin allowlist 계정에서 수행

### student

- Firebase Anonymous Auth 유지
- `session`, `question` 문서 read 가능
- 자기 `answer` 문서 create/update 가능
- 다른 학생 `answer` read 불가

### template visibility

- `private`: 작성자 본인만 사용
- `org`: 같은 `organizationId`의 강사에게 공개
- `shared`: 조직을 넘어 모든 강사에게 공개
- legacy `shared: true` 문서는 하위 호환을 위해 계속 read 가능

권한 규칙 파일:

- [firestore.rules](</C:/Users/User/Documents/Jindex/doro-survey/firestore.rules>)

인덱스:

- [firestore.indexes.json](</C:/Users/User/Documents/Jindex/doro-survey/firestore.indexes.json>)

---

## Routes

GitHub Pages 배포를 위해 `HashRouter`를 유지합니다.

| Route | Description |
|------|------|
| `/` | Home |
| `/library` | lesson template library |
| `/builder` | 새 lesson template 작성 |
| `/builder/:templateId` | 기존 template 편집 |
| `/session-new` | template 기반 live session 생성 |
| `/student?session=<id>` | 학생 참여 화면 |
| `/admin?session=<id>` | 강사 운영 화면 |
| `/display?session=<id>` | 발표 화면 |
| `/planner` | 기존 링크 호환용 alias, 현재 library로 연결 |

라우터 정의:

- [src/app/router.tsx](</C:/Users/User/Documents/Jindex/doro-survey/src/app/router.tsx>)

---

## Data Model

기존 live survey 세션 구조는 유지하면서 V2 컬렉션을 추가하는 방식입니다.

기존 세션 구조:

```text
sessions/{sessionId}
sessions/{sessionId}/questions/{questionId}
sessions/{sessionId}/questions/{questionId}/answers/{uid}
```

V2 추가 컬렉션:

```text
users/{uid}
lessonTemplates/{templateId}
lessonTemplates/{templateId}/slides/{slideId}
lessonTemplates/{templateId}/interactions/{interactionId}
```

핵심 타입 정의:

- `LessonTemplateDoc`
- `LessonSlideDoc`
- `LessonInteractionDoc`
- `UserProfileDoc`

참고:

- [src/firebase/types.ts](</C:/Users/User/Documents/Jindex/doro-survey/src/firebase/types.ts>)

---

## Tech Stack

| 항목 | 내용 |
|------|------|
| 프레임워크 | React 19 + TypeScript |
| 번들러 | Vite |
| 라우터 | React Router + HashRouter |
| 데이터 | Firebase Firestore |
| 인증 | 학생: Anonymous Auth / 강사: Email + Password |
| 차트 | Recharts |
| QR | qrcode.react |
| PPTX 분석 | jszip, fast-xml-parser |
| ID 생성 | nanoid |
| 배포 | GitHub Pages |

---

## Local Development

```bash
git clone https://github.com/Jinhan0603/doro-survey.git
cd doro-survey
npm install
npm run dev
```

기본 접속 주소:

```text
http://localhost:5173/doro-survey/
```

---

## Environment Variables

`.env.example`를 복사해 `.env` 파일을 만들고 Firebase 설정값을 입력합니다.

```bash
cp .env.example .env
```

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_DEFAULT_SESSION_ID=doro-tech-class-2026
VITE_APP_NAME=DORO Live Survey
```

---

## Build

```bash
npm run build
```

현재 저장소는 최종 반영 시점 기준으로 `npm run build` 통과를 유지합니다.

---

## Security And Constraints

- admin 비밀번호를 프론트 코드에 저장하지 않습니다.
- admin allowlist는 유지하고 teacher는 Firestore role 문서로 확장합니다.
- `dangerouslySetInnerHTML`을 사용하지 않습니다.
- 학생 텍스트 답변은 300자 이내로 제한합니다.
- 입력은 trim 처리합니다.
- PPTX 원본 파일은 브라우저에서만 읽고 서버에 저장하지 않습니다.
- Firebase Storage는 사용하지 않습니다.
- Cloud Functions나 별도 백엔드를 추가하지 않습니다.

---

## Notes

- Display 화면은 현재 이메일 로그인된 강사/관리자 브라우저 컨텍스트에서 사용합니다.
- Student 익명 로그인과 Teacher/Admin 이메일 로그인을 분리해 동작합니다.
- `/student`, `/admin`, `/display` 기존 런타임은 V2 타입 추가 이후에도 하위 호환을 유지하도록 설계했습니다.
