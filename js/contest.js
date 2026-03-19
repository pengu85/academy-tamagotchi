// ============================================
// contest.js - 경연대회/투표 로직
// ============================================

const Contest = {
  render(container) {
    const contest = Storage.getContest();
    const student = Storage.getCurrentStudent();

    if (!contest || !contest.active) {
      container.innerHTML = `
        <div class="contest-empty">
          <h2>🏆 경연대회</h2>
          <p>현재 진행 중인 대회가 없어요.</p>
          <p class="text-muted">선생님이 대회를 열면 여기에 표시됩니다!</p>
        </div>
      `;
      return;
    }

    const students = Storage.getStudents();
    const categoryLabel = { beauty: "멋진 외형", power: "파워 대결", popular: "인기 대회" };

    // 투표 수 계산
    const voteCount = {};
    Object.entries(contest.votes || {}).forEach(([targetId, voters]) => {
      voteCount[targetId] = voters.length;
      // 매력 보너스 (beauty 카테고리)
      if (contest.category === "beauty") {
        const target = students.find((s) => s.id === targetId);
        if (target) {
          voteCount[targetId] += target.tamagotchi.stats.cha * 0.5;
        }
      }
    });

    // 내가 투표한 수
    const myVotes = Object.values(contest.votes || {}).filter(
      (voters) => student && voters.includes(student.id)
    ).length;

    let html = `
      <div class="contest-header">
        <h2>🏆 ${contest.title}</h2>
        <div class="contest-info">
          <span class="contest-category">${categoryLabel[contest.category] || contest.category}</span>
          <span class="contest-date">마감: ${contest.endDate}</span>
        </div>
        ${student ? `<p class="my-votes">내 투표: ${myVotes}/3</p>` : ''}
      </div>
      <div class="contest-gallery">
    `;

    // 파워 대결은 STR 기준 정렬, 나머지는 투표수 기준
    let sorted = [...students];
    if (contest.category === "power") {
      sorted.sort((a, b) => b.tamagotchi.stats.str - a.tamagotchi.stats.str);
    } else {
      sorted.sort((a, b) => (voteCount[b.id] || 0) - (voteCount[a.id] || 0));
    }

    sorted.forEach((s) => {
      const votes = voteCount[s.id] || 0;
      const isMe = student && s.id === student.id;
      const alreadyVoted = student && ((contest.votes || {})[s.id] || []).includes(student.id);
      const canVote = student && !isMe && !alreadyVoted && myVotes < 3;

      html += `
        <div class="contest-card ${isMe ? 'is-me' : ''}">
          <div class="contest-tamagotchi">
            ${TamagotchiRenderer.render(s.tamagotchi, 120)}
          </div>
          <div class="contest-card-info">
            <div class="contest-tama-name">${s.tamagotchi.name}</div>
            <div class="contest-student-name">${s.name}</div>
            <div class="contest-level">Lv. ${s.tamagotchi.level}</div>
            ${contest.category === "power"
              ? `<div class="contest-stat">💪 STR: ${s.tamagotchi.stats.str}</div>`
              : `<div class="contest-votes">❤️ ${Math.floor(votes)}표</div>`
            }
            ${contest.category !== "power" && canVote
              ? `<button class="btn btn-small btn-vote" data-vote="${s.id}">투표</button>`
              : ''}
            ${alreadyVoted ? '<span class="voted-label">투표완료</span>' : ''}
          </div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;

    // 투표 이벤트
    container.querySelectorAll("[data-vote]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.vote(student.id, btn.dataset.vote);
        this.render(container);
      });
    });
  },

  vote(voterId, targetId) {
    const contest = Storage.getContest();
    if (!contest || !contest.active) return;

    if (!contest.votes[targetId]) {
      contest.votes[targetId] = [];
    }

    // 중복 확인
    if (contest.votes[targetId].includes(voterId)) return;

    // 총 투표수 확인
    const myTotal = Object.values(contest.votes).filter((v) => v.includes(voterId)).length;
    if (myTotal >= 3) {
      UI.showToast("투표를 모두 사용했어요! (최대 3표)", "error");
      return;
    }

    contest.votes[targetId].push(voterId);
    Storage.saveContest(contest);
    UI.showToast("투표 완료!", "success");
  },

  // 대회 생성 (관리자)
  createContest(data) {
    const contest = {
      id: "contest_" + Date.now(),
      title: data.title,
      startDate: new Date().toISOString().split("T")[0],
      endDate: data.endDate,
      category: data.category || "beauty",
      votes: {},
      active: true,
    };
    Storage.saveContest(contest);
    return contest;
  },

  // 대회 종료 (관리자)
  endContest() {
    const contest = Storage.getContest();
    if (contest) {
      contest.active = false;
      Storage.saveContest(contest);

      // 1등에게 간식상자 보상
      const winner = this.getWinner(contest);
      if (winner) {
        const student = Storage.getStudent(winner.id);
        if (student) {
          student.snackBoxChances += 1;
          Storage.updateStudent(student);
        }
      }
    }
    return contest;
  },

  getWinner(contest) {
    if (!contest) return null;
    const students = Storage.getStudents();

    if (contest.category === "power") {
      return students.sort((a, b) => b.tamagotchi.stats.str - a.tamagotchi.stats.str)[0] || null;
    }

    let maxVotes = 0;
    let winnerId = null;
    Object.entries(contest.votes || {}).forEach(([id, voters]) => {
      let count = voters.length;
      if (contest.category === "beauty") {
        const s = students.find((st) => st.id === id);
        if (s) count += s.tamagotchi.stats.cha * 0.5;
      }
      if (count > maxVotes) {
        maxVotes = count;
        winnerId = id;
      }
    });
    return students.find((s) => s.id === winnerId) || null;
  },
};
