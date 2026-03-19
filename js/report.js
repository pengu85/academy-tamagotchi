// ============================================
// report.js - 성장 리포트 카드
// ============================================

const Report = {
  // Show interactive report modal for student
  showMyReport(student) {
    Tamagotchi.ensureEvolution(student);
    Care.ensure(student);

    const weekStart = this._getWeekStart();
    const lastWeekStart = this._getWeekStart(7);

    // This week vs last week missions
    const thisWeekMissions = student.completedMissions.filter((c) => c.completedAt >= weekStart);
    const lastWeekMissions = student.completedMissions.filter((c) => c.completedAt >= lastWeekStart && c.completedAt < weekStart);

    // Mission type breakdown
    const missions = Storage.getMissions() || [];
    const typeCount = { attendance: 0, homework: 0, exam: 0, special: 0 };
    thisWeekMissions.forEach((cm) => {
      const m = missions.find((x) => x.id === cm.missionId);
      if (m && typeCount[m.type] !== undefined) typeCount[m.type]++;
    });

    // Growth comparison
    const missionDiff = thisWeekMissions.length - lastWeekMissions.length;
    const missionDiffText = missionDiff > 0 ? `\u25B2 ${missionDiff}` : missionDiff < 0 ? `\u25BC ${Math.abs(missionDiff)}` : "\u2192 \uB3D9\uC77C";
    const missionDiffClass = missionDiff > 0 ? "positive" : missionDiff < 0 ? "negative" : "neutral";

    // Mood summary
    let moodSummaryHtml = "";
    if (student.moodHistory && student.moodHistory.length > 0) {
      const weekMoods = student.moodHistory.filter((m) => m.date >= weekStart);
      if (weekMoods.length > 0) {
        const moodCounts = {};
        weekMoods.forEach((m) => {
          moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1;
        });
        const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
        const moodInfo = Mood.MOODS.find((m) => m.id === topMood[0]);
        if (moodInfo) {
          moodSummaryHtml = `
            <div class="report-mood-summary">
              <span class="report-mood-emoji">${moodInfo.emoji}</span>
              <span>\uC774\uBC88 \uC8FC \uAC00\uC7A5 \uB9CE\uC740 \uAE30\uBD84: <strong>${moodInfo.label}</strong> (${topMood[1]}\uC77C)</span>
            </div>
          `;
        }
      }
    }

    // Badge progress
    const totalBadges = BADGES.length;
    const earnedBadges = (student.badges || []).length;

    const tama = student.tamagotchi;
    const evo = tama.evolution || {};
    let evoLabel = evo.stageName || "\uC5B4\uB9B0\uC774";
    if (evo.finalForm && FINAL_FORMS[evo.finalForm]) {
      evoLabel = FINAL_FORMS[evo.finalForm].icon + " " + FINAL_FORMS[evo.finalForm].name;
    }

    const expPercent = Tamagotchi.getExpPercent(student);
    const expToNext = Tamagotchi.getExpToNext(student);

    const html = `
      <div class="report-modal">
        <div class="report-hero">
          <div class="report-tama">
            ${TamagotchiRenderer.render(tama, 120, calculateMood(student))}
          </div>
          <div class="report-hero-info">
            <div class="report-tama-name">${UI.esc(tama.name)}</div>
            <div class="report-level">Lv.${tama.level} \u00B7 ${evoLabel}</div>
            <div class="report-exp-mini">
              <div class="report-exp-bar"><div class="report-exp-fill" style="width:${expPercent}%"></div></div>
              <span class="report-exp-text">${tama.exp}/${expToNext}</span>
            </div>
          </div>
        </div>

        <div class="report-section">
          <h4>\u{1F4CA} \uC774\uBC88 \uC8FC \uD65C\uB3D9</h4>
          <div class="report-stats-grid">
            <div class="report-stat-card">
              <div class="report-stat-value">${thisWeekMissions.length}<span class="report-stat-unit">\uAC1C</span></div>
              <div class="report-stat-label">\uBBF8\uC158 \uC644\uB8CC</div>
              <div class="report-stat-diff ${missionDiffClass}">\uC9C0\uB09C\uC8FC \uB300\uBE44 ${missionDiffText}</div>
            </div>
            <div class="report-stat-card">
              <div class="report-stat-value">${student.streakDays}<span class="report-stat-unit">\uC77C</span></div>
              <div class="report-stat-label">\uC5F0\uC18D \uCD9C\uC11D</div>
            </div>
          </div>
          <div class="report-type-breakdown">
            <span class="report-type-chip">\u{1F4CB} \uCD9C\uC11D ${typeCount.attendance}</span>
            <span class="report-type-chip">\u{1F4DD} \uACFC\uC81C ${typeCount.homework}</span>
            <span class="report-type-chip">\u{1F4CA} \uC2DC\uD5D8 ${typeCount.exam}</span>
            <span class="report-type-chip">\u2B50 \uD2B9\uBCC4 ${typeCount.special}</span>
          </div>
        </div>

        ${moodSummaryHtml}

        <div class="report-section">
          <h4>\u{1F4AA} \uB2A5\uB825\uCE58</h4>
          <div class="report-stats-bars">
            ${this._renderStatBar("\u{1F4AA} \uD798", tama.stats.str, "#E74C3C")}
            ${this._renderStatBar("\u{1F9E0} \uC9C0\uB2A5", tama.stats.int, "#3498DB")}
            ${this._renderStatBar("\u2728 \uB9E4\uB825", tama.stats.cha, "#F39C12")}
            ${this._renderStatBar("\u2764\uFE0F \uCCB4\uB825", tama.stats.sta, "#27AE60")}
          </div>
        </div>

        <div class="report-section">
          <h4>\u{1F3C5} \uC5C5\uC801 \uC9C4\uD589</h4>
          <div class="report-badge-progress">
            <div class="report-badge-bar-wrap">
              <div class="report-badge-bar" style="width: ${Math.round((earnedBadges / totalBadges) * 100)}%"></div>
            </div>
            <span class="report-badge-text">${earnedBadges} / ${totalBadges}</span>
          </div>
        </div>

        <div class="report-actions">
          <button class="btn btn-primary" id="report-download-btn">\u{1F4E5} \uC774\uBBF8\uC9C0\uB85C \uC800\uC7A5 (\uD559\uBD80\uBAA8 \uACF5\uC720\uC6A9)</button>
        </div>
      </div>
    `;

    UI.showModal(`\u{1F4CA} ${student.name}\uC758 \uC131\uC7A5 \uB9AC\uD3EC\uD2B8`, html, [{ text: "\uB2EB\uAE30", class: "btn btn-secondary" }]);

    setTimeout(() => {
      document.getElementById("report-download-btn")?.addEventListener("click", () => {
        Dashboard.generateParentReport(student);
      });
    }, 100);
  },

  _renderStatBar(label, value, color) {
    const maxStat = 20;
    const pct = Math.min(Math.round((value / maxStat) * 100), 100);
    return `
      <div class="report-stat-bar-row">
        <span class="report-stat-bar-label">${label}</span>
        <div class="report-stat-bar-track">
          <div class="report-stat-bar-fill" style="width: ${pct}%; background: ${color}"></div>
        </div>
        <span class="report-stat-bar-value">${value}</span>
      </div>
    `;
  },

  _getWeekStart(offsetDays = 0) {
    const d = new Date(Date.now() - offsetDays * 86400000);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split("T")[0];
  },

  // Admin: render report management
  renderAdmin(container) {
    const students = Storage.getStudents();
    const weekStart = this._getWeekStart();

    let html = `
      <div class="admin-section">
        <h3>\u{1F4CA} \uC131\uC7A5 \uB9AC\uD3EC\uD2B8</h3>
        <p class="text-muted">\uD559\uC0DD\uBCC4 \uC8FC\uAC04 \uB9AC\uD3EC\uD2B8\uB97C \uC0DD\uC131\uD558\uC5EC \uD559\uBD80\uBAA8\uC5D0\uAC8C \uACF5\uC720\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.</p>
        <div class="report-bulk-actions">
          <button class="btn btn-primary" id="report-bulk-btn">\u{1F4E5} \uC804\uCCB4 \uD559\uC0DD \uB9AC\uD3EC\uD2B8 \uC77C\uAD04 \uB2E4\uC6B4\uB85C\uB4DC</button>
        </div>
        <div class="report-student-list">
    `;

    students.forEach((s) => {
      Tamagotchi.ensureEvolution(s);
      const weekMissions = s.completedMissions.filter((c) => c.completedAt >= weekStart).length;
      const todayMood = Mood.getTodayMood(s);
      html += `
        <div class="report-student-row">
          <div class="report-student-info">
            <strong>${UI.esc(s.name)}</strong>
            <span class="text-muted">Lv.${s.tamagotchi.level} \u00B7 \uC8FC\uAC04 \uBBF8\uC158 ${weekMissions}\uAC1C \u00B7 \uC5F0\uC18D\uCD9C\uC11D ${s.streakDays}\uC77C</span>
          </div>
          <div class="report-student-actions">
            ${todayMood ? `<span class="mood-badge-small">${todayMood.emoji}</span>` : ""}
            <button class="btn btn-small btn-secondary" data-view-report="${s.id}">\u{1F441}\uFE0F</button>
            <button class="btn btn-small btn-primary" data-dl-report="${s.id}">\u{1F4E5}</button>
          </div>
        </div>
      `;
    });

    html += `</div></div>`;
    container.innerHTML = html;

    // Bulk download
    document.getElementById("report-bulk-btn")?.addEventListener("click", async () => {
      UI.showToast("\uB9AC\uD3EC\uD2B8 \uC0DD\uC131 \uC911...", "info");
      for (const s of students) {
        await Dashboard.generateParentReport(s);
        await new Promise((r) => setTimeout(r, 500));
      }
      UI.showToast(`${students.length}\uBA85 \uB9AC\uD3EC\uD2B8 \uC800\uC7A5 \uC644\uB8CC!`, "success");
    });

    // Individual view
    container.querySelectorAll("[data-view-report]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const student = Storage.getStudent(btn.dataset.viewReport);
        if (student) Report.showMyReport(student);
      });
    });

    // Individual download
    container.querySelectorAll("[data-dl-report]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const student = Storage.getStudent(btn.dataset.dlReport);
        if (student) Dashboard.generateParentReport(student);
      });
    });
  },
};
