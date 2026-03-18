# 랭킹/공유/시즌/팀미션 통합 설계서

> **Summary**: 주간 랭킹, 학부모 공유(PNG), 시즌/이벤트, 팀 미션 4개 기능 상세 설계
>
> **Project**: 학원다마고치프로그램 (수학학원)
> **Author**: postmath21
> **Date**: 2026-03-18
> **Status**: Draft
> **Planning Doc**: [ranking-sharing-season-team.plan.md](../../01-plan/features/ranking-sharing-season-team.plan.md)

---

## 1. 데이터 모델

### 1.1 localStorage 키 추가

| Key | 타입 | 설명 |
|-----|------|------|
| `atg_event` | Event \| null | 현재 진행 중인 이벤트 |
| `atg_teams` | Team[] | 팀 목록 |
| `atg_team_battle` | TeamBattle \| null | 현재 팀 대항전 |
| `atg_academy_name` | string | 학원 이름 (공유 카드용, 기본: "수학학원") |

### 1.2 데이터 타입

```javascript
// 이벤트 (Event)
{
  id: "evt_001",
  title: "중간고사 대비 이벤트",
  type: "exam_prep",         // exam_prep | vacation | custom
  expMultiplier: 2.0,        // EXP 배율
  startDate: "2026-03-18",
  endDate: "2026-03-25",
  active: true,
}

// 팀 (Team)
{
  id: "team_001",
  name: "A반",
  color: "#FF6B6B",
  members: ["std_001", "std_002"],
}

// 팀 대항전 (TeamBattle)
{
  id: "battle_001",
  title: "3월 반 대항전",
  startDate: "2026-03-18",
  endDate: "2026-03-31",
  active: true,
  teamReward: { points: 20, snackBox: 1 },
}
```

---

## 2. 기능 1: 시즌/이벤트 시스템

### 2.1 Storage 추가 메서드

```javascript
Storage.getEvent()        // atg_event 읽기
Storage.saveEvent(event)  // atg_event 저장
```

### 2.2 event.js 모듈

```javascript
const GameEvent = {
  // 현재 활성 이벤트 가져오기 (만료 자동 체크)
  getActive() → Event | null

  // 현재 EXP 배율 (이벤트 없으면 1.0)
  getExpMultiplier() → number

  // 이벤트 생성 (관리자)
  create(data) → Event

  // 이벤트 종료 (관리자)
  end() → void

  // 홈 배너 HTML 생성
  renderBanner() → string
}
```

### 2.3 mission.js 수정 - EXP 배율 적용

```
기존: expAmount = mission.exp * (1 + intBonus)
수정: expAmount = mission.exp * (1 + intBonus) * GameEvent.getExpMultiplier()
```

미니게임에도 동일하게 배율 적용.

### 2.4 이벤트 배너 UI (홈 화면 상단)

```
┌──────────────────────────────────┐
│ 🔥 중간고사 대비 이벤트! EXP 2배  │
│    ~2026-03-25 까지              │
└──────────────────────────────────┘
```

### 2.5 관리자 이벤트 관리 탭

```
[이벤트 탭]
  현재 이벤트: 중간고사 대비 (EXP 2.0x)
  마감: 2026-03-25
  [이벤트 종료]

  -- 또는 --

  이벤트 없음
  [프리셋]
    시험대비 (2.0x) | 방학특훈 (1.5x)
  [자유 생성]
    제목 / 배율 / 마감일
```

---

## 3. 기능 2: 팀 미션 / 반 대항전

### 3.1 Storage 추가 메서드

```javascript
Storage.getTeams()             // atg_teams 읽기
Storage.saveTeams(teams)       // atg_teams 저장
Storage.getTeamBattle()        // atg_team_battle 읽기
Storage.saveTeamBattle(battle) // atg_team_battle 저장
```

### 3.2 team.js 모듈

```javascript
const Team = {
  // 팀 목록 가져오기
  getTeams() → Team[]

  // 학생의 팀 찾기
  getStudentTeam(studentId) → Team | null

  // 팀 생성 (관리자)
  createTeam(name, color) → Team

  // 팀에 학생 추가/제거 (관리자)
  addMember(teamId, studentId) → void
  removeMember(teamId, studentId) → void

  // 팀별 경험치 합산 (대항전 기간 내)
  getTeamExp(teamId) → number
    - 팀 멤버의 completedMissions 중 기간 내 기록 필터
    - 각 미션의 exp 합산 (미션 데이터 조회)

  // 팀 랭킹 (경험치 내림차순)
  getTeamRanking() → [{ team, totalExp }]

  // 대항전 생성/종료 (관리자)
  startBattle(data) → TeamBattle
  endBattle() → { winner, teams }
    - 1등 팀 멤버 전원에게 보상 지급

  // 팀 정보 렌더 (홈 화면)
  renderTeamInfo(studentId) → string

  // 팀 대항전 화면 렌더
  render(container) → void
}
```

