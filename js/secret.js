// ============================================
// secret.js - 비밀 진화 + 비밀 상점 + 랜덤 이벤트
// ============================================

const Secret = {
  // ============================================
  // 비밀 진화
  // ============================================

  // 비밀 진화 체크
  checkSecretEvolution(student) {
    if (student.secretForm) return null; // 이미 비밀 진화함
    if (student.tamagotchi.level < 15) return null; // 최종 진화 이후만

    for (const [key, evo] of Object.entries(SECRET_EVOLUTIONS)) {
      if (evo.condition(student)) {
        student.secretForm = key;
        student.tamagotchi.evolution.finalForm = key;
        student.tamagotchi.evolution.stageName = evo.name;
        Storage.updateStudent(student);
        return { key, ...evo };
      }
    }
    return null;
  },

  // 비밀 진화 힌트 (조건에 가까운 것)
  getHints(student) {
    if (student.secretForm) return [];
    const hints = [];

    for (const [key, evo] of Object.entries(SECRET_EVOLUTIONS)) {
      // 간단한 근접도 체크
      if (key === "math_king" && (student.perfectMinigames || 0) >= 10) {
        hints.push(evo.hint);
      }
      if (key === "phoenix" && (student.care?.recoveredCount || 0) >= 1) {
        hints.push(evo.hint);
      }
      if (key === "legend" && student.tamagotchi.level >= 15) {
        hints.push(evo.hint);
      }
    }
    return hints;
  },

  // 비밀 진화 모달
  showSecretEvolution(evo, student) {
    UI.showModal(`${evo.icon} 비밀 진화!`, `
      <div class="secret-evo-modal">
        <div class="secret-evo-character">${TamagotchiRenderer.render(student.tamagotchi, 160, "excited")}</div>
        <div class="secret-evo-name">${evo.name}</div>
        <div class="secret-evo-desc">${evo.description}</div>
      </div>
    `, [{ text: "대단해!", class: "btn btn-primary" }]);
  },

  // 도감용: 비밀 진화 목록
  renderSecretDex(student) {
    let html = '<h4 style="margin-top:12px">비밀 진화</h4><div class="dex-grid">';

    Object.entries(SECRET_EVOLUTIONS).forEach(([key, evo]) => {
      const unlocked = student.secretForm === key;
      html += `
        <div class="dex-item ${unlocked ? '' : 'locked'}">
          <div class="dex-stage">${unlocked ? evo.icon : '❓'} 비밀</div>
          <div class="dex-character">
            ${unlocked
              ? `<div style="font-size:2.5rem">${evo.icon}</div>`
              : `<div class="dex-silhouette">?</div>`
            }
          </div>
          <div class="dex-name">${unlocked ? evo.name : '???'}</div>
          <div class="dex-level">${unlocked ? evo.description : '비밀 조건'}</div>
          <div class="dex-status">${unlocked ? '✅' : '🔒'}</div>
        </div>
      `;
    });

    html += '</div>';
    return html;
  },

  // ============================================
  // 비밀 상점 (일일 할인)
  // ============================================

  getDailyDeal() {
    const items = Storage.getItems() || [];
    if (items.length === 0) return null;

    // 날짜 기반 시드로 매일 다른 아이템
    const today = new Date().toISOString().split("T")[0];
    const seed = today.split("-").reduce((a, b) => a + parseInt(b), 0);
    const idx = seed % items.length;
    const item = items[idx];

    return {
      ...item,
      originalCost: item.cost,
      discountCost: Math.ceil(item.cost * 0.5),
      discount: 50,
    };
  },

  renderDailyDeal(student) {
    const deal = this.getDailyDeal();
    if (!deal) return "";

    const owned = student.tamagotchi.ownedItems.includes(deal.id);
    const canBuy = !owned && student.tamagotchi.points >= deal.discountCost && student.tamagotchi.level >= deal.unlockLevel;

    return `
      <div class="daily-deal">
        <div class="deal-header">🏷️ 오늘의 할인</div>
        <div class="deal-item">
          <span class="deal-name">${deal.name}</span>
          <span class="deal-price"><s>${deal.originalCost}p</s> → <strong>${deal.discountCost}p</strong></span>
          ${owned ? '<span class="deal-owned">보유중</span>' :
            canBuy ? `<button class="btn btn-small btn-primary" id="buy-deal">구매</button>` :
            '<span class="deal-locked">구매 불가</span>'}
        </div>
      </div>
    `;
  },

  buyDailyDeal(student) {
    const deal = this.getDailyDeal();
    if (!deal) return false;
    if (student.tamagotchi.ownedItems.includes(deal.id)) return false;
    if (student.tamagotchi.points < deal.discountCost) return false;

    student.tamagotchi.points -= deal.discountCost;
    student.tamagotchi.ownedItems.push(deal.id);
    Storage.updateStudent(student);
    return true;
  },

  // ============================================
  // 행운의 룰렛
  // ============================================

  canSpin(student) {
    // 연속출석 7일마다 (7, 14, 21...)
    if (student.streakDays <= 0) return false;
    if (student.streakDays % 7 !== 0) return false;
    // 이미 이 streak에서 돌렸는지
    return (student.lastRouletteStreak || 0) < student.streakDays;
  },

  spin(student) {
    if (!this.canSpin(student)) return null;

    // 가중치 기반 랜덤
    const totalWeight = ROULETTE_REWARDS.reduce((sum, r) => sum + r.weight, 0);
    let rand = Math.random() * totalWeight;
    let reward = ROULETTE_REWARDS[0];

    for (const r of ROULETTE_REWARDS) {
      rand -= r.weight;
      if (rand <= 0) { reward = r; break; }
    }

    // 보상 적용
    switch (reward.type) {
      case "points":
        student.tamagotchi.points += reward.value;
        break;
      case "exp":
        Tamagotchi.addExp(student, reward.value);
        break;
      case "snackBox":
        student.snackBoxChances += reward.value;
        break;
      case "careHunger":
        Care.ensure(student);
        student.care.hunger = Math.min(100, student.care.hunger + reward.value);
        break;
    }

    student.lastRouletteStreak = student.streakDays;
    Storage.updateStudent(student);
    return reward;
  },

  renderRoulette(student) {
    if (!this.canSpin(student)) return "";
    return `
      <div class="roulette-available">
        <button class="btn btn-primary roulette-btn" id="spin-roulette">🎰 행운의 룰렛 (연속출석 ${student.streakDays}일 보상!)</button>
      </div>
    `;
  },

  // ============================================
  // 깜짝 이벤트 (미션 완료 시 10% 확률)
  // ============================================

  rollBonusTreasure(student) {
    if (Math.random() > 0.10) return null; // 10% 확률

    const bonus = Math.floor(Math.random() * 5) + 3; // 3~7p
    student.tamagotchi.points += bonus;
    student.totalBonusFound = (student.totalBonusFound || 0) + 1;
    Storage.updateStudent(student);
    return bonus;
  },
};
