// ============================================
// data.js - 기본 데이터 (레벨 테이블, 아이템, 미션)
// ============================================

const LEVEL_TABLE = [
  { level: 1,  expRequired: 0,    reward: { points: 0,  unlock: "다마고치 생성" } },
  { level: 2,  expRequired: 100,  reward: { points: 5,  unlock: null } },
  { level: 3,  expRequired: 150,  reward: { points: 5,  unlock: "눈 스타일 해금" } },
  { level: 4,  expRequired: 200,  reward: { points: 10, unlock: "색상 변경 해금" } },
  { level: 5,  expRequired: 300,  reward: { points: 10, unlock: "간식상자 1회", snackBox: 1 } },
  { level: 6,  expRequired: 350,  reward: { points: 10, unlock: null } },
  { level: 7,  expRequired: 400,  reward: { points: 15, unlock: "악세서리 해금" } },
  { level: 8,  expRequired: 500,  reward: { points: 15, unlock: null } },
  { level: 9,  expRequired: 600,  reward: { points: 15, unlock: null } },
  { level: 10, expRequired: 700,  reward: { points: 20, unlock: "간식상자 2회 + 특수효과 해금", snackBox: 2 } },
];

function getExpForLevel(level) {
  if (level <= 0) return 0;
  if (level <= LEVEL_TABLE.length) return LEVEL_TABLE[level - 1].expRequired;
  return 700 + (level - 10) * 100;
}

function getRewardForLevel(level) {
  if (level <= LEVEL_TABLE.length) return LEVEL_TABLE[level - 1].reward;
  const snackBox = level % 5 === 0 ? 1 : 0;
  return { points: 20, unlock: snackBox ? "간식상자 1회" : null, snackBox };
}

function getTotalExpForLevel(level) {
  let total = 0;
  for (let i = 2; i <= level; i++) {
    total += getExpForLevel(i);
  }
  return total;
}

const STAT_COST = 3; // 능력치 1포인트 올리는 비용

const BODY_COLORS = [
  { id: "yellow",  hex: "#FFD700", name: "노랑", cost: 0 },
  { id: "red",     hex: "#FF6B6B", name: "빨강", cost: 3 },
  { id: "blue",    hex: "#74B9FF", name: "파랑", cost: 3 },
  { id: "green",   hex: "#55EFC4", name: "초록", cost: 3 },
  { id: "pink",    hex: "#FD79A8", name: "분홍", cost: 3 },
  { id: "purple",  hex: "#A29BFE", name: "보라", cost: 3 },
  { id: "sky",     hex: "#81ECEC", name: "하늘", cost: 3 },
  { id: "orange",  hex: "#FAB1A0", name: "주황", cost: 3 },
];

const EYE_STYLES = [
  { id: "default",  name: "기본",   cost: 0 },
  { id: "sparkle",  name: "반짝",   cost: 2 },
  { id: "sleepy",   name: "졸림",   cost: 2 },
  { id: "angry",    name: "화남",   cost: 2 },
  { id: "heart",    name: "하트",   cost: 2 },
];

