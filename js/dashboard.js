// ============================================
// dashboard.js - 출석부 대시보드 + 학부모 리포트
// ============================================

const Dashboard = {
  // ============================================
  // 관리자 출석부 대시보드
  // ============================================

  renderAdmin(container) {
    const students = Storage.getStudents();
    const today = new Date().toISOString().split("T")[0];
    const weekStart = this._getWeekStart();

    // 통계 수집
    const stats = students.map((s) => {
      Care.ensure(s);
      Tamagotchi.ensureEvolution(s);
      const todayMissions = s.completedMissions.filter((c) => c.completedAt === today).length;
      const weekMissions = s.completedMissions.filter((c) => c.completedAt >= weekStart).length;
      const attendedToday = s.lastAttendance === today;
      const mood = calculateMood(s);
      const moodInfo = MOOD_STATES[mood] || MOOD_STATES.normal;

      return {
        student: s,
        attendedToday,
        todayMissions,
        weekMissions,
        mood,
        moodIcon: moodInfo.icon,
        isSick: s.care?.isSick || false,
      };
    });

    const totalStudents = students.length;
    const attendedCount = stats.filter((s) => s.attendedToday).length;
    const sickCount = stats.filter((s) => s.isSick).length;

    let html = `
      <div class="dashboard">
        <h3>출석부 대시보드</h3>
        <div class="dashboard-summary">
          <div class="summary-card">
            <div class="summary-value">${attendedCount}/${totalStudents}</div>
            <div class="summary-label">오늘 출석</div>
          </div>
          <div class="summary-card">
            <div class="summary-value">${sickCount}</div>
            <div class="summary-label">아픈 다마고치</div>
          </div>
          <div class="summary-card">
            <div class="summary-value">${today}</div>
            <div class="summary-label">오늘 날짜</div>
          </div>
        </div>

        <table class="dashboard-table">
          <thead>
            <tr>
              <th>학생</th>
              <th>다마고치</th>
              <th>Lv</th>
              <th>출석</th>
              <th>오늘</th>
              <th>주간</th>
              <th>연속</th>
              <th>상태</th>
              <th>리포트</th>
            </tr>
          </thead>
          <tbody>
    `;

    stats.forEach((s) => {
      html += `
        <tr class="${s.isSick ? 'row-sick' : ''}">
          <td><strong>${s.student.name}</strong></td>
          <td>${s.student.tamagotchi.name}</td>
          <td>${s.student.tamagotchi.level}</td>
          <td>${s.attendedToday ? '✅' : '❌'}</td>
          <td>${s.todayMissions}개</td>
          <td>${s.weekMissions}개</td>
          <td>${s.student.streakDays}일</td>
          <td>${s.moodIcon}${s.isSick ? '🤒' : ''}</td>
          <td><button class="btn btn-small btn-secondary" data-report-student="${s.student.id}">📄</button></td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = html;

    // 리포트 버튼
    container.querySelectorAll("[data-report-student]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const student = Storage.getStudent(btn.dataset.reportStudent);
        if (student) this.generateParentReport(student);
      });
    });
  },

  // ============================================
  // 학부모 주간 리포트 (PNG)
  // ============================================

  async generateParentReport(student) {
    Tamagotchi.ensureEvolution(student);
    Care.ensure(student);
    const mood = calculateMood(student);

    const canvas = document.createElement("canvas");
    canvas.width = 440;
    canvas.height = 700;
    const ctx = canvas.getContext("2d");

    // 배경
    ctx.fillStyle = "#FFFFFF";
    this._roundRect(ctx, 0, 0, 440, 700, 20);
    ctx.fill();

    // 헤더
    ctx.fillStyle = "#6C5CE7";
    this._roundRect(ctx, 0, 0, 440, 60, { tl: 20, tr: 20, bl: 0, br: 0 });
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.font = "bold 18px Pretendard, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`📊 ${Storage.getAcademyName()} 주간 리포트`, 220, 38);

    // 학생 정보
    ctx.fillStyle = "#2D3436";
    ctx.font = "bold 20px Pretendard, sans-serif";
    ctx.fillText(`${student.name} 학생`, 220, 95);

    // 다마고치 SVG
    const svgStr = TamagotchiRenderer.render(student.tamagotchi, 140, mood);
    try {
      await this._drawSvg(ctx, svgStr, 150, 110, 140, 140);
    } catch (e) { /* skip */ }

    // 다마고치 이름/레벨
    ctx.fillStyle = "#6C5CE7";
    ctx.font = "600 16px Pretendard, sans-serif";
    const evo = student.tamagotchi.evolution || {};
    let evoText = evo.stageName || "어린이";
    if (evo.finalForm && FINAL_FORMS[evo.finalForm]) {
      evoText = FINAL_FORMS[evo.finalForm].name;
    }
    ctx.fillText(`${student.tamagotchi.name} | Lv.${student.tamagotchi.level} | ${evoText}`, 220, 270);

    // 구분선
    ctx.strokeStyle = "#DFE6E9";
    ctx.lineWidth = 1;
    this._line(ctx, 30, 285, 410, 285);

    // 주간 통계
    const weekStart = this._getWeekStart();
    const weekMissions = student.completedMissions.filter((c) => c.completedAt >= weekStart);
    const moodInfo = MOOD_STATES[mood] || MOOD_STATES.normal;

    ctx.fillStyle = "#2D3436";
    ctx.font = "bold 16px Pretendard, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("이번 주 활동", 30, 315);

    ctx.font = "14px Pretendard, sans-serif";
    ctx.fillStyle = "#636E72";

    const rows = [
      [`📋 완료한 미션`, `${weekMissions.length}개`],
      [`🔥 연속 출석`, `${student.streakDays}일`],
      [`🧮 미니게임 만점`, `${student.perfectMinigames || 0}회`],
      [`${moodInfo.icon} 현재 기분`, moodInfo.name],
      [`🏅 획득한 업적`, `${(student.badges || []).length}/${BADGES.length}개`],
    ];

    rows.forEach((row, i) => {
      const y = 345 + i * 30;
      ctx.fillStyle = "#2D3436";
      ctx.textAlign = "left";
      ctx.fillText(row[0], 40, y);
      ctx.fillStyle = "#6C5CE7";
      ctx.font = "bold 14px Pretendard, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(row[1], 400, y);
      ctx.font = "14px Pretendard, sans-serif";
    });

    // 구분선
    this._line(ctx, 30, 505, 410, 505);

    // 능력치
    ctx.fillStyle = "#2D3436";
    ctx.font = "bold 16px Pretendard, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("능력치", 30, 535);

    const stats = student.tamagotchi.stats;
    const statItems = [
      { label: "💪 힘", value: stats.str },
      { label: "🧠 지능", value: stats.int },
      { label: "✨ 매력", value: stats.cha },
      { label: "❤️ 체력", value: stats.sta },
    ];

    statItems.forEach((s, i) => {
      const x = 40 + i * 100;
      ctx.fillStyle = "#636E72";
      ctx.font = "12px Pretendard, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(s.label, x + 30, 560);
      ctx.fillStyle = "#6C5CE7";
      ctx.font = "bold 18px Pretendard, sans-serif";
      ctx.fillText(s.value, x + 30, 585);
    });

    // 돌봄 게이지
    this._line(ctx, 30, 605, 410, 605);
    ctx.fillStyle = "#2D3436";
    ctx.font = "bold 16px Pretendard, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("돌봄 상태", 30, 635);

    const careItems = [
      { label: "🍚 배고픔", value: Math.round(student.care.hunger) },
      { label: "🛁 청결", value: Math.round(student.care.clean) },
      { label: "🎮 행복", value: Math.round(student.care.fun) },
    ];

    careItems.forEach((c, i) => {
      const x = 40 + i * 130;
      ctx.fillStyle = "#636E72";
      ctx.font = "12px Pretendard, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(c.label, x + 45, 655);
      ctx.fillStyle = c.value < 30 ? "#E74C3C" : "#2D3436";
      ctx.font = "bold 16px Pretendard, sans-serif";
      ctx.fillText(`${c.value}%`, x + 45, 675);
    });

    // 하단 날짜
    ctx.fillStyle = "#B2BEC3";
    ctx.font = "11px Pretendard, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${weekStart} ~ ${new Date().toISOString().split("T")[0]} | ${Storage.getAcademyName()}`, 220, 695);

    // 다운로드
    const link = document.createElement("a");
    link.download = `${student.name}_주간리포트.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();

    UI.showToast(`${student.name} 학생 리포트 저장 완료!`, "success");
  },

  _getWeekStart() {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split("T")[0];
  },

  _drawSvg(ctx, svgStr, x, y, w, h) {
    return new Promise((resolve, reject) => {
      const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => { ctx.drawImage(img, x, y, w, h); URL.revokeObjectURL(url); resolve(); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(); };
      img.src = url;
    });
  },

  _roundRect(ctx, x, y, w, h, r) {
    if (typeof r === "number") r = { tl: r, tr: r, bl: r, br: r };
    ctx.beginPath();
    ctx.moveTo(x + r.tl, y);
    ctx.lineTo(x + w - r.tr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r.tr);
    ctx.lineTo(x + w, y + h - r.br);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
    ctx.lineTo(x + r.bl, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r.bl);
    ctx.lineTo(x, y + r.tl);
    ctx.quadraticCurveTo(x, y, x + r.tl, y);
    ctx.closePath();
  },

  _line(ctx, x1, y1, x2, y2) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  },
};
