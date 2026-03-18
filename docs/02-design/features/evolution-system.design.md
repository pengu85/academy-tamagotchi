# 다마고치 진화 시스템 설계서

> **Summary**: 5단계 진화 체계 + 능력치 기반 최종 진화 4분기 - 상세 설계
>
> **Project**: 학원다마고치프로그램
> **Author**: postmath21
> **Date**: 2026-03-18
> **Status**: Draft
> **Planning Doc**: [evolution-system.plan.md](../../01-plan/features/evolution-system.plan.md)

---

## 1. 설계 목표

- 기존 코드에 최소한의 변경으로 진화 시스템 통합
- 기존 학생 데이터 하위 호환성 100% 보장
- 단계별 SVG 캐릭터를 기존 렌더러 구조 내에서 확장
- 기존 아이템(모자/악세서리/효과)이 모든 진화 단계에서 동작

### 설계 원칙

- 기존 `_renderBody()` 를 단계별 분기하여 확장 (교체가 아닌 추가)
- `evolution` 필드가 없는 기존 데이터는 레벨 기반 자동 마이그레이션
- 진화는 레벨업 시 자동 트리거 (별도 UI 조작 불필요)

---

## 2. 데이터 모델 변경

### 2.1 EVOLUTION_TABLE (data.js 추가)

```javascript
const EVOLUTION_TABLE = [
  { stage: 1, name: "알",     nameEn: "egg",     minLevel: 1,  sizeRatio: 0.6 },
  { stage: 2, name: "아기",   nameEn: "baby",    minLevel: 3,  sizeRatio: 0.8 },
  { stage: 3, name: "어린이", nameEn: "child",   minLevel: 6,  sizeRatio: 1.0 },
  { stage: 4, name: "청소년", nameEn: "teen",    minLevel: 10, sizeRatio: 1.1 },
  { stage: 5, name: "최종",   nameEn: "final",   minLevel: 15, sizeRatio: 1.2 },
];

const FINAL_FORMS = {
  warrior:  { name: "용사",   stat: "str", icon: "⚔️", description: "힘세고 용감한 전사" },
  scholar:  { name: "학자",   stat: "int", icon: "📚", description: "지혜로운 마법사" },
  star:     { name: "스타",   stat: "cha", icon: "⭐", description: "인기 많은 아이돌" },
  guardian: { name: "수호자", stat: "sta", icon: "🛡️", description: "든든한 수호자" },
};
```

### 2.2 Student.tamagotchi 추가 필드

```javascript
// tamagotchi 객체에 evolution 필드 추가
evolution: {
  stage: 3,            // 1~5
  stageName: "어린이",  // 한글 이름
  finalForm: null,     // null | "warrior" | "scholar" | "star" | "guardian"
}
```

### 2.3 하위 호환 마이그레이션 함수

```javascript
// getEvolutionStage(level) → 레벨로부터 진화 단계 계산
// ensureEvolution(student) → evolution 필드가 없으면 자동 생성
```

| 레벨 | 자동 부여 단계 |
|:----:|:-------------:|
| 1~2 | 1 (알) |
| 3~5 | 2 (아기) |
| 6~9 | 3 (어린이) |
| 10~14 | 4 (청소년) |
| 15+ | 5 (최종) - 최고 능력치로 finalForm 결정 |

---

## 3. 진화 로직 (tamagotchi.js 수정)

### 3.1 addExp() 수정 - 진화 체크 추가

```
기존 흐름:
  경험치 추가 → 레벨업 체크 → 포인트 지급

수정 흐름:
  경험치 추가 → 레벨업 체크 → 포인트 지급 → 진화 체크
                                               │
                                    ┌──────────┴──────────┐
                                    │ 진화 조건 충족       │ 아님
                                    │                     │
                                    ▼                     ▼
                              stage 업데이트           변화 없음
                              진화 이벤트 반환
                              (Lv.15: finalForm 결정)
```

### 3.2 핵심 함수