const DEFAULT_ITEMS = [
  // 모자
  { id: "hat_crown",    name: "왕관",     category: "hat",       cost: 5,  unlockLevel: 1, imageData: "crown",    description: "멋진 황금 왕관" },
  { id: "hat_cap",      name: "야구모자", category: "hat",       cost: 3,  unlockLevel: 1, imageData: "cap",      description: "시원한 야구모자" },
  { id: "hat_ribbon",   name: "머리띠",   category: "hat",       cost: 3,  unlockLevel: 1, imageData: "headband", description: "귀여운 머리띠" },
  { id: "hat_wizard",   name: "마법사",   category: "hat",       cost: 5,  unlockLevel: 3, imageData: "wizard",   description: "신비로운 마법사 모자" },
  { id: "hat_santa",    name: "산타",     category: "hat",       cost: 5,  unlockLevel: 5, imageData: "santa",    description: "메리 크리스마스!" },
  { id: "hat_flower",   name: "꽃",       category: "hat",       cost: 4,  unlockLevel: 2, imageData: "flower",   description: "예쁜 꽃 장식" },
  // 악세서리
  { id: "acc_glasses",  name: "안경",     category: "accessory", cost: 5,  unlockLevel: 7, imageData: "glasses",  description: "똑똑해 보이는 안경" },
  { id: "acc_necklace", name: "목걸이",   category: "accessory", cost: 5,  unlockLevel: 7, imageData: "necklace", description: "반짝이는 황금 목걸이" },
  { id: "acc_wings",    name: "날개",     category: "accessory", cost: 10, unlockLevel: 7, imageData: "wings",    description: "하늘을 나는 천사 날개" },
  { id: "acc_cape",     name: "망토",     category: "accessory", cost: 8,  unlockLevel: 7, imageData: "cape",     description: "영웅의 보라색 망토" },
  { id: "acc_bow",      name: "리본",     category: "accessory", cost: 5,  unlockLevel: 7, imageData: "bow",      description: "사랑스러운 분홍 리본" },
  // 배경
  { id: "bg_space",     name: "우주",     category: "background", cost: 8,  unlockLevel: 1, imageData: "space",   description: "별이 빛나는 우주" },
  { id: "bg_ocean",     name: "바다",     category: "background", cost: 8,  unlockLevel: 1, imageData: "ocean",   description: "시원한 파란 바다" },
  { id: "bg_forest",    name: "숲",       category: "background", cost: 8,  unlockLevel: 1, imageData: "forest",  description: "초록빛 평화로운 숲" },
  // 특수효과
  { id: "fx_sparkle",   name: "반짝이",   category: "effect",    cost: 15, unlockLevel: 10, imageData: "sparkle", description: "반짝반짝 빛나는 효과" },
  { id: "fx_halo",      name: "후광",     category: "effect",    cost: 15, unlockLevel: 10, imageData: "halo",    description: "천사의 황금 후광" },
  { id: "fx_fire",      name: "불꽃",     category: "effect",    cost: 15, unlockLevel: 10, imageData: "fire",    description: "타오르는 불꽃 효과" },
];

const DEFAULT_MISSIONS = [
  { id: "msn_attendance", title: "오늘 학원에 왔어요", description: "출석 체크", type: "attendance", exp: 10, repeatable: true, requireVerification: true, verificationCode: null, active: true },
  { id: "msn_homework1", title: "오늘 수학 숙제 제출", description: "오늘 배운 수학 숙제를 완료하고 제출했어요", type: "homework", exp: 30, repeatable: true, requireVerification: true, verificationCode: null, active: true },
  { id: "msn_homework2", title: "오답노트 작성", description: "틀린 문제를 오답노트에 정리했어요", type: "homework", exp: 30, repeatable: true, requireVerification: true, verificationCode: null, active: true },
  { id: "msn_exam_good", title: "수학 시험 80점 이상", description: "수학 시험에서 80점 이상을 받았어요", type: "exam", exp: 40, repeatable: false, requireVerification: true, verificationCode: null, active: true },
  { id: "msn_exam_great", title: "수학 시험 95점 이상", description: "수학 시험에서 95점 이상을 받았어요!", type: "exam", exp: 80, repeatable: false, requireVerification: true, verificationCode: null, active: true },
  { id: "msn_special1", title: "수학 공식 20개 암기", description: "수학 공식 20개를 완벽하게 외웠어요", type: "special", exp: 100, repeatable: false, requireVerification: true, verificationCode: null, active: true },
];

// ============================================
// 진화 시스템 데이터
// ============================================

const EVOLUTION_TABLE = [
  { stage: 1, name: "알쪼꼬미",   nameEn: "egg",   minLevel: 1,  sizeRatio: 0.6 },
  { stage: 2, name: "꼬꼬마",     nameEn: "baby",  minLevel: 3,  sizeRatio: 0.8 },
  { stage: 3, name: "쑥쑥이",     nameEn: "child", minLevel: 6,  sizeRatio: 1.0 },
  { stage: 4, name: "번개소년",   nameEn: "teen",  minLevel: 10, sizeRatio: 1.1 },
  { stage: 5, name: "전설체",     nameEn: "final", minLevel: 15, sizeRatio: 1.2 },
];

