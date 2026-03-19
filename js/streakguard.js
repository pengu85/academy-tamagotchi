// ============================================
// streakguard.js - 스트릭 위기 경고 시스템
// ============================================

const StreakGuard = {
  // 오늘 출석 미션을 완료했는지 확인
  hasAttendedToday(student) {
    const today = new Date().toISOString().split("T")[0];
    return student.lastAttendance === today;
  },

  // 스트릭이 위기인지 확인 (출석 미완 + 스트릭 3일 이상)
  isAtRisk(student) {
    if (student.streakDays < 1) return false;
    return !this.hasAttendedToday(student);
  },

  // 위기 배너 HTML 렌더링
  renderBanner(student) {
    if (!this.isAtRisk(student)) return "";

    const streak = student.streakDays;
    let urgency = "low";
    let message = "";

    if (streak >= 20) {
      urgency = "critical";
      message = `\u{1F6A8} ${streak}\uC77C \uC5F0\uC18D \uCD9C\uC11D\uC774 \uC0AC\uB77C\uC838\uC694! \uC9C0\uAE08 \uCD9C\uC11D \uBBF8\uC158\uC744 \uC644\uB8CC\uD558\uC138\uC694!`;
    } else if (streak >= 7) {
      urgency = "high";
      message = `\u26A0\uFE0F ${streak}\uC77C \uC5F0\uC18D \uCD9C\uC11D\uC774 \uC704\uD5D8\uD574\uC694! \uCD9C\uC11D \uBBF8\uC158\uC744 \uC644\uB8CC\uD574\uC8FC\uC138\uC694!`;
    } else {
      urgency = "low";
      message = `\u{1F525} ${streak}\uC77C \uC5F0\uC18D \uCD9C\uC11D \uC911! \uC624\uB298\uB3C4 \uCD9C\uC11D\uD558\uBA74 ${streak + 1}\uC77C\uC774 \uB3FC\uC694!`;
    }

    return `
      <div class="streak-guard ${urgency}" id="streak-guard">
        <div class="streak-guard-content">
          <span class="streak-guard-fire">\u{1F525}</span>
          <div class="streak-guard-text">
            <div class="streak-guard-msg">${message}</div>
            <div class="streak-guard-sub">\uCD9C\uC11D \uBBF8\uC158\uC744 \uC644\uB8CC\uD558\uBA74 \uC2A4\uD2B8\uB9AD\uC774 \uC720\uC9C0\uB3FC\uC694!</div>
          </div>
        </div>
        <button class="btn btn-small btn-primary streak-guard-btn" id="streak-go-mission">\uBBF8\uC158 \uAC00\uAE30 \u2192</button>
      </div>
    `;
  },

  // 배너 이벤트 바인딩
  bindEvents() {
    document.getElementById("streak-go-mission")?.addEventListener("click", () => {
      App.switchTab("mission");
    });
  },
};
