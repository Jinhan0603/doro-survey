# Codex 검증 파이프라인 가이드

> 큰 작업을 step으로 쪼개 진행할 때, **각 step의 완수 여부를 Claude가 self-judge하지 않고
> 외부 에이전트 `codex`(OpenAI Codex CLI)에 위임**해서 독립 검증한다.
> 이 문서는 그 호출 방식과 함정(시행착오)을 고정한다. 다음엔 바로 이 패턴을 쓴다.

---

## 0. 핵심 원칙

- **codex = 판정자(verifier)**. Claude는 구현하고, "완수했다"는 판정은 codex가 내린다.
- codex에는 **명확한 acceptance criteria**(검증 기준)를 주고, 마지막에 `VERDICT: PASS|FAIL`만 받는다.
- codex는 **읽기 전용 검증**만 하도록 지시한다. 단 OS 샌드박스를 끄고 돌리므로 파일을 건드릴 *가능성*은 있다 → **실행 전/후 `git status` 비교** 안전망을 둔다.
- ⚠️ **과반응 금지**: 안전망은 *codex가 이번 step 대상 파일을 의도치 않게 바꿨는지*만 본다. 사용자가 **병행 편집**한 무관한 파일(다른 문서·다른 기능)까지 codex 탓으로 오인해 되돌리거나 사용자에게 캐묻지 않는다. → §4b

---

## 1. 사전 조건

```bash
command -v codex && codex --version   # 예: codex-cli 0.141.0
```
설치 위치(이 환경 기준): `C:\Users\pc\AppData\Local\Programs\OpenAI\Codex\bin\codex`

---

## 2. 표준 호출 (copy-paste)

```bash
codex exec --skip-git-repo-check --dangerously-bypass-approvals-and-sandbox \
  "<검증 프롬프트 — 아래 템플릿 참고>" < /dev/null
```

**플래그 의미**
| 플래그 | 이유 |
|--------|------|
| `exec` | 비대화형 1회 실행 모드 (TUI 안 띄움) |
| `--skip-git-repo-check` | 더티 작업 트리에서도 실행 허용 |
| `--dangerously-bypass-approvals-and-sandbox` | **Windows OS 샌드박스 헬퍼가 깨져 있어** 샌드박스를 끔 (아래 §5 참고). 대신 프롬프트의 "수정 금지" 지시 + `git status` 안전망으로 통제 |
| `< /dev/null` | **stdin을 닫는다.** 안 닫으면 codex가 `Reading additional input from stdin...`에서 무한 대기 |

실행 **전후로 비교** (전체 클린 여부가 아니라 *델타*만 본다):
```bash
git status --porcelain > /tmp/codex_pre.txt        # codex 실행 전 baseline 스냅샷
codex exec ... < /dev/null                          # 검증 실행
git status --porcelain | diff /tmp/codex_pre.txt -  # 델타 = codex 실행 중 생긴 변경 후보
```
델타가 **이번 step 대상 파일 밖**이면 codex가 아니라 사용자 병행 작업일 공산이 크다 → §4b 판단.

---

## 3. 검증 프롬프트 템플릿

```
읽기 전용 검증 작업이다. 어떤 파일도 수정하지 마라.

[목표] <이 step이 달성하려던 것 한 줄>

[검증 기준] 아래를 각각 확인하라:
1. <구체·기계적으로 확인 가능한 조건 1>
2. <조건 2 — 예: `npm run build`가 통과>
3. <조건 3 — 예: 특정 함수/컴포넌트/규칙이 존재하고 ~하게 동작>

[출력] 각 기준의 통과 여부를 한 줄씩 적고,
마지막 줄에 정확히 'VERDICT: PASS' 또는 'VERDICT: FAIL (사유)' 만 출력하라.
```

원칙:
- 기준은 **기계적으로 확인 가능**해야 한다(파일/함수/규칙 존재, 빌드·타입체크 통과, 특정 문자열 부재 등). "예쁜가?" 같은 주관 기준 금지.
- 빌드/타입체크 실행을 시키면 codex가 직접 돌려서 결과로 판정한다(읽기만으로 부족할 때). 이 프로젝트 기준: `npm run build`(= `tsc -b && vite build`), `npx tsc --noEmit`, `npm run lint`.

---

## 4. step 진행 루프