const FINAL_FORMS = {
  warrior:  { name: "드래곤나이트",  stat: "str", icon: "🐉", description: "불꽃을 다루는 최강의 기사" },
  scholar:  { name: "아크메이지",    stat: "int", icon: "🔮", description: "모든 수학 마법을 꿰뚫는 천재 마법사" },
  star:     { name: "슈퍼아이돌",    stat: "cha", icon: "💖", description: "모두의 시선을 사로잡는 인기 만렙" },
  guardian: { name: "아이언가디언",   stat: "sta", icon: "🛡️", description: "절대 쓰러지지 않는 철벽 수호자" },
};

function createDefaultStudent(name, tamagotchiName) {
  return {
    id: "std_" + Date.now(),
    name: name,
    createdAt: new Date().toISOString().split("T")[0],
    tamagotchi: {
      name: tamagotchiName,
      level: 1,
      exp: 0,
      points: 0,
      stats: { str: 0, int: 0, cha: 0, sta: 0 },
      appearance: {
        bodyColor: "#FFD700",
        eyeStyle: "default",
        hat: null,
        accessory: null,
        background: "default",
        effect: null,
      },
      ownedItems: [],
      evolution: { stage: 1, stageName: "알", finalForm: null },
    },
    completedMissions: [],
    snackBoxChances: 0,
    streakDays: 0,
    lastAttendance: null,
    badges: [],
    minigameToday: 0,
    lastMinigameDate: null,
    // 돌봄 시스템
    care: {
      hunger: 100,
      clean: 100,
      fun: 100,
      lastUpdate: Date.now(),
      fedToday: false,
      washedToday: false,
      playedToday: false,
      lastCareDate: null,
      sickCount: 0,
      recoveredCount: 0,
      isSick: false,
      perfectDays: 0,
    },
    // 비밀 진화
    secretForm: null,
    // 랜덤 이벤트
    lastRouletteStreak: 0,
    totalBonusFound: 0,
    // 일기
    diary: [],
    // 챌린지
    completedChallenges: [],
    weeklyProgress: null,
    // 친구
    friends: [],           // 친구 학생 ID 목록
    giftSentToday: [],     // 오늘 선물 보낸 대상 ID
    lastGiftDate: null,
    coopMissions: [],      // 합동 미션 완료 기록
    // 하우스
    house: {
      wallpaper: "default",
      floor: "default",
      furniture: [],  // 배치된 가구 ID 목록
      ownedDecor: [], // 보유 꾸미기 아이템 ID 목록
    },
  };
}

// ============================================
// 돌봄 시스템 상수
// ============================================

const CARE_DECAY_PER_HOUR = { hunger: 2, clean: 1, fun: 1.5 };
const CARE_ACTION_RECOVER = 40;
const CARE_SICK_THRESHOLD = 0; // 게이지 0 이하
const CARE_SICK_DAYS = 3; // 3일 방치 시 아픔
const CARE_SICK_EXP_PENALTY = 0.5; // EXP 50% 감소
const DAILY_ROUTINE_BONUS_EXP = 20;

// ============================================
// 비밀 진화 데이터
// ============================================

const SECRET_EVOLUTIONS = {
  math_king: {
    name: "갓오브넘버스",
    icon: "🧮",
    description: "수학의 신! 모든 숫자가 무릎 꿇는다",
    hint: "수학을 정말 좋아하는 것 같아...",
    condition: (s) => (s.perfectMinigames || 0) >= 20 && s.tamagotchi.stats.int >= 15,
  },
  phoenix: {
    name: "피닉스",
    icon: "🔥",
    description: "불꽃 속에서 되살아난 불사의 전사",
    hint: "역경을 이겨낸 강한 의지!",
    condition: (s) => (s.care?.recoveredCount || 0) >= 3 && s.tamagotchi.stats.sta >= 10,
  },
  rainbow: {
    name: "프리즘킹",
    icon: "🌈",
    description: "일곱 빛깔을 모두 품은 화려한 존재",
    hint: "알록달록한 걸 좋아하네!",
    condition: (s) => {
      const colors = BODY_COLORS.filter((c) => c.cost > 0);
      const eyes = EYE_STYLES.filter((e) => e.cost > 0);
      return colors.every((c) => s.tamagotchi.ownedItems.includes("color_" + c.id))
          && eyes.every((e) => s.tamagotchi.ownedItems.includes("eye_" + e.id));
    },
  },
  legend: {
    name: "오메가",
    icon: "👑",
    description: "최종 진화를 넘어선 궁극의 존재! 전설이 되었다",
    hint: "모든 면에서 완벽에 가까워...",
    condition: (s) => {
      const st = s.tamagotchi.stats;
      return s.tamagotchi.level >= 20 && st.str >= 10 && st.int >= 10 && st.cha >= 10 && st.sta >= 10;
    },
  },
};