```javascript
// Tamagotchi 객체에 추가할 메서드

// 현재 레벨에 맞는 진화 단계 계산
getEvolutionStage(level) → { stage, name, nameEn, sizeRatio }

// 진화 체크 및 적용 (addExp 내부에서 호출)
checkEvolution(student) → evolution 객체 | null
  - 현재 레벨과 현재 stage 비교
  - 새 stage가 더 높으면 진화 발생
  - stage 5일 때: determineFinalForm(stats) 호출

// 최종 진화 형태 결정
determineFinalForm(stats) → "warrior" | "scholar" | "star" | "guardian"
  - 가장 높은 능력치의 형태 반환
  - 동률 시 우선순위: str > int > cha > sta

// 하위 호환 보장
ensureEvolution(student) → void
  - student.tamagotchi.evolution이 없으면 레벨 기반으로 생성
  - Storage.getCurrentStudent() 호출 시 자동 실행
```

### 3.3 addExp 반환값 변경

```javascript
// 기존: levelUps 배열만 반환
// 수정: levelUps 배열 + evolutions 배열 반환
return { levelUps, evolutions }

// evolution 이벤트 객체
{
  fromStage: 2,        // 이전 단계
  toStage: 3,          // 새 단계
  stageName: "어린이",  // 한글 이름
  finalForm: null,     // stage 5일 때만 값 있음
}
```

---

## 4. SVG 렌더링 변경 (tamagotchi-renderer.js 수정)

### 4.1 render() 함수 수정

```javascript
render(tamagotchi, size = 200) {
  const evolution = tamagotchi.evolution || { stage: 3 };
  const stage = evolution.stage;
  const finalForm = evolution.finalForm;

  // 기존 렌더링 흐름에서 _renderBody 호출을 단계별 분기로 교체
  switch (stage) {
    case 1: svg += this._renderEgg(color, cx, cy); break;
    case 2: svg += this._renderBaby(color, cx, cy); break;
    case 3: svg += this._renderBody(color, cx, cy); break;  // 기존 그대로
    case 4: svg += this._renderTeen(color, cx, cy); break;
    case 5: svg += this._renderFinal(color, cx, cy, finalForm); break;
  }

  // 눈/입/모자/악세서리 등은 단계에 따라 위치(cy 오프셋) 조정
}
```

### 4.2 단계별 SVG 디자인 명세

#### Stage 1: 알 (Egg)

```
┌─────────┐
│  ╭───╮  │  - 타원형 알 (rx:35, ry:45)
│  │ ∧ │  │  - 상단에 지그재그 금
│  │   │  │  - 눈/입 없음
│  ╰───╯  │  - bodyColor 적용
└─────────┘
```

- 몸체: 타원 1개 (팔/다리 없음)
- 상단 금: path 지그재그 라인
- 눈/입: 렌더링하지 않음
- 모자/악세서리: 렌더링하지 않음 (알 상태)
- 크기: 0.6x (작음)

#### Stage 2: 아기 (Baby)

```
┌─────────┐
│  ╭─╮    │  - 작고 동그란 몸 (rx:35, ry:38)
│  │◕◕│   │  - 큰 눈 (기존보다 1.3배)
│  │ ω │   │  - 짧은 팔다리 (rx:10, ry:7)
│  ╰┬┬╯   │  - bodyColor 적용
└─────────┘
```

- 몸체: 기존보다 작고 동그란 타원
- 팔: 짧고 통통 (rx:10, ry:7)
- 다리: 짧고 통통 (rx:12, ry:7)
- 눈: 기존 대비 1.3배 큰 눈 (귀여움 강조)
- 입: w형 고양이 입
- 모자/악세서리: 장착 가능 (위치 조정)

#### Stage 3: 어린이 (Child) - 기존 형태

- **기존 `_renderBody()` 그대로 사용**
- 변경 없음 (호환성 유지)

#### Stage 4: 청소년 (Teen)

```
┌─────────┐
│  ╭─╮    │  - 약간 길어진 몸 (rx:50, ry:65)
│  │◕◕│   │  - 작은 뿔/귀 추가
│  │ ‿ │   │  - 긴 팔다리
│  │   │   │  - bodyColor 적용
│  ╰┬┬╯   │
└─────────┘
```

- 몸체: 기존보다 세로로 약간 길어짐 (ry: 60→65)
- 팔: 약간 길어짐 (rx:18, ry:10)
- 다리: 약간 길어짐 (rx:18, ry:12)
- 뿔/귀: 머리 위에 작은 삼각형 2개
- 눈: 기존과 동일
- 모자/악세서리: 장착 가능 (위치 조정)

