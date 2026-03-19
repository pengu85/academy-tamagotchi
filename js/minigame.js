// ============================================
// minigame.js - 수학 미니게임
// ============================================

const Minigame = {
  currentGame: null,

  render(container) {
    const student = Storage.getCurrentStudent();
    if (!student) return;

    // 오늘 플레이 횟수 체크
    const today = new Date().toISOString().split("T")[0];
    if (student.lastMinigameDate !== today) {
      student.minigameToday = 0;
      student.perfectMinigameToday = false;
      student.lastMinigameDate = today;
      Storage.updateStudent(student);
    }

    const remaining = MINIGAME_MAX_PER_DAY - (student.minigameToday || 0);

    container.innerHTML = `
      <div class="minigame-screen">
        <h2>🧮 수학 미니게임</h2>
        <p class="text-muted">수학 문제를 풀고 보너스 경험치를 얻으세요!</p>
        <div class="minigame-info">
          <span>오늘 남은 횟수: <strong>${remaining}회</strong></span>
          <span>문제당 +${MINIGAME_EXP_PER_CORRECT} EXP | 만점 보너스 +${MINIGAME_PERFECT_BONUS} EXP</span>
        </div>
        ${remaining > 0
          ? `<button class="btn btn-primary btn-large" id="start-minigame">게임 시작!</button>`
          : `<p class="minigame-done">오늘은 모두 플레이했어요! 내일 다시 도전하세요.</p>`
        }
        <div id="minigame-area"></div>
      </div>
    `;

    const startBtn = document.getElementById("start-minigame");
    if (startBtn) {
      startBtn.addEventListener("click", () => this.startGame(student, container));
    }
  },

  startGame(student, container) {
    // 난이도: 레벨 기반
    const difficulty = Math.min(5, Math.ceil(student.tamagotchi.level / 3));
    const questions = [];
    for (let i = 0; i < MINIGAME_QUESTIONS; i++) {
      questions.push(generateMathQuestion(difficulty));
    }

    this.currentGame = {
      questions,
      currentQ: 0,
      correct: 0,
      student,
    };

    this._showQuestion(container);
  },

  _showQuestion(container) {
    const game = this.currentGame;
    if (!game) return;

    if (game.currentQ >= game.questions.length) {
      this._showResult(container);
      return;
    }

    const q = game.questions[game.currentQ];
    const area = document.getElementById("minigame-area");
    area.innerHTML = `
      <div class="minigame-question">
        <div class="question-progress">${game.currentQ + 1} / ${game.questions.length}</div>
        <div class="question-text">${q.text}</div>
        <div class="question-input">
          <input type="number" id="answer-input" placeholder="정답 입력" autofocus>
          <button class="btn btn-primary" id="submit-answer">확인</button>
        </div>
        <div class="question-score">맞은 수: ${game.correct} / ${game.currentQ}</div>
      </div>
    `;

    const submitBtn = document.getElementById("submit-answer");
    const input = document.getElementById("answer-input");

    const submit = () => {
      const userAnswer = parseInt(input.value);
      if (isNaN(userAnswer)) {
        UI.showToast("숫자를 입력해주세요!", "error");
        return;
      }

      const correct = userAnswer === q.answer;
      if (correct) {
        game.correct++;
        Sound.correct();
        UI.showToast("정답! 🎉", "success", 1000);
      } else {
        Sound.wrong();
        UI.showToast(`오답! 정답: ${q.answer}`, "error", 1500);
      }

      game.currentQ++;
      setTimeout(() => this._showQuestion(container), correct ? 500 : 1000);
    };

    submitBtn.addEventListener("click", submit);
    input.addEventListener("keyup", (e) => { if (e.key === "Enter") submit(); });
    input.focus();
  },

  _showResult(container) {
    const game = this.currentGame;
    const student = game.student;
    const isPerfect = game.correct === game.questions.length;
    const expGained = game.correct * MINIGAME_EXP_PER_CORRECT + (isPerfect ? MINIGAME_PERFECT_BONUS : 0);

    // 이벤트 배율 + INT 보너스
    const eventMultiplier = GameEvent.getExpMultiplier();
    const intBonus = student.tamagotchi.stats.int * 0.02;
    const totalExp = Math.floor(expGained * eventMultiplier * (1 + intBonus));

    // 경험치 지급
    const result = Tamagotchi.addExp(student, totalExp);

    // 플레이 횟수 증가
    student.minigameToday = (student.minigameToday || 0) + 1;
    if (isPerfect) {
      student.perfectMinigames = (student.perfectMinigames || 0) + 1;
      student.perfectMinigameToday = true;
    }
    Storage.updateStudent(student);

    // 뱃지 체크
    const newBadges = Badge.checkNewBadges(student);

    const area = document.getElementById("minigame-area");
    area.innerHTML = `
      <div class="minigame-result">
        <div class="result-title">${isPerfect ? '🎉 만점!' : '📊 결과'}</div>
        <div class="result-score">${game.correct} / ${game.questions.length} 정답</div>
        <div class="result-exp">+${totalExp} EXP 획득!</div>
        ${isPerfect ? '<div class="result-perfect">만점 보너스 +' + MINIGAME_PERFECT_BONUS + ' EXP!</div>' : ''}
        <button class="btn btn-primary" id="minigame-done">확인</button>
      </div>
    `;

    document.getElementById("minigame-done").addEventListener("click", () => {
      // 레벨업/진화 알림
      if (result.levelUps.length > 0) {
        result.levelUps.forEach((lu) => UI.showLevelUp(lu.level, lu.reward));
      }
      if (result.evolutions.length > 0) {
        const latestStudent = Storage.getCurrentStudent();
        result.evolutions.forEach((evo) => UI.showEvolution(evo, latestStudent.tamagotchi));
      }
      if (newBadges.length > 0) {
        setTimeout(() => newBadges.forEach((b) => Badge.showBadgeNotification(b)), 500);
      }
      this.render(container.closest(".tab-content"));
      App.renderHome();
    });

    this.currentGame = null;
  },
};
