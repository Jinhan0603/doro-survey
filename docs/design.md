# DORO 실시간 설문 — 라이트 테마 디자인 가이드

> 발표자 앱(홈·운영 콘솔·발표·학생·빌더) 전 화면의 색/타이포/형태를 이 문서로 통일한다.
> 인라인 스타일·CSS 모두 아래 값을 우선 사용한다.
> **기준점**: 홈/헤더에서 쓰는 `dh-*` 토큰 세트 = **Primary `#2563eb`**, soft `#eff6ff`,
> 보더 `#dde7f3`, 텍스트 `#111827 / #4b5563 / #6b7280`. 스크린샷의 그 파란 느낌이 표준이다.

> ⚠️ 현재 코드에는 파란 Primary가 **세 종류**(`#2563eb`, `#0071e3`, `#0b7ff3`) 섞여 있다.
> 신규 작업은 전부 `#2563eb`(`--c-blue-500`)로 통일하고, 나머지는 §13 마이그레이션 표를 따른다.

---

## 0. 핵심 토큰

표준 토큰은 `src/styles/global.css :root`에 `--c-*` / `--sh-*`로 이미 정의돼 있다.
신규 코드는 raw hex 대신 이 CSS 변수를 우선 사용한다.

```css
:root {
  /* Brand / Primary (Blue) */
  --c-blue-500: #2563eb;   /* Primary 기준 */
  --c-blue-600: #1d4ed8;   /* hover/active */
  --c-blue-100: #dbeafe;   /* 선택 보더, 강조 배경 */
  --c-blue-50:  #eff6ff;   /* 선택/활성 soft 배경 */

  /* Accent (보조) */
  --c-green-500: #22a06b;  --c-green-600: #16915e;  --c-green-50: #ecfdf5;
  --c-purple-500: #6d5dfb; --c-purple-50: #f3f0ff;

  /* Text */
  --c-text:    #111827;    /* 제목/이름 */
  --c-text-2:  #4b5563;    /* 본문/설명 */
  --c-text-3:  #6b7280;    /* 라벨/메타 */
  --c-text-soft: #8a96a8;  /* placeholder/disabled */

  /* Surface / Background */
  --c-page-bg: #f6faff;    /* 페이지 배경 */
  --c-card:    #ffffff;    /* 카드/패널/모달 */

  /* Border */
  --c-border:      #dde7f3;  /* 기본 보더 */
  --c-border-soft: #e7eef8;  /* 가벼운 구분선 */

  /* Shadow */
  --sh-card:       0 12px 30px rgba(15, 61, 138, 0.07);
  --sh-card-hover: 0 16px 36px rgba(15, 61, 138, 0.10);
  --sh-header:     0 8px 24px rgba(15, 61, 138, 0.06);
  --sh-btn:        0 10px 20px rgba(37, 99, 235, 0.18);
}
```

> 라운드/타이포 기준은 §11·§12 참고. 폰트는 **Pretendard** 우선
> (`Pretendard, Inter, 'Noto Sans KR', system-ui, sans-serif`).

---

## 1. 색상 팔레트

### Primary (Blue) — 링크·버튼·활성 상태의 기준색

| 용도 | 변수 | HEX |
|---|---|---:|
| Primary | `--c-blue-500` | `#2563eb` |
| Primary hover/active | `--c-blue-600` | `#1d4ed8` |
| 선택 보더 / 강조 | `--c-blue-100` | `#dbeafe` |
| 선택·활성 soft 배경 | `--c-blue-50` | `#eff6ff` |

### Accent (보조) — 기능 구분용. 남발 금지

| 색 | 500 | 600 | 50 | 사용처 |
|---|---:|---:|---:|---|
| **Green** | `#22a06b` | `#16915e` | `#ecfdf5` | 완료/성공, 발표 진행 액션 |
| **Purple** | `#6d5dfb` | — | `#f3f0ff` | 플래너/실험 기능 강조 |

### Feedback

| 용도 | HEX | 사용처 |
|---|---:|---|
| Danger 텍스트/보더 | `#dc2626` | 삭제·오류 |
| Danger 강조 텍스트 | `#b91c1c` | 폼 에러 메시지 |
| Danger soft 배경 | `#fef2f2` | 삭제 버튼 hover |
| Success | `#22a06b` | 제출 완료, 성공 안내 |

---

## 2. 텍스트 색상