// ============================================
// 룰렛 보상 데이터
// ============================================

const ROULETTE_REWARDS = [
  { name: "포인트 5p", type: "points", value: 5, weight: 30 },
  { name: "포인트 10p", type: "points", value: 10, weight: 20 },
  { name: "포인트 20p", type: "points", value: 20, weight: 10 },
  { name: "경험치 30 EXP", type: "exp", value: 30, weight: 20 },
  { name: "간식상자 1회", type: "snackBox", value: 1, weight: 5 },
  { name: "배고픔 풀회복", type: "careHunger", value: 100, weight: 15 },
];

// ============================================
// 다마고치 하우스 데이터
// ============================================

const HOUSE_WALLPAPERS = [
  { id: "default",    name: "기본 벽지",   color: "#F8F9FA", pattern: "none",   cost: 0 },
  { id: "stripe",     name: "줄무늬",      color: "#E8F5E9", pattern: "stripe", cost: 5 },
  { id: "dots",       name: "물방울",      color: "#E3F2FD", pattern: "dots",   cost: 5 },
  { id: "stars",      name: "별무늬",      color: "#FFF3E0", pattern: "stars",  cost: 8 },
  { id: "heart",      name: "하트무늬",    color: "#FCE4EC", pattern: "heart",  cost: 8 },
  { id: "math",       name: "수학공식",    color: "#F3E5F5", pattern: "math",   cost: 10 },
];

const HOUSE_FLOORS = [
  { id: "default",    name: "기본 바닥",   color: "#DFE6E9", cost: 0 },
  { id: "wood",       name: "나무 바닥",   color: "#D7B98E", cost: 5 },
  { id: "tile",       name: "타일 바닥",   color: "#B2BEC3", cost: 5 },
  { id: "carpet_red", name: "빨간 카펫",   color: "#E17055", cost: 8 },
  { id: "carpet_blue",name: "파란 카펫",   color: "#74B9FF", cost: 8 },
  { id: "grass",      name: "잔디 바닥",   color: "#81C784", cost: 10 },
];

const HOUSE_FURNITURE = [
  { id: "fur_bed",      name: "침대",       icon: "🛏️", cost: 8,  category: "bed" },
  { id: "fur_desk",     name: "책상",       icon: "📚", cost: 8,  category: "desk" },
  { id: "fur_lamp",     name: "스탠드",     icon: "💡", cost: 5,  category: "light" },
  { id: "fur_plant",    name: "화분",       icon: "🪴", cost: 5,  category: "plant" },
  { id: "fur_trophy",   name: "트로피 진열장", icon: "🏆", cost: 12, category: "trophy" },
  { id: "fur_poster",   name: "수학 포스터",  icon: "📐", cost: 6,  category: "poster" },
  { id: "fur_clock",    name: "벽시계",     icon: "🕐", cost: 6,  category: "clock" },
  { id: "fur_rug",      name: "러그",       icon: "🟫", cost: 7,  category: "rug" },
  { id: "fur_bookshelf",name: "책장",       icon: "📖", cost: 10, category: "bookshelf" },
  { id: "fur_globe",    name: "지구본",     icon: "🌍", cost: 10, category: "globe" },
];

// ============================================
// 계절 테마 데이터
// ============================================

