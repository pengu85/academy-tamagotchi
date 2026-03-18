// ============================================
// share.js - 학부모 공유 (이미지 내보내기)
// ============================================

const Share = {
  async downloadCard(student) {
    Tamagotchi.ensureEvolution(student);
    const mood = calculateMood(student);

    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 560;
    const ctx = canvas.getContext("2d");

    // 배경
    ctx.fillStyle = "#F8F5FF";
    this._roundRect(ctx, 0, 0, 400, 560, 20);
    ctx.fill();

    // 헤더
    ctx.fillStyle = "#6C5CE7";
    this._roundRect(ctx, 0, 0, 400, 55, { tl: 20, tr: 20, bl: 0, br: 0 });
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.font = "bold 18px Pretendard, sans-serif";
    ctx.textAlign = "center";
    const academyName = Storage.getAcademyName();
    ctx.fillText(`🏫 ${academyName} 다마고치`, 200, 36);

    // SVG → Canvas
    const tama = student.tamagotchi;
    const svgStr = TamagotchiRenderer.render(tama, 200, mood);
    try {
      await this._drawSvg(ctx, svgStr, 100, 70, 200, 200);
    } catch (e) {
      // SVG 렌더 실패 시 placeholder
      ctx.fillStyle = "#DDD";
      ctx.fillRect(150, 120, 100, 100);
    }

    // 이름
    ctx.fillStyle = "#2D3436";
    ctx.font = "bold 22px Pretendard, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${tama.name} (${student.name})`, 200, 305);

    // 레벨 + 진화
    const evo = tama.evolution || { stageName: "어린이", finalForm: null };
    let evoText = evo.stageName + " 단계";
    if (evo.finalForm && FINAL_FORMS[evo.finalForm]) {
      evoText = FINAL_FORMS[evo.finalForm].icon + " " + FINAL_FORMS[evo.finalForm].name;
    }
    ctx.fillStyle = "#6C5CE7";
    ctx.font = "600 16px Pretendard, sans-serif";
    ctx.fillText(`Lv.${tama.level}  |  ${evoText}`, 200, 335);

    // 구분선
    ctx.strokeStyle = "#DFE6E9";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 355);
    ctx.lineTo(360, 355);
    ctx.stroke();

    // 능력치
    ctx.fillStyle = "#2D3436";
    ctx.font = "16px Pretendard, sans-serif";
    const stats = tama.stats;
    ctx.fillText(`💪 ${stats.str}   🧠 ${stats.int}   ✨ ${stats.cha}   ❤️ ${stats.sta}`, 200, 385);

    // 구분선
    ctx.beginPath();
    ctx.moveTo(40, 405);
    ctx.lineTo(360, 405);
    ctx.stroke();

    // 정보
    ctx.fillStyle = "#636E72";
    ctx.font = "14px Pretendard, sans-serif";
    ctx.fillText(`🔥 연속출석 ${student.streakDays}일`, 200, 435);
    ctx.fillText(`🏅 업적 ${(student.badges || []).length}/${BADGES.length}`, 200, 460);

    const moodInfo = MOOD_STATES[mood] || MOOD_STATES.normal;
    ctx.fillText(`${moodInfo.icon} ${moodInfo.name}`, 200, 485);

    // 하단 날짜
    ctx.fillStyle = "#B2BEC3";
    ctx.font = "12px Pretendard, sans-serif";
    ctx.fillText(new Date().toISOString().split("T")[0], 200, 540);

    // 다운로드
    const link = document.createElement("a");
    link.download = `${tama.name}_카드.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();

    UI.showToast("카드가 저장되었어요!", "success");
  },

  _drawSvg(ctx, svgStr, x, y, w, h) {
    return new Promise((resolve, reject) => {
      const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, x, y, w, h);
        URL.revokeObjectURL(url);
        resolve();
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject();
      };
      img.src = url;
    });
  },

  _roundRect(ctx, x, y, w, h, r) {
    if (typeof r === "number") r = { tl: r, tr: r, bl: r, br: r };
    ctx.beginPath();
    ctx.moveTo(x + r.tl, y);
    ctx.lineTo(x + w - r.tr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r.tr);
    ctx.lineTo(x + w, y + h - r.br);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
    ctx.lineTo(x + r.bl, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r.bl);
    ctx.lineTo(x, y + r.tl);
    ctx.quadraticCurveTo(x, y, x + r.tl, y);
    ctx.closePath();
  },
};
