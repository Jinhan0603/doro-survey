# DORO Live Survey V2

> DOROSSAEM 기술/툴/실습형 수업을 위한 참여 설계 + 실시간 운영 시스템

DORO Live Survey V2는 기존 실시간 설문 엔진 위에 **lesson template planner**를 얹은 제품입니다.
강사는 수업 전에 phase별 interaction 흐름을 템플릿으로 설계하고, 수업 중에는 Student/Admin/Display 화면으로 그대로 운영할 수 있습니다.

이 프로젝트는 특정 강연이나 단일 주제 전용이 아니라, DOROSSAEM의 다양한 기술 수업 포맷을 공통 구조로 다루는 것을 목표로 합니다.

---

## Access Links

GitHub Pages 배포 주소:

- [DORO Live Survey Home](https://jinhan0603.github.io/doro-survey/)

### V1 Live Survey

기존 로봇 창업 강의 세션(`robot-startup-2026`) 접근 링크입니다. Admin에서 seed를 실행할 때 `과거 로봇 창업 강의 질문`을 선택하면 이 세션에 V1 질문 세트를 다시 올릴 수 있습니다.

| Screen | Link |
|------|------|
| Admin | [V1 Admin - robot-startup-2026](https://jinhan0603.github.io/doro-survey/#/admin?session=robot-startup-2026) |
| Student | [V1 Student - robot-startup-2026](https://jinhan0603.github.io/doro-survey/#/student?session=robot-startup-2026) |
| Display | [V1 Display - robot-startup-2026](https://jinhan0603.github.io/doro-survey/#/display?session=robot-startup-2026) |

### V2 Lesson Template Planner

현재 V2 템플릿 설계/세션 생성 흐름과 직접 질문 생성 흐름 접근 링크입니다. Admin에서 seed를 실행할 때 `현재 기술 수업 질문`을 선택하면 V2 기본 기술 수업 질문 세트를 올릴 수 있습니다.

| Screen | Link |
|------|------|
| Home | [V2 Home](https://jinhan0603.github.io/doro-survey/) |
| Library | [V2 Lesson Template Library](https://jinhan0603.github.io/doro-survey/#/library) |
| Builder | [V2 Lesson Template Builder](https://jinhan0603.github.io/doro-survey/#/builder) |
| Session New | [V2 New Lesson Session](https://jinhan0603.github.io/doro-survey/#/session-new) |
| Direct Question Session | [V2 Direct Question Session](https://jinhan0603.github.io/doro-survey/#/custom-session) |
| Admin | [V2 Admin - doro-tech-class-2026](https://jinhan0603.github.io/doro-survey/#/admin?session=doro-tech-class-2026) |
| Student | [V2 Student - doro-tech-class-2026](https://jinhan0603.github.io/doro-survey/#/student?session=doro-tech-class-2026) |
| Display | [V2 Display - doro-tech-class-2026](https://jinhan0603.github.io/doro-survey/#/display?session=doro-tech-class-2026) |

Admin, Display, Library, Builder, Session New, Direct Question Session은 강사/관리자 Email/Password 로그인이 필요합니다. Student 화면은 익명 로그인으로 참여합니다.

---

## Overview

V2의 핵심은 아래 흐름을 한 제품 안에서 연결한 것입니다.

1. `Library`에서 내 템플릿과 공유 템플릿을 관리합니다.
2. `Builder`에서 phase별 slides와 interaction block을 설계합니다.
3. `Session New`에서 템플릿 기반 live session을 생성합니다.
4. 빠른 수업이나 일회성 활동은 `Direct Question Session`에서 직접 질문을 작성해 live session을 생성합니다.
5. `Admin`에서 수업 중 질문 전환과 결과 공개를 운영합니다.
6. `Student`는 모바일에서 현재 질문에 응답합니다.
7. `Display`는 공개 가능한 결과만 프로젝터 화면에 보여줍니다.

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
- 템플릿 없이 직접 질문을 작성해 즉시 live session을 생성하는 빠른 V2 경로 추가
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
9. 직접 질문 기반 live session 생성 화면 추가

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

### Direct Question Session

- 템플릿 없이 직접 질문 작성
- `choice / text / multi / scale / status` 질문 생성
- `public / teacher-only / hidden` 결과 visibility 설정
- 생성 직후 첫 질문 응답 수집을 열지 선택
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
| `/custom-session` | 직접 질문 기반 live session 생성 |
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

직접 질문 세션은 새 컬렉션을 만들지 않고 기존 live survey 구조에 바로 저장됩니다.

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