| 용도 | 변수 | HEX | 사용처 |
|---|---|---:|---|
| **제목 / 이름** | `--c-text` | `#111827` | 헤딩, 카드 제목, 유저 이름 |
| **본문 / 설명** | `--c-text-2` | `#4b5563` | 설명 문구, 안내 메시지 |
| **라벨 / 메타** | `--c-text-3` | `#6b7280` | 날짜, 개수, 보조 라벨 |
| **placeholder / disabled** | `--c-text-soft` | `#8a96a8` | placeholder, 비활성 텍스트 |
| **링크 / 활성 / 강조** | `--c-blue-500` | `#2563eb` | 링크, 활성 탭/네비, 강조 |
| **에러** | — | `#dc2626` | 오류·삭제 텍스트 |

> placeholder는 `#9ca3af`도 혼용 중이나 신규는 `--c-text-soft`(`#8a96a8`)로 맞춘다.
> 컬러 버튼(파랑/초록 배경) 위 텍스트는 **반드시 `#fff`**.

---

## 3. 배경

| 용도 | 변수 | 값 | 사용처 |
|---|---|---:|---|
| **페이지 배경** | `--c-page-bg` | `#f6faff` | 최하위 배경 |
| **카드 / 패널 / 모달** | `--c-card` | `#ffffff` | 카드, 사이드 패널, 모달 |
| **선택 / 활성 배경** | `--c-blue-50` | `#eff6ff` | 선택된 리스트 행·탭·pill |
| **표준 hover** | — | `#f8fbff` 또는 `#f1f5f9` | 버튼/리스트 hover |
| **빌더 페이지 배경** | — | `#f8fafc` | 빌더 작업 화면 캔버스 |
| **모달 backdrop** | — | `rgba(15, 23, 42, 0.45)` | 모달 뒤 딤 |

빌더 캔버스의 상단 글로우는 다음 패턴을 유지한다.

```css
background:
  radial-gradient(circle at 10% 0%, rgba(59, 130, 246, 0.14), transparent 34%),
  radial-gradient(circle at 90% 16%, rgba(147, 197, 253, 0.12), transparent 30%),
  #f8fafc;
```

---

## 4. 보더 & 포커스

| 용도 | 변수 | 값 |
|---|---|---:|
| **기본 보더** | `--c-border` | `#dde7f3` |
| **가벼운 구분선** | `--c-border-soft` | `#e7eef8` |
| **입력/컨트롤 보더** | — | `#d4dbe8` |
| **선택/활성 보더** | `--c-blue-100` | `#dbeafe` (또는 `#93c5fd`) |

### 포커스 링 (입력·버튼 공통)

```css
border-color: #2563eb;            /* 표준. survey-builder는 #3b82f6 혼용 → #2563eb로 수렴 */
box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
```

> 보더 hex가 `#dde7f3 / #d4dbe8 / #dbe3ef / #d9e1ec / #e5eaf2`로 흩어져 있다.
> 면(카드/패널)은 `--c-border`, 폼 컨트롤은 `#d4dbe8`로 두 가지만 쓴다.

---

## 5. 버튼

높이·라운드는 `dh-btn` 규격을 기준으로 한다.

| 사이즈 | 높이 | radius | font |
|---|---:|---:|---:|
| `lg` | 56px | 14px | 15px |
| `md` | 48px | 12px | 14px |
| `sm` | 40px | 999px(pill) | 14px |

### Primary

```css
background: #2563eb;
color: #fff;
box-shadow: var(--sh-btn);          /* 0 10px 20px rgba(37,99,235,0.18) */
/* hover */ background: #1d4ed8;
/* disabled */ background: #cbd5e1; color: #fff; box-shadow: none;
```

### Secondary / Outline / Pill

| 타입 | 기본 | hover |
|---|---|---|
| **Secondary** | `background:#fff; border:#dde7f3; color:#111827;` | `background:#f8fbff;` |
| **Blue Outline** | `background:#fff; border:#bed5ff; color:#2563eb;` | `background:#f8fbff;` |
| **Green Outline** | `background:#fff; border:#bfebd6; color:#16915e;` | `background:#ecfdf5;` |
| **Pill (soft)** | `background:#eff6ff; color:#2563eb; border-radius:999px;` | `background:#e3effe;` |

### Danger

```css
/* ghost danger (아이콘/행 액션) */
color: #6b7280;
/* hover */ background: #fef2f2; color: #dc2626;
```

### ⚠️ 컬러 버튼 텍스트 규칙

```css
/* OK */  background: #2563eb; color: #fff;
/* NG */  background: #2563eb; color: #111827;
```

---

## 6. 카드 / 패널

