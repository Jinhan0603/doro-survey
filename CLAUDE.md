# DORO Live Survey

실시간 수업 참여 도구. 교사가 질문을 진행하고 학생이 링크/QR로 참여해 응답하면,
발표 화면에 결과를 실시간으로 보여준다. (survey.doroedu.co.kr)

## Tech Stack

| 영역 | 기술 |
|------|------|
| Client | Vite + React 19 + TypeScript (HashRouter SPA) |
| Data | Firebase (Firestore 실시간 구독 + Auth) |
| Auth | Firebase Auth (교사 이메일 / 학생 익명) → **DoroGate Keycloak SSO로 전환 예정** |
| Charts | recharts |
| Deploy | dev → survey.doroedu.co.kr 서버, main → GitHub Pages |

## Commands

```bash
npm run dev      # 개발 서버 (vite)
npm run build    # 빌드 (tsc -b && vite build)
npm run lint     # eslint
npx tsc --noEmit # 타입체크만
```
> 테스트 프레임워크는 아직 없음. 검증은 빌드/타입체크 + codex 위임으로 한다.

## 화면 구성

- `/` 홈(발표자 랜딩) · `/admin` 교사 운영 콘솔 · `/display` 발표 화면 · `/student` 학생 참여(참여 링크 전용)
- `/builder` `/library` 수업 템플릿 · `/session-new` `/custom-session` 세션 생성 · `/planner`
- 세 핵심 화면(Student/Admin/Display)은 같은 `?session=<id>`를 공유. Firebase 미설정 시 mock 미리보기로 폴백.

## Security Rules (필수)

- **시크릿**: 코드/로그에 노출 금지. Firebase 설정은 `import.meta.env`(VITE_*)로만. `.env`는 커밋 금지.
- **Firestore 규칙**: 권한 변경은 `firestore.rules`에 반영하고, 익명 학생 write 경로(`studentCreatesAnswer`)를 깨지 않는다.
- **사용자 입력**: 닉네임/답변은 `utils/sanitize.ts`로 정규화 후 저장.

## Codex 위임 검증 (필수)

**단순한 변경 작업을 제외한 모든 작업은 반드시 `docs/codex.md`를 참고**해
각 step의 완수 여부를 `codex`에 위임 검증한다.
(기능 구현, 리팩터, 마이그레이션, 버그 수정, 로직 변경 등 — 사실상 코드 동작에
영향을 주는 작업 전부 해당)

> **단순한 변경 작업** = codex 검증 없이 진행 가능한 것:
> 오타/주석/문구 수정, 포매팅, 단순 rename, 설정/문서 편집 등
> 동작 변화가 없거나 자명한 1~2줄 수정. 애매하면 codex 검증 대상으로 간주한다.

**핵심 규칙:**
- Claude는 구현, 판정은 codex(`VERDICT: PASS|FAIL`)가 내린다. Claude 자체 self-judge 금지.
- step별 PASS → 대상 파일만 즉시 커밋 후 다음 step 자동 진행(사용자에게 "계속할까요?" 묻지 않음).
- FAIL → 사유 보고 후 수정·재검증. Claude가 임의로 "됐다" 처리 금지.
- 호출 방법, 프롬프트 템플릿, 안전망 운용, 트러블슈팅은 **`docs/codex.md` 전문 참고**.

> 진짜 멈춰야 할 때: 설계 모호함, 같은 step FAIL 반복(2~3회), 되돌리기 어려운 외부 작업(배포·force push·삭제 등).

## 진행 중 작업

- **DoroGate(Keycloak) SSO 연동** — 발표자 앱 전체를 진입 시 1회 로그인으로 게이팅, 내부 로그인 프롬프트 제거.
  전체 계획: `docs/auth-integration-plan.md`.

## Conventions

- 주석/커밋 메시지: 한국어 우선
- 네이밍: camelCase(변수/함수), PascalCase(컴포넌트/타입)
- 기존 파일/디렉토리 패턴을 따른다(새 디렉토리 지양). 컴포넌트는 `src/components/<area>/`, 페이지는 `src/pages/`.