### 3.3 팀 대항전 UI

```
┌──────────────────────────────────┐
│  ⚔️ 3월 반 대항전                │
│  마감: 2026-03-31                │
├──────────────────────────────────┤
│                                  │
│  🥇 A반     ████████  1,250 EXP │
│  🥈 B반     ██████    980 EXP   │
│  🥉 C반     ████      640 EXP   │
│                                  │
│  내 팀: A반 (3명)                │
│  내 기여: 420 EXP                │
└──────────────────────────────────┘
```

### 3.4 관리자 팀 관리 탭

```
[팀 관리 탭]
  [+ 팀 추가]

  A반 (빨강) - 3명
    홍길동, 김철수, 이영희
    [학생 추가] [삭제]

  B반 (파랑) - 2명
    ...

  [대항전]
    [대항전 시작] 제목 / 마감일 / 보상
    -- 진행중이면 --
    [대항전 종료] → 1등 팀에 보상 자동 지급
```

---

## 4. 기능 3: 주간 랭킹 보드

### 4.1 ranking.js 모듈

```javascript
const Ranking = {
  // 랭킹 카테고리별 정렬
  getRanking(category) → [{ student, value, rank }]
    - "level":    레벨 내림차순 → 경험치 내림차순
    - "totalExp": getTotalExpForLevel(level) + exp
    - "streak":   streakDays 내림차순
    - "minigame": perfectMinigames 내림차순

  // 랭킹 모달 렌더
  showRankingModal() → void

  // 메달 표시
  getMedal(rank) → "🥇" | "🥈" | "🥉" | rank 번호
}
```

### 4.2 랭킹 UI (모달)

```
┌──────────────────────────────────┐
│  🏅 랭킹 보드                    │
├──────────────────────────────────┤
│  [레벨] [경험치] [출석] [게임]    │
├──────────────────────────────────┤
│  🥇 뽀삐 (홍길동)    Lv.10      │
│  🥈 치킨 (김철수)    Lv.8       │
│  🥉 구름 (이영희)    Lv.7       │
│   4 번개 (박수민)    Lv.5       │
│   5 별이 (최지은)    Lv.3       │
├──────────────────────────────────┤
│  [팀 랭킹]  (대항전 진행 시)     │
│  🥇 A반  1,250 EXP              │
│  🥈 B반  980 EXP                │
└──────────────────────────────────┘
```

- 홈 화면의 "랭킹" 버튼 클릭 시 모달 표시
- 4가지 카테고리 탭 전환
- 팀 대항전 진행 중이면 팀 랭킹 탭 추가

---

## 5. 기능 4: 학부모 공유 (이미지 내보내기)

### 5.1 share.js 모듈

```javascript
const Share = {
  // 다마고치 카드를 Canvas에 그리기
  generateCard(student) → Promise<HTMLCanvasElement>

  // PNG 다운로드 트리거
  downloadCard(student) → void

  // Canvas 렌더링 절차:
  // 1. Canvas 생성 (400x560)
  // 2. 배경 (둥근 모서리, 그라데이션)
  // 3. 학원 이름 헤더
  // 4. SVG → Image → Canvas drawImage
  // 5. 학생/다마고치 이름
  // 6. 레벨 + 진화 단계
  // 7. 능력치 4개
  // 8. 연속출석 + 업적 수
  // 9. toDataURL → 다운로드
}
```

### 5.2 카드 레이아웃 (400x560px)

```
Canvas 400 x 560
┌──────────────────────────────────┐ y=0
│ 🏫 ○○수학학원 다마고치            │ y=20~50 (헤더, 폰트 18px)
├──────────────────────────────────┤ y=60
│                                  │
│        [다마고치 SVG 200x200]     │ y=70~270
│                                  │
├──────────────────────────────────┤ y=290
│  뽀삐 (홍길동)                    │ y=300 (이름, 폰트 22px bold)
│  Lv.10 | ⚔️ 용사 단계            │ y=330 (레벨+진화, 폰트 16px)
├──────────────────────────────────┤ y=370
│  💪 3   🧠 5   ✨ 2   ❤️ 4      │ y=390 (능력치, 폰트 16px)
├──────────────────────────────────┤ y=430
│  🔥 연속출석 15일                 │ y=450
│  🏅 업적 8/14                    │ y=475
│  😊 행복                         │ y=500
└──────────────────────────────────┘ y=560
```

### 5.3 SVG → Canvas 변환

```javascript
// SVG 문자열 → Blob → Image → canvas.drawImage
const svgStr = TamagotchiRenderer.render(tama, 200, mood);
const blob = new Blob([svgStr], { type: 'image/svg+xml' });
const url = URL.createObjectURL(blob);
const img = new Image();
img.onload = () => {
  ctx.drawImage(img, x, y, 200, 200);
  URL.revokeObjectURL(url);
};
img.src = url;
```

### 5.4 다운로드 트리거