#### Stage 5: 최종 (Final) - 4가지 분기

**Warrior (용사)**
```
- 각진 몸체 (rect 기반 + rounded corners)
- 작은 뿔 2개 (삼각형, 붉은 색)
- 강인한 눈 (angry 스타일 변형)
- 어깨가 넓은 체형
```

**Scholar (학자)**
```
- 기존 형태 기반, 머리 부분이 약간 큰 비율
- 반짝이는 큰 눈 (sparkle 변형)
- 머리 위에 별/마법진 효과
- 전체적으로 둥근 실루엣
```

**Star (스타)**
```
- 날씬한 체형 (rx:45, ry:65)
- 하트 눈 (heart 스타일)
- 몸 주변에 별 반짝이
- 우아한 자세 (팔 위치 약간 위)
```

**Guardian (수호자)**
```
- 큰 체형 (rx:60, ry:65)
- 든든한 눈 (기본 스타일, 약간 큰)
- 몸 앞에 방패 모양 무늬
- 짧고 굵은 팔다리
```

### 4.3 아이템 호환성

모든 진화 단계에서 기존 아이템 장착 가능. 단계별 위치 오프셋 적용:

| 단계 | 모자 cy오프셋 | 악세서리 cy오프셋 | 비고 |
|:----:|:----------:|:------------:|------|
| 1 (알) | - | - | 아이템 비표시 |
| 2 (아기) | +5 | +3 | 약간 아래로 |
| 3 (어린이) | 0 | 0 | 기존 그대로 |
| 4 (청소년) | -3 | -2 | 약간 위로 |
| 5 (최종) | -5 | -3 | 더 위로 |

---

## 5. UI 변경사항

### 5.1 홈 화면 (app.js renderHome)

```
기존:
  이름 + Lv.X

수정:
  이름 + Lv.X
  ✨ 어린이 단계          ← 진화 단계 표시 추가
```

### 5.2 진화 축하 모달 (ui.js 추가)

```
┌──────────────────────────┐
│        🌟 진화!          │
│                          │
│    [이전 캐릭터 SVG]     │
│          ↓               │
│    [새 캐릭터 SVG]       │
│                          │
│  아기 → 어린이 진화!     │
│                          │
│       [ 확인 ]           │
└──────────────────────────┘
```

최종 진화 시 특별 모달:
```
┌──────────────────────────┐
│     ⚔️ 최종 진화!        │
│                          │
│    [최종 형태 SVG]       │
│                          │
│   용사로 진화했어요!      │
│   "힘세고 용감한 전사"   │
│                          │
│       [ 확인 ]           │
└──────────────────────────┘
```

### 5.3 진화 도감 (app.js 새 섹션)

홈 화면에 "📖 진화 도감" 버튼 추가. 클릭 시 모달로 표시:

```
┌──────────────────────────────────┐
│  📖 진화 도감                    │
├──────────────────────────────────┤
│  Stage 1: 알       Lv.1   ✅    │
│  [알 SVG]                        │
│                                  │
│  Stage 2: 아기     Lv.3   ✅    │
│  [아기 SVG]                      │
│                                  │
│  Stage 3: 어린이   Lv.6   ✅    │
│  [어린이 SVG]                    │
│                                  │
│  Stage 4: 청소년   Lv.10  🔒    │
│  [실루엣]                        │
│                                  │
│  Stage 5-1: 용사   Lv.15  🔒    │
│  Stage 5-2: 학자   Lv.15  🔒    │
│  Stage 5-3: 스타   Lv.15  🔒    │
│  Stage 5-4: 수호자 Lv.15  🔒    │
│                                  │
│          [ 닫기 ]                │
└──────────────────────────────────┘
```

- 현재 도달한 단계: 캐릭터 SVG 표시 + ✅
- 미도달 단계: 실루엣(회색) + 🔒
- 최종 진화 4형태 모두 미리 표시 (어떤 형태인지 궁금증 유발)

---

## 6. CSS 변경 (tamagotchi.css 추가)

