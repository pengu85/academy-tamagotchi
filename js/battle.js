// ============================================
// battle.js - 학생 배틀 (능력치 기반 대결)
// ============================================

const Battle = {
  COST: 2, // 배틀 비용 (포인트)
  WIN_REWARD: 5,
  MAX_PER_DAY: 3,

  render(container) {
    const student = Storage.getCurrentStudent();
    if (!student) return;

    const today = new Date().toISOString().split("T")[0];
    if (student.lastBattleDate !== today) {
      student.battleToday = 0;
      student.lastBattleDate = today;
      Storage.updateStudent(student);
    }

    const remaining = this.MAX_PER_DAY - (student.battleToday || 0);
    const friends = Friend.getFriends(student);

    let html = `
      <div class="battle-screen">
        <h2>\u2694\uFE0F \uBC30\uD2C0</h2>
        <p class="text-muted">\uB2A5\uB825\uCE58 \uAE30\uBC18 \uB300\uACB0! \uC2B9\uB9AC\uD558\uBA74 +${this.WIN_REWARD}p</p>
        <div class="battle-info">
          <span>\uC624\uB298 \uB0A8\uC740 \uD69F\uC218: <strong>${remaining}\uD68C</strong></span>
          <span>\uBE44\uC6A9: ${this.COST}p / \uD68C</span>
        </div>
    `;

    if (remaining <= 0) {
      html += '<div class="battle-done">\uC624\uB298 \uBC30\uD2C0\uC744 \uBAA8\uB450 \uC18C\uC9C4\uD588\uC5B4\uC694! \uB0B4\uC77C \uB2E4\uC2DC \uB3C4\uC804!</div>';
    } else if (friends.length === 0) {
      html += '<div class="battle-done">\uBC30\uD2C0\uD560 \uCE5C\uAD6C\uAC00 \uC5C6\uC5B4\uC694. \uCE5C\uAD6C\uB97C \uCD94\uAC00\uD574\uBCF4\uC138\uC694!</div>';
    } else {
      html += '<div class="battle-opponents"><h3>\uB300\uC804 \uC0C1\uB300 \uC120\uD0DD</h3>';
      friends.forEach((f) => {
        Tamagotchi.ensureEvolution(f);
        const stats = f.tamagotchi.stats;
        const total = stats.str + stats.int + stats.cha + stats.sta;
        html += `
          <div class="battle-opponent" data-opponent="${f.id}">
            <div class="battle-opp-tama">${TamagotchiRenderer.render(f.tamagotchi, 60)}</div>
            <div class="battle-opp-info">
              <div class="battle-opp-name">${UI.esc(f.tamagotchi.name)} (${UI.esc(f.name)})</div>
              <div class="battle-opp-stats">Lv.${f.tamagotchi.level} | \uCD1D ${total}</div>
            </div>
            <button class="btn btn-small btn-primary" data-fight="${f.id}">\uB300\uC804!</button>
          </div>
        `;
      });
      html += '</div>';
    }

    // 전적
    const record = student.battleRecord || { wins: 0, losses: 0 };
    html += `
      <div class="battle-record">
        \u{1F3C6} \uC804\uC801: ${record.wins}\uC2B9 ${record.losses}\uD328
      </div>
    </div>`;

    container.innerHTML = html;

    container.querySelectorAll("[data-fight]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const opponent = Storage.getStudent(btn.dataset.fight);
        if (opponent) this._fight(student, opponent, container);
      });
    });
  },

  _fight(student, opponent, container) {
    if (student.tamagotchi.points < this.COST) {
      UI.showToast(`\uD3EC\uC778\uD2B8\uAC00 \uBD80\uC871\uD574\uC694! (${this.COST}p \uD544\uC694)`, "error");
      return;
    }

    student.tamagotchi.points -= this.COST;
    student.battleToday = (student.battleToday || 0) + 1;
    if (!student.battleRecord) student.battleRecord = { wins: 0, losses: 0 };

    // 배틀 로직: 랜덤 능력치 선택 + 주사위 보정
    const statKeys = ["str", "int", "cha", "sta"];
    const chosenStat = statKeys[Math.floor(Math.random() * statKeys.length)];
    const statLabels = { str: "\u{1F4AA} \uD798", int: "\u{1F9E0} \uC9C0\uB2A5", cha: "\u2728 \uB9E4\uB825", sta: "\u2764\uFE0F \uCCB4\uB825" };

    const myVal = student.tamagotchi.stats[chosenStat] + Math.floor(Math.random() * 5);
    const oppVal = opponent.tamagotchi.stats[chosenStat] + Math.floor(Math.random() * 5);
    const win = myVal >= oppVal;

    if (win) {
      student.battleRecord.wins++;
      student.tamagotchi.points += this.WIN_REWARD;
    } else {
      student.battleRecord.losses++;
    }
    Storage.updateStudent(student);

    // 결과 모달
    const resultHtml = `
      <div class="battle-result">
        <div class="battle-versus">
          <div class="battle-fighter">
            <div>${TamagotchiRenderer.render(student.tamagotchi, 80)}</div>
            <div class="battle-fighter-name">${UI.esc(student.tamagotchi.name)}</div>
            <div class="battle-fighter-val">${statLabels[chosenStat]}: ${myVal}</div>
          </div>
          <div class="battle-vs">VS</div>
          <div class="battle-fighter">
            <div>${TamagotchiRenderer.render(opponent.tamagotchi, 80)}</div>
            <div class="battle-fighter-name">${UI.esc(opponent.tamagotchi.name)}</div>
            <div class="battle-fighter-val">${statLabels[chosenStat]}: ${oppVal}</div>
          </div>
        </div>
        <div class="battle-stat-chosen">\uC624\uB298\uC758 \uB300\uACB0: ${statLabels[chosenStat]}</div>
        <div class="battle-outcome ${win ? 'win' : 'lose'}">
          ${win ? `\u{1F389} \uC2B9\uB9AC! +${this.WIN_REWARD}p` : '\u{1F614} \uD328\uBC30... \uB2E4\uC74C\uC5D4 \uC774\uAE38 \uC218 \uC788\uC5B4!'}
        </div>
      </div>
    `;

    UI.showModal("\u2694\uFE0F \uBC30\uD2C0 \uACB0\uACFC", resultHtml, [
      { text: "\uD655\uC778", class: "btn btn-primary", onClick: () => this.render(container) },
    ]);
  },
};
