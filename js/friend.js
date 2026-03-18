// ============================================
// friend.js - 친구 시스템
// ============================================

const Friend = {
  _ensure(student) {
    if (!student.friends) student.friends = [];
    if (!student.giftSentToday) student.giftSentToday = [];
    if (!student.coopMissions) student.coopMissions = [];
    const today = new Date().toISOString().split("T")[0];
    if (student.lastGiftDate !== today) {
      student.giftSentToday = [];
      student.lastGiftDate = today;
    }
  },

  // 친구 추가 (관리자가 양방향 연결)
  addFriend(studentId1, studentId2) {
    const s1 = Storage.getStudent(studentId1);
    const s2 = Storage.getStudent(studentId2);
    if (!s1 || !s2 || studentId1 === studentId2) return false;
    this._ensure(s1);
    this._ensure(s2);
    if (!s1.friends.includes(studentId2)) s1.friends.push(studentId2);
    if (!s2.friends.includes(studentId1)) s2.friends.push(studentId1);
    Storage.updateStudent(s1);
    Storage.updateStudent(s2);
    return true;
  },

  // 친구 삭제
  removeFriend(studentId1, studentId2) {
    const s1 = Storage.getStudent(studentId1);
    const s2 = Storage.getStudent(studentId2);
    if (s1) { this._ensure(s1); s1.friends = s1.friends.filter((f) => f !== studentId2); Storage.updateStudent(s1); }
    if (s2) { this._ensure(s2); s2.friends = s2.friends.filter((f) => f !== studentId1); Storage.updateStudent(s2); }
  },

  // 친구 목록 가져오기
  getFriends(student) {
    this._ensure(student);
    return student.friends.map((id) => Storage.getStudent(id)).filter(Boolean);
  },

  // 선물 보내기 (1일 친구당 1회, 3p 소모 → 상대방 5p 받음)
  sendGift(sender, receiverId) {
    this._ensure(sender);
    if (!sender.friends.includes(receiverId)) return { success: false, message: "친구가 아니에요!" };
    if (sender.giftSentToday.includes(receiverId)) return { success: false, message: "오늘 이미 선물했어요!" };
    if (sender.tamagotchi.points < 3) return { success: false, message: "포인트가 부족해요! (3p 필요)" };

    const receiver = Storage.getStudent(receiverId);
    if (!receiver) return { success: false, message: "친구를 찾을 수 없어요" };

    sender.tamagotchi.points -= 3;
    sender.giftSentToday.push(receiverId);
    receiver.tamagotchi.points += 5;

    // 양쪽 행복도 증가
    Care.ensure(sender);
    Care.ensure(receiver);
    sender.care.fun = Math.min(100, sender.care.fun + 10);
    receiver.care.fun = Math.min(100, receiver.care.fun + 15);

    Storage.updateStudent(sender);
    Storage.updateStudent(receiver);
    return { success: true, message: `${receiver.tamagotchi.name}에게 선물 완료! (+5p 전달, 서로 행복도 UP!)` };
  },

  // 함께 놀기 (친구와 놀면 서로 행복도 증가, 1일 1회)
  playTogether(student, friendId) {
    this._ensure(student);
    const today = new Date().toISOString().split("T")[0];
    const playKey = `play_${friendId}_${today}`;
    if (student.coopMissions.includes(playKey)) return { success: false, message: "오늘 이미 같이 놀았어요!" };

    const friend = Storage.getStudent(friendId);
    if (!friend) return { success: false, message: "친구를 찾을 수 없어요" };

    student.coopMissions.push(playKey);
    Care.ensure(student);
    Care.ensure(friend);
    student.care.fun = Math.min(100, student.care.fun + 20);
    friend.care.fun = Math.min(100, friend.care.fun + 20);

    // 양쪽에 보너스 EXP
    Tamagotchi.addExp(student, 5);
    Tamagotchi.addExp(friend, 5);

    Storage.updateStudent(student);
    Storage.updateStudent(friend);
    return {
      success: true,
      message: `${friend.tamagotchi.name}와 신나게 놀았어요! 서로 행복도+20, +5 EXP!`,
      friendName: friend.tamagotchi.name,
    };
  },

  // 친구 화면 렌더
  render(container) {
    const student = Storage.getCurrentStudent();
    if (!student) return;
    this._ensure(student);

    const friends = this.getFriends(student);
    const allStudents = Storage.getStudents().filter((s) => s.id !== student.id);

    let html = `<div class="friend-screen"><h2>👫 친구</h2>`;

    if (friends.length === 0) {
      html += '<p class="text-muted" style="text-align:center;padding:20px">아직 친구가 없어요.<br>선생님에게 친구를 연결해달라고 부탁하세요!</p>';
    }

    friends.forEach((f) => {
      Tamagotchi.ensureEvolution(f);
      Care.ensure(f);
      const fMood = calculateMood(f);
      const fMoodInfo = MOOD_STATES[fMood] || MOOD_STATES.normal;
      const giftSent = student.giftSentToday.includes(f.id);
      const today = new Date().toISOString().split("T")[0];
      const played = student.coopMissions.includes(`play_${f.id}_${today}`);

      html += `
        <div class="friend-card">
          <div class="friend-tama">
            ${TamagotchiRenderer.render(f.tamagotchi, 80, fMood)}
          </div>
          <div class="friend-info">
            <div class="friend-name">${f.tamagotchi.name} <span class="friend-student">(${f.name})</span></div>
            <div class="friend-level">Lv.${f.tamagotchi.level} ${fMoodInfo.icon}</div>
          </div>
          <div class="friend-actions">
            <button class="btn btn-small ${giftSent ? 'btn-disabled' : 'btn-primary'}"
                    data-gift="${f.id}" ${giftSent ? 'disabled' : ''}>
              🎁 ${giftSent ? '완료' : '선물 3p'}
            </button>
            <button class="btn btn-small ${played ? 'btn-disabled' : 'btn-secondary'}"
                    data-play-with="${f.id}" ${played ? 'disabled' : ''}>
              🤝 ${played ? '완료' : '같이놀기'}
            </button>
          </div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;

    // 선물 이벤트
    container.querySelectorAll("[data-gift]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const r = this.sendGift(student, btn.dataset.gift);
        Sound[r.success ? "care" : "error"]();
        UI.showToast(r.message, r.success ? "success" : "error");
        if (r.success) this.render(container);
      });
    });

    // 같이놀기 이벤트
    container.querySelectorAll("[data-play-with]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const r = this.playTogether(student, btn.dataset.playWith);
        if (r.success) {
          Sound.care();
          UI.showReaction({
            type: "play",
            emojis: ["🤝", "💫", "🎵", "❤️"],
            speech: `${r.friendName}와 놀아서 행복해~!`,
            animation: "jump",
          });
          setTimeout(() => this.render(container), 2500);
        } else {
          UI.showToast(r.message, "error");
        }
      });
    });
  },

  // 관리자: 친구 관리
  renderAdmin(container) {
    const students = Storage.getStudents();

    let html = '<div class="admin-section"><h3>친구 관리</h3>';
    html += '<p class="text-muted" style="margin-bottom:12px">두 학생을 선택하면 친구로 연결됩니다.</p>';

    html += `
      <div class="friend-connect">
        <select id="friend-s1"><option value="">학생 1 선택</option>${students.map((s) => `<option value="${s.id}">${s.name} (${s.tamagotchi.name})</option>`).join("")}</select>
        <span>🤝</span>
        <select id="friend-s2"><option value="">학생 2 선택</option>${students.map((s) => `<option value="${s.id}">${s.name} (${s.tamagotchi.name})</option>`).join("")}</select>
        <button class="btn btn-primary btn-small" id="connect-friends">연결</button>
      </div>
    `;

    // 현재 친구 관계 표시
    html += '<h4 style="margin-top:16px">현재 친구 관계</h4>';
    const pairs = new Set();
    students.forEach((s) => {
      (s.friends || []).forEach((fId) => {
        const key = [s.id, fId].sort().join("_");
        if (!pairs.has(key)) {
          pairs.add(key);
          const f = students.find((st) => st.id === fId);
          if (f) {
            html += `
              <div class="friend-pair">
                <span>${s.name} (${s.tamagotchi.name})</span>
                <span>🤝</span>
                <span>${f.name} (${f.tamagotchi.name})</span>
                <button class="btn btn-small btn-danger" data-unfriend="${s.id}" data-unfriend2="${fId}">해제</button>
              </div>
            `;
          }
        }
      });
    });
    if (pairs.size === 0) html += '<p class="text-muted">연결된 친구가 없어요.</p>';

    html += '</div>';
    container.innerHTML = html;

    document.getElementById("connect-friends")?.addEventListener("click", () => {
      const s1 = document.getElementById("friend-s1").value;
      const s2 = document.getElementById("friend-s2").value;
      if (!s1 || !s2 || s1 === s2) { UI.showToast("서로 다른 학생 2명을 선택하세요", "error"); return; }
      if (this.addFriend(s1, s2)) {
        UI.showToast("친구 연결 완료!", "success");
        this.renderAdmin(container);
      }
    });

    container.querySelectorAll("[data-unfriend]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.removeFriend(btn.dataset.unfriend, btn.dataset.unfriend2);
        UI.showToast("친구 해제 완료", "info");
        this.renderAdmin(container);
      });
    });
  },
};
