// ============================================
// timer.js - 집중 타이머 (자습 모드)
// ============================================

const Timer = {
  PRESETS: [
    { minutes: 15, exp: 10, label: "15\uBD84" },
    { minutes: 25, exp: 18, label: "25\uBD84" },
    { minutes: 45, exp: 30, label: "45\uBD84" },
  ],

  _active: null,
  _interval: null,

  render(container) {
    const student = Storage.getCurrentStudent();
    if (!student) return;

    const today = new Date().toISOString().split("T")[0];
    const todaySessions = (student.focusSessions || []).filter((s) => s.date === today);
    const todayMinutes = todaySessions.reduce((sum, s) => sum + s.minutes, 0);

    if (this._active) {
      this._renderActive(container, student);
      return;
    }

    let html = `
      <div class="timer-screen">
        <h2>\u{1F3AF} \uC9D1\uC911 \uD0C0\uC774\uBA38</h2>
        <p class="text-muted">\uC790\uC2B5 \uC2DC\uAC04\uC744 \uC644\uB8CC\uD558\uBA74 EXP \uBCF4\uC0C1!</p>
        <div class="timer-today-stat">
          \uC624\uB298 \uC9D1\uC911: <strong>${todayMinutes}\uBD84</strong> (${todaySessions.length}\uD68C)
        </div>
        <div class="timer-presets">
    `;

    this.PRESETS.forEach((p) => {
      html += `
        <button class="timer-preset-btn" data-minutes="${p.minutes}">
          <span class="timer-preset-time">${p.label}</span>
          <span class="timer-preset-reward">+${p.exp} EXP</span>
        </button>
      `;
    });

    html += `
        </div>
      </div>
    `;
    container.innerHTML = html;

    container.querySelectorAll("[data-minutes]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const minutes = parseInt(btn.dataset.minutes);
        this._start(minutes, student, container);
      });
    });
  },

  _start(minutes, student, container) {
    const preset = this.PRESETS.find((p) => p.minutes === minutes);
    this._active = {
      totalSeconds: minutes * 60,
      remaining: minutes * 60,
      minutes,
      exp: preset ? preset.exp : Math.round(minutes * 0.6),
      startTime: Date.now(),
    };

    this._renderActive(container, student);

    this._interval = setInterval(() => {
      if (!this._active) return;
      this._active.remaining--;
      if (this._active.remaining <= 0) {
        this._complete(student, container);
      } else {
        this._updateDisplay();
      }
    }, 1000);
  },

  _renderActive(container, student) {
    const a = this._active;
    const min = Math.floor(a.remaining / 60);
    const sec = a.remaining % 60;
    const pct = Math.round(((a.totalSeconds - a.remaining) / a.totalSeconds) * 100);

    container.innerHTML = `
      <div class="timer-active">
        <h2>\u{1F3AF} \uC9D1\uC911 \uC911...</h2>
        <div class="timer-circle" id="timer-circle">
          <svg viewBox="0 0 120 120" width="180" height="180">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#F1F2F6" stroke-width="8"/>
            <circle cx="60" cy="60" r="54" fill="none" stroke="#6C5CE7" stroke-width="8"
                    stroke-dasharray="${54 * 2 * Math.PI}"
                    stroke-dashoffset="${54 * 2 * Math.PI * (1 - pct / 100)}"
                    stroke-linecap="round" transform="rotate(-90 60 60)" id="timer-ring"/>
          </svg>
          <div class="timer-time" id="timer-time">${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}</div>
        </div>
        <div class="timer-reward-info">\uC644\uB8CC \uBCF4\uC0C1: +${a.exp} EXP</div>
        <button class="btn btn-danger btn-small" id="timer-cancel">\uD3EC\uAE30\uD558\uAE30</button>
      </div>
    `;

    document.getElementById("timer-cancel")?.addEventListener("click", () => {
      if (confirm("\uC9D1\uC911\uC744 \uD3EC\uAE30\uD558\uBA74 \uBCF4\uC0C1\uC744 \uBC1B\uC744 \uC218 \uC5C6\uC5B4\uC694. \uD3EC\uAE30\uD560\uAE4C\uC694?")) {
        clearInterval(this._interval);
        this._active = null;
        this.render(container);
      }
    });
  },

  _updateDisplay() {
    const a = this._active;
    if (!a) return;
    const min = Math.floor(a.remaining / 60);
    const sec = a.remaining % 60;
    const pct = ((a.totalSeconds - a.remaining) / a.totalSeconds) * 100;

    const timeEl = document.getElementById("timer-time");
    const ringEl = document.getElementById("timer-ring");
    if (timeEl) timeEl.textContent = `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    if (ringEl) ringEl.setAttribute("stroke-dashoffset", 54 * 2 * Math.PI * (1 - pct / 100));
  },

  _complete(student, container) {
    clearInterval(this._interval);
    const exp = this._active.exp;
    const minutes = this._active.minutes;
    this._active = null;

    // Record session
    if (!student.focusSessions) student.focusSessions = [];
    student.focusSessions.push({ date: new Date().toISOString().split("T")[0], minutes, timestamp: Date.now() });
    // Keep last 90 days
    const cutoff = new Date(Date.now() - 90 * 86400000).toISOString().split("T")[0];
    student.focusSessions = student.focusSessions.filter((s) => s.date >= cutoff);

    Tamagotchi.addExp(student, exp);
    ClassPet.contribute(student.id, "mission");
    Storage.updateStudent(student);

    Sound.missionComplete();
    UI.showToast(`\u{1F389} ${minutes}\uBD84 \uC9D1\uC911 \uC644\uB8CC! +${exp} EXP`, "success", 3000);
    this.render(container);
  },

  // 관리자: 집중 통계
  renderAdmin(container) {
    const students = Storage.getStudents();
    const today = new Date().toISOString().split("T")[0];
    const weekStart = new Date(Date.now() - 6 * 86400000).toISOString().split("T")[0];

    let html = '<div class="admin-section"><h3>\u{1F3AF} \uC9D1\uC911 \uD0C0\uC774\uBA38 \uD1B5\uACC4</h3>';

    const stats = students.map((s) => {
      const sessions = (s.focusSessions || []).filter((f) => f.date >= weekStart);
      const todaySessions = sessions.filter((f) => f.date === today);
      return {
        name: s.name,
        weekTotal: sessions.reduce((sum, f) => sum + f.minutes, 0),
        weekCount: sessions.length,
        todayTotal: todaySessions.reduce((sum, f) => sum + f.minutes, 0),
      };
    }).sort((a, b) => b.weekTotal - a.weekTotal);

    html += '<div class="timer-admin-list">';
    stats.forEach((s) => {
      html += `
        <div class="timer-admin-row">
          <strong>${UI.esc(s.name)}</strong>
          <span>\uC624\uB298 ${s.todayTotal}\uBD84</span>
          <span>\uC8FC\uAC04 ${s.weekTotal}\uBD84 (${s.weekCount}\uD68C)</span>
        </div>
      `;
    });
    html += '</div></div>';
    container.innerHTML = html;
  },
};
