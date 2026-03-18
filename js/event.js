// ============================================
// event.js - 시즌/이벤트 시스템
// ============================================

const GameEvent = {
  // 현재 활성 이벤트 (만료 자동 체크)
  getActive() {
    const event = Storage.getEvent();
    if (!event || !event.active) return null;

    const today = new Date().toISOString().split("T")[0];
    if (event.endDate < today) {
      event.active = false;
      Storage.saveEvent(event);
      return null;
    }
    return event;
  },

  // 현재 EXP 배율
  getExpMultiplier() {
    const event = this.getActive();
    return event ? event.expMultiplier : 1.0;
  },

  // 이벤트 생성 (관리자)
  create(data) {
    const event = {
      id: "evt_" + Date.now(),
      title: data.title,
      type: data.type || "custom",
      expMultiplier: parseFloat(data.expMultiplier) || 1.5,
      startDate: new Date().toISOString().split("T")[0],
      endDate: data.endDate,
      active: true,
    };
    Storage.saveEvent(event);
    return event;
  },

  // 이벤트 종료
  end() {
    const event = Storage.getEvent();
    if (event) {
      event.active = false;
      Storage.saveEvent(event);
    }
  },

  // 홈 배너 HTML
  renderBanner() {
    const event = this.getActive();
    if (!event) return "";

    const typeIcons = { exam_prep: "📝", vacation: "☀️", custom: "🎉" };
    const icon = typeIcons[event.type] || "🎉";

    return `
      <div class="event-banner">
        <span class="event-banner-icon">${icon}</span>
        <div class="event-banner-text">
          <strong>${event.title}</strong>
          <span>EXP ${event.expMultiplier}배 | ~${event.endDate}</span>
        </div>
      </div>
    `;
  },

  // 관리자 이벤트 관리 렌더
  renderAdmin(container) {
    const event = this.getActive();

    let html = '<div class="admin-section"><h3>이벤트 관리</h3>';

    if (event) {
      html += `
        <div class="event-admin-info">
          <p><strong>${event.title}</strong></p>
          <p>EXP ${event.expMultiplier}배 | 마감: ${event.endDate}</p>
          <button class="btn btn-danger btn-small" id="end-event-btn">이벤트 종료</button>
        </div>
      `;
    } else {
      html += `
        <p class="text-muted">진행 중인 이벤트 없음</p>
        <div class="event-presets">
          <h4>프리셋</h4>
          <button class="btn btn-small btn-primary" data-preset="exam_prep">📝 시험대비 (2.0x)</button>
          <button class="btn btn-small btn-primary" data-preset="vacation">☀️ 방학특훈 (1.5x)</button>
        </div>
        <div style="margin-top:12px">
          <h4>자유 생성</h4>
          <button class="btn btn-small btn-secondary" id="custom-event-btn">+ 직접 만들기</button>
        </div>
      `;
    }

    html += '</div>';
    container.innerHTML = html;

    if (event) {
      document.getElementById("end-event-btn").addEventListener("click", () => {
        this.end();
        UI.showToast("이벤트가 종료되었어요", "info");
        this.renderAdmin(container);
      });
    } else {
      container.querySelectorAll("[data-preset]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const presets = {
            exam_prep: { title: "시험대비 이벤트", type: "exam_prep", expMultiplier: 2.0 },
            vacation: { title: "방학특훈 이벤트", type: "vacation", expMultiplier: 1.5 },
          };
          const p = presets[btn.dataset.preset];
          const d = new Date(); d.setDate(d.getDate() + 7);
          p.endDate = d.toISOString().split("T")[0];
          this.create(p);
          UI.showToast(`${p.title} 시작!`, "success");
          this.renderAdmin(container);
        });
      });

      const customBtn = document.getElementById("custom-event-btn");
      if (customBtn) {
        customBtn.addEventListener("click", async () => {
          const d = new Date(); d.setDate(d.getDate() + 7);
          const result = await UI.prompt("이벤트 만들기", [
            { id: "title", label: "이벤트 이름", placeholder: "예: 기말고사 대비" },
            { id: "expMultiplier", label: "EXP 배율", type: "number", value: "1.5" },
            { id: "endDate", label: "마감일 (YYYY-MM-DD)", value: d.toISOString().split("T")[0] },
          ]);
          if (result && result.title) {
            this.create(result);
            UI.showToast(`${result.title} 시작!`, "success");
            this.renderAdmin(container);
          }
        });
      }
    }
  },
};
