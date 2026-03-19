// ============================================
// classpet.js - 반 펫 (클래스 공동 돌봄)
// ============================================

const ClassPet = {
  _default() {
    return {
      name: "\uBC18 \uD3AB",
      level: 1,
      exp: 0,
      hunger: 100,
      happiness: 100,
      lastUpdate: Date.now(),
      todayContributions: {},
      totalContributions: {},
      goal: null,
      goalProgress: 0,
      appearance: "#A29BFE",
    };
  },

  get() {
    return Storage.get("class_pet", null);
  },

  save(pet) {
    Storage.set("class_pet", pet);
  },

  ensure() {
    let pet = this.get();
    if (!pet) return null;
    // Daily reset check
    const today = new Date().toISOString().split("T")[0];
    if (pet._lastDate !== today) {
      pet.todayContributions = {};
      pet._lastDate = today;
      this.save(pet);
    }
    // Gauge decay
    const hours = (Date.now() - pet.lastUpdate) / (1000 * 60 * 60);
    if (hours > 0.5) {
      pet.hunger = Math.max(0, pet.hunger - hours * 1.5);
      pet.happiness = Math.max(0, pet.happiness - hours * 1);
      pet.lastUpdate = Date.now();
      this.save(pet);
    }
    return pet;
  },

  // 학생이 기여 (출석/미션 완료 시 자동 호출)
  contribute(studentId, type) {
    const pet = this.ensure();
    if (!pet) return;

    if (!pet.todayContributions[studentId]) {
      pet.todayContributions[studentId] = [];
    }
    pet.todayContributions[studentId].push(type);

    if (!pet.totalContributions[studentId]) {
      pet.totalContributions[studentId] = 0;
    }
    pet.totalContributions[studentId]++;

    // 기여에 따른 효과
    if (type === "attendance") {
      pet.hunger = Math.min(100, pet.hunger + 5);
      pet.happiness = Math.min(100, pet.happiness + 3);
    } else if (type === "mission") {
      pet.hunger = Math.min(100, pet.hunger + 3);
      pet.happiness = Math.min(100, pet.happiness + 5);
      pet.exp += 2;
    } else if (type === "minigame") {
      pet.happiness = Math.min(100, pet.happiness + 4);
      pet.exp += 1;
    }

    // 레벨업 체크
    const needed = 20 + pet.level * 10;
    if (pet.exp >= needed) {
      pet.exp -= needed;
      pet.level++;
    }

    // 목표 진행
    if (pet.goal) {
      pet.goalProgress++;
      if (pet.goalProgress >= pet.goal.target) {
        pet.goal.completed = true;
      }
    }

    this.save(pet);
  },

  // 홈 화면 반 펫 상태 미니 위젯
  renderWidget() {
    const pet = this.ensure();
    if (!pet) return "";

    const hungerPct = Math.round(pet.hunger);
    const happyPct = Math.round(pet.happiness);
    const low = hungerPct < 30 || happyPct < 30;
    const goalHtml = pet.goal && !pet.goal.completed
      ? `<div class="cp-goal">\u{1F3AF} ${UI.esc(pet.goal.title)}: ${pet.goalProgress}/${pet.goal.target}</div>`
      : pet.goal && pet.goal.completed
      ? `<div class="cp-goal achieved">\u2705 \uBAA9\uD45C \uB2EC\uC131!</div>`
      : "";

    return `
      <div class="classpet-widget ${low ? "low" : ""}" id="classpet-widget">
        <div class="cp-header">
          <span class="cp-icon">\u{1F3EB}</span>
          <span class="cp-name">${UI.esc(pet.name)} Lv.${pet.level}</span>
        </div>
        <div class="cp-gauges">
          <div class="cp-gauge">
            <span>\u{1F35A}</span>
            <div class="cp-bar"><div class="cp-fill" style="width:${hungerPct}%;background:#FF6B6B"></div></div>
          </div>
          <div class="cp-gauge">
            <span>\u{1F60A}</span>
            <div class="cp-bar"><div class="cp-fill" style="width:${happyPct}%;background:#FDCB6E"></div></div>
          </div>
        </div>
        ${goalHtml}
      </div>
    `;
  },

  // 관리자: 반 펫 관리
  renderAdmin(container) {
    let pet = this.get();

    let html = '<div class="admin-section"><h3>\u{1F3EB} \uBC18 \uD3AB \uAD00\uB9AC</h3>';

    if (!pet) {
      html += `
        <p class="text-muted">\uBC18 \uD3AB\uC774 \uC544\uC9C1 \uC5C6\uC5B4\uC694. \uBC18 \uC804\uCCB4\uAC00 \uD568\uAED8 \uD0A4\uC6B0\uB294 \uD3AB\uC744 \uB9CC\uB4E4\uC5B4\uBCF4\uC138\uC694!</p>
        <button class="btn btn-primary" id="cp-create">\u{1F423} \uBC18 \uD3AB \uB9CC\uB4E4\uAE30</button>
      `;
      html += "</div>";
      container.innerHTML = html;

      document.getElementById("cp-create")?.addEventListener("click", async () => {
        const result = await UI.prompt("\uBC18 \uD3AB \uB9CC\uB4E4\uAE30", [
          { id: "name", label: "\uBC18 \uD3AB \uC774\uB984", placeholder: "\uC608: \uC6B0\uB9AC\uBC18 \uBB49\uBB49\uC774" },
        ]);
        if (result && result.name) {
          const newPet = this._default();
          newPet.name = result.name;
          newPet._lastDate = new Date().toISOString().split("T")[0];
          this.save(newPet);
          UI.showToast(`\uBC18 \uD3AB "${result.name}" \uD0C4\uC0DD!`, "success");
          this.renderAdmin(container);
        }
      });
      return;
    }

    pet = this.ensure();
    const students = Storage.getStudents();
    const today = new Date().toISOString().split("T")[0];

    // 오늘 기여한 학생 수
    const todayContributors = Object.keys(pet.todayContributions).length;

    html += `
      <div class="cp-admin-status">
        <div class="cp-admin-stat">
          <div class="cp-admin-value">${UI.esc(pet.name)}</div>
          <div class="cp-admin-label">Lv.${pet.level}</div>
        </div>
        <div class="cp-admin-stat">
          <div class="cp-admin-value">${todayContributors}/${students.length}</div>
          <div class="cp-admin-label">\uC624\uB298 \uCC38\uC5EC</div>
        </div>
        <div class="cp-admin-stat">
          <div class="cp-admin-value">${Math.round(pet.hunger)}%</div>
          <div class="cp-admin-label">\uBC30\uACE0\uD514</div>
        </div>
        <div class="cp-admin-stat">
          <div class="cp-admin-value">${Math.round(pet.happiness)}%</div>
          <div class="cp-admin-label">\uD589\uBCF5</div>
        </div>
      </div>
    `;

    // 목표 설정
    html += '<h4 style="margin-top:16px">\u{1F3AF} \uBC18 \uBAA9\uD45C</h4>';
    if (pet.goal && !pet.goal.completed) {
      html += `
        <div class="cp-goal-admin">
          <strong>${UI.esc(pet.goal.title)}</strong>
          <div class="cp-goal-bar-wrap">
            <div class="cp-goal-bar" style="width:${Math.min(100, Math.round(pet.goalProgress / pet.goal.target * 100))}%"></div>
          </div>
          <span>${pet.goalProgress} / ${pet.goal.target}</span>
          <button class="btn btn-small btn-danger" id="cp-clear-goal">\uC0AD\uC81C</button>
        </div>
      `;
    } else {
      if (pet.goal && pet.goal.completed) {
        html += '<p style="color:#00B894;font-weight:600">\u2705 \uBAA9\uD45C \uB2EC\uC131! \uC0C8 \uBAA9\uD45C\uB97C \uC124\uC815\uD558\uC138\uC694.</p>';
      }
      html += `<button class="btn btn-primary btn-small" id="cp-set-goal">\uBAA9\uD45C \uC124\uC815</button>`;
    }

    // 기여 랭킹
    html += '<h4 style="margin-top:16px">\u{1F4CA} \uAE30\uC5EC \uB7AD\uD0B9</h4><div class="cp-contrib-list">';
    const contribList = students.map((s) => ({
      name: s.name,
      count: pet.totalContributions[s.id] || 0,
      today: (pet.todayContributions[s.id] || []).length,
    })).sort((a, b) => b.count - a.count);

    contribList.forEach((c, i) => {
      const medal = i === 0 ? "\u{1F947}" : i === 1 ? "\u{1F948}" : i === 2 ? "\u{1F949}" : "";
      html += `
        <div class="cp-contrib-row">
          <span class="cp-contrib-rank">${medal || (i + 1)}</span>
          <span class="cp-contrib-name">${UI.esc(c.name)}</span>
          <span class="cp-contrib-today">\uC624\uB298 ${c.today}\uD68C</span>
          <span class="cp-contrib-total">\uCD1D ${c.count}\uD68C</span>
        </div>
      `;
    });
    html += "</div>";

    // 삭제
    html += `<div style="margin-top:20px"><button class="btn btn-danger btn-small" id="cp-delete">\uBC18 \uD3AB \uC0AD\uC81C</button></div>`;
    html += "</div>";
    container.innerHTML = html;

    // Events
    document.getElementById("cp-set-goal")?.addEventListener("click", async () => {
      const result = await UI.prompt("\uBC18 \uBAA9\uD45C \uC124\uC815", [
        { id: "title", label: "\uBAA9\uD45C \uC81C\uBAA9", placeholder: "\uC608: \uC774\uBC88 \uC8FC \uBBF8\uC158 50\uAC1C \uC644\uB8CC" },
        { id: "target", label: "\uBAA9\uD45C \uD69F\uC218", type: "number", value: "30" },
        { id: "reward", label: "\uBCF4\uC0C1 \uC124\uBA85", placeholder: "\uC608: \uC804\uCCB4 \uD559\uC0DD \uAC04\uC2DD\uC0C1\uC790 1\uD68C" },
      ]);
      if (result && result.title) {
        pet.goal = { title: result.title, target: parseInt(result.target) || 30, reward: result.reward || "", completed: false };
        pet.goalProgress = 0;
        this.save(pet);
        UI.showToast("\uBC18 \uBAA9\uD45C\uAC00 \uC124\uC815\uB418\uC5C8\uC5B4\uC694!", "success");
        this.renderAdmin(container);
      }
    });

    document.getElementById("cp-clear-goal")?.addEventListener("click", () => {
      pet.goal = null;
      pet.goalProgress = 0;
      this.save(pet);
      this.renderAdmin(container);
    });

    document.getElementById("cp-delete")?.addEventListener("click", async () => {
      const ok = await UI.confirm("\uBC18 \uD3AB \uC0AD\uC81C", "\uBC18 \uD3AB\uC744 \uC0AD\uC81C\uD560\uAE4C\uC694?");
      if (ok) {
        Storage.remove("class_pet");
        UI.showToast("\uBC18 \uD3AB\uC774 \uC0AD\uC81C\uB418\uC5C8\uC5B4\uC694", "info");
        this.renderAdmin(container);
      }
    });
  },
};
