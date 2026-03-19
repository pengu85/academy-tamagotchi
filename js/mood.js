// ============================================
// mood.js - 감정 체크인 시스템
// ============================================

const Mood = {
  MOODS: [
    { id: "great", emoji: "\u{1F606}", label: "최고!", color: "#00B894", message: "오늘 기분이 최고구나! 파이팅!" },
    { id: "good", emoji: "\u{1F60A}", label: "좋아", color: "#6C5CE7", message: "좋은 하루가 될 거야!" },
    { id: "okay", emoji: "\u{1F610}", label: "그냥 그래", color: "#FDCB6E", message: "괜찮아, 오늘 하루도 힘내자!" },
    { id: "tired", emoji: "\u{1F634}", label: "피곤해", color: "#E17055", message: "힘들었구나... 오늘은 편하게 해!" },
    { id: "sad", emoji: "\u{1F622}", label: "슬퍼", color: "#74B9FF", message: "슬프구나... 선생님이 응원할게!" },
    { id: "angry", emoji: "\u{1F624}", label: "짜증나", color: "#D63031", message: "화가 났구나. 같이 이야기해볼까?" },
  ],

  CHECKIN_EXP: 5,

  isCheckedToday(student) {
    const today = new Date().toISOString().split("T")[0];
    if (!student.moodHistory) student.moodHistory = [];
    return student.moodHistory.some((m) => m.date === today);
  },

  showCheckIn(student, onComplete) {
    const moodButtons = this.MOODS.map(
      (m) => `
      <button class="mood-checkin-btn" data-mood="${m.id}" style="--mood-color: ${m.color}">
        <span class="mood-checkin-emoji">${m.emoji}</span>
        <span class="mood-checkin-label">${m.label}</span>
      </button>
    `
    ).join("");

    const overlay = document.createElement("div");
    overlay.className = "mood-checkin-overlay";
    overlay.innerHTML = `
      <div class="mood-checkin-card">
        <div class="mood-checkin-header">
          <span class="mood-checkin-icon">\u{1F4AD}</span>
          <h2>오늘 기분이 어때?</h2>
          <p class="mood-checkin-sub">매일 기분을 알려주면 +${this.CHECKIN_EXP} EXP!</p>
        </div>
        <div class="mood-checkin-grid">
          ${moodButtons}
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add("active"));

    overlay.querySelectorAll(".mood-checkin-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const moodId = btn.dataset.mood;
        const moodData = this.MOODS.find((m) => m.id === moodId);
        this.record(student, moodId);

        // Show response
        const card = overlay.querySelector(".mood-checkin-card");
        card.innerHTML = `
          <div class="mood-checkin-result">
            <div class="mood-result-emoji">${moodData.emoji}</div>
            <div class="mood-result-message">${moodData.message}</div>
            <div class="mood-result-exp">+${this.CHECKIN_EXP} EXP \u2728</div>
          </div>
        `;

        // Add EXP
        Tamagotchi.addExp(student, this.CHECKIN_EXP);

        setTimeout(() => {
          overlay.classList.remove("active");
          setTimeout(() => {
            overlay.remove();
            if (onComplete) onComplete();
          }, 300);
        }, 1800);
      });
    });
  },

  record(student, moodId) {
    if (!student.moodHistory) student.moodHistory = [];
    const today = new Date().toISOString().split("T")[0];
    student.moodHistory = student.moodHistory.filter((m) => m.date !== today);
    student.moodHistory.push({ date: today, mood: moodId, timestamp: Date.now() });
    // Keep last 90 days
    const cutoff = new Date(Date.now() - 90 * 86400000).toISOString().split("T")[0];
    student.moodHistory = student.moodHistory.filter((m) => m.date >= cutoff);
    Storage.updateStudent(student);
  },

  getTodayMood(student) {
    const today = new Date().toISOString().split("T")[0];
    if (!student.moodHistory) return null;
    const entry = student.moodHistory.find((m) => m.date === today);
    return entry ? this.MOODS.find((m) => m.id === entry.mood) : null;
  },

  // Admin: render mood dashboard
  renderAdmin(container) {
    const students = Storage.getStudents();
    const today = new Date().toISOString().split("T")[0];

    // Today's mood overview
    let todayChecked = 0;
    const todayMoods = {};
    this.MOODS.forEach((m) => (todayMoods[m.id] = 0));

    students.forEach((s) => {
      if (!s.moodHistory) return;
      const todayEntry = s.moodHistory.find((m) => m.date === today);
      if (todayEntry) {
        todayChecked++;
        if (todayMoods[todayEntry.mood] !== undefined) todayMoods[todayEntry.mood]++;
      }
    });

    let html = `
      <div class="admin-section mood-admin">
        <h3>\u{1F4AD} 오늘의 감정 현황</h3>
        <div class="mood-admin-summary">
          <div class="mood-summary-stat">
            <div class="mood-summary-value">${todayChecked}/${students.length}</div>
            <div class="mood-summary-label">체크인 완료</div>
          </div>
        </div>
        <div class="mood-today-dist">
    `;

    this.MOODS.forEach((m) => {
      const count = todayMoods[m.id];
      const pct = todayChecked > 0 ? Math.round((count / todayChecked) * 100) : 0;
      html += `
        <div class="mood-dist-item">
          <span class="mood-dist-emoji">${m.emoji}</span>
          <span class="mood-dist-label">${m.label}</span>
          <div class="mood-dist-bar-wrap">
            <div class="mood-dist-bar" style="width: ${pct}%; background: ${m.color}"></div>
          </div>
          <span class="mood-dist-count">${count}\uBA85</span>
        </div>
      `;
    });

    html += `</div>`;

    // Alert: students with mostly negative moods in past 7 days
    const alertStudents = [];
    students.forEach((s) => {
      if (!s.moodHistory || s.moodHistory.length === 0) return;
      const weekCutoff = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
      const recentMoods = s.moodHistory.filter((m) => m.date >= weekCutoff);
      if (recentMoods.length < 3) return;
      const negativeCount = recentMoods.filter((m) => ["sad", "angry", "tired"].includes(m.mood)).length;
      if (negativeCount > recentMoods.length / 2) {
        alertStudents.push({
          student: s,
          negativeCount,
          total: recentMoods.length,
          latestMood: recentMoods[recentMoods.length - 1].mood,
        });
      }
    });

    if (alertStudents.length > 0) {
      html += `
        <div class="mood-alert-section">
          <h4>\u26A0\uFE0F 관심이 필요한 학생</h4>
          <p class="text-muted">최근 7일간 부정적 감정이 많았어요</p>
      `;
      alertStudents.forEach((a) => {
        const moodInfo = this.MOODS.find((m) => m.id === a.latestMood);
        html += `
          <div class="mood-alert-item">
            <strong>${a.student.name}</strong>
            <span>${moodInfo ? moodInfo.emoji : ""} 부정적 감정 ${a.negativeCount}/${a.total}일</span>
          </div>
        `;
      });
      html += `</div>`;
    }

    // Per-student mood history (last 7 days)
    const dayLabels = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      dayLabels.push(["일", "월", "화", "수", "목", "금", "토"][d.getDay()]);
    }

    html += `
      <h4 style="margin-top: 20px">\u{1F4CB} 학생별 감정 기록 (최근 7일)</h4>
      <div class="mood-history-header">
        <span class="mood-history-name"></span>
        <div class="mood-history-days">${dayLabels.map((d) => `<span class="mood-day-cell mood-day-label">${d}</span>`).join("")}</div>
      </div>
      <div class="mood-history-list">
    `;

    students.forEach((s) => {
      if (!s.moodHistory) s.moodHistory = [];
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        const dateStr = d.toISOString().split("T")[0];
        const entry = s.moodHistory.find((m) => m.date === dateStr);
        const moodInfo = entry ? this.MOODS.find((m) => m.id === entry.mood) : null;
        days.push(moodInfo ? moodInfo.emoji : "\u00B7");
      }
      html += `
        <div class="mood-history-row">
          <span class="mood-history-name">${UI.esc(s.name)}</span>
          <div class="mood-history-days">${days.map((d) => `<span class="mood-day-cell">${d}</span>`).join("")}</div>
        </div>
      `;
    });

    html += `</div></div>`;
    container.innerHTML = html;
  },
};
