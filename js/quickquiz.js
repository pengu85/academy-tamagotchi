// ============================================
// quickquiz.js - 퀵 퀴즈 돌봄 (1문제로 돌봄)
// ============================================

const QuickQuiz = {
  BONUS_EXP: 3,

  // 돌봄 전 퀴즈 표시. 맞히든 틀리든 돌봄은 수행, 맞히면 보너스
  showBeforeCare(student, careType) {
    // 기존 오버레이 제거
    document.querySelectorAll(".qq-overlay").forEach((el) => el.remove());

    return new Promise((resolve) => {
      const difficulty = Math.min(5, Math.ceil(student.tamagotchi.level / 3));
      const q = generateMathQuestion(difficulty);

      const careLabels = {
        feed: { icon: "\u{1F35A}", label: "\uBC25\uC8FC\uAE30", color: "#FF6B6B" },
        wash: { icon: "\u{1FAE7}", label: "\uC52C\uAE30\uAE30", color: "#74B9FF" },
        play: { icon: "\u{1F3AE}", label: "\uB180\uC544\uC8FC\uAE30", color: "#FDCB6E" },
      };
      const info = careLabels[careType] || careLabels.feed;

      const overlay = document.createElement("div");
      overlay.className = "qq-overlay";
      overlay.innerHTML = `
        <div class="qq-card">
          <div class="qq-header" style="background: ${info.color}">
            <span class="qq-care-icon">${info.icon}</span>
            <span class="qq-care-label">${info.label} \uD034\uC988!</span>
          </div>
          <div class="qq-body">
            <p class="qq-desc">\uBB38\uC81C\uB97C \uD480\uBA74 ${UI.esc(student.tamagotchi.name)}\uC5D0\uAC8C ${info.label}\uD560 \uC218 \uC788\uC5B4\uC694!</p>
            <div class="qq-question">${q.text}</div>
            <div class="qq-input-row">
              <input type="number" class="qq-input" id="qq-answer" placeholder="\uC815\uB2F5 \uC785\uB825" autofocus>
              <button class="btn btn-primary qq-submit" id="qq-submit">\uD655\uC778!</button>
            </div>
            <button class="btn btn-ghost btn-small qq-skip" id="qq-skip">\uADF8\uB0E5 ${info.label} (\uBCF4\uB108\uC2A4 \uC5C6\uC74C)</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add("active"));
      overlay.querySelector(".qq-input")?.focus();

      const close = (correct) => {
        overlay.classList.remove("active");
        setTimeout(() => overlay.remove(), 300);
        resolve(correct);
      };

      const submit = () => {
        const input = overlay.querySelector(".qq-input");
        const userAnswer = parseInt(input.value);
        if (isNaN(userAnswer)) {
          input.classList.add("qq-shake");
          setTimeout(() => input.classList.remove("qq-shake"), 400);
          return;
        }

        const correct = userAnswer === q.answer;
        const card = overlay.querySelector(".qq-card");

        if (correct) {
          Sound.correct();
          card.innerHTML = `
            <div class="qq-result correct">
              <div class="qq-result-icon">\u{1F389}</div>
              <div class="qq-result-text">\uC815\uB2F5! +${this.BONUS_EXP} \uBCF4\uB108\uC2A4 EXP!</div>
              <div class="qq-result-sub">${UI.esc(student.tamagotchi.name)}\uC774(\uAC00) \uAE30\uBE60\uD574\uD574\uC694!</div>
            </div>
          `;
          Tamagotchi.addExp(student, this.BONUS_EXP);
        } else {
          Sound.wrong();
          card.innerHTML = `
            <div class="qq-result wrong">
              <div class="qq-result-icon">\u{1F914}</div>
              <div class="qq-result-text">\uC544\uC26C\uC6CC\uC694! \uC815\uB2F5\uC740 ${q.answer}</div>
              <div class="qq-result-sub">\uAD1C\uCC2E\uC544\uC694, ${info.label}\uC740 \uD574\uC904\uAC8C\uC694!</div>
            </div>
          `;
        }

        setTimeout(() => close(correct), 1500);
      };

      overlay.querySelector(".qq-submit").addEventListener("click", submit);
      overlay.querySelector(".qq-input").addEventListener("keyup", (e) => {
        if (e.key === "Enter") submit();
      });

      // Skip: care without bonus
      overlay.querySelector(".qq-skip").addEventListener("click", () => {
        close(false);
      });
    });
  },
};