const SEASONS = {
  spring: { name: "봄",   icon: "🌸", months: [3, 4, 5],   bgColor: "#FFF0F5", accent: "#FF69B4" },
  summer: { name: "여름", icon: "🌻", months: [6, 7, 8],   bgColor: "#F0FFFF", accent: "#00CED1" },
  autumn: { name: "가을", icon: "🍂", months: [9, 10, 11],  bgColor: "#FFF8DC", accent: "#D2691E" },
  winter: { name: "겨울", icon: "❄️",  months: [12, 1, 2],  bgColor: "#F0F8FF", accent: "#6495ED" },
};

const SEASONAL_ITEMS = {
  spring: [
    { id: "season_cherry",  name: "벚꽃 머리띠",  category: "hat",       cost: 0, unlockLevel: 1, imageData: "headband", description: "봄 한정! 벚꽃 장식" },
    { id: "season_sp_wall", name: "벚꽃 벽지",    type: "wallpaper", wallId: "spring_wall", color: "#FFE4E1", pattern: "cherry", cost: 0 },
  ],
  summer: [
    { id: "season_sunhat",  name: "밀짚모자",      category: "hat",       cost: 0, unlockLevel: 1, imageData: "cap",     description: "여름 한정! 시원한 밀짚모자" },
    { id: "season_sm_wall", name: "바다 벽지",     type: "wallpaper", wallId: "summer_wall", color: "#E0F7FA", pattern: "wave", cost: 0 },
  ],
  autumn: [
    { id: "season_beret",   name: "가을 베레모",   category: "hat",       cost: 0, unlockLevel: 1, imageData: "cap",     description: "가을 한정! 멋진 베레모" },
    { id: "season_au_wall", name: "단풍 벽지",     type: "wallpaper", wallId: "autumn_wall", color: "#FFF3E0", pattern: "leaf", cost: 0 },
  ],
  winter: [
    { id: "season_santa2",  name: "산타 모자",     category: "hat",       cost: 0, unlockLevel: 1, imageData: "santa",   description: "겨울 한정! 산타 모자" },
    { id: "season_wt_wall", name: "눈꽃 벽지",     type: "wallpaper", wallId: "winter_wall", color: "#E8EAF6", pattern: "snow", cost: 0 },
  ],
};

function getCurrentSeason() {
  const month = new Date().getMonth() + 1;
  for (const [key, season] of Object.entries(SEASONS)) {
    if (season.months.includes(month)) return { key, ...season };
  }
  return { key: "spring", ...SEASONS.spring };
}

// ============================================
// 챌린지 데이터
// ============================================

const WEEKLY_CHALLENGES = [
  { id: "ch_missions10",  name: "미션 사냥꾼",    icon: "📋", description: "이번 주 미션 10개 완료", condition: (s, week) => week.missions >= 10, reward: { points: 30 } },
  { id: "ch_minigame3",   name: "수학 마라톤",    icon: "🧮", description: "미니게임 연속 3회 만점", condition: (s) => (s.perfectMinigames || 0) >= 3, reward: { points: 25 } },
  { id: "ch_perfect5",    name: "완벽한 한 주",   icon: "🌟", description: "5일 연속 일일 루틴 완료", condition: (s) => (s.care?.perfectDays || 0) >= 5, reward: { points: 40, snackBox: 1 } },
  { id: "ch_care_master", name: "돌봄 마스터",    icon: "💖", description: "이번 주 매일 밥주기 완료", condition: (s, week) => week.fedDays >= 5, reward: { points: 20 } },
  { id: "ch_level_up3",   name: "급성장",         icon: "🚀", description: "이번 주 3레벨 이상 성장", condition: (s, week) => week.levelsGained >= 3, reward: { points: 35 } },
];

