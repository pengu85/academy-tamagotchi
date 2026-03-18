// ============================================
// team.js - 팀 미션 / 반 대항전
// ============================================

const Team = {
  getTeams() {
    return Storage.getTeams();
  },

  getStudentTeam(studentId) {
    return this.getTeams().find((t) => t.members.includes(studentId)) || null;
  },

  // 팀 생성 (관리자)
  createTeam(name, color) {
    const teams = this.getTeams();
    const team = { id: "team_" + Date.now(), name, color, members: [] };
    teams.push(team);
    Storage.saveTeams(teams);
    return team;
  },

  deleteTeam(teamId) {
    const teams = this.getTeams().filter((t) => t.id !== teamId);
    Storage.saveTeams(teams);
  },

  addMember(teamId, studentId) {
    const teams = this.getTeams();
    // 다른 팀에서 제거
    teams.forEach((t) => { t.members = t.members.filter((m) => m !== studentId); });
    const team = teams.find((t) => t.id === teamId);
    if (team && !team.members.includes(studentId)) {
      team.members.push(studentId);
    }
    Storage.saveTeams(teams);
  },

  removeMember(teamId, studentId) {
    const teams = this.getTeams();
    const team = teams.find((t) => t.id === teamId);
    if (team) {
      team.members = team.members.filter((m) => m !== studentId);
      Storage.saveTeams(teams);
    }
  },

  // 팀별 경험치 합산 (대항전 기간 내)
  getTeamExp(teamId) {
    const battle = Storage.getTeamBattle();
    if (!battle) return 0;

    const teams = this.getTeams();
    const team = teams.find((t) => t.id === teamId);
    if (!team) return 0;

    const missions = Storage.getMissions() || [];
    let total = 0;

    team.members.forEach((memberId) => {
      const student = Storage.getStudent(memberId);
      if (!student) return;

      student.completedMissions.forEach((c) => {
        if (c.completedAt >= battle.startDate && (!battle.endDate || c.completedAt <= battle.endDate)) {
          const mission = missions.find((m) => m.id === c.missionId);
          if (mission) total += mission.exp;
        }
      });
    });

    return total;
  },

  // 팀 랭킹
  getTeamRanking() {
    const teams = this.getTeams();
    return teams.map((t) => ({
      team: t,
      totalExp: this.getTeamExp(t.id),
    })).sort((a, b) => b.totalExp - a.totalExp);
  },

  // 대항전 시작
  startBattle(data) {
    const battle = {
      id: "battle_" + Date.now(),
      title: data.title,
      startDate: new Date().toISOString().split("T")[0],
      endDate: data.endDate,
      active: true,
      teamReward: { points: parseInt(data.rewardPoints) || 20, snackBox: parseInt(data.rewardSnack) || 1 },
    };
    Storage.saveTeamBattle(battle);
    return battle;
  },

  // 대항전 종료 + 보상 지급
  endBattle() {
    const battle = Storage.getTeamBattle();
    if (!battle) return null;

    battle.active = false;
    Storage.saveTeamBattle(battle);

    const ranking = this.getTeamRanking();
    if (ranking.length > 0 && ranking[0].totalExp > 0) {
      const winner = ranking[0].team;
      winner.members.forEach((memberId) => {
        const student = Storage.getStudent(memberId);
        if (student) {
          student.tamagotchi.points += battle.teamReward.points;
          student.snackBoxChances += battle.teamReward.snackBox;
          Storage.updateStudent(student);
        }
      });
      return { winner, ranking };
    }
    return { winner: null, ranking };
  },

  // 홈 화면 팀 정보
  renderTeamInfo(studentId) {
    const battle = Storage.getTeamBattle();
    if (!battle || !battle.active) return "";

    const team = this.getStudentTeam(studentId);
    if (!team) return "";

    const ranking = this.getTeamRanking();
    const myRank = ranking.findIndex((r) => r.team.id === team.id) + 1;
    const myTeamExp = this.getTeamExp(team.id);

    return `
      <div class="team-info-bar" style="border-left: 4px solid ${team.color}">
        <span>내 팀: <strong>${team.name}</strong></span>
        <span>팀 순위: ${myRank}등</span>
        <span>팀 EXP: ${myTeamExp}</span>
      </div>
    `;
  },

  // 팀 대항전 화면
  render(container) {
    const battle = Storage.getTeamBattle();

    if (!battle || !battle.active) {
      container.innerHTML = `<div class="team-empty"><h2>⚔️ 팀 대항전</h2><p class="text-muted">현재 진행 중인 대항전이 없어요.</p></div>`;
      return;
    }

    const ranking = this.getTeamRanking();
    const medals = ["🥇", "🥈", "🥉"];

    let html = `
      <div class="team-battle-screen">
        <h2>⚔️ ${battle.title}</h2>
        <p class="text-muted">마감: ${battle.endDate}</p>
        <div class="team-ranking-list">
    `;

    ranking.forEach((r, i) => {
      const medal = i < 3 ? medals[i] : `${i + 1}`;
      const barWidth = ranking[0].totalExp > 0 ? Math.max(5, (r.totalExp / ranking[0].totalExp) * 100) : 5;
      html += `
        <div class="team-rank-item">
          <span class="team-medal">${medal}</span>
          <span class="team-name-badge" style="color: ${r.team.color}">${r.team.name}</span>
          <div class="team-exp-bar-wrap">
            <div class="team-exp-bar" style="width: ${barWidth}%; background: ${r.team.color}"></div>
          </div>
          <span class="team-exp-value">${r.totalExp} EXP</span>
        </div>
      `;
    });

    html += '</div></div>';
    container.innerHTML = html;
  },

  // 관리자 팀 관리
  renderAdmin(container) {
    const teams = this.getTeams();
    const students = Storage.getStudents();
    const battle = Storage.getTeamBattle();

    let html = '<div class="admin-section"><h3>팀 관리 <button class="btn btn-small btn-primary" id="add-team-btn">+ 팀 추가</button></h3>';

    const teamColors = ["#FF6B6B", "#74B9FF", "#55EFC4", "#FDCB6E", "#A29BFE", "#FD79A8"];

    teams.forEach((t) => {
      const memberNames = t.members.map((id) => {
        const s = students.find((st) => st.id === id);
        return s ? s.name : "?";
      }).join(", ");

      // 미배정 학생 목록
      const unassigned = students.filter((s) => !teams.some((team) => team.members.includes(s.id)));

      html += `
        <div class="team-admin-card" style="border-left: 4px solid ${t.color}">
          <div class="team-admin-header">
            <strong>${t.name}</strong> (${t.members.length}명)
            <button class="btn btn-small btn-danger" data-delete-team="${t.id}">삭제</button>
          </div>
          <div class="team-members">${memberNames || '<span class="text-muted">멤버 없음</span>'}</div>
          ${unassigned.length > 0 ? `
            <select data-add-to-team="${t.id}" class="team-add-select">
              <option value="">학생 추가...</option>
              ${unassigned.map((s) => `<option value="${s.id}">${s.name}</option>`).join("")}
            </select>
          ` : ''}
        </div>
      `;
    });

    // 대항전 관리
    html += '<h3 style="margin-top:16px">대항전</h3>';
    if (battle && battle.active) {
      const ranking = this.getTeamRanking();
      const winnerName = ranking.length > 0 ? ranking[0].team.name : "-";
      html += `
        <div class="battle-admin-info">
          <p><strong>${battle.title}</strong> | 마감: ${battle.endDate}</p>
          <p>현재 1등: ${winnerName}</p>
          <button class="btn btn-danger btn-small" id="end-battle-btn">대항전 종료 + 보상 지급</button>
        </div>
      `;
    } else {
      html += `
        <p class="text-muted">진행 중인 대항전 없음</p>
        ${teams.length >= 2 ? `<button class="btn btn-primary btn-small" id="start-battle-btn">대항전 시작</button>` : '<p class="text-muted">팀을 2개 이상 만들어주세요.</p>'}
      `;
    }

    html += '</div>';
    container.innerHTML = html;

    // 이벤트 바인딩
    document.getElementById("add-team-btn")?.addEventListener("click", async () => {
      const idx = teams.length;
      const color = teamColors[idx % teamColors.length];
      const result = await UI.prompt("팀 추가", [
        { id: "name", label: "팀 이름", placeholder: "예: A반" },
      ]);
      if (result && result.name) {
        this.createTeam(result.name, color);
        UI.showToast(`${result.name} 팀 생성!`, "success");
        this.renderAdmin(container);
      }
    });

    container.querySelectorAll("[data-delete-team]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const ok = await UI.confirm("팀 삭제", "이 팀을 삭제할까요?");
        if (ok) {
          this.deleteTeam(btn.dataset.deleteTeam);
          this.renderAdmin(container);
        }
      });
    });

    container.querySelectorAll("[data-add-to-team]").forEach((sel) => {
      sel.addEventListener("change", () => {
        if (sel.value) {
          this.addMember(sel.dataset.addToTeam, sel.value);
          UI.showToast("학생 배정 완료!", "success");
          this.renderAdmin(container);
        }
      });
    });

    document.getElementById("start-battle-btn")?.addEventListener("click", async () => {
      const d = new Date(); d.setDate(d.getDate() + 14);
      const result = await UI.prompt("대항전 시작", [
        { id: "title", label: "대항전 이름", placeholder: "예: 3월 반 대항전" },
        { id: "endDate", label: "마감일", value: d.toISOString().split("T")[0] },
        { id: "rewardPoints", label: "우승 보상 (포인트)", value: "20" },
        { id: "rewardSnack", label: "우승 보상 (간식상자)", value: "1" },
      ]);
      if (result && result.title) {
        this.startBattle(result);
        UI.showToast("대항전 시작!", "success");
        this.renderAdmin(container);
      }
    });

    document.getElementById("end-battle-btn")?.addEventListener("click", async () => {
      const ok = await UI.confirm("대항전 종료", "종료하고 1등 팀에 보상을 지급할까요?");
      if (ok) {
        const result = this.endBattle();
        if (result && result.winner) {
          UI.showToast(`🏆 우승: ${result.winner.name}! 보상 지급 완료`, "success", 4000);
        }
        this.renderAdmin(container);
      }
    });
  },
};
