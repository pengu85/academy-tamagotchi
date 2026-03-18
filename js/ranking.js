// ============================================
// ranking.js - 주간 랭킹 보드
// ============================================

const Ranking = {
  getRanking(category) {
    const students = Storage.getStudents();
    let sorted;

    switch (category) {
      case "level":
        sorted = students.sort((a, b) => {
          if (b.tamagotchi.level !== a.tamagotchi.level) return b.tamagotchi.level - a.tamagotchi.level;
          return b.tamagotchi.exp - a.tamagotchi.exp;
        });
        break;
      case "totalExp":
        sorted = students.sort((a, b) => {
          const aTotal = getTotalExpForLevel(a.tamagotchi.level) + a.tamagotchi.exp;
          const bTotal = getTotalExpForLevel(b.tamagotchi.level) + b.tamagotchi.exp;
          return bTotal - aTotal;
        });
        break;
      case "streak":
        sorted = students.sort((a, b) => (b.streakDays || 0) - (a.streakDays || 0));
        break;
      case "minigame":
        sorted = students.sort((a, b) => (b.perfectMinigames || 0) - (a.perfectMinigames || 0));
        break;
      default:
        sorted = students;
    }

    return sorted.map((s, i) => ({
      student: s,
      rank: i + 1,
      value: this._getValue(s, category),
    }));
  },

  _getValue(student, category) {
    switch (category) {
      case "level": return `Lv.${student.tamagotchi.level}`;
      case "totalExp": return `${getTotalExpForLevel(student.tamagotchi.level) + student.tamagotchi.exp} EXP`;
      case "streak": return `${student.streakDays || 0}일`;
      case "minigame": return `${student.perfectMinigames || 0}회 만점`;
      default: return "";
    }
  },

  getMedal(rank) {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `${rank}`;
  },

  showRankingModal() {
    const categories = [
      { key: "level", label: "레벨" },
      { key: "totalExp", label: "경험치" },
      { key: "streak", label: "출석" },
      { key: "minigame", label: "게임" },
    ];

    // 팀 대항전 중이면 팀 랭킹 탭 추가
    const battle = Storage.getTeamBattle();
    if (battle && battle.active) {
      categories.push({ key: "team", label: "팀" });
    }

    let html = `<div class="ranking-modal">
      <div class="ranking-tabs" id="ranking-tabs">
        ${categories.map((c, i) => `<button class="ranking-tab ${i === 0 ? 'active' : ''}" data-rank-cat="${c.key}">${c.label}</button>`).join("")}
      </div>
      <div class="ranking-list" id="ranking-list"></div>
    </div>`;

    UI.showModal("🏅 랭킹 보드", html, [{ text: "닫기", class: "btn btn-secondary" }]);

    setTimeout(() => {
      this._renderCategory("level");
      document.querySelectorAll("[data-rank-cat]").forEach((tab) => {
        tab.addEventListener("click", () => {
          document.querySelectorAll("[data-rank-cat]").forEach((t) => t.classList.remove("active"));
          tab.classList.add("active");
          this._renderCategory(tab.dataset.rankCat);
        });
      });
    }, 100);
  },

  _renderCategory(category) {
    const list = document.getElementById("ranking-list");
    if (!list) return;

    if (category === "team") {
      this._renderTeamRanking(list);
      return;
    }

    const ranking = this.getRanking(category);
    const currentId = Storage.getCurrentStudentId();

    list.innerHTML = ranking.map((r) => {
      const isMe = r.student.id === currentId;
      return `
        <div class="ranking-item ${isMe ? 'is-me' : ''} ${r.rank <= 3 ? 'top3' : ''}">
          <span class="ranking-medal">${this.getMedal(r.rank)}</span>
          <span class="ranking-tama-name">${r.student.tamagotchi.name}</span>
          <span class="ranking-student-name">(${r.student.name})</span>
          <span class="ranking-value">${r.value}</span>
        </div>
      `;
    }).join("") || '<p class="text-muted" style="padding:12px">학생이 없어요.</p>';
  },

  _renderTeamRanking(list) {
    const ranking = Team.getTeamRanking();
    const medals = ["🥇", "🥈", "🥉"];

    list.innerHTML = ranking.map((r, i) => `
      <div class="ranking-item top3">
        <span class="ranking-medal">${i < 3 ? medals[i] : i + 1}</span>
        <span class="ranking-tama-name" style="color: ${r.team.color}">${r.team.name}</span>
        <span class="ranking-value">${r.totalExp} EXP</span>
      </div>
    `).join("") || '<p class="text-muted" style="padding:12px">팀이 없어요.</p>';
  },
};
