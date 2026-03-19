// ============================================
// lootbox.js - 미션 완료 후 랜덤 보상 카드 뽑기
// ============================================

const Lootbox = {
  RARITIES: [
    { id: "common",    name: "\uC77C\uBC18",  color: "#B2BEC3", bgColor: "#F8F9FA", chance: 55, icon: "\u25CF" },
    { id: "rare",      name: "\uB808\uC5B4",  color: "#6C5CE7", bgColor: "#F8F5FF", chance: 25, icon: "\u25C6" },
    { id: "epic",      name: "\uC5D0\uD53D",  color: "#E17055", bgColor: "#FFF3E0", chance: 15, icon: "\u2605" },
    { id: "legendary", name: "\uC804\uC124",  color: "#F1C40F", bgColor: "#FFF9DB", chance: 5,  icon: "\u2728" },
  ],

  REWARDS: {
    common: [
      { name: "+3p \uD3EC\uC778\uD2B8", type: "points", value: 3 },
      { name: "+5 EXP", type: "exp", value: 5 },
      { name: "\uBC30\uACE0\uD514 +10", type: "hunger", value: 10 },
      { name: "\uD589\uBCF5 +10", type: "fun", value: 10 },
    ],
    rare: [
      { name: "+8p \uD3EC\uC778\uD2B8", type: "points", value: 8 },
      { name: "+15 EXP", type: "exp", value: 15 },
      { name: "\uCCAD\uACB0 \uD480\uD68C\uBCF5", type: "clean", value: 100 },
      { name: "\uBC30\uACE0\uD514 \uD480\uD68C\uBCF5", type: "hunger", value: 100 },
    ],
    epic: [
      { name: "+20p \uD3EC\uC778\uD2B8", type: "points", value: 20 },
      { name: "+30 EXP", type: "exp", value: 30 },
      { name: "\uAC04\uC2DD\uC0C1\uC790 1\uD68C", type: "snackBox", value: 1 },
    ],
    legendary: [
      { name: "+50p \uD3EC\uC778\uD2B8!", type: "points", value: 50 },
      { name: "+50 EXP!", type: "exp", value: 50 },
      { name: "\uAC04\uC2DD\uC0C1\uC790 2\uD68C!", type: "snackBox", value: 2 },
      { name: "\uC804\uCCB4 \uAC8C\uC774\uC9C0 \uD480\uD68C\uBCF5!", type: "fullRestore", value: 100 },
    ],
  },

  // 랜덤 등급 뽑기
  _rollRarity() {
    const roll = Math.random() * 100;
    let cumulative = 0;
    for (const r of this.RARITIES) {
      cumulative += r.chance;
      if (roll < cumulative) return r;
    }
    return this.RARITIES[0];
  },

  // 보상 적용
  _applyReward(student, reward) {
    Care.ensure(student);
    switch (reward.type) {
      case "points":
        student.tamagotchi.points += reward.value;
        break;
      case "exp":
        const expResult = Tamagotchi.addExp(student, reward.value);
        if (expResult.levelUps && expResult.levelUps.length > 0) {
          setTimeout(() => {
            Sound.levelUp();
            expResult.levelUps.forEach((lu) => UI.showLevelUp(lu.level, lu.reward));
          }, 2500);
        }
        break;
      case "snackBox":
        student.snackBoxChances += reward.value;
        student.totalSnackBoxEarned = (student.totalSnackBoxEarned || 0) + reward.value;
        break;
      case "hunger":
        student.care.hunger = Math.min(100, student.care.hunger + reward.value);
        break;
      case "clean":
        student.care.clean = Math.min(100, student.care.clean + reward.value);
        break;
      case "fun":
        student.care.fun = Math.min(100, student.care.fun + reward.value);
        break;
      case "fullRestore":
        student.care.hunger = 100;
        student.care.clean = 100;
        student.care.fun = 100;
        break;
    }
    Storage.updateStudent(student);
  },

  // 카드 뽑기 모달 표시
  showDraw(student) {
    // 기존 오버레이 제거
    document.querySelectorAll(".loot-overlay").forEach((el) => el.remove());

    const rarity = this._rollRarity();
    const rewards = this.REWARDS[rarity.id];
    const reward = rewards[Math.floor(Math.random() * rewards.length)];

    const overlay = document.createElement("div");
    overlay.className = "loot-overlay";
    overlay.innerHTML = `
      <div class="loot-card-wrapper">
        <div class="loot-card back">
          <div class="loot-card-back">
            <div class="loot-card-back-icon">\u2753</div>
            <div class="loot-card-back-text">\uD0ED\uD574\uC11C \uC5F4\uAE30!</div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add("active"));

    const card = overlay.querySelector(".loot-card");
    let flipped = false;

    const doFlip = () => {
      if (flipped) return;
      flipped = true;
      card.classList.remove("back");
      card.classList.add("flipped");

      card.innerHTML = `
        <div class="loot-card-front" style="background:${rarity.bgColor};border-color:${rarity.color}">
          <div class="loot-rarity" style="color:${rarity.color}">${rarity.icon} ${rarity.name}</div>
          <div class="loot-reward-icon">\u{1F381}</div>
          <div class="loot-reward-name">${reward.name}</div>
          <div class="loot-reward-desc">\uBBF8\uC158 \uBCF4\uB108\uC2A4 \uD68D\uB4DD!</div>
        </div>
      `;

      // Apply reward (레벨업/진화 알림 포함)
      this._applyReward(student, reward);

      setTimeout(() => {
        overlay.classList.remove("active");
        setTimeout(() => overlay.remove(), 300);
      }, 2200);
    };

    card.addEventListener("click", doFlip, { once: true });

    // 자동 닫기: 6초 후 클릭 안 하면 자동 뒤집기
    setTimeout(() => doFlip(), 6000);
  },
};
