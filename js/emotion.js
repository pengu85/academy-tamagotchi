// ============================================
// emotion.js - 감정 표현 강화 시스템
// ============================================

const Emotion = {
  // 접속 시 환영 메시지 (부재 시간에 따라 다른 반응)
  getWelcomeReaction(student) {
    if (!student.lastAttendance) return null;

    const now = Date.now();
    const lastVisit = new Date(student.lastAttendance).getTime();
    const hoursSince = (now - lastVisit) / (1000 * 60 * 60);
    const name = student.tamagotchi.name;

    // 24시간 이내: 반가움
    if (hoursSince < 24) {
      return {
        type: "welcome",
        speech: this._pick([
          `${name}: \uC640\uC918\uC11C \uAE30\uBF10!`,
          `${name}: \uC624\uB298\uB3C4 \uC640\uC918\uC11E!`,
          `${name}: \uAC19\uC774 \uB180\uC790!`,
        ]),
        emojis: ["\u{1F49B}", "\u2728", "\u{1F60A}"],
        animation: "bounce",
      };
    }

    // 1-3일: 보고 싶었어
    if (hoursSince < 72) {
      return {
        type: "miss",
        speech: this._pick([
          `${name}: \uBCF4\uACE0 \uC2F6\uC5C8\uC5B4... \uC640\uC918\uC11C \uACE0\uB9C8\uC6CC!`,
          `${name}: \uD63C\uC790\uC11C \uC678\uB85C\uC6E0\uC5B4...`,
          `${name}: \uB4DC\uB514\uC5B4 \uC654\uAD6C\uB098! \uAE30\uB2E4\uB838\uC5B4!`,
        ]),
        emojis: ["\u{1F622}", "\u{1F49B}", "\u{1F917}"],
        animation: "shake",
      };
    }

    // 3일 이상: 매우 슬픔
    return {
      type: "lonely",
      speech: this._pick([
        `${name}: \uC5B4\uB514 \uAC14\uC5C8\uC5B4...? \uB108\uBB34 \uC678\uB85C\uC6E0\uC5B4...`,
        `${name}: \uBC84\uB9BC\uBC1B\uC740 \uC904 \uC54C\uC558\uC5B4... \uB2E4\uD589\uC774\uB2E4!`,
        `${name}: \uC6B8\uBE60\uD588\uC5B4... \uC774\uC81C \uC548 \uAC00\uC9C0?`,
      ]),
      emojis: ["\u{1F62D}", "\u{1F494}", "\u{1F97A}"],
      animation: "shake",
    };
  },

  // 미션 완료 시 레벨별 반응
  getMissionReaction(student) {
    const level = student.tamagotchi.level;
    if (level < 5) {
      return this._pick(["\uC6B0\uC640! \uBA4B\uC838!", "\uB300\uB2E8\uD574!", "\uCD5C\uACE0\uC57C!"]);
    } else if (level < 10) {
      return this._pick(["\uC5ED\uC2DC \uB0B4 \uC8FC\uC778!", "\uC810\uC810 \uAC15\uD574\uC9C0\uACE0 \uC788\uC5B4!", "\uC774 \uC815\uB3C4\uB294 \uAE30\uBCF8\uC774\uC9C0!"]);
    } else {
      return this._pick(["\uC804\uC124\uC758 \uC2E4\uB825\uC774\uC57C!", "\uC218\uD559\uC758 \uC2E0\uC774 \uB418\uC5B4\uAC00\uACE0 \uC788\uC5B4!", "\uB098\uB3C4 \uC8FC\uC778\uCC98\uB7FC \uB418\uACE0 \uC2F6\uC5B4!"]);
    }
  },

  // 방치 상태 시각 효과 (홈 화면용)
  getNeglectOverlay(student) {
    Care.ensure(student);
    const care = student.care;
    const avgGauge = (care.hunger + care.clean + care.fun) / 3;

    // 게이지 평균이 낮으면 어두운 오버레이
    if (care.isSick) {
      return `<div class="emotion-overlay sick">
        <div class="emotion-particles">\u{1F4A7}\u{1F4A7}\u{1F4A7}</div>
      </div>`;
    }
    if (avgGauge < 20) {
      return `<div class="emotion-overlay sad">
        <div class="emotion-bubble">\uBC30\uACE0\uD30C... \uB3CC\uBD10\uC918...</div>
      </div>`;
    }
    if (avgGauge < 40) {
      return `<div class="emotion-overlay worried"></div>`;
    }
    return "";
  },

  // 돌봄 후 행복 반응 (일반 리액션 강화)
  getHappyBubble(student) {
    const name = student.tamagotchi.name;
    return this._pick([
      `${name}: \uD589\uBCF5\uD574\uC11C \uB0A0\uC544\uAC08 \uAC83 \uAC19\uC544~!`,
      `${name}: \uCD5C\uACE0\uC758 \uD558\uB8E8\uC57C!`,
      `${name}: \uC0AC\uB791\uD574 \uC8FC\uC778!`,
      `${name}: \uD788\uD788\uD788~ \uAE30\uBD84 \uC88B\uC544!`,
    ]);
  },

  _pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  },
};
