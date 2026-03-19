// ============================================
// quest.js - 퀘스트 체인 (스토리형 연결 미션)
// ============================================

const Quest = {
  CHAINS: [
    {
      id: "math_road", name: "수학왕의 길", icon: "\u{1F9EE}", description: "수학의 기초부터 고수까지!",
      steps: [
        { title: "첫 걸음", desc: "미션 3개 완료하기", condition: (s) => s.completedMissions.length >= 3, reward: { exp: 20, points: 5 } },
        { title: "성실한 학생", desc: "7일 연속 출석하기", condition: (s) => s.streakDays >= 7, reward: { exp: 30, points: 10 } },
        { title: "수학 도전자", desc: "미니게임 만점 3회 달성", condition: (s) => (s.perfectMinigames || 0) >= 3, reward: { exp: 50, points: 15 } },
        { title: "수학 달인", desc: "레벨 10 달성하기", condition: (s) => s.tamagotchi.level >= 10, reward: { exp: 80, points: 20 } },
        { title: "수학왕 등극!", desc: "레벨 15 + INT 10 이상", condition: (s) => s.tamagotchi.level >= 15 && s.tamagotchi.stats.int >= 10, reward: { exp: 100, points: 30, snackBox: 2 } },
      ],
    },
    {
      id: "social_star", name: "인기스타", icon: "\u{1F31F}", description: "친구와 함께 성장하자!",
      steps: [
        { title: "첫 만남", desc: "친구 1명 이상", condition: (s) => (s.friends || []).length >= 1, reward: { exp: 15, points: 5 } },
        { title: "선물의 기쁨", desc: "친구에게 선물 보내기", condition: (s) => (s.giftSentToday || []).length >= 1 || (s.totalGiftsSent || 0) >= 1, reward: { exp: 25, points: 10 } },
        { title: "패션왕", desc: "아이템 5개 수집", condition: (s) => s.tamagotchi.ownedItems.length >= 5, reward: { exp: 40, points: 15 } },
        { title: "인기 만렙", desc: "CHA 능력치 8 이상", condition: (s) => s.tamagotchi.stats.cha >= 8, reward: { exp: 60, points: 20, snackBox: 1 } },
      ],
    },
    {
      id: "care_master", name: "돌봄 마스터", icon: "\u{1F496}", description: "다마고치를 최고로 돌봐주자!",
      steps: [
        { title: "첫 돌봄", desc: "밥 주기 완료", condition: (s) => s.care?.fedToday === true || (s.care?.perfectDays || 0) >= 1, reward: { exp: 10, points: 3 } },
        { title: "완벽한 하루", desc: "일일 루틴 완료 3일", condition: (s) => (s.care?.perfectDays || 0) >= 3, reward: { exp: 30, points: 10 } },
        { title: "건강 지킴이", desc: "아픔 회복 1회 이상", condition: (s) => (s.care?.recoveredCount || 0) >= 1, reward: { exp: 40, points: 10 } },
        { title: "돌봄 달인", desc: "일일 루틴 완료 10일", condition: (s) => (s.care?.perfectDays || 0) >= 10, reward: { exp: 60, points: 20 } },
        { title: "최고의 주인", desc: "STA 10 이상 + 진화 달성", condition: (s) => s.tamagotchi.stats.sta >= 10 && s.tamagotchi.evolution?.stage >= 4, reward: { exp: 100, points: 30, snackBox: 2 } },
      ],
    },
  ],

  getProgress(student) {
    if (!student.questProgress) student.questProgress = {};
    return student.questProgress;
  },

  getCurrentStep(student, chainId) {
    const progress = this.getProgress(student);
    return progress[chainId] || 0;
  },

  checkAndAdvance(student) {
    const progress = this.getProgress(student);
    const completed = [];

    this.CHAINS.forEach((chain) => {
      const currentStep = progress[chain.id] || 0;
      if (currentStep >= chain.steps.length) return; // Already complete

      const step = chain.steps[currentStep];
      if (step.condition(student)) {
        progress[chain.id] = currentStep + 1;
        // Apply reward
        if (step.reward.exp) Tamagotchi.addExp(student, step.reward.exp);
        if (step.reward.points) student.tamagotchi.points += step.reward.points;
        if (step.reward.snackBox) {
          student.snackBoxChances += step.reward.snackBox;
          student.totalSnackBoxEarned = (student.totalSnackBoxEarned || 0) + step.reward.snackBox;
        }
        completed.push({ chain: chain.name, chainIcon: chain.icon, step: step.title, reward: step.reward });
      }
    });

    if (completed.length > 0) {
      student.questProgress = progress;
      Storage.updateStudent(student);
    }
    return completed;
  },

  show(student) {
    const progress = this.getProgress(student);
    let html = '<div class="quest-list">';

    this.CHAINS.forEach((chain) => {
      const currentStep = progress[chain.id] || 0;
      const isComplete = currentStep >= chain.steps.length;
      const pct = Math.round((currentStep / chain.steps.length) * 100);

      html += `
        <div class="quest-chain ${isComplete ? 'complete' : ''}">
          <div class="quest-chain-header">
            <span class="quest-chain-icon">${chain.icon}</span>
            <div class="quest-chain-info">
              <div class="quest-chain-name">${chain.name}</div>
              <div class="quest-chain-desc">${chain.description}</div>
            </div>
            <span class="quest-chain-pct">${pct}%</span>
          </div>
          <div class="quest-chain-bar"><div class="quest-chain-fill" style="width:${pct}%"></div></div>
          <div class="quest-steps">
      `;

      chain.steps.forEach((step, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        const locked = i > currentStep;
        let rewardText = [];
        if (step.reward.exp) rewardText.push(`+${step.reward.exp} EXP`);
        if (step.reward.points) rewardText.push(`+${step.reward.points}p`);
        if (step.reward.snackBox) rewardText.push(`\u{1F36A} ${step.reward.snackBox}\uD68C`);

        html += `
          <div class="quest-step ${done ? 'done' : ''} ${active ? 'active' : ''} ${locked ? 'locked' : ''}">
            <span class="quest-step-check">${done ? '\u2705' : active ? '\u{1F4CD}' : '\u{1F512}'}</span>
            <div class="quest-step-info">
              <div class="quest-step-title">${step.title}</div>
              <div class="quest-step-desc">${step.desc}</div>
            </div>
            <div class="quest-step-reward">${rewardText.join(' ')}</div>
          </div>
        `;
      });

      html += '</div></div>';
    });

    html += '</div>';
    UI.showModal("\u{1F5FA}\uFE0F \uD038\uC2A4\uD2B8", html, [{ text: "\uB2EB\uAE30", class: "btn btn-secondary" }]);
  },

  showNotification(completed) {
    completed.forEach((c) => {
      let rewardText = [];
      if (c.reward.exp) rewardText.push(`+${c.reward.exp} EXP`);
      if (c.reward.points) rewardText.push(`+${c.reward.points}p`);
      UI.showToast(`${c.chainIcon} ${c.chain}: "${c.step}" \uB2EC\uC131! ${rewardText.join(' ')}`, "success", 4000);
    });
  },
};