```css
background: #ffffff;            /* --c-card */
border: 1px solid #dde7f3;      /* --c-border */
border-radius: 22px;
box-shadow: var(--sh-card);     /* 0 12px 30px rgba(15,61,138,0.07) */

/* hover 카드 */
transition: transform 150ms ease, box-shadow 150ms ease;
/* hover */ transform: translateY(-2px); box-shadow: var(--sh-card-hover);
```

> 라운드는 카드 **22px**가 기준. 빌더 패널 24px, 발표 무대(`.display-stage`)·대형 카드 30~40px는
> 의도적 예외로 허용한다(그 외 신규 카드는 22px).

---

## 7. 입력창 / 텍스트영역 / 셀렉트

| 상태 | 배경 | 보더 | 텍스트 | placeholder |
|---|---:|---:|---:|---:|
| default | `#ffffff` | `#d4dbe8` | `#111827` | `#9ca3af`→`#8a96a8` |
| focus | `#ffffff` | `#2563eb` | `#111827` | — |
| disabled | `rgba(0,0,0,0.04)` | `#e7eef8` | `#8a96a8` | — |

```css
input:focus, textarea:focus, select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
}
```

높이 기준: 큰 입력 52px / 일반 44px / 컴팩트 36~38px. radius 10~14px.

---

## 8. 리스트 행 / 선택 / 라디오 / 필터 (활성 상태)

선택 가능한 리스트 행, 라디오 필터, 탭 pill은 같은 활성 스타일을 공유한다.

| 상태 | 배경 | 보더 | 텍스트 |
|---|---:|---:|---:|
| **default** | `#fff` | `#e5eaf2` / `#dde7f3` | `#4b5563` |
| **hover** | `#fff` | `#cdd7e6` | `#111827` |
| **selected / active** | `#eff6ff` | `#93c5fd` (≈`#dbeafe`) | `#2563eb` |

```css
/* 선택된 리스트 행 / 활성 필터 */
background: #eff6ff;
border-color: #93c5fd;
color: #2563eb;

/* 라디오/체크 accent */
accent-color: #2563eb;   /* survey-builder의 #0b7ff3 → #2563eb로 수렴 */
```

---

## 9. 헤더 / 네비게이션

전 라우트 공통 sticky 헤더(`dh-header`, 높이 **72px**).

```css
.dh-header {
  height: 72px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #e7eef8;   /* --c-border-soft */
  box-shadow: var(--sh-header);
}
```

| 네비 상태 | 텍스트 | 비고 |
|---|---:|---|
| default | `#1f2937` | 모든 항목 동일 박스(40px, padding 0 16px, radius 999px) |
| hover | `#2563eb` | |
| **active** | `#2563eb` | 너비 변화 없이 색만 전환 |

> 페이지 콘텐츠 높이 계산에는 `--app-header-height: 72px`를 사용한다
> (`height: calc(100dvh - var(--app-header-height, 72px))`).

---

## 10. 뱃지 / 태그 / 아이콘 칩 / Phase

### 아이콘 뱃지 (`dh-badge`)

```css
/* blue */   background:#eff6ff; border:#d7e7ff; color:#2563eb;
/* green */  background:#ecfdf5; border:#cbefdd; color:#22a06b;
/* purple */ background:#f3f0ff; border:#ded8ff; color:#6d5dfb;
```

### 질문 번호 칩 / 섹션 헤딩 아이콘

```css
background: #eff6ff;
color: #2563eb;      /* 기존 #0b7ff3 → #2563eb 로 통일 */
border-radius: 12px;
```

### Phase 태그 색 (수업 구간)

| Phase | 변수 | HEX |
|---|---|---:|
| intro | `--color-phase-intro` | `#5c7cfa` |
| theory | `--color-phase-theory` | `#f59f00` |
| practice | `--color-phase-practice` | `#37b24d` |
| ethics | `--color-phase-ethics` | `#ae3ec9` |
| closing | `--color-phase-closing` | `#f03e3e` |

```css
.phase-tag {
  background: color-mix(in srgb, var(--phase-color) 14%, transparent);
  color: var(--phase-color);
  border: 1px solid color-mix(in srgb, var(--phase-color) 24%, transparent);
}
```

---

## 11. 라운드(radius) 기준

| 요소 | radius |
|---|---:|
| 작은 칩/뱃지/아이콘 박스 | 12px |
| 버튼(md/lg) | 12~14px |
| 입력/셀렉트 | 10~14px |
| 카드/패널 | 22~24px |
| pill(필터·sm 버튼·태그) | 999px |
| 대형 무대 카드(예외) | 28~40px |

---

## 12. 타이포그래피

