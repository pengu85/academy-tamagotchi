// ============================================
// collection.js - 아이템 도감 + 희귀도 시스템
// ============================================

const Collection = {
  // 아이템 희귀도 매핑
  RARITY: {
    // 모자
    hat_crown:    "epic",
    hat_cap:      "common",
    hat_ribbon:   "common",
    hat_wizard:   "rare",
    hat_santa:    "rare",
    hat_flower:   "common",
    // 악세서리
    acc_glasses:  "common",
    acc_necklace: "rare",
    acc_wings:    "epic",
    acc_cape:     "rare",
    acc_bow:      "common",
    // 배경
    bg_space:     "rare",
    bg_ocean:     "rare",
    bg_forest:    "rare",
    // 특수효과
    fx_sparkle:   "epic",
    fx_halo:      "epic",
    fx_fire:      "legendary",
  },

  // 색상/눈 스타일도 도감에 포함
  COLOR_RARITY: {
    yellow: "common", red: "common", blue: "common", green: "common",
    pink: "rare", purple: "rare", sky: "rare", orange: "common",
  },

  EYE_RARITY: {
    default: "common", sparkle: "rare", sleepy: "common", angry: "rare", heart: "epic",
  },

  // 계절 아이템은 전부 legendary
  SEASONAL_RARITY: "legendary",

  RARITY_INFO: {
    common:    { name: "\uC77C\uBC18",  color: "#B2BEC3", bgColor: "#F8F9FA", stars: 1 },
    rare:      { name: "\uB808\uC5B4",  color: "#6C5CE7", bgColor: "#F8F5FF", stars: 2 },
    epic:      { name: "\uC5D0\uD53D",  color: "#E17055", bgColor: "#FFF3E0", stars: 3 },
    legendary: { name: "\uC804\uC124",  color: "#F1C40F", bgColor: "#FFF9DB", stars: 4 },
  },

  getRarity(itemId) {
    if (this.RARITY[itemId]) return this.RARITY[itemId];
    if (itemId.startsWith("color_")) return this.COLOR_RARITY[itemId.replace("color_", "")] || "common";
    if (itemId.startsWith("eye_")) return this.EYE_RARITY[itemId.replace("eye_", "")] || "common";
    if (itemId.startsWith("season_")) return this.SEASONAL_RARITY;
    return "common";
  },

  getRarityInfo(itemId) {
    return this.RARITY_INFO[this.getRarity(itemId)] || this.RARITY_INFO.common;
  },

  // 전체 수집 가능 아이템 수
  getTotalItems() {
    const items = Storage.getItems() || [];
    const colors = BODY_COLORS.filter((c) => c.cost > 0);
    const eyes = EYE_STYLES.filter((e) => e.cost > 0);
    // 계절 아이템은 현재 시즌만
    const season = getCurrentSeason();
    const seasonal = SEASONAL_ITEMS[season.key] || [];
    return items.length + colors.length + eyes.length + seasonal.length;
  },

  // 학생이 보유한 아이템 수
  getOwnedCount(student) {
    const tama = student.tamagotchi;
    const items = Storage.getItems() || [];
    let count = 0;
    items.forEach((i) => { if (tama.ownedItems.includes(i.id)) count++; });
    BODY_COLORS.filter((c) => c.cost > 0).forEach((c) => { if (tama.ownedItems.includes("color_" + c.id)) count++; });
    EYE_STYLES.filter((e) => e.cost > 0).forEach((e) => { if (tama.ownedItems.includes("eye_" + e.id)) count++; });
    const season = getCurrentSeason();
    (SEASONAL_ITEMS[season.key] || []).forEach((s) => {
      if (tama.ownedItems.includes(s.id) || (student.house?.ownedDecor || []).includes(s.id)) count++;
    });
    return count;
  },

  // 도감 모달 표시
  show(student) {
    const tama = student.tamagotchi;
    const items = Storage.getItems() || [];
    const total = this.getTotalItems();
    const owned = this.getOwnedCount(student);
    const pct = total > 0 ? Math.round((owned / total) * 100) : 0;

    let html = `
      <div class="coll-header">
        <div class="coll-progress-wrap">
          <div class="coll-progress-bar"><div class="coll-progress-fill" style="width:${pct}%"></div></div>
          <span class="coll-progress-text">${owned} / ${total} (${pct}%)</span>
        </div>
      </div>
    `;

    // 카테고리별 표시
    const categories = [
      { label: "\u{1F451} \uBAA8\uC790", items: items.filter((i) => i.category === "hat") },
      { label: "\u{1F48E} \uC545\uC138\uC11C\uB9AC", items: items.filter((i) => i.category === "accessory") },
      { label: "\u{1F30C} \uBC30\uACBD", items: items.filter((i) => i.category === "background") },
      { label: "\u2728 \uD2B9\uC218\uD6A8\uACFC", items: items.filter((i) => i.category === "effect") },
    ];

    categories.forEach((cat) => {
      html += `<h4 class="coll-cat-title">${cat.label}</h4><div class="coll-grid">`;
      cat.items.forEach((item) => {
        const isOwned = tama.ownedItems.includes(item.id);
        const rarity = this.getRarityInfo(item.id);
        html += this._renderCard(item.name, Shop._getItemEmoji(item), isOwned, rarity);
      });
      html += "</div>";
    });

    // 색상
    html += `<h4 class="coll-cat-title">\u{1F3A8} \uC0C9\uC0C1</h4><div class="coll-grid">`;
    BODY_COLORS.filter((c) => c.cost > 0).forEach((c) => {
      const isOwned = tama.ownedItems.includes("color_" + c.id);
      const rarity = this.RARITY_INFO[this.COLOR_RARITY[c.id] || "common"];
      html += `
        <div class="coll-card ${isOwned ? "" : "locked"}">
          <div class="coll-card-icon"><div class="coll-color-swatch" style="background:${c.hex}"></div></div>
          <div class="coll-card-name">${c.name}</div>
          <div class="coll-rarity" style="color:${rarity.color}">${"\u2605".repeat(rarity.stars)}</div>
        </div>
      `;
    });
    html += "</div>";

    // 눈 스타일
    html += `<h4 class="coll-cat-title">\u{1F440} \uB208 \uC2A4\uD0C0\uC77C</h4><div class="coll-grid">`;
    EYE_STYLES.filter((e) => e.cost > 0).forEach((e) => {
      const isOwned = tama.ownedItems.includes("eye_" + e.id);
      const rarity = this.RARITY_INFO[this.EYE_RARITY[e.id] || "common"];
      html += this._renderCard(e.name, "\u{1F441}\uFE0F", isOwned, rarity);
    });
    html += "</div>";

    // 계절 한정
    const season = getCurrentSeason();
    const seasonal = SEASONAL_ITEMS[season.key] || [];
    if (seasonal.length > 0) {
      html += `<h4 class="coll-cat-title">${season.icon} ${season.name} \uD55C\uC815</h4><div class="coll-grid">`;
      seasonal.forEach((s) => {
        const isOwned = tama.ownedItems.includes(s.id) || (student.house?.ownedDecor || []).includes(s.id);
        const rarity = this.RARITY_INFO.legendary;
        html += this._renderCard(s.name, s.type === "wallpaper" ? "\u{1F3A8}" : "\u{1F452}", isOwned, rarity);
      });
      html += "</div>";
    }

    UI.showModal("\u{1F4D6} \uC544\uC774\uD15C \uB3C4\uAC10", html, [{ text: "\uB2EB\uAE30", class: "btn btn-secondary" }]);
  },

  _renderCard(name, icon, isOwned, rarity) {
    return `
      <div class="coll-card ${isOwned ? "" : "locked"}" style="${isOwned ? `border-color:${rarity.color}` : ""}">
        <div class="coll-card-icon">${isOwned ? icon : "\u2753"}</div>
        <div class="coll-card-name">${isOwned ? name : "???"}</div>
        <div class="coll-rarity" style="color:${rarity.color}">${"\u2605".repeat(rarity.stars)}</div>
      </div>
    `;
  },
};
