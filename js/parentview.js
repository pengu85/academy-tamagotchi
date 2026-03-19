// ============================================
// parentview.js - 학부모 전용 열람 뷰
// ============================================

const ParentView = {
  PIN_KEY: "atg_parent_pin",

  getPin() { return Storage.get("parent_pin", null); },
  setPin(pin) { Storage.set("parent_pin", pin); },

  renderLogin(container) {
    const hasPin = !!this.getPin();

    container.innerHTML = `
      <div class="admin-login">
        <h2>\u{1F468}\u200D\u{1F469}\u200D\u{1F467} \uD559\uBD80\uBAA8 \uBAA8\uB4DC</h2>
        <p>${hasPin ? '\uD559\uBD80\uBAA8 PIN\uC744 \uC785\uB825\uD558\uC138\uC694' : '\uC120\uC0DD\uB2D8\uC774 \uD559\uBD80\uBAA8 PIN\uC744 \uC124\uC815\uD558\uC9C0 \uC54A\uC558\uC5B4\uC694'}</p>
        ${hasPin ? `
          <input type="password" id="parent-pin" maxlength="4" placeholder="PIN 4\uC790\uB9AC" class="pin-input">
          <button class="btn btn-primary" id="parent-login-btn">\uD655\uC778</button>
        ` : '<p class="text-muted">\uC120\uC0DD\uB2D8 \uBAA8\uB4DC \u2192 \uC124\uC815\uC5D0\uC11C PIN\uC744 \uC124\uC815\uD574\uC8FC\uC138\uC694</p>'}
        <button class="btn btn-secondary btn-small" id="parent-back" style="margin-top:12px">\uB3CC\uC544\uAC00\uAE30</button>
      </div>
    `;

    document.getElementById("parent-back")?.addEventListener("click", () => App.switchTab("home"));

    if (hasPin) {
      const loginBtn = document.getElementById("parent-login-btn");
      const pinInput = document.getElementById("parent-pin");
      const doLogin = () => {
        if (pinInput.value === this.getPin()) {
          this._renderDashboard(container);
        } else {
          UI.showToast("PIN\uC774 \uD2C0\uB838\uC5B4\uC694!", "error");
          pinInput.value = "";
        }
      };
      loginBtn?.addEventListener("click", doLogin);
      pinInput?.addEventListener("keyup", (e) => { if (e.key === "Enter") doLogin(); });
    }
  },

  _renderDashboard(container) {
    const students = Storage.getStudents();
    const today = new Date().toISOString().split("T")[0];
    const weekStart = new Date(Date.now() - 6 * 86400000).toISOString().split("T")[0];

    let html = `
      <div class="parent-view">
        <div class="parent-header">
          <h2>\u{1F468}\u200D\u{1F469}\u200D\u{1F467} \uD559\uBD80\uBAA8 \uB300\uC2DC\uBCF4\uB4DC</h2>
          <button class="btn btn-small btn-secondary" id="parent-logout">\uB098\uAC00\uAE30</button>
        </div>
        <p class="text-muted">\uD559\uC0DD\uC744 \uC120\uD0DD\uD558\uBA74 \uC0C1\uC138 \uB9AC\uD3EC\uD2B8\uB97C \uBCFC \uC218 \uC788\uC5B4\uC694.</p>
        <div class="parent-student-list">
    `;

    students.forEach((s) => {
      Tamagotchi.ensureEvolution(s);
      const weekMissions = s.completedMissions.filter((c) => c.completedAt >= weekStart).length;
      const todayMood = Mood.getTodayMood(s);
      html += `
        <div class="parent-student-card" data-parent-report="${s.id}">
          <div class="parent-student-tama">${TamagotchiRenderer.render(s.tamagotchi, 50)}</div>
          <div class="parent-student-info">
            <strong>${UI.esc(s.name)}</strong>
            <span>Lv.${s.tamagotchi.level} | \uC8FC\uAC04 ${weekMissions}\uBBF8\uC158 | \uCD9C\uC11D ${s.streakDays}\uC77C</span>
          </div>
          ${todayMood ? `<span class="parent-mood">${todayMood.emoji}</span>` : ''}
        </div>
      `;
    });

    html += '</div></div>';
    container.innerHTML = html;

    document.getElementById("parent-logout")?.addEventListener("click", () => App.switchTab("home"));
    container.querySelectorAll("[data-parent-report]").forEach((el) => {
      el.addEventListener("click", () => {
        const student = Storage.getStudent(el.dataset.parentReport);
        if (student) Report.showMyReport(student);
      });
    });
  },
};
