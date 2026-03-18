// ============================================
// tutorial.js - 튜토리얼/온보딩 가이드
// ============================================

const Tutorial = {
  steps: [
    {
      title: "환영해요! 🐣",
      content: `
        <div class="tuto-center">
          <div style="font-size:4rem;margin-bottom:12px">🏫</div>
          <h3>학원 다마고치에 오신 걸 환영해요!</h3>
          <p>미션을 완료하고, 나만의 다마고치를 키워보세요!</p>
        </div>
      `,
    },
    {
      title: "미션 완료하기 📋",
      content: `
        <div class="tuto-step">
          <div class="tuto-icon">📋</div>
          <h3>미션을 완료하면 경험치를 얻어요!</h3>
          <ul>
            <li>선생님에게 <strong>인증코드</strong>를 받으세요</li>
            <li>미션 옆에 코드를 입력하고 <strong>완료하기</strong> 클릭!</li>
            <li>경험치가 쌓이면 <strong>레벨업</strong>해요</li>
          </ul>
        </div>
      `,
    },
    {
      title: "다마고치 돌보기 🍚",
      content: `
        <div class="tuto-step">
          <div class="tuto-icon">🍚🛁🎮</div>
          <h3>매일 다마고치를 돌봐주세요!</h3>
          <ul>
            <li><strong>밥주기</strong> - 배고픔 게이지 회복</li>
            <li><strong>씻기기</strong> - 청결 게이지 회복</li>
            <li><strong>놀아주기</strong> - 행복 게이지 회복</li>
            <li>3개 모두 하면 <strong>완벽한 하루</strong> 보너스!</li>
          </ul>
          <p class="tuto-warn">⚠️ 방치하면 다마고치가 아파요!</p>
        </div>
      `,
    },
    {
      title: "꾸미고 진화시키기 ✨",
      content: `
        <div class="tuto-step">
          <div class="tuto-icon">✨🧮🏠</div>
          <h3>포인트로 다마고치를 꾸며보세요!</h3>
          <ul>
            <li><strong>상점</strong>에서 모자/악세서리/배경 구매</li>
            <li><strong>하우스</strong>에서 방을 꾸밀 수 있어요</li>
            <li>레벨이 오르면 <strong>진화</strong>해요!</li>
            <li>능력치에 따라 <strong>최종 형태</strong>가 달라져요</li>
            <li>숨겨진 <strong>비밀 진화</strong>도 있어요! 🤫</li>
          </ul>
        </div>
      `,
    },
    {
      title: "수학 미니게임 🧮",
      content: `
        <div class="tuto-step">
          <div class="tuto-icon">🧮</div>
          <h3>수학 문제를 풀고 보너스 경험치!</h3>
          <ul>
            <li>하루 <strong>2번</strong> 플레이 가능</li>
            <li>레벨이 높을수록 <strong>어려운 문제</strong>가 나와요</li>
            <li><strong>만점</strong>이면 추가 보너스!</li>
          </ul>
        </div>
      `,
    },
    {
      title: "준비 완료! 🎉",
      content: `
        <div class="tuto-center">
          <div style="font-size:4rem;margin-bottom:12px">🎉</div>
          <h3>이제 시작해볼까요?</h3>
          <p>미션을 완료하고 다마고치를 멋지게 키워보세요!</p>
          <p style="margin-top:8px;color:var(--text-muted);font-size:0.85rem">
            💡 홈 화면에서 일기, 도감, 랭킹 등 다양한 기능을 이용할 수 있어요!
          </p>
        </div>
      `,
    },
  ],

  shouldShow() {
    return !Storage.get("tutorial_done", false);
  },

  markDone() {
    Storage.set("tutorial_done", true);
  },

  show(onComplete) {
    let currentStep = 0;
    const total = this.steps.length;

    const renderStep = () => {
      const step = this.steps[currentStep];
      const isFirst = currentStep === 0;
      const isLast = currentStep === total - 1;

      const overlay = document.querySelector(".tutorial-overlay") || document.createElement("div");
      overlay.className = "tutorial-overlay active";
      overlay.innerHTML = `
        <div class="tutorial-modal">
          <div class="tutorial-progress">
            ${this.steps.map((_, i) => `<div class="progress-dot ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'done' : ''}"></div>`).join("")}
          </div>
          <div class="tutorial-body">
            ${step.content}
          </div>
          <div class="tutorial-footer">
            ${!isFirst ? '<button class="btn btn-secondary btn-small" id="tuto-prev">이전</button>' : '<div></div>'}
            <span class="tutorial-count">${currentStep + 1} / ${total}</span>
            ${isLast
              ? '<button class="btn btn-primary" id="tuto-done">시작하기!</button>'
              : '<button class="btn btn-primary btn-small" id="tuto-next">다음</button>'
            }
          </div>
          <button class="tutorial-skip" id="tuto-skip">건너뛰기</button>
        </div>
      `;

      if (!overlay.parentNode) document.body.appendChild(overlay);

      document.getElementById("tuto-next")?.addEventListener("click", () => {
        Sound.click();
        currentStep++;
        renderStep();
      });

      document.getElementById("tuto-prev")?.addEventListener("click", () => {
        Sound.click();
        currentStep--;
        renderStep();
      });

      const finish = () => {
        Sound.missionComplete();
        this.markDone();
        overlay.classList.remove("active");
        setTimeout(() => overlay.remove(), 300);
        if (onComplete) onComplete();
      };

      document.getElementById("tuto-done")?.addEventListener("click", finish);
      document.getElementById("tuto-skip")?.addEventListener("click", finish);
    };

    renderStep();
  },
};
