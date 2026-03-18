// ============================================
// challenge.js - 주간 챌린지 시스템
// ============================================

const Challenge = {
  // 이번 주 시작일 (월요일 기준)
  _getWeekStart() {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split("T")[0];
  },

  // 이번 주 진행 상황 수집
  getWeeklyStats(student) {
    const weekStart = this._getWeekStart();
    const missions = student.completedMissions.filter((c) => c.completedAt >= weekStart);

    // 이번 주 돌봄 일수 (간이 계산: fedToday 기반은 오늘만 가능, diary 기반으로 추정)
    const diaryDays = (student.diary || []).filter((d) => d.date >= weekStart).length;
    const fedDays = Math.min(diaryDays, 7);

    // 이번 주 레벨 성장 (weeklyProgress 활용)
    if (!student.weeklyProgress || student.weeklyProgress.weekStart !== weekStart) {
      student.weeklyProgress = {
        weekStart,
        startLevel: student.tamagotchi.level,
      };
      Storage.updateStudent(student);
    }
    const levelsGained = student.tamagotchi.level - student.weeklyProgress.startLevel;

    return {
      missions: missions.length,
      fedDays,
      levelsGained,
      weekStart,
    };
  },

  // 챌린지 상태 확인
  getChallengeStatus(student) {
    if (!student.completedChallenges) student.completedChallenges = [];
    const weekStats = this.getWeeklyStats(student);
    const weekStart = weekStats.weekStart;

    return WEEKLY_CHALLENGES.map((ch) => {
      const completedKey = `${ch.id}_${weekStart}`;
      const completed = student.completedChallenges.includes(completedKey);
      const achieved = ch.condition(student, weekStats);
      return { ...ch, completed, achieved, completedKey };
    });
  },

  // 챌린지 보상 수령
  claimReward(student, challengeId) {
    const status = this.getChallengeStatus(student);
    const ch = status.find((c) => c.id === challengeId);
    if (!ch || ch.completed || !ch.achieved) return null;

    if (!student.completedChallenges) student.completedChallenges = [];
    student.completedChallenges.push(ch.completedKey);

    // 보상 지급
    if (ch.reward.points) student.tamagotchi.points += ch.reward.points;
    if (ch.reward.snackBox) student.snackBoxChances += ch.reward.snackBox;
    if (ch.reward.exp) Tamagotchi.addExp(student, ch.reward.exp);

    Storage.updateStudent(student);
    return ch;
  },

  // 챌린지 화면 렌더
  render(container) {
    const student = Storage.getCurrentStudent();
    if (!student) return;

    const challenges = this.getChallengeStatus(student);
    const weekStart = this._getWeekStart();
    const weekEnd = new Date(new Date(weekStart).getTime() + 6 * 86400000).toISOString().split("T")[0];

    let html = `
      <div class="challenge-screen">
        <h2>🏆 주간 챌린지</h2>
        <p class="text-muted">${weekStart} ~ ${weekEnd}</p>
        <div class="challenge-list">
    `;

    challenges.forEach((ch) => {
      let statusLabel, statusClass, btnHtml = "";

      if (ch.completed) {
        statusLabel = "완료!";
        statusClass = "completed";
      } else if (ch.achieved) {
        statusLabel = "달성!";
        statusClass = "achieved";
        btnHtml = `<button class="btn btn-small btn-primary" data-claim-challenge="${ch.id}">보상 받기</button>`;
      } else {
        statusLabel = "진행중";
        statusClass = "pending";
      }

      const rewardText = [];
      if (ch.reward.points) rewardText.push(`${ch.reward.points}p`);
      if (ch.reward.snackBox) rewardText.push(`간식상자 ${ch.reward.snackBox}회`);
      if (ch.reward.exp) rewardText.push(`${ch.reward.exp} EXP`);

      html += `
        <div class="challenge-card ${statusClass}">
          <div class="challenge-icon">${ch.icon}</div>
          <div class="challenge-info">
            <div class="challenge-name">${ch.name}</div>
            <div class="challenge-desc">${ch.description}</div>
            <div class="challenge-reward">보상: ${rewardText.join(" + ")}</div>
          </div>
          <div class="challenge-status">
            <span class="challenge-status-label ${statusClass}">${statusLabel}</span>
            ${btnHtml}
          </div>
        </div>
      `;
    });

    html += '</div></div>';
    container.innerHTML = html;

    container.querySelectorAll("[data-claim-challenge]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const ch = this.claimReward(student, btn.dataset.claimChallenge);
        if (ch) {
          UI.showToast(`${ch.icon} ${ch.name} 보상 획득!`, "success");
          this.render(container);
          App.renderHome();
        }
      });
    });
  },
};