// 일기 템플릿 (활동 기반 자동 생성)
const DIARY_TEMPLATES = {
  missions: [
    "오늘 주인이 미션을 {count}개나 해줬어! 정말 뿌듯해~",
    "미션 {count}개 완료! 주인 덕분에 경험치가 쑥쑥 올라!",
    "오늘도 열심히! {count}개 미션 클리어~ 내일도 화이팅!",
  ],
  minigame_perfect: [
    "미니게임 만점이래! 역시 내 주인은 수학 천재야~! 🧮",
    "와! 수학 문제 다 맞혔어! 나까지 똑똑해지는 기분이야!",
  ],
  minigame: [
    "오늘 수학 미니게임을 했어. 조금 틀렸지만 괜찮아, 다음엔 더 잘할 거야!",
    "미니게임 도전! 수학은 연습하면 늘어나는 거라고 했어~",
  ],
  levelup: [
    "레벨이 올랐어!! Lv.{level} 달성! 🎉 더 멋있어진 것 같아!",
    "드디어 Lv.{level}! 주인 덕분에 점점 강해지고 있어!",
  ],
  evolution: [
    "와!!! 나... 진화했어!!! {form}(이)가 되었어! 너무 신기해!!!",
  ],
  care_fed: [
    "오늘 밥을 줬어! 배가 불러서 행복해~ 🍚",
    "맛있는 밥! 든든하다~ 내일도 꼭 밥 줘!",
  ],
  care_sick: [
    "으으... 몸이 아파... 주인이 빨리 돌봐줬으면 좋겠어... 🤒",
  ],
  care_recovered: [
    "드디어 나았어! 아플 때 주인이 돌봐줘서 고마워! 💊",
  ],
  streak: [
    "{days}일 연속 출석! 주인은 정말 성실해! 나도 본받아야지!",
  ],
  idle: [
    "오늘은 조용한 하루였어. 내일은 주인이랑 더 많이 놀고 싶다...",
    "심심해... 내일 학원에 오면 같이 놀자!",
  ],
  first_day: [
    "안녕! 나는 방금 태어났어! 앞으로 잘 부탁해! 🐣",
  ],
};

// ============================================
// 업적/뱃지 데이터
// ============================================

const BADGES = [
  { id: "first_levelup",    name: "첫 레벨업",       icon: "🌱", description: "처음으로 레벨업!", condition: (s) => s.tamagotchi.level >= 2 },
  { id: "level5",           name: "5레벨 달성",      icon: "⭐", description: "레벨 5 달성", condition: (s) => s.tamagotchi.level >= 5 },
  { id: "level10",          name: "10레벨 달성",     icon: "🌟", description: "레벨 10 달성!", condition: (s) => s.tamagotchi.level >= 10 },
  { id: "level15",          name: "최종 진화",       icon: "👑", description: "최종 진화 달성!", condition: (s) => s.tamagotchi.level >= 15 },
  { id: "streak7",          name: "출석왕 7일",      icon: "🔥", description: "7일 연속 출석!", condition: (s) => s.streakDays >= 7 },
  { id: "streak30",         name: "출석왕 30일",     icon: "💎", description: "30일 연속 출석!", condition: (s) => s.streakDays >= 30 },
  { id: "items5",           name: "수집가",          icon: "🎒", description: "아이템 5개 수집", condition: (s) => s.tamagotchi.ownedItems.length >= 5 },
  { id: "items10",          name: "컬렉터",          icon: "🏆", description: "아이템 10개 수집!", condition: (s) => s.tamagotchi.ownedItems.length >= 10 },
  { id: "stat10",           name: "능력치 마스터",    icon: "💪", description: "한 능력치 10 달성", condition: (s) => Math.max(s.tamagotchi.stats.str, s.tamagotchi.stats.int, s.tamagotchi.stats.cha, s.tamagotchi.stats.sta) >= 10 },
  { id: "missions10",       name: "미션 헌터",       icon: "📋", description: "미션 10회 완료", condition: (s) => s.completedMissions.length >= 10 },
  { id: "missions50",       name: "미션 마스터",     icon: "🎯", description: "미션 50회 완료!", condition: (s) => s.completedMissions.length >= 50 },
  { id: "math_genius",      name: "수학 천재",       icon: "🧮", description: "미니게임 5회 만점", condition: (s) => (s.perfectMinigames || 0) >= 5 },
  { id: "first_snackbox",   name: "간식 러버",       icon: "🍪", description: "첫 간식상자 획득", condition: (s) => s.snackBoxChances > 0 || (s.totalSnackBoxEarned || 0) > 0 },
  { id: "all_colors",       name: "무지개",          icon: "🌈", description: "모든 색상 구매", condition: (s) => BODY_COLORS.filter((c) => c.cost > 0).every((c) => s.tamagotchi.ownedItems.includes("color_" + c.id)) },
];

