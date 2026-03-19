// ============================================
// admin.js - 관리자(선생님) 모드
// ============================================

const Admin = {
  isAuthenticated: false,

  render(container) {
    if (!this.isAuthenticated) {
      this._renderLogin(container);
      return;
    }

    container.innerHTML = `
      <div class="admin-header">
        <h2>🔑 선생님 모드</h2>
        <button class="btn btn-secondary btn-small" id="admin-logout">학생 모드로 ↩️</button>
      </div>
      <div class="admin-tabs">
        <button class="admin-tab active" data-admin-tab="missions">미션 관리</button>
        <button class="admin-tab" data-admin-tab="students">학생 관리</button>
        <button class="admin-tab" data-admin-tab="contest">경연대회</button>
        <button class="admin-tab" data-admin-tab="snackbox">간식상자</button>
        <button class="admin-tab" data-admin-tab="event">이벤트</button>
        <button class="admin-tab" data-admin-tab="teams">팀관리</button>
        <button class="admin-tab" data-admin-tab="dashboard">대시보드</button>
        <button class="admin-tab" data-admin-tab="friends">친구관리</button>
        <button class="admin-tab" data-admin-tab="attendance">출결통계</button>
        <button class="admin-tab" data-admin-tab="mood">감정현황</button>
        <button class="admin-tab" data-admin-tab="report">리포트</button>
        <button class="admin-tab" data-admin-tab="settings">설정</button>
      </div>
      <div class="admin-content" id="admin-content"></div>
    `;

    document.getElementById("admin-logout").addEventListener("click", () => {
      this.isAuthenticated = false;
      App.switchTab("home");
    });

    const content = document.getElementById("admin-content");
    this._renderMissions(content);

    container.querySelectorAll(".admin-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        container.querySelectorAll(".admin-tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        tab.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        switch (tab.dataset.adminTab) {
          case "missions": this._renderMissions(content); break;
          case "students": this._renderStudents(content); break;
          case "contest": this._renderContest(content); break;
          case "snackbox": this._renderSnackBox(content); break;
          case "event": GameEvent.renderAdmin(content); break;
          case "teams": Team.renderAdmin(content); break;
          case "dashboard": Dashboard.renderAdmin(content); break;
          case "friends": Friend.renderAdmin(content); break;
          case "attendance": Attendance.renderAdmin(content); break;
          case "mood": Mood.renderAdmin(content); break;
          case "report": Report.renderAdmin(content); break;
          case "settings": this._renderSettings(content); break;
        }
      });
    });
  },

  _renderLogin(container) {
    container.innerHTML = `
      <div class="admin-login">
        <h2>🔑 선생님 모드</h2>
        <p>관리자 PIN을 입력하세요</p>
        <input type="password" id="admin-pin" maxlength="4" placeholder="PIN 4자리" class="pin-input">
        <button class="btn btn-primary" id="admin-login-btn">확인</button>
        <p class="text-muted">기본 PIN: 0000</p>
      </div>
    `;

    const loginBtn = document.getElementById("admin-login-btn");
    const pinInput = document.getElementById("admin-pin");

    const doLogin = () => {
      const pin = pinInput.value;
      if (pin === Storage.getAdminPin()) {
        this.isAuthenticated = true;
        this.render(container);
      } else {
        UI.showToast("PIN이 틀렸어요!", "error");
        pinInput.value = "";
      }
    };

    loginBtn.addEventListener("click", doLogin);
    pinInput.addEventListener("keyup", (e) => { if (e.key === "Enter") doLogin(); });
  },

  _renderMissions(container) {
    const missions = Storage.getMissions() || [];
    const code = Storage.getVerificationCode();

    let html = `
      <div class="admin-section">
        <div class="code-section">
          <h3>오늘의 인증코드</h3>
          <div class="code-display">
            <span class="code-value" id="current-code">${code}</span>
            <button class="btn btn-small btn-primary" id="new-code-btn">새 코드 생성</button>
          </div>
        </div>
        <h3>미션 목록 <button class="btn btn-small btn-primary" id="add-mission-btn">+ 미션 추가</button></h3>
        <div class="mission-list-admin">
    `;

    const typeLabels = { attendance: "📋 출석", homework: "📝 과제", exam: "📊 시험", special: "⭐ 특별" };
    missions.forEach((m) => {
      html += `
        <div class="mission-item-admin">
          <span class="mission-type-badge">${typeLabels[m.type] || m.type}</span>
          <span class="mission-title">${m.title}</span>
          <span class="mission-exp">+${m.exp} EXP</span>
          <span class="mission-repeat">${m.repeatable ? '매일' : '1회'}</span>
          <button class="btn btn-small btn-secondary" data-edit-mission="${m.id}">✏️</button>
          <button class="btn btn-small btn-danger" data-delete-mission="${m.id}">🗑️</button>
        </div>
      `;
    });

    html += '</div></div>';
    container.innerHTML = html;

    document.getElementById("new-code-btn").addEventListener("click", () => {
      const newCode = String(Math.floor(1000 + Math.random() * 9000));
      Storage.setVerificationCode(newCode);
      document.getElementById("current-code").textContent = newCode;
      UI.showToast(`새 인증코드: ${newCode}`, "success");
    });

    document.getElementById("add-mission-btn").addEventListener("click", async () => {
      const result = await UI.prompt("미션 추가", [
        { id: "title", label: "미션 이름", placeholder: "예: 수학 숙제 제출" },
        { id: "description", label: "설명", placeholder: "미션 설명을 입력하세요" },
        { id: "exp", label: "보상 경험치", type: "number", value: "30" },
        { id: "type", label: "유형 (attendance/homework/exam/special)", value: "homework" },
        { id: "repeatable", label: "반복 여부 (매일: yes / 1회: no)", value: "yes" },
      ]);
      if (result && result.title) {
        result.repeatable = result.repeatable === "yes" || result.repeatable === "Y";
        Mission.addMission(result);
        UI.showToast("미션이 추가되었어요!", "success");
        this._renderMissions(container);
      }
    });

    container.querySelectorAll("[data-edit-mission]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const missions = Storage.getMissions() || [];
        const mission = missions.find((m) => m.id === btn.dataset.editMission);
        if (!mission) return;
        const result = await UI.prompt("미션 수정", [
          { id: "title", label: "미션 이름", value: mission.title },
          { id: "description", label: "설명", value: mission.description || "" },
          { id: "exp", label: "보상 경험치", type: "number", value: String(mission.exp) },
          { id: "type", label: "유형 (attendance/homework/exam/special)", value: mission.type },
          { id: "repeatable", label: "반복 여부 (매일: yes / 1회: no)", value: mission.repeatable ? "yes" : "no" },
        ]);
        if (result && result.title) {
          Mission.updateMission(mission.id, {
            title: result.title,
            description: result.description || "",
            exp: parseInt(result.exp) || mission.exp,
            type: result.type || mission.type,
            repeatable: result.repeatable === "yes" || result.repeatable === "Y",
          });
          UI.showToast("미션이 수정되었어요!", "success");
          this._renderMissions(container);
        }
      });
    });

    container.querySelectorAll("[data-delete-mission]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const ok = await UI.confirm("미션 삭제", "이 미션을 삭제할까요?");
        if (ok) {
          Mission.deleteMission(btn.dataset.deleteMission);
          UI.showToast("미션이 삭제되었어요", "info");
          this._renderMissions(container);
        }
      });
    });
  },

  _renderStudents(container) {
    const students = Storage.getStudents();
    let html = '<div class="admin-section"><h3>학생 목록</h3>';

    if (students.length === 0) {
      html += '<p class="text-muted">등록된 학생이 없어요.</p>';
    }

    students.forEach((s) => {
      html += `
        <div class="student-item-admin">
          <div class="student-info">
            <strong>${s.name}</strong>
            <span>다마고치: ${s.tamagotchi.name} (Lv.${s.tamagotchi.level})</span>
            <span>포인트: ${s.tamagotchi.points}p | 간식상자: ${s.snackBoxChances}회</span>
          </div>
          <div class="student-actions">
            <button class="btn btn-small btn-primary" data-approve-student="${s.id}">미션 승인</button>
            <button class="btn btn-small btn-danger" data-delete-student="${s.id}">삭제</button>
          </div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;

    container.querySelectorAll("[data-approve-student]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const student = Storage.getStudent(btn.dataset.approveStudent);
        if (!student) return;

        const missions = Mission.getActiveMissions();
        const missionOptions = missions.map((m) => `
          <div class="approve-mission-row">
            <span>${m.title} (+${m.exp} EXP)</span>
            <button class="btn btn-small btn-primary" data-direct-approve="${m.id}" data-student-id="${student.id}">승인</button>
          </div>
        `).join("");

        UI.showModal(`${student.name} 미션 직접 승인`, `
          <p class="text-muted">인증코드 없이 미션을 직접 완료 처리합니다.</p>
          <div class="approve-mission-list">${missionOptions}</div>
        `, []);

        setTimeout(() => {
          document.querySelectorAll("[data-direct-approve]").forEach((approveBtn) => {
            approveBtn.addEventListener("click", () => {
              const sid = approveBtn.dataset.studentId;
              const mid = approveBtn.dataset.directApprove;
              const s = Storage.getStudent(sid);
              if (!s) return;

              const missions2 = Storage.getMissions() || [];
              const mission = missions2.find((m) => m.id === mid);
              if (!mission) return;

              // 반복 미션 오늘 완료 확인
              if (mission.repeatable && Mission.isCompletedToday(s, mid)) {
                UI.showToast("이 학생은 오늘 이미 완료했어요!", "error");
                return;
              }
              if (!mission.repeatable && Mission.isCompleted(s, mid)) {
                UI.showToast("이미 완료한 미션이에요", "error");
                return;
              }

              s.completedMissions.push({
                missionId: mid,
                completedAt: new Date().toISOString().split("T")[0],
              });

              if (mission.type === "attendance") {
                Mission._updateStreak(s);
              }

              const levelUps = Tamagotchi.addExp(s, mission.exp);
              UI.closeModal();
              UI.showToast(`${s.name}: ${mission.title} 승인 완료! +${mission.exp} EXP`, "success");
              if (levelUps.length > 0) {
                setTimeout(() => UI.showToast(`${s.tamagotchi.name} 레벨 UP! Lv.${levelUps[levelUps.length - 1].level}`, "success"), 500);
              }
              this._renderStudents(container);
            });
          });
        }, 100);
      });
    });

    container.querySelectorAll("[data-delete-student]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const ok = await UI.confirm("학생 삭제", "이 학생을 삭제할까요? 모든 데이터가 사라집니다.");
        if (ok) {
          Storage.deleteStudent(btn.dataset.deleteStudent);
          UI.showToast("학생이 삭제되었어요", "info");
          this._renderStudents(container);
        }
      });
    });
  },

  _renderContest(container) {
    const contest = Storage.getContest();

    let html = '<div class="admin-section"><h3>경연대회 관리</h3>';

    if (contest && contest.active) {
      const winner = Contest.getWinner(contest);
      html += `
        <div class="contest-admin-info">
          <p><strong>${contest.title}</strong></p>
          <p>카테고리: ${contest.category} | 마감: ${contest.endDate}</p>
          ${winner ? `<p>현재 1등: ${winner.tamagotchi.name} (${winner.name})</p>` : ''}
          <button class="btn btn-danger" id="end-contest-btn">대회 종료</button>
        </div>
      `;
    } else {
      html += `
        <p>진행 중인 대회가 없습니다.</p>
        <button class="btn btn-primary" id="create-contest-btn">새 대회 만들기</button>
      `;
    }

    html += '</div>';
    container.innerHTML = html;

    const createBtn = document.getElementById("create-contest-btn");
    if (createBtn) {
      createBtn.addEventListener("click", async () => {
        const result = await UI.prompt("경연대회 만들기", [
          { id: "title", label: "대회 이름", placeholder: "예: 3월 멋진 다마고치 대회" },
          { id: "endDate", label: "마감일 (YYYY-MM-DD)", value: this._getNextWeek() },
          { id: "category", label: "카테고리 (beauty/power/popular)", value: "beauty" },
        ]);
        if (result && result.title) {
          Contest.createContest(result);
          UI.showToast("대회가 시작되었어요!", "success");
          this._renderContest(container);
        }
      });
    }

    const endBtn = document.getElementById("end-contest-btn");
    if (endBtn) {
      endBtn.addEventListener("click", async () => {
        const ok = await UI.confirm("대회 종료", "대회를 종료하고 1등에게 간식상자를 줄까요?");
        if (ok) {
          const c = Contest.endContest();
          const winner = Contest.getWinner(c);
          if (winner) {
            UI.showToast(`🏆 1등: ${winner.tamagotchi.name} (${winner.name}) - 간식상자 1회 지급!`, "success", 4000);
          }
          this._renderContest(container);
        }
      });
    }
  },

  _renderSnackBox(container) {
    const students = Storage.getStudents();
    let html = '<div class="admin-section"><h3>🍪 간식상자 관리</h3>';

    students.forEach((s) => {
      html += `
        <div class="snackbox-item">
          <span><strong>${s.name}</strong>: ${s.snackBoxChances}회 남음</span>
          ${s.snackBoxChances > 0
            ? `<button class="btn btn-small btn-primary" data-use-snack="${s.id}">사용 처리</button>`
            : '<span class="text-muted">기회 없음</span>'}
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;

    container.querySelectorAll("[data-use-snack]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const ok = await UI.confirm("간식상자 사용", "간식상자 기회 1회를 사용 처리할까요?");
        if (ok) {
          const student = Storage.getStudent(btn.dataset.useSnack);
          if (student && student.snackBoxChances > 0) {
            student.snackBoxChances -= 1;
            Storage.updateStudent(student);
            UI.showToast(`${student.name}의 간식상자 사용 완료!`, "success");
            this._renderSnackBox(container);
          }
        }
      });
    });
  },

  _renderSettings(container) {
    const academyName = Storage.getAcademyName();

    container.innerHTML = `
      <div class="admin-section">
        <h3>🏫 학원 정보</h3>
        <div class="form-group">
          <label>학원 이름 (공유카드/리포트에 표시)</label>
          <div class="input-row">
            <input type="text" id="academy-name" value="${academyName}" maxlength="20" placeholder="예: 최강수학학원">
            <button class="btn btn-primary btn-small" id="save-academy-btn">저장</button>
          </div>
          <p class="text-muted" style="margin-top:4px;font-size:0.75rem">현재: "${academyName}" → 공유 카드, 학부모 리포트에 반영됩니다.</p>
        </div>

        <h3 style="margin-top:20px">🔑 관리자 PIN</h3>
        <div class="form-group">
          <div class="input-row">
            <input type="password" id="new-pin" maxlength="4" placeholder="새 PIN 4자리" class="pin-input">
            <button class="btn btn-primary btn-small" id="change-pin-btn">변경</button>
          </div>
        </div>

        <h3 style="margin-top:20px">💾 데이터 백업 / 복원</h3>
        <div class="backup-section">
          <div class="backup-info">
            <p>학생 ${Storage.getStudents().length}명 | 미션 ${(Storage.getMissions() || []).length}개 | 팀 ${Storage.getTeams().length}개</p>
          </div>
          <div class="backup-buttons">
            <button class="btn btn-primary" id="backup-btn">📥 데이터 백업 (다운로드)</button>
            <label class="btn btn-secondary backup-upload-label">
              📤 데이터 복원 (불러오기)
              <input type="file" id="restore-input" accept=".json" style="display:none">
            </label>
          </div>
          <p class="text-muted" style="margin-top:8px;font-size:0.75rem">
            백업: 모든 학생/미션/아이템/팀/이벤트 데이터를 JSON 파일로 저장합니다.<br>
            복원: 백업 파일을 불러와 기존 데이터를 덮어씁니다. (기존 데이터는 사라집니다)
          </p>
        </div>

        <h3 style="margin-top:20px">⚠️ 위험 영역</h3>
        <div class="form-group">
          <button class="btn btn-danger" id="reset-all-btn">모든 데이터 초기화</button>
        </div>
      </div>
    `;

    // 학원 이름 저장
    document.getElementById("save-academy-btn").addEventListener("click", () => {
      const name = document.getElementById("academy-name").value.trim();
      if (name) {
        Storage.setAcademyName(name);
        UI.showToast(`학원 이름이 "${name}"(으)로 변경되었어요!`, "success");
      } else {
        UI.showToast("학원 이름을 입력해주세요", "error");
      }
    });

    // PIN 변경
    document.getElementById("change-pin-btn").addEventListener("click", () => {
      const newPin = document.getElementById("new-pin").value;
      if (/^\d{4}$/.test(newPin)) {
        Storage.setAdminPin(newPin);
        document.getElementById("new-pin").value = "";
        UI.showToast("PIN이 변경되었어요!", "success");
      } else {
        UI.showToast("PIN은 숫자 4자리여야 해요", "error");
      }
    });

    // 데이터 백업
    document.getElementById("backup-btn").addEventListener("click", () => {
      this._exportData();
    });

    // 데이터 복원
    document.getElementById("restore-input").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) this._importData(file, container);
    });

    // 초기화
    document.getElementById("reset-all-btn").addEventListener("click", async () => {
      const ok = await UI.confirm("⚠️ 데이터 초기화", "정말 모든 데이터를 삭제할까요? 이 작업은 되돌릴 수 없어요!\n\n먼저 백업을 권장합니다.");
      if (ok) {
        localStorage.clear();
        location.reload();
      }
    });
  },

  // 데이터 백업 (JSON 다운로드)
  _exportData() {
    const data = {};
    const prefix = Storage.PREFIX;

    // localStorage에서 atg_ 접두사 키 모두 수집
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(prefix)) {
        try {
          data[key] = JSON.parse(localStorage.getItem(key));
        } catch {
          data[key] = localStorage.getItem(key);
        }
      }
    }

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const date = new Date().toISOString().split("T")[0];
    const academyName = Storage.getAcademyName();
    link.download = `${academyName}_다마고치_백업_${date}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);

    UI.showToast("백업 파일이 저장되었어요!", "success");
  },

  // 데이터 복원 (JSON 불러오기)
  async _importData(file, container) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // 유효성 검사: atg_ 키가 있는지 확인
      const keys = Object.keys(data);
      const validKeys = keys.filter((k) => k.startsWith(Storage.PREFIX));

      if (validKeys.length === 0) {
        UI.showToast("올바른 백업 파일이 아니에요!", "error");
        return;
      }

      // 학생 수 확인
      const students = data[Storage.PREFIX + "students"];
      const studentCount = Array.isArray(students) ? students.length : 0;

      const ok = await UI.confirm(
        "📤 데이터 복원",
        `백업 파일: ${file.name}\n데이터 ${validKeys.length}개 항목, 학생 ${studentCount}명\n\n기존 데이터를 모두 덮어씁니다. 계속할까요?`
      );

      if (!ok) return;

      // 기존 atg_ 데이터 삭제
      const toRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(Storage.PREFIX)) toRemove.push(key);
      }
      toRemove.forEach((k) => localStorage.removeItem(k));

      // 새 데이터 넣기
      validKeys.forEach((key) => {
        localStorage.setItem(key, JSON.stringify(data[key]));
      });

      UI.showToast(`복원 완료! (${studentCount}명, ${validKeys.length}개 항목)`, "success");
      setTimeout(() => location.reload(), 1500);
    } catch (e) {
      UI.showToast("파일을 읽을 수 없어요. JSON 형식을 확인해주세요.", "error");
    }
  },

  _getNextWeek() {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  },
};
