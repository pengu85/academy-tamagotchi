// ============================================
// shop.js - 아이템 구매, 외형 변경, 능력치 배분
// ============================================

const Shop = {
  currentTab: "items",

  render(container) {
    const student = Storage.getCurrentStudent();
    if (!student) return;

    container.innerHTML = `
      <div class="shop-header">
        <h2>🛒 상점</h2>
        <span class="points-display">💰 ${student.tamagotchi.points}p</span>
      </div>
      <div class="shop-tabs">
        <button class="shop-tab ${this.currentTab === 'items' ? 'active' : ''}" data-tab="items">아이템 구매</button>
        <button class="shop-tab ${this.currentTab === 'customize' ? 'active' : ''}" data-tab="customize">외형 변경</button>
        <button class="shop-tab ${this.currentTab === 'stats' ? 'active' : ''}" data-tab="stats">능력치 배분</button>
      </div>
      <div class="shop-content" id="shop-content"></div>
    `;

    container.querySelectorAll(".shop-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        this.currentTab = tab.dataset.tab;
        this.render(container);
      });
    });

    const content = container.querySelector("#shop-content");
    switch (this.currentTab) {
      case "items": this._renderItems(content, student); break;
      case "customize": this._renderCustomize(content, student); break;
      case "stats": this._renderStats(content, student); break;
    }
  },

  _renderItems(container, student) {
    const items = Storage.getItems() || [];
    const categories = [
      { key: "hat", label: "모자" },
      { key: "accessory", label: "악세서리" },
      { key: "background", label: "배경" },
      { key: "effect", label: "특수효과" },
    ];

    let html = '<div class="item-categories">';
    categories.forEach((cat) => {
      const catItems = items.filter((i) => i.category === cat.key);
      html += `<h3>${cat.label}</h3><div class="item-grid">`;
      catItems.forEach((item) => {
        const owned = student.tamagotchi.ownedItems.includes(item.id);
        const locked = student.tamagotchi.level < item.unlockLevel;
        const canBuy = !owned && !locked && student.tamagotchi.points >= item.cost;
        html += `
          <div class="item-card ${owned ? 'owned' : ''} ${locked ? 'locked' : ''}">
            <div class="item-icon">${this._getItemEmoji(item)}</div>
            <div class="item-name">${item.name}</div>
            ${locked ? `<div class="item-price">🔒 Lv.${item.unlockLevel}</div>` :
              owned ? `<div class="item-price owned-label">보유중</div>` :
              `<div class="item-price">${item.cost}p</div>`}
            ${!owned && !locked ? `<button class="btn btn-small ${canBuy ? 'btn-primary' : 'btn-disabled'}"
              data-item="${item.id}" ${!canBuy ? 'disabled' : ''}>구매</button>` : ''}
          </div>
        `;
      });
      html += '</div>';
    });
    html += '</div>';
    container.innerHTML = html;

    container.querySelectorAll("[data-item]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const result = Tamagotchi.buyItem(student, btn.dataset.item);
        UI.showToast(result.message, result.success ? "success" : "error");
        if (result.success) this.render(container.closest(".tab-content"));
      });
    });
  },

  _renderCustomize(container, student) {
    const tama = student.tamagotchi;
    let html = '<div class="customize-section">';

    // 미리보기
    html += `<div class="customize-preview" id="customize-preview">
      ${TamagotchiRenderer.render(tama)}
    </div>`;

    // 몸 색상
    html += '<h3>몸 색상</h3><div class="color-grid">';
    BODY_COLORS.forEach((color) => {
      const owned = color.cost === 0 || tama.ownedItems.includes("color_" + color.id);
      const active = tama.appearance.bodyColor === color.hex;
      const locked = tama.level < 4 && color.cost > 0;
      html += `
        <button class="color-btn ${active ? 'active' : ''} ${locked ? 'locked' : ''}"
                style="background-color: ${color.hex}"
                data-color="${color.id}"
                title="${color.name}${!owned && !locked ? ` (${color.cost}p)` : ''}${locked ? ' (Lv.4 해금)' : ''}"
                ${locked ? 'disabled' : ''}>
          ${active ? '✓' : ''}
        </button>
      `;
    });
    html += '</div>';

    // 눈 스타일
    html += '<h3>눈 스타일</h3><div class="style-grid">';
    EYE_STYLES.forEach((style) => {
      const owned = style.cost === 0 || tama.ownedItems.includes("eye_" + style.id);
      const active = tama.appearance.eyeStyle === style.id;
      const locked = tama.level < 3 && style.cost > 0;
      html += `
        <button class="style-btn ${active ? 'active' : ''} ${locked ? 'locked' : ''}"
                data-eye="${style.id}"
                ${locked ? 'disabled' : ''}>
          ${style.name}${!owned && !locked ? ` (${style.cost}p)` : ''}${locked ? ' 🔒' : ''}
        </button>
      `;
    });
    html += '</div>';

    // 장착 아이템
    const equipped = tama.appearance;
    const ownedItems = (Storage.getItems() || []).filter((i) => tama.ownedItems.includes(i.id));

    ["hat", "accessory", "background", "effect"].forEach((cat) => {
      const catItems = ownedItems.filter((i) => i.category === cat);
      if (catItems.length === 0) return;
      const labels = { hat: "모자", accessory: "악세서리", background: "배경", effect: "특수효과" };
      html += `<h3>${labels[cat]} 장착</h3><div class="equip-grid">`;
      catItems.forEach((item) => {
        const isEquipped = equipped[cat] === item.imageData;
        html += `
          <button class="equip-btn ${isEquipped ? 'equipped' : ''}"
                  data-equip-cat="${cat}" data-equip-val="${item.imageData}">
            ${this._getItemEmoji(item)} ${item.name} ${isEquipped ? '✓' : ''}
          </button>
        `;
      });
      html += '</div>';
    });

    html += '</div>';
    container.innerHTML = html;

    // 색상 변경 이벤트
    container.querySelectorAll("[data-color]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const result = Tamagotchi.changeBodyColor(student, btn.dataset.color);
        if (!result) {
          UI.showToast("포인트가 부족해요!", "error");
        }
        this.render(container.closest(".tab-content"));
        App.renderHome();
      });
    });

    // 눈 스타일 변경 이벤트
    container.querySelectorAll("[data-eye]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const result = Tamagotchi.changeEyeStyle(student, btn.dataset.eye);
        if (!result) {
          UI.showToast("포인트가 부족하거나 레벨이 부족해요!", "error");
        }
        this.render(container.closest(".tab-content"));
        App.renderHome();
      });
    });

    // 장착 이벤트
    container.querySelectorAll("[data-equip-cat]").forEach((btn) => {
      btn.addEventListener("click", () => {
        Tamagotchi.equipItem(student, btn.dataset.equipCat, btn.dataset.equipVal);
        this.render(container.closest(".tab-content"));
        App.renderHome();
      });
    });
  },

  _renderStats(container, student) {
    const stats = student.tamagotchi.stats;
    const statInfo = [
      { key: "str", name: "힘 (STR)",   icon: "💪", desc: "경연대회 '파워' 부문" },
      { key: "int", name: "지능 (INT)",  icon: "🧠", desc: "경험치 보너스 +2%/포인트" },
      { key: "cha", name: "매력 (CHA)",  icon: "✨", desc: "경연대회 '인기' 부문 보너스" },
      { key: "sta", name: "체력 (STA)",  icon: "❤️", desc: "연속 출석 7일 간식상자" },
    ];

    let html = `
      <div class="stats-section">
        <div class="stats-points">💰 보유 포인트: <strong>${student.tamagotchi.points}p</strong> | 능력치 1당 ${STAT_COST}p</div>
    `;

    statInfo.forEach((s) => {
      const val = stats[s.key];
      const maxBar = 20;
      const percent = Math.min(100, (val / maxBar) * 100);
      const canBuy = student.tamagotchi.points >= STAT_COST;
      html += `
        <div class="stat-row">
          <div class="stat-info">
            <span class="stat-icon">${s.icon}</span>
            <span class="stat-name">${s.name}</span>
            <span class="stat-desc">${s.desc}</span>
          </div>
          <div class="stat-bar-container">
            <div class="stat-bar" style="width: ${percent}%"></div>
          </div>
          <span class="stat-value">${val}</span>
          <button class="btn btn-small ${canBuy ? 'btn-primary' : 'btn-disabled'}"
                  data-stat="${s.key}" ${!canBuy ? 'disabled' : ''}>+1 (${STAT_COST}p)</button>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;

    container.querySelectorAll("[data-stat]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const result = Tamagotchi.addStat(student, btn.dataset.stat);
        if (result) {
          UI.showToast(`${btn.dataset.stat.toUpperCase()} +1!`, "success");
          this.render(container.closest(".tab-content"));
        } else {
          UI.showToast("포인트가 부족해요!", "error");
        }
      });
    });
  },

  _getItemEmoji(item) {
    const emojis = {
      crown: "👑", cap: "🧢", headband: "🎀", wizard: "🧙", santa: "🎅", flower: "🌸",
      glasses: "👓", necklace: "📿", wings: "🪽", cape: "🦸", bow: "🎀",
      space: "🌌", ocean: "🌊", forest: "🌲",
      sparkle: "✨", halo: "😇", fire: "🔥",
    };
    return emojis[item.imageData] || "📦";
  },
};