1. Claude가 step 구현 → 자체 빌드(`npm run build` 또는 `npx tsc --noEmit`)로 1차 확인.
2. codex 실행 전 `git status` baseline 스냅샷(§2).
3. 해당 step의 acceptance criteria로 **codex 검증 호출**(§2).
4. `VERDICT: PASS` + (델타에 **step 대상 파일**에 대한 codex의 의도치 않은 수정 없음):
   - a. **step 대상 파일만 명시적으로** `git add <files>` 후 커밋. 메시지에 step 번호·목표 명시.
     무관한 사용자 변경(병행 작업)은 **절대 staging 금지**.
   - b. **곧바로 다음 step으로 진행한다. "계속할까요?"라고 묻지 않는다.** (이미 전체 진행을 위임받음)
5. `VERDICT: FAIL` → 사유를 보고 수정 후 3번 재실행. (Claude가 임의로 "됐다" 하지 않는다.)

### 진행 정책 (커밋·자동 진행)

- **step별 커밋**: PASS 받은 step은 그 즉시 대상 파일만 커밋한다. 한 step = 한 커밋(원칙).
- **묻지 않고 계속**: PASS면 사용자 확인 없이 다음 step을 바로 시작한다. 진행 자체를 멈추고 묻는 건
  아래 *진짜 멈춰야 할 때*로 한정한다.
- **push**: 매 step push하지 않는다. 기능이 일관된 마일스톤에 도달했거나 사용자가 요청할 때 push.
  (미완 기능을 배포 브랜치(dev)에 매 step 흘리지 않기 위함)
- **진짜 멈춰야 할 때만 사용자에게 묻는다**:
  1) 설계가 갈리는 진짜 모호함(코드/맥락으로 못 정함), 2) 같은 step이 FAIL 반복(2~3회)으로 막힘,
  3) 되돌리기 어렵거나 외부로 나가는 작업(force push·삭제·배포 등). 그 외에는 멈추지 않는다.

---

## 4b. 안전망 운용 — 과반응 금지 (중요)

codex 실행 후 `git status`에 변경이 보여도 **전부 codex 탓이 아니다.** 사용자는 그 사이
다른 파일을 병행 편집할 수 있다. 다음 절차로 **귀속(attribution)** 부터 판단한다:

1. **델타가 step 대상 파일인가?** (이번에 내가 만지는 소스 + codex가 빌드/검사한 파일)
   - 예 → codex가 건드렸을 수 있음. 내용 확인 후 필요시 되돌림.
   - 아니오(무관한 문서·다른 기능·사용자의 알려진 WIP) → **codex 아님.** 그대로 둔다. 되돌리거나 캐묻지 않는다.
2. 애매하면 **사용자에게 단정 짓지 말고** "이건 의도한 변경인가요?"로 가볍게 확인. *codex가 망가뜨렸다고 단정 보고 금지.*
3. 커밋 시에는 어차피 **step 대상 파일만 명시적으로 `git add`** 하므로, 무관한 변경은 자연히 섞이지 않는다.

---

## 5. 함정 & 트러블슈팅 (이미 겪은 것)

| 증상 | 원인 | 대응 |
|------|------|------|
| `Reading additional input from stdin...` 후 무한 대기 | stdin 미닫힘 | `< /dev/null` 추가 |
| `windows sandbox: orchestrator_helper_launch_failed ... codex-windows-sandbox-setup.exe, program not found` | `--sandbox read-only`가 **Windows 샌드박스 헬퍼 exe를 못 찾음** | `--sandbox read-only` 쓰지 말고 `--dangerously-bypass-approvals-and-sandbox` 사용 |
| `rmcp ... 127.0.0.1:8080/mcp ... Transport channel closed` / `mcp node_repl/js (failed)` | codex 설정에 등록된 **로컬 MCP 서버가 안 떠 있음** | **무해**. codex가 일반 셸 명령으로 폴백해 정상 동작. MCP 별도 설정 불필요 |
| 토큰 폭증(예: 13만 토큰) | 깨진 샌드박스에서 재시도 thrash | 위 샌드박스 플래그 교정 시 ~1.5만 토큰으로 정상화 |

> 정리: **OS 샌드박스에 기대지 않는다.** "수정 금지" 프롬프트 지시 + 실행 후 `git status` 대조가 안전망이다.
> MCP 노이즈는 신경 쓰지 않는다.

---

## 6. 검증된 예시 (실제 동작 확인)

```bash
codex exec --skip-git-repo-check --dangerously-bypass-approvals-and-sandbox \
  "읽기 전용 검증. 수정 금지. src/firebase/client.ts 가 존재하는가?
   마지막 줄에 'VERDICT: <PRESENT|ABSENT>' 만 출력하라." < /dev/null
# → VERDICT: PRESENT, git status 무변경
```
