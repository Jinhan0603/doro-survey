# DORO Live Survey

> 학생들이 QR로 실시간 답변하고, 강사가 결과를 바로 공개하는 **수업용 실시간 설문 시스템**입니다.

---

## 바로가기 링크

| 화면 | 링크 | 누가 사용하나요? |
|------|------|-----------------|
| **학생 화면** | [열기](https://jinhan0603.github.io/doro-survey/#/student?session=robot-startup-2026) | 수업 참여 학생 |
| **Admin 화면** | [열기](https://jinhan0603.github.io/doro-survey/#/admin?session=robot-startup-2026) | 강사 (로그인 필요) |
| **발표 화면** | [열기](https://jinhan0603.github.io/doro-survey/#/display?session=robot-startup-2026) | 강사 (빔프로젝터용) |

---

## 화면별 역할

### 학생 화면 (Student)
- QR 코드 또는 링크로 접속합니다.
- 닉네임을 입력하면 바로 현재 질문이 나타납니다.
- 객관식 선택 또는 주관식 작성 후 제출하면 끝입니다.
- 강사가 다음 질문을 열면 화면이 자동으로 바뀝니다.

### Admin 화면 (강사 전용)
- 이메일/비밀번호로 로그인합니다.
- 질문 목록에서 현재 질문을 선택합니다.
- **응답 열기 / 마감** 버튼으로 수집 상태를 조작합니다.
- **결과 공개** 버튼을 누르면 발표 화면에 그래프가 나타납니다.
- 주관식 답변은 승인/숨김 처리 후 공개할 수 있습니다.
- CSV 다운로드로 답변 데이터를 저장할 수 있습니다.

### 발표 화면 (Display)
- Admin 로그인 후 같은 브라우저에서 엽니다.
- 빔프로젝터나 큰 화면에 띄워두면 됩니다.
- Admin이 결과 공개를 누르는 순간 자동으로 그래프 또는 주관식 답변이 나타납니다.

---

## 수업 전 테스트 체크리스트

수업 전날 아래 순서대로 확인하세요.

- [ ] **Admin 로그인 확인** — [Admin 화면](https://jinhan0603.github.io/doro-survey/#/admin?session=robot-startup-2026)에서 이메일/비밀번호로 로그인되는지 확인
- [ ] **기본 질문 seed** — 로그인 후 상단의 `기본 질문 seed` 버튼 클릭 → 질문 목록이 뜨는지 확인
- [ ] **학생 화면 접속** — [학생 화면](https://jinhan0603.github.io/doro-survey/#/student?session=robot-startup-2026)에서 닉네임 입력 → 질문이 나타나는지 확인
- [ ] **응답 수집 테스트** — Admin에서 `응답 열기` → 학생 화면에서 답변 제출 → Admin 응답 테이블에 기록되는지 확인
- [ ] **결과 공개 테스트** — Admin에서 `결과 공개하기` → 발표 화면에 그래프가 나타나는지 확인
- [ ] **QR 코드 확인** — Admin 우측 QR 패널이 보이는지, QR로 학생 화면 접속이 되는지 확인
- [ ] **모바일 확인** — 스마트폰으로 학생 링크 접속 → 닉네임 입력 → 답변 제출 흐름 확인

---

## 수업 당일 사용 순서

```
1. 강사: Admin 화면 로그인
2. 강사: 기본 질문 seed 버튼 클릭 (처음 한 번만)
3. 강사: 발표 화면을 빔프로젝터에 연결
4. 강사: 학생들에게 QR 코드 또는 학생 링크 공유
5. 강사: 원하는 질문 선택 → 응답 열기
6. 학생: QR 접속 → 닉네임 입력 → 답변 제출
7. 강사: 응답이 충분히 모이면 응답 마감
8. 강사: 결과 공개 → 발표 화면에 그래프 표시
9. 함께 결과를 보며 토론
10. 다음 질문 선택 → 5번부터 반복
```

---

## 주의사항

- 학생에게는 **학생 링크만** 공유하세요. Admin 링크를 공유하지 마세요.
- 발표 화면은 Admin 로그인 후 **같은 브라우저**에서 새 탭으로 여세요.
- 질문이 안 보이면 Admin에서 `기본 질문 seed` 버튼을 먼저 누르세요.
- 주관식 답변은 Admin에서 **승인** 처리 후 발표 화면에 표시됩니다.

---

## 팀원 개발 환경 설정

Firebase 연결 없이도 미리보기 모드로 UI를 확인할 수 있습니다.

```bash
# 저장소 복제
git clone https://github.com/Jinhan0603/doro-survey.git
cd doro-survey

# 패키지 설치
npm install

# 개발 서버 실행 (Firebase 없이도 미리보기 가능)
npm run dev
```

브라우저에서 `http://localhost:5173/doro-survey/` 접속

### Firebase 연결 (실제 데이터 사용 시)

`.env.example` 파일을 복사해서 `.env` 파일을 만들고 Firebase 프로젝트 설정값을 입력하세요.

```bash
cp .env.example .env
```

`.env` 파일 내용:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_DEFAULT_SESSION_ID=robot-startup-2026
VITE_APP_NAME=DORO Live Survey
```

### 빌드 및 배포

```bash
npm run build       # 빌드 확인
git push origin main  # main에 push하면 GitHub Actions가 자동 배포
```

---

## 기술 스택

| 항목 | 내용 |
|------|------|
| 프레임워크 | React 19 + TypeScript |
| 빌드 도구 | Vite |
| 백엔드 | Firebase (Firestore + Auth) |
| 배포 | GitHub Pages (GitHub Actions 자동 배포) |
| 인증 | 학생: 익명 로그인 / 강사: Email + Password |

---

## 프로젝트 구조

```
src/
├── pages/          # 학생(Student), 관리자(Admin), 발표(Display), 홈(Home) 페이지
├── components/
│   ├── admin/      # 질문 목록, 운영 제어, QR 패널, 응답 테이블
│   ├── common/     # 공용 Button, Card, Badge, Input
│   ├── display/    # 발표용 결과 차트, 답변 월
│   ├── layout/     # AppShell, PageHeader (공통 레이아웃)
│   └── survey/     # 질문 카드, 객관식, 주관식, 대기 상태
├── firebase/       # Firestore CRUD, Auth, 타입 정의
├── hooks/          # useAuth, useSession, useActiveQuestion, useAnswers
├── data/           # 미리보기용 더미 데이터, seed 질문 세트
└── styles/         # global.css (Apple-inspired 디자인 시스템)
```