```css
/* 진화 단계 표시 */
.evolution-stage { ... }

/* 진화 모달 애니메이션 */
.evolution-animation { ... }  /* 이전→새 형태 전환 효과 */

/* 진화 도감 */
.dex-grid { ... }
.dex-item { ... }
.dex-item.locked { ... }     /* 실루엣 처리: filter: brightness(0) opacity(0.3) */
```

---

## 7. 수정 파일 목록 및 변경 범위

| 파일 | 변경 유형 | 변경 내용 |
|------|-----------|-----------|
| `js/data.js` | 추가 | EVOLUTION_TABLE, FINAL_FORMS 상수 추가 |
| `js/data.js` | 수정 | createDefaultStudent()에 evolution 필드 추가 |
| `js/tamagotchi.js` | 수정 | addExp() 반환값 변경, 진화 체크 로직 추가 |
| `js/tamagotchi.js` | 추가 | getEvolutionStage(), checkEvolution(), determineFinalForm(), ensureEvolution() |
| `js/tamagotchi-renderer.js` | 수정 | render()에서 stage별 분기 |
| `js/tamagotchi-renderer.js` | 추가 | _renderEgg(), _renderBaby(), _renderTeen(), _renderFinal() |
| `js/app.js` | 수정 | renderHome()에 진화 단계 표시, 진화 도감 버튼 |
| `js/app.js` | 수정 | renderMission()에서 진화 이벤트 처리 |
| `js/app.js` | 추가 | showEvolutionDex() 진화 도감 모달 |
| `js/ui.js` | 추가 | showEvolution() 진화 축하 모달 |
| `css/tamagotchi.css` | 추가 | 진화 관련 스타일 |

---

## 8. 구현 순서

1. [ ] `js/data.js` - EVOLUTION_TABLE, FINAL_FORMS 추가 + createDefaultStudent 수정
2. [ ] `js/tamagotchi.js` - 진화 로직 함수 추가 (getEvolutionStage, checkEvolution, determineFinalForm, ensureEvolution)
3. [ ] `js/tamagotchi.js` - addExp() 수정 (진화 체크 + 반환값 변경)
4. [ ] `js/tamagotchi-renderer.js` - _renderEgg(), _renderBaby(), _renderTeen(), _renderFinal() 추가
5. [ ] `js/tamagotchi-renderer.js` - render() 수정 (stage 분기)
6. [ ] `js/ui.js` - showEvolution() 진화 축하 모달 추가
7. [ ] `js/app.js` - renderHome() 수정 (진화 단계 표시 + 도감 버튼)
8. [ ] `js/app.js` - 미션 완료 시 진화 이벤트 처리 + showEvolutionDex()
9. [ ] `css/tamagotchi.css` - 진화 스타일 추가
10. [ ] 하위 호환성 테스트 (기존 학생 데이터)

---

## 9. 테스트 계획

| 테스트 케이스 | 검증 항목 |
|--------------|-----------|
| 신규 학생 생성 | evolution: { stage: 1, stageName: "알", finalForm: null } 기본값 |
| Lv.2→3 레벨업 | stage 1→2 진화, 축하 모달 표시 |
| Lv.5→6 레벨업 | stage 2→3 진화, 기존 형태(어린이) 렌더링 |
| Lv.9→10 레벨업 | stage 3→4 진화, 청소년 형태 표시 |
| Lv.14→15 (STR 최고) | stage 4→5 진화, warrior 형태, 특별 모달 |
| Lv.14→15 (INT 최고) | scholar 형태 확인 |
| Lv.14→15 (CHA 최고) | star 형태 확인 |
| Lv.14→15 (STA 최고) | guardian 형태 확인 |
| Lv.14→15 (동률 STR=INT) | STR 우선 → warrior |
| 기존 학생 로그인 (evolution 없음) | 레벨 기반 자동 마이그레이션 |
| 알 상태에서 모자 장착 | 모자 비표시 (알은 아이템 불가) |
| 청소년에서 왕관 장착 | 위치 오프셋 적용되어 정상 표시 |
| 진화 도감 열기 | 도달 단계 ✅, 미도달 🔒 |
| 브라우저 새로고침 | 진화 상태 유지 |

---

## 버전 이력

| 버전 | 날짜 | 변경사항 | 작성자 |
|------|------|----------|--------|
| 0.1 | 2026-03-18 | 초안 작성 | postmath21 |
