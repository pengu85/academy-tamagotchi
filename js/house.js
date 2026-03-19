// ============================================
// house.js - 다마고치 하우스 (방 꾸미기)
// ============================================

const House = {
  ensure(student) {
    if (!student.house) {
      student.house = { wallpaper: "default", floor: "default", furniture: [], ownedDecor: [] };
    }
  },

  render(container) {
    const student = Storage.getCurrentStudent();
    if (!student) return;
    this.ensure(student);

    const house = student.house;
    const season = getCurrentSeason();

    container.innerHTML = `
      <div class="house-screen">
        <div class="house-header">
          <h2>🏠 ${UI.esc(student.tamagotchi.name)}의 방</h2>
          <span class="points-display">💰 ${student.tamagotchi.points}p</span>
        </div>

        <div class="house-preview" id="house-preview">
          ${this._renderRoom(student)}
        </div>

        <div class="house-tabs">
          <button class="house-tab active" data-htab="wallpaper">벽지</button>
          <button class="house-tab" data-htab="floor">바닥</button>
          <button class="house-tab" data-htab="furniture">가구</button>
          <button class="house-tab" data-htab="seasonal">계절 ${season.icon}</button>
        </div>
        <div class="house-shop" id="house-shop"></div>
      </div>
    `;

    this._renderShop("wallpaper", student, container);

    container.querySelectorAll(".house-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        container.querySelectorAll(".house-tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        this._renderShop(tab.dataset.htab, student, container);
      });
    });
  },

  _renderRoom(student) {
    this.ensure(student);
    const house = student.house;
    const wall = HOUSE_WALLPAPERS.find((w) => w.id === house.wallpaper)
      || this._findSeasonalWall(house.wallpaper)
      || HOUSE_WALLPAPERS[0];
    const floor = HOUSE_FLOORS.find((f) => f.id === house.floor) || HOUSE_FLOORS[0];
    const mood = calculateMood(student);

    // 방 SVG 렌더링
    let furnitureHtml = "";
    const positions = [
      { x: 15, y: 70 }, { x: 250, y: 70 }, { x: 15, y: 130 },
      { x: 250, y: 130 }, { x: 130, y: 180 }, { x: 15, y: 20 },
      { x: 250, y: 20 }, { x: 130, y: 20 }, { x: 70, y: 180 }, { x: 200, y: 180 },
    ];

    house.furniture.forEach((fId, i) => {
      const fur = HOUSE_FURNITURE.find((f) => f.id === fId);
      if (fur && i < positions.length) {
        const pos = positions[i];
        furnitureHtml += `<div class="room-furniture" style="left:${pos.x}px;top:${pos.y}px">${fur.icon}</div>`;
      }
    });

    // 벽지 패턴
    const patternClass = wall.pattern !== "none" ? `pattern-${wall.pattern}` : "";

    return `
      <div class="room-container">
        <div class="room-wall ${patternClass}" style="background-color: ${wall.color}">
          <div class="room-floor" style="background-color: ${floor.color}"></div>
          <div class="room-tama">
            ${TamagotchiRenderer.render(student.tamagotchi, 100, mood)}
          </div>
          ${furnitureHtml}
        </div>
      </div>
    `;
  },

  _findSeasonalWall(wallId) {
    for (const items of Object.values(SEASONAL_ITEMS)) {
      const found = items.find((i) => i.type === "wallpaper" && i.id === wallId);
      if (found) return { id: found.id, name: found.name, color: found.color, pattern: found.pattern, cost: 0 };
    }
    return null;
  },

  _renderShop(tab, student, container) {
    const shop = container.querySelector("#house-shop");
    this.ensure(student);
    const house = student.house;
    let html = "";

    if (tab === "wallpaper") {
      html = '<div class="decor-grid">';
      HOUSE_WALLPAPERS.forEach((w) => {
        const active = house.wallpaper === w.id;
        const owned = w.cost === 0 || house.ownedDecor.includes("wall_" + w.id);
        const canBuy = !owned && student.tamagotchi.points >= w.cost;
        html += `
          <div class="decor-card ${active ? 'equipped' : ''}" data-wall="${w.id}">
            <div class="decor-swatch" style="background-color: ${w.color}"></div>
            <div class="decor-name">${w.name}</div>
            ${owned || w.cost === 0 ? `<div class="decor-status">${active ? '사용중' : '적용'}</div>` :
              `<div class="decor-price">${w.cost}p</div>`}
          </div>
        `;
      });
      // 보유 중인 계절 벽지도 표시
      Object.values(SEASONAL_ITEMS).flat().filter((i) => i.type === "wallpaper").forEach((sw) => {
        if (house.ownedDecor.includes(sw.id)) {
          const active = house.wallpaper === sw.id;
          html += `
            <div class="decor-card ${active ? 'equipped' : ''}" data-wall="${sw.id}">
              <div class="decor-swatch" style="background-color: ${sw.color}">
                <span style="font-size:1.2rem">${getCurrentSeason().icon}</span>
              </div>
              <div class="decor-name">${sw.name}</div>
              <div class="decor-status">${active ? '사용중' : '적용'}</div>
            </div>
          `;
        }
      });
      html += '</div>';
    }

    if (tab === "floor") {
      html = '<div class="decor-grid">';
      HOUSE_FLOORS.forEach((f) => {
        const active = house.floor === f.id;
        const owned = f.cost === 0 || house.ownedDecor.includes("floor_" + f.id);
        html += `
          <div class="decor-card ${active ? 'equipped' : ''}" data-floor="${f.id}">
            <div class="decor-swatch" style="background-color: ${f.color}"></div>
            <div class="decor-name">${f.name}</div>
            ${owned || f.cost === 0 ? `<div class="decor-status">${active ? '사용중' : '적용'}</div>` :
              `<div class="decor-price">${f.cost}p</div>`}
          </div>
        `;
      });
      html += '</div>';
    }

    if (tab === "furniture") {
      html = '<div class="decor-grid">';
      HOUSE_FURNITURE.forEach((f) => {
        const owned = house.ownedDecor.includes(f.id);
        const placed = house.furniture.includes(f.id);
        const canBuy = !owned && student.tamagotchi.points >= f.cost;
        html += `
          <div class="decor-card ${placed ? 'equipped' : ''}" data-fur="${f.id}">
            <div class="decor-icon">${f.icon}</div>
            <div class="decor-name">${f.name}</div>
            ${owned ? `<div class="decor-status">${placed ? '배치됨' : '배치하기'}</div>` :
              `<div class="decor-price ${canBuy ? '' : 'insufficient'}">${f.cost}p</div>`}
          </div>
        `;
      });
      html += '</div>';
    }

    if (tab === "seasonal") {
      const season = getCurrentSeason();
      const items = SEASONAL_ITEMS[season.key] || [];
      html = `<div class="season-banner" style="background: ${season.bgColor}; border-color: ${season.accent}">
        <span>${season.icon} ${season.name} 시즌! 한정 아이템을 무료로 받으세요!</span>
      </div><div class="decor-grid">`;
      items.forEach((item) => {
        const owned = student.tamagotchi.ownedItems.includes(item.id) || house.ownedDecor.includes(item.id);
        html += `
          <div class="decor-card ${owned ? 'equipped' : ''}" data-season="${item.id}">
            <div class="decor-icon">${item.type === "wallpaper" ? "🎨" : "👒"}</div>
            <div class="decor-name">${item.name}</div>
            <div class="decor-status">${owned ? '보유중' : '무료 받기!'}</div>
          </div>
        `;
      });
      html += '</div>';
    }

    shop.innerHTML = html;

    // 이벤트 바인딩
    shop.querySelectorAll("[data-wall]").forEach((el) => {
      el.addEventListener("click", () => {
        const wId = el.dataset.wall;
        const w = HOUSE_WALLPAPERS.find((x) => x.id === wId);
        if (w) {
          // 기본 벽지
          const owned = w.cost === 0 || house.ownedDecor.includes("wall_" + wId);
          if (!owned) {
            if (student.tamagotchi.points < w.cost) { UI.showToast("포인트 부족!", "error"); return; }
            student.tamagotchi.points -= w.cost;
            house.ownedDecor.push("wall_" + wId);
          }
        } else if (!house.ownedDecor.includes(wId)) {
          // 계절 벽지인데 보유 안 함
          return;
        }
        house.wallpaper = wId;
        Storage.updateStudent(student);
        this.render(container.closest(".tab-content"));
      });
    });

    shop.querySelectorAll("[data-floor]").forEach((el) => {
      el.addEventListener("click", () => {
        const fId = el.dataset.floor;
        const f = HOUSE_FLOORS.find((x) => x.id === fId);
        if (!f) return;
        const owned = f.cost === 0 || house.ownedDecor.includes("floor_" + fId);
        if (!owned) {
          if (student.tamagotchi.points < f.cost) { UI.showToast("포인트 부족!", "error"); return; }
          student.tamagotchi.points -= f.cost;
          house.ownedDecor.push("floor_" + fId);
        }
        house.floor = fId;
        Storage.updateStudent(student);
        this.render(container.closest(".tab-content"));
      });
    });

    shop.querySelectorAll("[data-fur]").forEach((el) => {
      el.addEventListener("click", () => {
        const fId = el.dataset.fur;
        const f = HOUSE_FURNITURE.find((x) => x.id === fId);
        if (!f) return;
        const owned = house.ownedDecor.includes(fId);
        if (!owned) {
          if (student.tamagotchi.points < f.cost) { UI.showToast("포인트 부족!", "error"); return; }
          student.tamagotchi.points -= f.cost;
          house.ownedDecor.push(fId);
          UI.showToast(`${f.name} 구매 완료!`, "success");
        }
        // 배치 토글
        if (house.furniture.includes(fId)) {
          house.furniture = house.furniture.filter((x) => x !== fId);
        } else {
          if (house.furniture.length >= 10) { UI.showToast("가구는 최대 10개까지!", "error"); return; }
          house.furniture.push(fId);
        }
        Storage.updateStudent(student);
        this.render(container.closest(".tab-content"));
      });
    });

    shop.querySelectorAll("[data-season]").forEach((el) => {
      el.addEventListener("click", () => {
        const itemId = el.dataset.season;
        const season = getCurrentSeason();
        const items = SEASONAL_ITEMS[season.key] || [];
        const item = items.find((i) => i.id === itemId);
        if (!item) return;

        if (item.type === "wallpaper") {
          if (!house.ownedDecor.includes(itemId)) {
            house.ownedDecor.push(itemId);
            UI.showToast(`${item.name} 획득!`, "success");
          }
        } else {
          if (!student.tamagotchi.ownedItems.includes(itemId)) {
            student.tamagotchi.ownedItems.push(itemId);
            UI.showToast(`${item.name} 획득!`, "success");
          }
        }
        Storage.updateStudent(student);
        this.render(container.closest(".tab-content"));
      });
    });
  },
};