// ============================================
// 수학 미니게임 데이터
// ============================================

const MINIGAME_MAX_PER_DAY = 2;
const MINIGAME_QUESTIONS = 5;
const MINIGAME_EXP_PER_CORRECT = 5;
const MINIGAME_PERFECT_BONUS = 10;

function generateMathQuestion(difficulty) {
  let a, b, op, answer, text;

  if (difficulty <= 2) {
    // 쉬움: 덧셈/뺄셈 (1~50)
    a = Math.floor(Math.random() * 50) + 1;
    b = Math.floor(Math.random() * 50) + 1;
    if (Math.random() < 0.5) {
      op = "+"; answer = a + b; text = `${a} + ${b} = ?`;
    } else {
      if (a < b) [a, b] = [b, a];
      op = "-"; answer = a - b; text = `${a} - ${b} = ?`;
    }
  } else if (difficulty <= 4) {
    // 보통: 곱셈 (구구단~12단)
    a = Math.floor(Math.random() * 12) + 2;
    b = Math.floor(Math.random() * 12) + 2;
    op = "×"; answer = a * b; text = `${a} × ${b} = ?`;
  } else {
    // 어려움: 혼합 연산, 나눗셈
    const type = Math.floor(Math.random() * 3);
    if (type === 0) {
      // 나눗셈 (나누어떨어지는)
      b = Math.floor(Math.random() * 12) + 2;
      answer = Math.floor(Math.random() * 12) + 1;
      a = b * answer;
      op = "÷"; text = `${a} ÷ ${b} = ?`;
    } else if (type === 1) {
      // 제곱
      a = Math.floor(Math.random() * 12) + 2;
      answer = a * a;
      op = "²"; text = `${a}² = ?`;
    } else {
      // 큰 수 곱셈
      a = Math.floor(Math.random() * 20) + 10;
      b = Math.floor(Math.random() * 9) + 2;
      op = "×"; answer = a * b; text = `${a} × ${b} = ?`;
    }
  }

  return { text, answer, op };
}

// ============================================
// 감정/상태 시스템 데이터
// ============================================

const MOOD_STATES = {
  happy:    { name: "행복",   icon: "😊", mouthStyle: "happy",  threshold: 3 },
  excited:  { name: "신남",   icon: "🤩", mouthStyle: "excited", threshold: 7 },
  normal:   { name: "보통",   icon: "😐", mouthStyle: "normal",  threshold: 0 },
  sad:      { name: "슬픔",   icon: "😢", mouthStyle: "sad",     threshold: -3 },
  hungry:   { name: "배고픔", icon: "😫", mouthStyle: "hungry",  threshold: -5 },
};

function calculateMood(student) {
  let moodScore = 0;
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  // 오늘 미션 완료 수
  const todayMissions = student.completedMissions.filter((c) => c.completedAt === today).length;
  moodScore += todayMissions * 2;

  // 연속 출석 보너스
  if (student.streakDays >= 7) moodScore += 3;
  else if (student.streakDays >= 3) moodScore += 1;

  // 최근 활동 없으면 감소
  if (student.lastAttendance && student.lastAttendance !== today && student.lastAttendance !== yesterday) {
    const daysSince = Math.floor((Date.now() - new Date(student.lastAttendance).getTime()) / 86400000);
    moodScore -= Math.min(daysSince, 5);
  }

  // 첫 방문 (lastAttendance 없으면 보통)
  if (!student.lastAttendance) return "normal";

  if (moodScore >= MOOD_STATES.excited.threshold) return "excited";
  if (moodScore >= MOOD_STATES.happy.threshold) return "happy";
  if (moodScore <= MOOD_STATES.hungry.threshold) return "hungry";
  if (moodScore <= MOOD_STATES.sad.threshold) return "sad";
  return "normal";
}
