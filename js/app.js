// ============================================
// app.js - 앱 초기화, 탭 전환, 이벤트 바인딩
// ============================================

const App = {
  currentTab: "home",

  _deferredPrompt: null,

  init() {
    Storage.initAll();
    Sound.isEnabled();
    this._registerSW();
    this._listenInstall();
    this._checkFirstRun();
  },

  _registerSW() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    }
  },

  // PWA 설치 이벤트 캡처
  _listenInstall() {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      this._deferredPrompt = e;
      this._showInstallBanner();
    });
  },

  // 설치 유도 배너
  _showInstallBanner() {
    // 이미 설치된 상태면 표시 안 함
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (Storage.get("install_dismissed", false)) return;

    const banner = document.createElement("div");
    banner.id = "install-banner";
    banner.innerHTML = `
      <div class="install-banner">
        <span class="install-text">📲 홈화면에 추가하면 앱처럼 사용할 수 있어요!</span>
        <div class="install-buttons">
          <button class="btn btn-primary btn-small" id="install-btn">설치하기</button>
          <button class="btn btn-ghost btn-small" id="install-dismiss" style="color:#636E72">닫기</button>
        </div>
      </div>
    `;
    document.body.appendChild(banner);

    document.getElementById("install-btn").addEventListener("click", async () => {
      if (this._deferredPrompt) {
        this._deferredPrompt.prompt();
        const result = await this._deferredPrompt.userChoice;
        if (result.outcome === "accepted") {
          UI.showToast("앱이 설치되었어요! 🎉", "success");
        }
        this._deferredPrompt = null;
      } else {
        // iOS 등 beforeinstallprompt 미지원 시 안내
        UI.showModal("📲 앱 설치 방법", `
          <div style="text-align:left;font-size:0.9rem;line-height:1.8">
            <p><strong>Android Chrome:</strong></p>
            <p>⋮ 메뉴 → "앱 설치" 또는 "홈 화면에 추가"</p>
            <br>
            <p><strong>iPhone Safari:</strong></p>
            <p>하단 공유(□↑) → "홈 화면에 추가"</p>
            <br>
            <p class="text-muted">※ iPhone은 Safari에서만 설치 가능합니다</p>
          </div>
        `, [{ text: "확인", class: "btn btn-primary" }]);
      }
      banner.remove();
    });

    document.getElementById("install-dismiss").addEventListener("click", () => {
      Storage.set("install_dismissed", true);
      banner.remove();
    });
  },

  _checkFirstRun() {
    const student = Storage.getCurrentStudent();
    if (!student) {
      this._showWelcome();
    } else {
      Tamagotchi.ensureEvolution(student);
      Storage.updateStudent(student);
      // 튜토리얼 체크
      if (Tutorial.shouldShow()) {
        Tutorial.show(() => this._startAppWithMood());
      } else {
        this._startAppWithMood();
      }
    }
  },

  _showWelcome() {
    document.getElementById("app").innerHTML = `
      <div class="welcome-screen">
        <h1>🏫 학원 다마고치</h1>
        <p>나만의 다마고치를 키워보세요!</p>
        <div class="welcome-form">
          <div class="form-group">
            <label>학생 이름</label>
            <input type="text" id="student-name" placeholder="이름을 입력하세요" maxlength="10">
          </div>
          <div class="form-group">
            <label>다마고치 이름</label>
            <input type="text" id="tama-name" placeholder="다마고치 이름을 지어주세요" maxlength="10">
          </div>
          <button class="btn btn-primary btn-large" id="start-btn">시작하기!</button>
        </div>
        <div class="welcome-existing" id="existing-section" style="display:none">
          <hr>
          <p>기존 학생으로 로그인:</p>
          <select id="existing-select"></select>
          <button class="btn btn-secondary" id="login-btn">로그인</button>
        </div>
      </div>
    `;

    const students = Storage.getStudents();
    if (students.length > 0) {
      document.getElementById("existing-section").style.display = "block";
      const select = document.getElementById("existing-select");
      students.forEach((s) => {
        const opt = document.createElement("option");
        opt.value = s.id;
        opt.textContent = `${s.name} (${s.tamagotchi.name} Lv.${s.tamagotchi.level})`;
        select.appendChild(opt);
      });

      document.getElementById("login-btn").addEventListener("click", () => {
        const student = Storage.getStudent(select.value);
        if (student) {
          Tamagotchi.ensureEvolution(student);
          Storage.updateStudent(student);
        }
        Storage.setCurrentStudentId(select.value);
        this._startApp();
      });
    }

    document.getElementById("start-btn").addEventListener("click", () => {
      const name = document.getElementById("student-name").value.trim();
      const tamaName = document.getElementById("tama-name").value.trim();
      if (!name || !tamaName) {
        UI.showToast("이름을 모두 입력해주세요!", "error");
        return;
      }
      const student = createDefaultStudent(name, tamaName);
      Storage.updateStudent(student);
      Storage.setCurrentStudentId(student.id);
      UI.showToast(`${tamaName}이(가) 태어났어요! 🐣`, "success");
      this._startApp();
    });
  },

  _startAppWithMood() {
    const student = Storage.getCurrentStudent();
    if (!student) return this._showWelcome();

    // 감정 체크인: 오늘 아직 안 했으면 팝업 표시
    if (!Mood.isCheckedToday(student)) {
      this._startApp();
      setTimeout(() => {
        Mood.showCheckIn(student, () => this.renderHome());
      }, 500);
    } else {
      this._startApp();
    }
  },

  _startApp() {
    const student = Storage.getCurrentStudent();
    if (!student) return this._showWelcome();

    document.getElementById("app").innerHTML = `
      <header class="app-header">
        <h1>🏫 학원 다마고치</h1>
        <div class="header-actions">
          <button class="btn btn-small btn-ghost" id="sound-toggle">${Sound.isEnabled() ? '🔊' : '🔇'}</button>
          <button class="btn btn-small btn-ghost" id="switch-student-btn">👤 ${UI.esc(student.name)}</button>
          <button class="btn btn-small btn-ghost" id="admin-btn">🔑</button>
        </div>
      </header>
      <main class="app-main">
        <div class="tab-content" id="tab-content"></div>
      </main>
      <nav class="tab-bar">
        <button class="tab-btn active" data-tab="home">🏠<span>홈</span></button>
        <button class="tab-btn" data-tab="mission">📋<span>미션</span></button>
        <button class="tab-btn" data-tab="minigame">🧮<span>게임</span></button>
        <button class="tab-btn" data-tab="challenge">🏆<span>챌린지</span></button>
        <button class="tab-btn" data-tab="friend">👫<span>친구</span></button>
        <button class="tab-btn" data-tab="house">🏠<span>하우스</span></button>
      </nav>
    `;

    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => this.switchTab(btn.dataset.tab));
    });

    document.getElementById("sound-toggle").addEventListener("click", () => {
      const enabled = Sound.toggle();
      document.getElementById("sound-toggle").textContent = enabled ? '🔊' : '🔇';
      if (enabled) Sound.click();
    });

    document.getElementById("switch-student-btn").addEventListener("click", () => {
      Storage.setCurrentStudentId(null);
      this._showWelcome();
    });

    document.getElementById("admin-btn").addEventListener("click", () => {
      this.switchTab("admin");
    });

    this.switchTab("home");
  },

  switchTab(tab) {
    this.currentTab = tab;
    const content = document.getElementById("tab-content");
    if (!content) return;

    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tab);
    });

    switch (tab) {
      case "home": this.renderHome(); break;
      case "mission": this.renderMission(); break;
      case "minigame": Minigame.render(content); break;
      case "challenge": Challenge.render(content); break;
      case "friend": Friend.render(content); break;
      case "house": House.render(content); break;
      case "shop": Shop.render(content); break;
      case "contest": Contest.render(content); break;
      case "badges": Badge.render(content); break;
      case "admin": Admin.render(content); break;
    }
  },

  renderHome() {
    const content = document.getElementById("tab-content");
    if (!content || this.currentTab !== "home") return;

    const student = Storage.getCurrentStudent();
    if (!student) return;

    Tamagotchi.ensureEvolution(student);
    const tama = student.tamagotchi;
    const expPercent = Tamagotchi.getExpPercent(student);
    const expToNext = Tamagotchi.getExpToNext(student);
    const stats = tama.stats;
    const evo = tama.evolution;
    const mood = calculateMood(student);
    const moodInfo = MOOD_STATES[mood] || MOOD_STATES.normal;

    // 진화 단계 표시 텍스트
    let evoLabel = evo.stageName;
    if (evo.finalForm && FINAL_FORMS[evo.finalForm]) {
      evoLabel = FINAL_FORMS[evo.finalForm].icon + " " + FINAL_FORMS[evo.finalForm].name;
    }

    // 돌봄 게이지 업데이트
    Care.updateGauges(student);

    content.innerHTML = `
      <div class="home-screen">
        ${GameEvent.renderBanner()}
        ${Secret.renderRoulette(student)}
        <div class="tama-display">
          <div class="tama-character ${mood === 'sad' || mood === 'hungry' ? 'tama-sad' : ''} ${student.care?.isSick ? 'tama-sick' : ''}" id="tama-character">
            ${TamagotchiRenderer.render(tama, 200, mood)}
          </div>
          <div class="tama-info">
            <div class="tama-name">${UI.esc(tama.name)} ${student.care?.isSick ? '🤒' : ''}</div>
            <div class="tama-level">Lv. ${tama.level}</div>
            <div class="evolution-stage-label">${evoLabel} 단계</div>
            <div class="mood-label">${moodInfo.icon} ${moodInfo.name}</div>
            ${Mood.getTodayMood(student) ? `<div class="mood-today-badge" id="mood-badge">${Mood.getTodayMood(student).emoji} 오늘의 기분: ${Mood.getTodayMood(student).label}</div>` : ''}
          </div>
        </div>

        ${Care.renderGauges(student)}
        ${Care.renderActions(student)}
        ${Care.renderRoutine(student)}

        <div class="exp-section">
          <div class="exp-bar">
            <div class="exp-fill" style="width: ${expPercent}%"></div>
          </div>
          <div class="exp-text">EXP: ${tama.exp} / ${expToNext}</div>
        </div>

        <div class="stats-display">
          <div class="stat-chip"><span class="stat-label">💪 STR</span><span class="stat-num">${stats.str}</span></div>
          <div class="stat-chip"><span class="stat-label">🧠 INT</span><span class="stat-num">${stats.int}</span></div>
          <div class="stat-chip"><span class="stat-label">✨ CHA</span><span class="stat-num">${stats.cha}</span></div>
          <div class="stat-chip"><span class="stat-label">❤️ STA</span><span class="stat-num">${stats.sta}</span></div>
        </div>

        ${Team.renderTeamInfo(student.id)}
        ${Secret.renderDailyDeal(student)}

        <div class="home-footer">
          <div class="footer-stat">💰 ${tama.points}p</div>
          <div class="footer-stat">🍪 간식상자 ${student.snackBoxChances}회</div>
          <div class="footer-stat">🔥 연속출석 ${student.streakDays}일</div>
        </div>

        <div class="home-buttons">
          <button class="btn btn-secondary btn-small" id="diary-btn">📖 일기</button>
          <button class="btn btn-secondary btn-small" id="dex-btn">🔬 도감</button>
          <button class="btn btn-secondary btn-small" id="badge-btn">🏅 업적</button>
          <button class="btn btn-secondary btn-small" id="calendar-btn">📅 출석</button>
          <button class="btn btn-secondary btn-small" id="ranking-btn">📊 랭킹</button>
          <button class="btn btn-secondary btn-small" id="shop-btn">🛒 상점</button>
          <button class="btn btn-secondary btn-small" id="contest-btn">🏆 경연</button>
          <button class="btn btn-secondary btn-small" id="report-btn">📊 리포트</button>
          <button class="btn btn-small share-btn" id="share-btn">📤 공유</button>
        </div>
        <div class="season-indicator" style="background: ${getCurrentSeason().bgColor}; color: ${getCurrentSeason().accent}">
          ${getCurrentSeason().icon} ${getCurrentSeason().name} 시즌
        </div>
      </div>
    `;

    // 돌봄 버튼 (퀵 퀴즈 연동)
    const careHandler = (action) => {
      const r = action();
      if (r.success && r.reaction) {
        Sound.care();
        UI.showReaction(r.reaction);
        setTimeout(() => this.renderHome(), 2500);
      } else {
        UI.showToast(r.message, "error");
      }
    };

    const quizCareHandler = async (careType, careAction) => {
      // 이미 완료된 돌봄이면 퀴즈 없이 바로 메시지
      const care = student.care || {};
      if ((careType === "feed" && care.fedToday) ||
          (careType === "wash" && care.washedToday) ||
          (careType === "play" && care.playedToday)) {
        careHandler(careAction);
        return;
      }
      // 퀵 퀴즈 후 돌봄
      await QuickQuiz.showBeforeCare(student, careType);
      careHandler(careAction);
    };

    document.getElementById("care-feed")?.addEventListener("click", () => quizCareHandler("feed", () => Care.feed(student)));
    document.getElementById("care-wash")?.addEventListener("click", () => quizCareHandler("wash", () => Care.wash(student)));
    document.getElementById("care-play")?.addEventListener("click", () => quizCareHandler("play", () => Care.play(student)));

    // 할인 상점 구매
    document.getElementById("buy-deal")?.addEventListener("click", () => {
      if (Secret.buyDailyDeal(student)) {
        UI.showToast("할인 구매 완료!", "success");
        this.renderHome();
      }
    });

    // 룰렛
    document.getElementById("spin-roulette")?.addEventListener("click", () => {
      Sound.roulette();
      const reward = Secret.spin(student);
      if (reward) {
        UI.showModal("🎰 행운의 룰렛!", `
          <div style="text-align:center;padding:20px;">
            <div style="font-size:2rem;margin-bottom:12px;">🎉</div>
            <div style="font-size:1.2rem;font-weight:700;">${reward.name} 당첨!</div>
          </div>
        `, [{ text: "좋아!", class: "btn btn-primary" }]);
        this.renderHome();
      }
    });

    // 일일 루틴 보너스 자동 체크
    if (Care.claimDailyBonus(student)) {
      UI.showToast("🌟 완벽한 하루! +20 EXP 보너스!", "success");
    }

    // 일기 자동 생성
    Diary.generateToday(student);

    document.getElementById("diary-btn").addEventListener("click", () => {
      Diary.showDiary(student);
    });

    document.getElementById("dex-btn").addEventListener("click", () => {
      this.showEvolutionDex(student);
    });

    document.getElementById("shop-btn")?.addEventListener("click", () => {
      this.switchTab("shop");
    });

    document.getElementById("contest-btn")?.addEventListener("click", () => {
      this.switchTab("contest");
    });

    document.getElementById("badge-btn").addEventListener("click", () => {
      this.switchTab("badges");
    });

    document.getElementById("calendar-btn").addEventListener("click", () => {
      Calendar.show(student);
    });

    document.getElementById("ranking-btn").addEventListener("click", () => {
      Ranking.showRankingModal();
    });

    document.getElementById("report-btn").addEventListener("click", () => {
      Report.showMyReport(student);
    });

    document.getElementById("share-btn").addEventListener("click", () => {
      Share.downloadCard(student);
    });

    // 뱃지 자동 체크
    const newBadges = Badge.checkNewBadges(student);
    if (newBadges.length > 0) {
      setTimeout(() => newBadges.forEach((b) => Badge.showBadgeNotification(b)), 300);
    }
  },

  // 진화 도감 모달
  showEvolutionDex(student) {
    Tamagotchi.ensureEvolution(student);
    const currentStage = student.tamagotchi.evolution.stage;
    const currentForm = student.tamagotchi.evolution.finalForm;

    let html = '<div class="dex-grid">';

    // Stage 1~4
    EVOLUTION_TABLE.slice(0, 4).forEach((evo) => {
      const unlocked = currentStage >= evo.stage;
      html += `
        <div class="dex-item ${unlocked ? '' : 'locked'}">
          <div class="dex-stage">Stage ${evo.stage}</div>
          <div class="dex-character">
            ${unlocked
              ? TamagotchiRenderer.render({
                  ...student.tamagotchi,
                  evolution: { stage: evo.stage, stageName: evo.name, finalForm: null }
                }, 80)
              : `<div class="dex-silhouette">?</div>`
            }
          </div>
          <div class="dex-name">${evo.name}</div>
          <div class="dex-level">Lv.${evo.minLevel}~</div>
          <div class="dex-status">${unlocked ? '✅' : '🔒'}</div>
        </div>
      `;
    });

    // Stage 5: 최종 4형태
    Object.entries(FINAL_FORMS).forEach(([formKey, formData]) => {
      const unlocked = currentStage >= 5 && currentForm === formKey;
      html += `
        <div class="dex-item ${unlocked ? '' : 'locked'}">
          <div class="dex-stage">${formData.icon} 최종</div>
          <div class="dex-character">
            ${unlocked
              ? TamagotchiRenderer.render({
                  ...student.tamagotchi,
                  evolution: { stage: 5, stageName: "최종", finalForm: formKey }
                }, 80)
              : `<div class="dex-silhouette">?</div>`
            }
          </div>
          <div class="dex-name">${formData.name}</div>
          <div class="dex-level">Lv.15+ (${formData.stat.toUpperCase()} 특화)</div>
          <div class="dex-status">${unlocked ? '✅' : '🔒'}</div>
        </div>
      `;
    });

    html += '</div>';

    // 비밀 진화 섹션
    html += Secret.renderSecretDex(student);

    // 힌트
    const hints = Secret.getHints(student);
    if (hints.length > 0) {
      html += '<div class="dex-hints"><h4>힌트</h4>';
      hints.forEach((h) => { html += `<p class="dex-hint-text">💬 "${h}"</p>`; });
      html += '</div>';
    }

    UI.showModal("📖 진화 도감", html, [{ text: "닫기", class: "btn btn-secondary" }]);
  },

  renderMission() {
    const content = document.getElementById("tab-content");
    if (!content) return;

    const student = Storage.getCurrentStudent();
    if (!student) return;

    const missions = Mission.getActiveMissions();
    const typeLabels = { attendance: "📋 출석", homework: "📝 과제", exam: "📊 시험", special: "⭐ 특별" };

    let html = '<div class="mission-screen"><h2>📋 오늘의 미션</h2>';

    missions.forEach((m) => {
      const completedToday = m.repeatable
        ? Mission.isCompletedToday(student, m.id)
        : Mission.isCompleted(student, m.id);

      html += `
        <div class="mission-card ${completedToday ? 'completed' : ''}">
          <div class="mission-card-header">
            <span class="mission-badge">${typeLabels[m.type] || m.type}</span>
            <span class="mission-exp-badge">+${m.exp} EXP</span>
          </div>
          <div class="mission-card-title">${completedToday ? '✅' : '⬜'} ${m.title}</div>
          <div class="mission-card-desc">${m.description}</div>
          ${!completedToday ? `
            <div class="mission-card-actions">
              <input type="text" class="code-input" placeholder="인증코드" maxlength="4" data-code-for="${m.id}">
              <button class="btn btn-primary btn-small" data-complete-mission="${m.id}">완료하기</button>
            </div>
          ` : '<div class="mission-done-label">완료!</div>'}
        </div>
      `;
    });

    html += '</div>';
    content.innerHTML = html;

    // 미션 완료 이벤트
    content.querySelectorAll("[data-complete-mission]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const missionId = btn.dataset.completeMission;
        const codeInput = content.querySelector(`[data-code-for="${missionId}"]`);
        const code = codeInput ? codeInput.value : "";

        const result = Mission.completeMission(student, missionId, code);

        if (result.success) {
          Sound.missionComplete();
          UI.showToast(result.message, "success");

          const levelUps = result.levelUps || [];
          const evolutions = result.evolutions || [];
          let delay = 500;

          if (levelUps.length > 0) {
            setTimeout(() => {
              Sound.levelUp();
              levelUps.forEach((lu) => UI.showLevelUp(lu.level, lu.reward));
            }, delay);
            delay += 1500;
          }

          if (evolutions.length > 0) {
            setTimeout(() => {
              Sound.evolution();
              const latestStudent = Storage.getCurrentStudent();
              evolutions.forEach((evo) => UI.showEvolution(evo, latestStudent.tamagotchi));
            }, delay);
            delay += 1500;
          }

          if (result.treasureBonus) {
            setTimeout(() => { Sound.treasure(); UI.showToast(`💎 보물 발견! +${result.treasureBonus}p!`, "success", 3000); }, delay);
            delay += 1000;
          }

          // 비밀 진화
          if (result.secretEvo) {
            setTimeout(() => Secret.showSecretEvolution(result.secretEvo, Storage.getCurrentStudent()), delay);
            delay += 2000;
          }

          // 뱃지 체크
          const latestForBadge = Storage.getCurrentStudent();
          const newBadges = Badge.checkNewBadges(latestForBadge);
          if (newBadges.length > 0) {
            setTimeout(() => newBadges.forEach((b) => Badge.showBadgeNotification(b)), delay);
          }

          this.renderMission();
          this.renderHome();
        } else {
          UI.showToast(result.message, "error");
        }
      });
    });
  },
};

// 앱 시작
document.addEventListener("DOMContentLoaded", () => App.init());
