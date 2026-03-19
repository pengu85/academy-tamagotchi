// ============================================
// care.js - 돌봄 시스템 + 일일 루틴
// ============================================

const Care = {
  // 돌봄 데이터 보장 (하위 호환)
  ensure(student) {
    if (!student.care) {
      student.care = {
        hunger: 80, clean: 80, fun: 80,
        lastUpdate: Date.now(),
        fedToday: false, washedToday: false, playedToday: false,
        lastCareDate: null, sickCount: 0, recoveredCount: 0,
        isSick: false, perfectDays: 0,
      };
    }
  },

  // 게이지 감소 계산 (시간 경과 기반)
  updateGauges(student) {
    this.ensure(student);
    const care = student.care;
    const now = Date.now();
    const hours = (now - care.lastUpdate) / (1000 * 60 * 60);

    if (hours > 0.1) { // 6분 이상 경과 시
      care.hunger = Math.max(0, care.hunger - hours * CARE_DECAY_PER_HOUR.hunger);
      care.clean = Math.max(0, care.clean - hours * CARE_DECAY_PER_HOUR.clean);
      care.fun = Math.max(0, care.fun - hours * CARE_DECAY_PER_HOUR.fun);
      care.lastUpdate = now;

      // 아픔 체크: 모든 게이지가 0이면 아픔
      if (care.hunger <= 0 && care.clean <= 0 && care.fun <= 0 && !care.isSick) {
        care.isSick = true;
        care.sickCount = (care.sickCount || 0) + 1;
      }

      // 일일 리셋 체크
      const today = new Date().toISOString().split("T")[0];
      if (care.lastCareDate !== today) {
        care.fedToday = false;
        care.washedToday = false;
        care.playedToday = false;
        care.lastCareDate = today;
      }

      Storage.updateStudent(student);
    }
  },

  // 밥 주기
  feed(student) {
    this.ensure(student);
    if (student.care.fedToday) return { success: false, message: "오늘은 이미 밥을 줬어요!" };
    student.care.hunger = Math.min(100, student.care.hunger + CARE_ACTION_RECOVER);
    student.care.fedToday = true;
    this._checkSickRecovery(student);
    Storage.updateStudent(student);
    return {
      success: true,
      reaction: {
        type: "feed",
        emojis: ["🍚", "🍙", "🥄", "😋"],
        speech: this._pickRandom([
          "냠냠! 맛있다~!",
          "배고팠는데 고마워!",
          "우와! 밥이다! 최고야!",
          "맛있어서 눈물이 나...!",
          "한 그릇 더?! 농담이야~ 배불러!",
        ]),
        animation: "bounce",
      },
    };
  },

  // 씻기기
  wash(student) {
    this.ensure(student);
    if (student.care.washedToday) return { success: false, message: "오늘은 이미 씻겨줬어요!" };
    student.care.clean = Math.min(100, student.care.clean + CARE_ACTION_RECOVER);
    student.care.washedToday = true;
    this._checkSickRecovery(student);
    Storage.updateStudent(student);
    return {
      success: true,
      reaction: {
        type: "wash",
        emojis: ["🫧", "🛁", "💧", "✨"],
        speech: this._pickRandom([
          "아~ 시원하다! 깨끗해졌어!",
          "뽀득뽀득! 반짝반짝!",
          "거품 목욕 최고야~!",
          "이제 나 냄새 안 나지?!",
          "깨끗한 게 제일 좋아!",
        ]),
        animation: "shake",
      },
    };
  },

  // 놀아주기
  play(student) {
    this.ensure(student);
    if (student.care.playedToday) return { success: false, message: "오늘은 이미 놀아줬어요!" };
    student.care.fun = Math.min(100, student.care.fun + CARE_ACTION_RECOVER);
    student.care.playedToday = true;
    this._checkSickRecovery(student);
    Storage.updateStudent(student);
    return {
      success: true,
      reaction: {
        type: "play",
        emojis: ["🎮", "⭐", "🎵", "💫"],
        speech: this._pickRandom([
          "너무 재밌다! 히히!",
          "같이 노니까 최고야!",
          "신나! 신나! 더 놀자~!",
          "우와~ 또 놀아줘!",
          "행복해서 날아갈 것 같아~!",
        ]),
        animation: "jump",
      },
    };
  },

  _pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  },

  // 아픔 회복 체크
  _checkSickRecovery(student) {
    if (student.care.isSick && student.care.hunger > 30 && student.care.clean > 30 && student.care.fun > 30) {
      student.care.isSick = false;
      student.care.recoveredCount = (student.care.recoveredCount || 0) + 1;
      Diary.addRecovery(student);
      UI.showToast("다마고치가 건강을 회복했어요! 💊", "success");
    }
  },

  // EXP 페널티 배율 (아플 때 50%)
  getExpPenalty(student) {
    this.ensure(student);
    return student.care.isSick ? CARE_SICK_EXP_PENALTY : 1.0;
  },

  // 일일 루틴 완료 체크
  checkDailyRoutine(student) {
    this.ensure(student);
    const care = student.care;
    const today = new Date().toISOString().split("T")[0];

    // 미션 1개 이상 완료 체크
    const missionDone = student.completedMissions.some((c) => c.completedAt === today);

    // 미니게임 플레이 체크
    const gameDone = student.lastMinigameDate === today && (student.minigameToday || 0) > 0;

    return {
      fed: care.fedToday,
      missionDone,
      gameDone,
      allComplete: care.fedToday && missionDone && gameDone,
    };
  },

  // 완벽한 하루 보상 지급
  claimDailyBonus(student) {
    const routine = this.checkDailyRoutine(student);
    if (!routine.allComplete) return false;

    // 이미 받았는지 체크 (perfectDays로 추적)
    const today = new Date().toISOString().split("T")[0];
    if (student.care._lastPerfectDate === today) return false;

    student.care._lastPerfectDate = today;
    student.care.perfectDays = (student.care.perfectDays || 0) + 1;
    Tamagotchi.addExp(student, DAILY_ROUTINE_BONUS_EXP);
    return true;
  },

  // 게이지 바 HTML 렌더
  renderGauges(student) {
    this.ensure(student);
    this.updateGauges(student);
    const care = student.care;

    const gauges = [
      { key: "hunger", label: "배고픔", icon: "🍚", value: care.hunger, color: "#FF6B6B" },
      { key: "clean",  label: "청결",   icon: "🛁", value: care.clean,  color: "#74B9FF" },
      { key: "fun",    label: "행복",   icon: "🎮", value: care.fun,    color: "#FDCB6E" },
    ];

    let html = '<div class="care-gauges">';
    gauges.forEach((g) => {
      const percent = Math.max(0, Math.min(100, Math.round(g.value)));
      const low = percent < 30;
      html += `
        <div class="care-gauge ${low ? 'low' : ''}">
          <span class="care-icon">${g.icon}</span>
          <div class="care-bar-wrap">
            <div class="care-bar" style="width: ${percent}%; background: ${g.color}"></div>
          </div>
          <span class="care-value">${percent}</span>
        </div>
      `;
    });
    html += '</div>';

    if (care.isSick) {
      html += '<div class="care-sick-alert">🤒 다마고치가 아파요! 돌봐주세요!</div>';
    }

    return html;
  },

  // 돌봄 버튼 HTML
  renderActions(student) {
    this.ensure(student);
    const care = student.care;

    return `
      <div class="care-actions">
        <button class="care-btn ${care.fedToday ? 'done' : ''}" id="care-feed" ${care.fedToday ? 'disabled' : ''}>
          🍚 밥주기${care.fedToday ? ' ✓' : ''}
        </button>
        <button class="care-btn ${care.washedToday ? 'done' : ''}" id="care-wash" ${care.washedToday ? 'disabled' : ''}>
          🛁 씻기기${care.washedToday ? ' ✓' : ''}
        </button>
        <button class="care-btn ${care.playedToday ? 'done' : ''}" id="care-play" ${care.playedToday ? 'disabled' : ''}>
          🎮 놀아주기${care.playedToday ? ' ✓' : ''}
        </button>
      </div>
    `;
  },

  // 일일 루틴 체크리스트 HTML
  renderRoutine(student) {
    const r = this.checkDailyRoutine(student);
    return `
      <div class="daily-routine">
        <div class="routine-title">오늘의 루틴</div>
        <div class="routine-items">
          <span class="${r.fed ? 'done' : ''}">${r.fed ? '✅' : '⬜'} 밥주기</span>
          <span class="${r.missionDone ? 'done' : ''}">${r.missionDone ? '✅' : '⬜'} 미션</span>
          <span class="${r.gameDone ? 'done' : ''}">${r.gameDone ? '✅' : '⬜'} 게임</span>
        </div>
        ${r.allComplete ? '<div class="routine-complete">🌟 완벽한 하루! +20 EXP</div>' : ''}
      </div>
    `;
  },
};
