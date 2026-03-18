// ============================================
// ui.js - 공통 UI 유틸 (모달, 토스트, 애니메이션)
// ============================================

const UI = {
  // 다마고치 리액션 표시
  showReaction(reaction) {
    const tamaEl = document.getElementById("tama-character");
    if (!tamaEl) return;

    // 기존 리액션 제거
    document.querySelectorAll(".reaction-overlay").forEach((el) => el.remove());

    // 캐릭터 애니메이션
    tamaEl.classList.add(`react-${reaction.animation}`);
    setTimeout(() => tamaEl.classList.remove(`react-${reaction.animation}`), 1200);

    // 이모지 파티클
    const particleContainer = document.createElement("div");
    particleContainer.className = "reaction-overlay";
    tamaEl.style.position = "relative";
    tamaEl.appendChild(particleContainer);

    reaction.emojis.forEach((emoji, i) => {
      const particle = document.createElement("span");
      particle.className = "reaction-particle";
      particle.textContent = emoji;
      particle.style.animationDelay = `${i * 0.15}s`;
      particle.style.left = `${30 + Math.random() * 40}%`;
      particleContainer.appendChild(particle);
    });

    // 말풍선
    const bubble = document.createElement("div");
    bubble.className = "reaction-speech";
    bubble.textContent = reaction.speech;
    particleContainer.appendChild(bubble);

    // 정리
    setTimeout(() => particleContainer.remove(), 2500);
  },

  // 모달 표시
  showModal(title, content, buttons = []) {
    this.closeModal();
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close" onclick="UI.closeModal()">&times;</button>
        </div>
        <div class="modal-body">${content}</div>
        ${buttons.length ? `<div class="modal-footer" id="modal-footer"></div>` : ""}
      </div>
    `;
    document.body.appendChild(overlay);
    if (buttons.length) {
      const footer = overlay.querySelector("#modal-footer");
      buttons.forEach((btn) => {
        const el = document.createElement("button");
        el.className = btn.class || "btn";
        el.textContent = btn.text;
        el.onclick = () => {
          if (btn.onClick) btn.onClick();
          if (btn.closeOnClick !== false) UI.closeModal();
        };
        footer.appendChild(el);
      });
    }
    requestAnimationFrame(() => overlay.classList.add("active"));
  },

  closeModal() {
    const overlay = document.querySelector(".modal-overlay");
    if (overlay) {
      overlay.classList.remove("active");
      setTimeout(() => overlay.remove(), 200);
    }
  },

  // 진화 축하 모달
  showEvolution(evolution, tamagotchi) {
    const isFinal = evolution.toStage === 5;
    const finalInfo = isFinal && evolution.finalForm ? FINAL_FORMS[evolution.finalForm] : null;

    const fromName = EVOLUTION_TABLE.find((e) => e.stage === evolution.fromStage)?.name || "?";
    const toName = evolution.stageName;

    let title = "🌟 진화!";
    let body = "";

    if (isFinal && finalInfo) {
      title = `${finalInfo.icon} 최종 진화!`;
      body = `
        <div class="evolution-animation">
          <div class="evolution-character">${TamagotchiRenderer.render(tamagotchi, 160)}</div>
          <div class="evolution-form-name">${finalInfo.name}</div>
          <div class="evolution-form-desc">${finalInfo.description}</div>
        </div>
      `;
    } else {
      body = `
        <div class="evolution-animation">
          <div class="evolution-stages">
            <span class="evolution-from">${fromName}</span>
            <span class="evolution-arrow">→</span>
            <span class="evolution-to">${toName}</span>
          </div>
          <div class="evolution-character">${TamagotchiRenderer.render(tamagotchi, 140)}</div>
          <div class="evolution-text">${toName}(으)로 진화했어요!</div>
        </div>
      `;
    }

    this.showModal(title, body, [{ text: "확인", class: "btn btn-primary" }]);
  },

  // 토스트 메시지
  showToast(message, type = "info", duration = 2500) {
    const container = document.getElementById("toast-container") || this._createToastContainer();
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  _createToastContainer() {
    const container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
    return container;
  },

  // 레벨업 애니메이션
  showLevelUp(level, reward) {
    let rewardText = `포인트 ${reward.points}p 획득!`;
    if (reward.unlock) rewardText += `<br>${reward.unlock}`;
    if (reward.snackBox) rewardText += `<br>🍪 간식상자 ${reward.snackBox}회 추가!`;

    this.showModal("🎉 레벨 UP!", `
      <div class="levelup-animation">
        <div class="levelup-level">Lv. ${level}</div>
        <div class="levelup-reward">${rewardText}</div>
      </div>
    `, [{ text: "확인", class: "btn btn-primary" }]);
  },

  // 경험치 바 업데이트 애니메이션
  animateExpBar(element, fromPercent, toPercent) {
    element.style.width = fromPercent + "%";
    requestAnimationFrame(() => {
      element.style.transition = "width 0.5s ease";
      element.style.width = toPercent + "%";
    });
  },

  // 확인 다이얼로그
  confirm(title, message) {
    return new Promise((resolve) => {
      this.showModal(title, `<p>${message}</p>`, [
        { text: "취소", class: "btn btn-secondary", onClick: () => resolve(false) },
        { text: "확인", class: "btn btn-primary", onClick: () => resolve(true) },
      ]);
    });
  },

  // 입력 다이얼로그
  prompt(title, fields) {
    return new Promise((resolve) => {
      const fieldsHtml = fields.map((f) => `
        <div class="form-group">
          <label>${f.label}</label>
          <input type="${f.type || "text"}" id="prompt-${f.id}"
                 placeholder="${f.placeholder || ""}" value="${f.value || ""}"
                 ${f.maxLength ? `maxlength="${f.maxLength}"` : ""}>
        </div>
      `).join("");

      this.showModal(title, fieldsHtml, [
        { text: "취소", class: "btn btn-secondary", onClick: () => resolve(null) },
        {
          text: "확인", class: "btn btn-primary",
          onClick: () => {
            const result = {};
            fields.forEach((f) => {
              result[f.id] = document.getElementById(`prompt-${f.id}`).value;
            });
            resolve(result);
          },
        },
      ]);
    });
  },
};
