// ============================================
// calendar.js - 출석 캘린더 (월별 출석 도장 + 마일스톤)
// ============================================

const Calendar = {
  MILESTONES: [
    { days: 7, icon: "\u{1F525}", label: "7\uC77C \uC5F0\uC18D!", reward: "\uAC04\uC2DD\uC0C1\uC790 1\uD68C" },
    { days: 14, icon: "\u{1F31F}", label: "14\uC77C \uC5F0\uC18D!", reward: "+30 EXP" },
    { days: 21, icon: "\u{1F48E}", label: "21\uC77C \uC5F0\uC18D!", reward: "\uAC04\uC2DD\uC0C1\uC790 2\uD68C" },
    { days: 30, icon: "\u{1F451}", label: "30\uC77C \uC5F0\uC18D!", reward: "\uD2B9\uBCC4 \uCE6D\uD638 + 50 EXP" },
  ],

  show(student) {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-indexed

    const html = `
      <div class="calendar-container">
        <div class="calendar-nav">
          <span class="calendar-title">${year}\uB144 ${month + 1}\uC6D4</span>
        </div>
        ${this._renderGrid(student, year, month)}
        ${this._renderStreak(student)}
        ${this._renderMilestones(student)}
      </div>
    `;

    UI.showModal("\u{1F4C5} \uCD9C\uC11D \uCE98\uB9B0\uB354", html, [{ text: "\uB2EB\uAE30", class: "btn btn-secondary" }]);
  },

  _renderGrid(student, year, month) {
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayDate = new Date().getDate();
    const todayMonth = new Date().getMonth();
    const todayYear = new Date().getFullYear();

    // Collect attendance dates for this month
    const attendedDates = new Set();
    if (student.completedMissions) {
      student.completedMissions.forEach((c) => {
        if (c.completedAt) {
          const d = new Date(c.completedAt);
          if (d.getFullYear() === year && d.getMonth() === month) {
            attendedDates.add(d.getDate());
          }
        }
      });
    }

    // Also check mood check-in as attendance indicator
    if (student.moodHistory) {
      student.moodHistory.forEach((m) => {
        const d = new Date(m.date);
        if (d.getFullYear() === year && d.getMonth() === month) {
          attendedDates.add(d.getDate());
        }
      });
    }

    const dayNames = ["\uC77C", "\uC6D4", "\uD654", "\uC218", "\uBAA9", "\uAE08", "\uD1A0"];
    let html = '<div class="cal-grid">';

    // Header row
    dayNames.forEach((d, i) => {
      const cls = i === 0 ? "cal-day-name sun" : i === 6 ? "cal-day-name sat" : "cal-day-name";
      html += `<div class="${cls}">${d}</div>`;
    });

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      html += '<div class="cal-cell empty"></div>';
    }

    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = d === todayDate && month === todayMonth && year === todayYear;
      const attended = attendedDates.has(d);
      const isPast = new Date(year, month, d) < new Date(todayYear, todayMonth, todayDate);
      const isFuture = new Date(year, month, d) > new Date(todayYear, todayMonth, todayDate);

      let cls = "cal-cell";
      if (isToday) cls += " today";
      if (attended) cls += " attended";
      if (isPast && !attended) cls += " missed";
      if (isFuture) cls += " future";

      const stamp = attended ? '<span class="cal-stamp">\u2705</span>' : "";

      html += `<div class="${cls}"><span class="cal-date">${d}</span>${stamp}</div>`;
    }

    html += "</div>";

    // Monthly stats
    const totalAttended = attendedDates.size;
    const totalPast = Math.min(todayDate, daysInMonth);
    const rate = totalPast > 0 ? Math.round((totalAttended / totalPast) * 100) : 0;

    html += `
      <div class="cal-summary">
        <span>\uC774\uBC88 \uB2EC \uCD9C\uC11D: <strong>${totalAttended}\uC77C</strong> / ${totalPast}\uC77C</span>
        <span class="cal-rate">${rate}%</span>
      </div>
    `;

    return html;
  },

  _renderStreak(student) {
    const streak = student.streakDays || 0;
    const nextMilestone = this.MILESTONES.find((m) => m.days > streak);
    const daysToNext = nextMilestone ? nextMilestone.days - streak : 0;
    const progress = nextMilestone ? Math.round((streak / nextMilestone.days) * 100) : 100;

    return `
      <div class="cal-streak">
        <div class="cal-streak-header">
          <span>\u{1F525} \uC5F0\uC18D \uCD9C\uC11D</span>
          <span class="cal-streak-count">${streak}\uC77C</span>
        </div>
        ${nextMilestone ? `
          <div class="cal-streak-next">
            <div class="cal-streak-bar-wrap">
              <div class="cal-streak-bar" style="width: ${progress}%"></div>
            </div>
            <span class="cal-streak-target">${nextMilestone.icon} ${nextMilestone.days}\uC77C\uAE4C\uC9C0 ${daysToNext}\uC77C \uB0A8\uC74C</span>
          </div>
        ` : `<div class="cal-streak-complete">\u{1F451} \uBAA8\uB4E0 \uB9C8\uC77C\uC2A4\uD1A4 \uB2EC\uC131!</div>`}
      </div>
    `;
  },

  _renderMilestones(student) {
    const streak = student.streakDays || 0;

    let html = '<div class="cal-milestones"><h4>\u{1F3C6} \uCD9C\uC11D \uB9C8\uC77C\uC2A4\uD1A4</h4><div class="cal-milestone-list">';

    this.MILESTONES.forEach((m) => {
      const achieved = streak >= m.days;
      html += `
        <div class="cal-milestone ${achieved ? "achieved" : ""}">
          <span class="cal-milestone-icon">${m.icon}</span>
          <div class="cal-milestone-info">
            <span class="cal-milestone-label">${m.label}</span>
            <span class="cal-milestone-reward">${m.reward}</span>
          </div>
          <span class="cal-milestone-check">${achieved ? "\u2705" : "\u{1F512}"}</span>
        </div>
      `;
    });

    html += "</div></div>";
    return html;
  },
};
