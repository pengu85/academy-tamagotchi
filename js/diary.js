// ============================================
// diary.js - 다마고치 일기 시스템
// ============================================

const Diary = {
  // 오늘의 일기 자동 생성 (앱 로드 시 or 미션 완료 시)
  generateToday(student) {
    if (!student.diary) student.diary = [];
    const today = new Date().toISOString().split("T")[0];

    // 오늘 이미 생성했으면 업데이트
    let entry = student.diary.find((d) => d.date === today);
    if (!entry) {
      entry = { date: today, lines: [], mood: "normal" };
      student.diary.push(entry);
      // 최대 30일치만 보관
      if (student.diary.length > 30) student.diary.shift();
    }

    // 오늘의 활동 수집
    const todayMissions = student.completedMissions.filter((c) => c.completedAt === today);
    const mood = calculateMood(student);
    entry.mood = mood;
    entry.lines = [];

    // 첫날
    if (student.diary.length === 1 && todayMissions.length === 0) {
      entry.lines.push(this._pick(DIARY_TEMPLATES.first_day));
      Storage.updateStudent(student);
      return entry;
    }

    // 미션 관련
    if (todayMissions.length > 0) {
      entry.lines.push(this._pick(DIARY_TEMPLATES.missions).replace("{count}", todayMissions.length));
    }

    // 미니게임
    if (student.lastMinigameDate === today) {
      const isPerfect = !!student.perfectMinigameToday;
      entry.lines.push(this._pick(isPerfect ? DIARY_TEMPLATES.minigame_perfect : DIARY_TEMPLATES.minigame));
    }

    // 돌봄
    Care.ensure(student);
    if (student.care.fedToday) {
      entry.lines.push(this._pick(DIARY_TEMPLATES.care_fed));
    }
    if (student.care.isSick) {
      entry.lines.push(this._pick(DIARY_TEMPLATES.care_sick));
    }

    // 연속 출석
    if (student.streakDays >= 3) {
      entry.lines.push(this._pick(DIARY_TEMPLATES.streak).replace("{days}", student.streakDays));
    }

    // 활동 없을 때
    if (entry.lines.length === 0) {
      entry.lines.push(this._pick(DIARY_TEMPLATES.idle));
    }

    Storage.updateStudent(student);
    return entry;
  },

  // 레벨업 일기 추가
  addLevelUp(student, level) {
    const entry = this._getOrCreateToday(student);
    entry.lines.push(this._pick(DIARY_TEMPLATES.levelup).replace("{level}", level));
    Storage.updateStudent(student);
  },

  // 진화 일기 추가
  addEvolution(student, formName) {
    const entry = this._getOrCreateToday(student);
    entry.lines.push(this._pick(DIARY_TEMPLATES.evolution).replace("{form}", formName));
    Storage.updateStudent(student);
  },

  // 회복 일기 추가
  addRecovery(student) {
    const entry = this._getOrCreateToday(student);
    entry.lines.push(this._pick(DIARY_TEMPLATES.care_recovered));
    Storage.updateStudent(student);
  },

  _getOrCreateToday(student) {
    if (!student.diary) student.diary = [];
    const today = new Date().toISOString().split("T")[0];
    let entry = student.diary.find((d) => d.date === today);
    if (!entry) {
      entry = { date: today, lines: [], mood: "normal" };
      student.diary.push(entry);
      if (student.diary.length > 30) student.diary.shift();
    }
    return entry;
  },

  _pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  },

  // 일기 모달 표시
  showDiary(student) {
    if (!student.diary) student.diary = [];
    this.generateToday(student);

    const entries = [...student.diary].reverse(); // 최신순

    let html = '<div class="diary-list">';

    if (entries.length === 0) {
      html += '<p class="text-muted" style="text-align:center;padding:20px">아직 일기가 없어요.</p>';
    }

    entries.forEach((entry) => {
      const moodInfo = MOOD_STATES[entry.mood] || MOOD_STATES.normal;
      html += `
        <div class="diary-entry">
          <div class="diary-date">${entry.date} ${moodInfo.icon}</div>
          <div class="diary-content">
            ${entry.lines.map((l) => `<p>${l}</p>`).join("")}
          </div>
        </div>
      `;
    });

    html += '</div>';
    UI.showModal(`📖 ${student.tamagotchi.name}의 일기`, html, [{ text: "닫기", class: "btn btn-secondary" }]);
  },
};
