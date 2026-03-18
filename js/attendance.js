// ============================================
// attendance.js - 출결 통계 그래프 (Canvas 기반)
// ============================================

const Attendance = {
  renderAdmin(container) {
    const students = Storage.getStudents();

    container.innerHTML = `
      <div class="admin-section">
        <h3>출결 통계</h3>
        <div class="att-tabs">
          <button class="att-tab active" data-att="weekly">주간</button>
          <button class="att-tab" data-att="monthly">월간</button>
          <button class="att-tab" data-att="missions">미션 현황</button>
        </div>
        <div class="att-chart-wrap">
          <canvas id="att-chart" width="400" height="250"></canvas>
        </div>
        <div class="att-details" id="att-details"></div>
      </div>
    `;

    this._renderChart("weekly", students);

    container.querySelectorAll(".att-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        container.querySelectorAll(".att-tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        this._renderChart(tab.dataset.att, students);
      });
    });
  },

  _renderChart(type, students) {
    const canvas = document.getElementById("att-chart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    if (type === "weekly") this._drawWeeklyChart(ctx, W, H, students);
    if (type === "monthly") this._drawMonthlyChart(ctx, W, H, students);
    if (type === "missions") this._drawMissionChart(ctx, W, H, students);
  },

  // 주간 출석률 막대 그래프 (최근 7일)
  _drawWeeklyChart(ctx, W, H, students) {
    const days = [];
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = d.toISOString().split("T")[0];
      const attended = students.filter((s) => s.lastAttendance === dateStr || s.completedMissions.some((c) => c.completedAt === dateStr)).length;
      days.push({
        label: dayNames[d.getDay()],
        date: dateStr.slice(5),
        count: attended,
        rate: students.length > 0 ? Math.round((attended / students.length) * 100) : 0,
      });
    }

    this._drawBarChart(ctx, W, H, days, "주간 출석률", "%", true);

    // 상세 정보
    const details = document.getElementById("att-details");
    if (details) {
      const avgRate = days.length > 0 ? Math.round(days.reduce((s, d) => s + d.rate, 0) / days.length) : 0;
      details.innerHTML = `
        <div class="att-summary">
          <span>주간 평균 출석률: <strong>${avgRate}%</strong></span>
          <span>총 학생 수: <strong>${students.length}명</strong></span>
        </div>
      `;
    }
  },

  // 월간 출석률 (최근 4주)
  _drawMonthlyChart(ctx, W, H, students) {
    const weeks = [];
    for (let w = 3; w >= 0; w--) {
      const weekStart = new Date(Date.now() - (w * 7 + 6) * 86400000);
      const weekEnd = new Date(Date.now() - w * 7 * 86400000);
      const startStr = weekStart.toISOString().split("T")[0];
      const endStr = weekEnd.toISOString().split("T")[0];

      let totalAttendDays = 0;
      students.forEach((s) => {
        const attended = s.completedMissions.filter((c) => c.completedAt >= startStr && c.completedAt <= endStr);
        const uniqueDays = new Set(attended.map((c) => c.completedAt));
        totalAttendDays += uniqueDays.size;
      });

      const maxDays = students.length * 7;
      const rate = maxDays > 0 ? Math.round((totalAttendDays / maxDays) * 100) : 0;

      weeks.push({
        label: `${4 - w}주차`,
        date: startStr.slice(5),
        count: totalAttendDays,
        rate,
      });
    }

    this._drawBarChart(ctx, W, H, weeks, "월간 출석률 (4주)", "%", true);

    const details = document.getElementById("att-details");
    if (details) {
      const avgRate = weeks.length > 0 ? Math.round(weeks.reduce((s, w) => s + w.rate, 0) / weeks.length) : 0;
      details.innerHTML = `<div class="att-summary"><span>월간 평균 출석률: <strong>${avgRate}%</strong></span></div>`;
    }
  },

  // 학생별 미션 현황 (횡 막대)
  _drawMissionChart(ctx, W, H, students) {
    const padding = { top: 30, right: 20, bottom: 20, left: 80 };
    const chartW = W - padding.left - padding.right;
    const chartH = H - padding.top - padding.bottom;

    // 제목
    ctx.fillStyle = "#2D3436";
    ctx.font = "bold 13px Pretendard, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("학생별 주간 미션 완료 수", W / 2, 18);

    const weekStart = new Date(Date.now() - 6 * 86400000).toISOString().split("T")[0];
    const data = students.map((s) => ({
      name: s.name,
      count: s.completedMissions.filter((c) => c.completedAt >= weekStart).length,
    })).sort((a, b) => b.count - a.count).slice(0, 10);

    if (data.length === 0) {
      ctx.fillStyle = "#636E72";
      ctx.font = "12px Pretendard, sans-serif";
      ctx.fillText("데이터가 없어요", W / 2, H / 2);
      return;
    }

    const maxVal = Math.max(...data.map((d) => d.count), 1);
    const barH = Math.min(20, (chartH - 10) / data.length - 4);

    data.forEach((d, i) => {
      const y = padding.top + i * (barH + 4);
      const barW = (d.count / maxVal) * chartW;

      // 이름
      ctx.fillStyle = "#2D3436";
      ctx.font = "11px Pretendard, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(d.name, padding.left - 8, y + barH / 2 + 4);

      // 막대
      ctx.fillStyle = "#6C5CE7";
      ctx.beginPath();
      ctx.roundRect(padding.left, y, Math.max(barW, 2), barH, 3);
      ctx.fill();

      // 값
      ctx.fillStyle = "#636E72";
      ctx.textAlign = "left";
      ctx.font = "bold 10px Pretendard, sans-serif";
      ctx.fillText(`${d.count}개`, padding.left + barW + 6, y + barH / 2 + 4);
    });

    const details = document.getElementById("att-details");
    if (details) {
      const total = data.reduce((s, d) => s + d.count, 0);
      details.innerHTML = `<div class="att-summary"><span>주간 총 미션 완료: <strong>${total}개</strong></span></div>`;
    }
  },

  // 공통 막대 그래프 그리기
  _drawBarChart(ctx, W, H, data, title, unit, showRate) {
    const padding = { top: 35, right: 15, bottom: 40, left: 40 };
    const chartW = W - padding.left - padding.right;
    const chartH = H - padding.top - padding.bottom;

    // 제목
    ctx.fillStyle = "#2D3436";
    ctx.font = "bold 13px Pretendard, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(title, W / 2, 18);

    if (data.length === 0) return;

    const maxVal = 100; // 출석률은 100% 기준
    const barW = Math.min(40, (chartW / data.length) - 10);

    // Y축 눈금
    ctx.strokeStyle = "#DFE6E9";
    ctx.lineWidth = 0.5;
    ctx.fillStyle = "#636E72";
    ctx.font = "10px Pretendard, sans-serif";
    ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + chartH - (chartH * i / 4);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(W - padding.right, y);
      ctx.stroke();
      ctx.fillText(`${i * 25}${unit}`, padding.left - 5, y + 4);
    }

    // 막대
    data.forEach((d, i) => {
      const x = padding.left + (chartW / data.length) * i + (chartW / data.length - barW) / 2;
      const barH = (d.rate / maxVal) * chartH;
      const y = padding.top + chartH - barH;

      // 그라데이션
      const grad = ctx.createLinearGradient(x, y, x, y + barH);
      grad.addColorStop(0, "#6C5CE7");
      grad.addColorStop(1, "#A29BFE");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
      ctx.fill();

      // 값
      ctx.fillStyle = "#6C5CE7";
      ctx.font = "bold 10px Pretendard, sans-serif";
      ctx.textAlign = "center";
      if (d.rate > 0) ctx.fillText(`${d.rate}${unit}`, x + barW / 2, y - 5);

      // 라벨
      ctx.fillStyle = "#636E72";
      ctx.font = "10px Pretendard, sans-serif";
      ctx.fillText(d.label, x + barW / 2, H - padding.bottom + 14);
      ctx.fillStyle = "#B2BEC3";
      ctx.font = "8px Pretendard, sans-serif";
      ctx.fillText(d.date, x + barW / 2, H - padding.bottom + 26);
    });
  },
};

// Canvas roundRect 폴리필
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (typeof r === "number") r = [r, r, r, r];
    if (!Array.isArray(r)) r = [0, 0, 0, 0];
    this.moveTo(x + r[0], y);
    this.lineTo(x + w - r[1], y);
    this.quadraticCurveTo(x + w, y, x + w, y + r[1]);
    this.lineTo(x + w, y + h - r[2]);
    this.quadraticCurveTo(x + w, y + h, x + w - r[2], y + h);
    this.lineTo(x + r[3], y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r[3]);
    this.lineTo(x, y + r[0]);
    this.quadraticCurveTo(x, y, x + r[0], y);
    this.closePath();
  };
}