| 용도 | size | weight | letter-spacing |
|---|---:|---:|---:|
| Hero headline | 56~64px | 800 | -0.045em |
| 섹션 타이틀 | 28px | 800 | -0.025em |
| 패널/페이지 헤딩 | 20px | 800 | -0.03em |
| 카드 제목 | 16~22px | 700~800 | -0.02em |
| 본문 | 14~15px | 500~600 | — |
| 라벨/메타 | 12~13px | 600~800 | — |

> 한글 헤딩은 굵게(`800`) + 음수 자간으로 또렷하게. 본문은 `1.5~1.75` 행간.

---

## 13. 그림자

| 용도 | 변수 | 값 |
|---|---|---:|
| 카드 | `--sh-card` | `0 12px 30px rgba(15,61,138,0.07)` |
| 카드 hover | `--sh-card-hover` | `0 16px 36px rgba(15,61,138,0.10)` |
| 헤더 | `--sh-header` | `0 8px 24px rgba(15,61,138,0.06)` |
| Primary 버튼 | `--sh-btn` | `0 10px 20px rgba(37,99,235,0.18)` |

> 그림자 톤은 파란빛(`rgba(15,61,138,*)`)을 기본으로. 무채색 그림자보다 페이지와 잘 붙는다.

---

## 14. 스크롤바

빌더 패널 표준을 따른다.

```css
/* Firefox */
scrollbar-width: thin;
scrollbar-color: #cbd5e1 transparent;

/* WebKit */
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
```

---

## 15. 사용 금지 값 & 마이그레이션

신규 코드에서 아래 좌측 값을 쓰지 않는다. 기존 코드 수정 시 우측으로 교체한다.

### Primary 파랑 잔재 → `#2563eb`

| ❌ 기존 | 위치 | ✅ 교체 |
|---|---|---|
| `#0071e3` (`--color-accent`) | `.button`, admin/student/display, builder soft | `#2563eb` (`--c-blue-500`) |
| `#0066cc` (`--color-accent-strong`) | 버튼 hover | `#1d4ed8` (`--c-blue-600`) |
| `#0b7ff3` / hover `#006ee6` | 섹션 헤딩, 질문 칩, `primaryQrButton` | `#2563eb` / `#1d4ed8` |
| `#3b82f6` | survey-builder 입력 포커스 | `#2563eb` |
| `rgba(0,113,227,*)` | builder/admin glow·soft | `rgba(37,99,235,*)` |

### 텍스트/배경 토큰 잔재

| ❌ 기존 | ✅ 교체 |
|---|---|
| `#1d1d1f` (`--color-text`) | `#111827` (`--c-text`) |
| `#6e6e73` (`--color-text-muted`) | `#4b5563` (`--c-text-2`) |
| `#8d8d92` (`--color-text-soft`) | `#6b7280` (`--c-text-3`) / `#8a96a8` (placeholder) |
| `#f5f5f7` 계열 페이지 배경 | `#f6faff` (`--c-page-bg`) / 빌더는 `#f8fafc` |

> `--color-*` / `--color-accent*` 토큰 세트는 **레거시**다. 새 컴포넌트는 `--c-*`만 쓰고,
> 레거시 토큰을 만지는 작업이면 그 김에 `--c-*`로 옮긴다.

### 형태 잔재

```css
/* ❌ 999px 알약형 일반 버튼(.button) — 신규는 12~14px radius dh-btn 규격 */
/* ❌ 카드 radius 30~40px 무분별 사용 — 기본은 22px (대형 무대만 예외) */
```

---

## 16. 체크리스트 — 새 컴포넌트 작성 시

- [ ] Primary가 `#2563eb`(`--c-blue-500`)인가? (`#0071e3`·`#0b7ff3`·`#3b82f6` 아님)
- [ ] Primary hover가 `#1d4ed8`인가?
- [ ] 컬러 버튼 위 텍스트가 `#fff`인가?
- [ ] 선택/활성 배경 `#eff6ff` + 보더 `#93c5fd`(≈`#dbeafe`) + 텍스트 `#2563eb`인가?
- [ ] 제목 `#111827` / 본문 `#4b5563` / 라벨 `#6b7280` / placeholder `#8a96a8`인가?
- [ ] 카드 보더 `#dde7f3`, 폼 보더 `#d4dbe8`, 라운드 22px / 컨트롤 10~14px인가?
- [ ] 입력 포커스가 `#2563eb` + `0 0 0 4px rgba(37,99,235,0.12)`인가?
- [ ] 그림자가 `--sh-*`(파란빛 톤)인가?
- [ ] 스크롤바가 §14 표준(8px, `#cbd5e1`)인가?
- [ ] 레거시 `--color-*` 토큰을 새로 끌어다 쓰지 않았는가?