```javascript
const link = document.createElement('a');
link.download = `${student.tamagotchi.name}_카드.png`;
link.href = canvas.toDataURL('image/png');
link.click();
```

---

## 6. UI 통합 (app.js / admin.js 수정)

### 6.1 홈 화면 버튼 영역

```
기존: [진화도감] [업적]
수정: [진화도감] [업적] [랭킹] [공유]
```

### 6.2 홈 화면 이벤트 배너

이벤트 활성 시 캐릭터 위에 배너 표시:
```
[이벤트 배너]       ← GameEvent.renderBanner()
[다마고치 캐릭터]
[이름/레벨/진화/감정]
```

### 6.3 홈 화면 팀 정보

대항전 진행 시 능력치 아래에 팀 정보:
```
[능력치]
[내 팀: A반 | 팀 순위 1등 | 기여 420 EXP]  ← Team.renderTeamInfo()
[포인트/간식/출석]
```

### 6.4 관리자 모드 탭 추가

```
기존: [미션관리] [학생관리] [경연대회] [간식상자] [설정]
수정: [미션관리] [학생관리] [경연대회] [간식상자] [이벤트] [팀관리] [설정]
```

---

## 7. 수정/추가 파일 목록

| 파일 | 유형 | 변경 내용 |
|------|------|-----------|
| `js/event.js` | **신규** | 이벤트 CRUD, 배율 계산, 배너 렌더 |
| `js/team.js` | **신규** | 팀 CRUD, 대항전, 팀 경험치 합산 |
| `js/ranking.js` | **신규** | 4카테고리 랭킹 + 팀 랭킹 + 모달 렌더 |
| `js/share.js` | **신규** | Canvas 카드 생성, PNG 다운로드 |
| `css/event.css` | **신규** | 이벤트 배너 스타일 |
| `css/team.css` | **신규** | 팀 대항전 UI 스타일 |
| `css/ranking.css` | **신규** | 랭킹 모달 스타일 |
| `css/share.css` | **신규** | 공유 버튼 스타일 |
| `js/storage.js` | 수정 | 이벤트/팀/대항전/학원이름 메서드 추가 |
| `js/mission.js` | 수정 | EXP 배율 적용 (GameEvent.getExpMultiplier) |
| `js/minigame.js` | 수정 | EXP 배율 적용 |
| `js/app.js` | 수정 | 홈에 배너/팀정보/랭킹/공유 버튼 추가 |
| `js/admin.js` | 수정 | 이벤트/팀관리 탭 추가 |
| `index.html` | 수정 | 새 JS/CSS 파일 추가 |

---

## 8. 구현 순서

### Phase 1: 기반 (Storage + Event)
1. [ ] `js/storage.js` - 이벤트/팀/대항전/학원이름 메서드 추가
2. [ ] `js/event.js` - 이벤트 CRUD + 배율 + 배너
3. [ ] `js/mission.js` - EXP 배율 적용
4. [ ] `js/minigame.js` - EXP 배율 적용
5. [ ] `js/admin.js` - 이벤트 관리 탭
6. [ ] `css/event.css`

### Phase 2: 팀 시스템
7. [ ] `js/team.js` - 팀 CRUD + 대항전 + 경험치 합산
8. [ ] `js/admin.js` - 팀 관리 탭 추가
9. [ ] `css/team.css`

### Phase 3: 랭킹
10. [ ] `js/ranking.js` - 4카테고리 + 팀 랭킹 + 모달
11. [ ] `css/ranking.css`

### Phase 4: 공유
12. [ ] `js/share.js` - Canvas 카드 + PNG 다운로드
13. [ ] `css/share.css`

### Phase 5: 통합
14. [ ] `js/app.js` - 홈에 배너/팀정보/버튼 통합
15. [ ] `index.html` - 새 파일 추가

---

## 9. 테스트 계획

| 테스트 | 검증 항목 |
|--------|-----------|
| 이벤트 생성 | 배너 표시 + 미션 EXP 배율 적용 확인 |
| 이벤트 만료 | endDate 지난 후 자동 비활성 |
| 팀 생성/학생 배정 | 팀에 학생 추가/제거 정상 동작 |
| 대항전 시작 | 팀별 경험치 합산 정확성 |
| 대항전 종료 | 1등 팀 멤버 보상 지급 |
| 랭킹 레벨 기준 | 레벨 → 경험치 순 정렬 |
| 랭킹 팀 탭 | 대항전 중에만 표시 |
| 공유 카드 생성 | SVG → Canvas → PNG 변환 |
| 공유 다운로드 | PNG 파일 정상 저장 |
| 이벤트 없을 때 | 배너 미표시, 배율 1.0 |
| 대항전 없을 때 | 팀 정보/팀 랭킹 미표시 |

---

## 버전 이력

| 버전 | 날짜 | 변경사항 | 작성자 |
|------|------|----------|--------|
| 0.1 | 2026-03-18 | 초안 작성 | postmath21 |
