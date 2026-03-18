// ============================================
// sound.js - 효과음 시스템 (Web Audio API)
// 외부 파일 없이 코드로 사운드 생성
// ============================================

const Sound = {
  _ctx: null,
  _enabled: true,

  _getCtx() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this._ctx;
  },

  toggle() {
    this._enabled = !this._enabled;
    Storage.set("sound_enabled", this._enabled);
    return this._enabled;
  },

  isEnabled() {
    const saved = Storage.get("sound_enabled", true);
    this._enabled = saved;
    return this._enabled;
  },

  _play(frequency, duration, type = "sine", volume = 0.3) {
    if (!this._enabled) return;
    try {
      const ctx = this._getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = frequency;
      gain.gain.value = volume;
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (e) { /* 브라우저 미지원 시 무시 */ }
  },

  _playSequence(notes, interval = 0.15) {
    if (!this._enabled) return;
    notes.forEach((note, i) => {
      setTimeout(() => this._play(note.freq, note.dur || 0.2, note.type || "sine", note.vol || 0.3), i * interval * 1000);
    });
  },

  // ============================================
  // 개별 효과음
  // ============================================

  // 미션 완료
  missionComplete() {
    this._playSequence([
      { freq: 523, dur: 0.1 },
      { freq: 659, dur: 0.1 },
      { freq: 784, dur: 0.2 },
    ], 0.1);
  },

  // 레벨업
  levelUp() {
    this._playSequence([
      { freq: 523, dur: 0.15 },
      { freq: 659, dur: 0.15 },
      { freq: 784, dur: 0.15 },
      { freq: 1047, dur: 0.3 },
    ], 0.12);
  },

  // 진화
  evolution() {
    this._playSequence([
      { freq: 392, dur: 0.2 },
      { freq: 523, dur: 0.2 },
      { freq: 659, dur: 0.2 },
      { freq: 784, dur: 0.2 },
      { freq: 1047, dur: 0.4 },
    ], 0.15);
  },

  // 돌봄 (밥/씻기/놀기)
  care() {
    this._playSequence([
      { freq: 660, dur: 0.1, type: "triangle" },
      { freq: 880, dur: 0.15, type: "triangle" },
    ], 0.1);
  },

  // 아이템 구매
  purchase() {
    this._play(880, 0.15, "triangle", 0.25);
  },

  // 미니게임 정답
  correct() {
    this._playSequence([
      { freq: 660, dur: 0.08 },
      { freq: 880, dur: 0.12 },
    ], 0.08);
  },

  // 미니게임 오답
  wrong() {
    this._playSequence([
      { freq: 300, dur: 0.15, type: "square", vol: 0.15 },
      { freq: 250, dur: 0.2, type: "square", vol: 0.15 },
    ], 0.12);
  },

  // 뱃지 획득
  badge() {
    this._playSequence([
      { freq: 523, dur: 0.1, type: "triangle" },
      { freq: 784, dur: 0.1, type: "triangle" },
      { freq: 1047, dur: 0.25, type: "triangle" },
    ], 0.1);
  },

  // 보물 발견
  treasure() {
    this._playSequence([
      { freq: 880, dur: 0.08 },
      { freq: 1100, dur: 0.08 },
      { freq: 1320, dur: 0.15 },
    ], 0.08);
  },

  // 버튼 클릭
  click() {
    this._play(600, 0.05, "sine", 0.1);
  },

  // 에러
  error() {
    this._play(200, 0.2, "square", 0.1);
  },

  // 룰렛
  roulette() {
    this._playSequence([
      { freq: 440, dur: 0.05 },
      { freq: 550, dur: 0.05 },
      { freq: 660, dur: 0.05 },
      { freq: 770, dur: 0.05 },
      { freq: 880, dur: 0.05 },
      { freq: 1100, dur: 0.3 },
    ], 0.08);
  },
};
