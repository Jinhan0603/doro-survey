# DoroGate(Keycloak) SSO 연동 — 실행 계획

> 작성 2026-06-30. 발표자 앱(survey.doroedu.co.kr)의 인증을 DoroGate 중앙 인증으로 전환.

## 목표

- 발표자만 루트(`/`) 접근, 학생은 참여 링크(`/student`)로만 접근.
- 진입 시 **1회 DoroGate 로그인**으로 통일하고, 앱 내부의 그때그때 뜨는 로그인 프롬프트를 모두 제거.
- **teacher / manager / admin** 통과, **student** 차단("권한 없음").

## 핵심 제약

Firestore 보안은 **Firebase Auth 토큰**에 묶여 있는데 DoroGate는 **Keycloak(OIDC) 토큰**을 발급한다.
→ Keycloak 신원을 Firebase 신원으로 변환하는 **브리지가 필수**. 이게 작업 규모가 큰 이유.

## 확정 결정

- 브리지 = **Firebase Custom Token + 교환 서버**, 호스트 = **Firebase Functions** (survey 프로젝트 내, Blaze 플랜 필요).
- Keycloak: issuer `https://gate.doroedu.co.kr/realms/doro`, realm `doro`, JWKS 엔드포인트 사용.
  public + **PKCE** 클라이언트 `doro-survey-web` 신규 등록.
- 역할: student / teacher / manager / admin (**parent 역할은 없음**). 통과 = teacher/manager/admin, 차단 = student.
- Firebase uid = `kc:{sub}` 로 고정(재로그인해도 소유권 유지).
- `/student`는 게이트 제외 + 기존 Firebase 익명 인증 유지(답변 write 필요).

## 아키텍처

```
[발표자 브라우저] →(미인증)→ [DoroGate Keycloak: PKCE 로그인]
   → access token(role claim) → [Firebase Function exchangeToken]
       · KC 토큰 JWKS 검증 (issuer/aud)
       · role ∈ {teacher,manager,admin} 확인 (student → 403)
       · users/{uid} JIT 생성/갱신, uid = kc:{sub}
       · createCustomToken(uid, {role,email,org}) 반환
   → survey SPA: signInWithCustomToken() → Firestore (role claim 기반 규칙)
```

## Phase별 작업

### Phase 1 — DoroGate 측 (gate.doroedu.co.kr, 별도 레포/배포)
- realm `doro`에 OIDC 클라이언트 `doro-survey-web` 등록: public+PKCE, redirect `https://survey.doroedu.co.kr/*`(+`http://localhost:5173/*`), Web Origins.
- realm role(teacher/manager/admin)을 토큰 claim에 포함하도록 client scope mapper 확인.

### Phase 2 — Firebase Function `exchangeToken` (신규 `functions/`)
- `firebase init functions` (Blaze 전환). `jose`로 KC access token JWKS 검증 → role 화이트리스트 → uid `kc:{sub}` → `users/{uid}` JIT → `createCustomToken` 반환, student/미허용 403.

### Phase 3 — 프런트 인증 계층 (`src/`)
- `oidc-client-ts` 추가. `src/auth/keycloak.ts`, `src/auth/AuthProvider.tsx`(KC 로그인→exchange→`signInWithCustomToken`→`{user,role,loading,signOut}`).
- `src/components/auth/AuthGate.tsx`: 미인증→KC 리다이렉트 / student→권한없음 / 그 외→렌더.
- `router.tsx`: `/student` 제외 전 라우트 게이팅, OIDC 콜백 처리(HashRouter 대응).
- env: `VITE_KEYCLOAK_ISSUER`, `VITE_KEYCLOAK_CLIENT_ID`, `VITE_AUTH_EXCHANGE_URL` + `.env.example` 갱신.

### Phase 4 — 내부 로그인 프롬프트 제거
- `AdminPage` 이메일/비번 폼, `components/teacher/TeacherGate.tsx`, `DisplayPage` "먼저 Admin에서 로그인" 배너,
  `LessonTemplateLibrary/Builder`·`NewLessonSession`·`CustomQuestionSession`·`Planner` 인증 배너 제거.
- `firebase/auth.ts`: `signInAdminWithEmail` 제거(익명 유지), custom-token 로그인 추가.
- `firebase/users.ts`: 이메일 allowlist 제거, role은 KC claim 기준.

### Phase 5 — Firestore 규칙 재작성 (`firestore.rules`)
- `adminEmails()`/이메일 모델 → **claim 모델**(`isAdmin = token.role in ['admin','manager']`, `isTeacher = token.role=='teacher'`).
- `ownerUid == request.auth.uid` 소유권 유지, 학생 익명 read/`studentCreatesAnswer` 경로 그대로.

### Phase 6 — 배포·검증
- `firebase deploy --only functions,firestore:rules` + 프런트 빌드 배포(dev).
- E2E: 교사 통과 / 학생 차단 / 내부 프롬프트 0 / 참여 링크 정상 / 실시간 유지. 롤백 절차 확보.

## 리스크
1. **기존 ownerUid 마이그레이션** — 옛 이메일 uid ↔ 새 `kc:{sub}` 불일치. 실데이터 있으면 선행 매핑 필요. *(Phase 0에서 점검)*
2. **HashRouter ↔ OIDC redirect_uri** 콜백 처리.
3. **Blaze 플랜 전환**(Functions 과금).
4. DoroGate는 별도 인프라/레포(SCP+docker 배포).

## 참고
- DoroGate 레포: `C:\Users\pc\Documents\DoroGate` (gate.doroedu.co.kr, 서버 210.109.54.214).
- DoroBus도 동일 Keycloak realm에 연동됨(매핑 manager→admin 참고).
