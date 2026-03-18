// ============================================
// tamagotchi-renderer.js - SVG 캐릭터 렌더링 (진화 시스템 포함)
// ============================================

const TamagotchiRenderer = {
  render(tamagotchi, size = 200, mood = "normal") {
    const app = tamagotchi.appearance;
    const evolution = tamagotchi.evolution || { stage: 3, finalForm: null };
    const stage = evolution.stage;
    const s = size;
    const cx = s / 2;
    const cy = s / 2;

    // 단계별 위치 오프셋 (아이템 위치 조정용)
    const offsets = { 1: { hat: 0, acc: 0 }, 2: { hat: 5, acc: 3 }, 3: { hat: 0, acc: 0 }, 4: { hat: -3, acc: -2 }, 5: { hat: -5, acc: -3 } };
    const off = offsets[stage] || offsets[3];

    let svg = `<svg viewBox="0 0 ${s} ${s}" width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg">`;

    // 1. 배경
    svg += this._renderBackground(app.background, s);

    // 2. 특수효과 (뒤) - 알은 제외
    if (stage > 1 && app.effect) svg += this._renderEffectBehind(app.effect, cx, cy, s);

    // 3. 악세서리 (뒤) - 알은 제외
    if (stage > 1 && app.accessory) svg += this._renderAccessoryBehind(app.accessory, cx, cy + off.acc);

    // 4. 몸체 (진화 단계별 분기)
    switch (stage) {
      case 1: svg += this._renderEgg(app.bodyColor, cx, cy); break;
      case 2: svg += this._renderBaby(app.bodyColor, cx, cy); break;
      case 3: svg += this._renderBody(app.bodyColor, cx, cy); break;
      case 4: svg += this._renderTeen(app.bodyColor, cx, cy); break;
      case 5: svg += this._renderFinal(app.bodyColor, cx, cy, evolution.finalForm); break;
      default: svg += this._renderBody(app.bodyColor, cx, cy); break;
    }

    // 5. 눈 (알은 제외)
    if (stage > 1) svg += this._renderEyes(app.eyeStyle, cx, cy, stage);

    // 6. 입 (알은 제외) - 감정 반영
    if (stage > 1) svg += this._renderMouth(cx, cy, stage, mood);

    // 7. 모자 (알은 제외)
    if (stage > 1 && app.hat) svg += this._renderHat(app.hat, cx, cy + off.hat);

    // 8. 악세서리 (앞) - 알은 제외
    if (stage > 1 && app.accessory) svg += this._renderAccessoryFront(app.accessory, cx, cy + off.acc);

    // 9. 특수효과 (앞) - 알은 제외
    if (stage > 1 && app.effect) svg += this._renderEffectFront(app.effect, cx, cy, s);

    svg += `</svg>`;
    return svg;
  },

  // ============================================
  // Stage 1: 알 (Egg)
  // ============================================
  _renderEgg(color, cx, cy) {
    return `
      <ellipse cx="${cx}" cy="${cy+10}" rx="35" ry="45" fill="${color}" stroke="#333" stroke-width="2"/>
      <ellipse cx="${cx}" cy="${cy+10}" rx="35" ry="45" fill="white" opacity="0.15"/>
      <ellipse cx="${cx}" cy="${cy+25}" rx="22" ry="12" fill="white" opacity="0.3"/>
      <!-- 금 -->
      <path d="M${cx-15} ${cy-20} L${cx-8} ${cy-12} L${cx} ${cy-22} L${cx+8} ${cy-12} L${cx+15} ${cy-20}"
            stroke="#333" stroke-width="2" fill="none" stroke-linecap="round"/>
      <!-- 반짝 -->
      <circle cx="${cx+18}" cy="${cy-5}" r="3" fill="white" opacity="0.6"/>
      <circle cx="${cx+15}" cy="${cy+5}" r="2" fill="white" opacity="0.4"/>
    `;
  },

  // ============================================
  // Stage 2: 아기 (Baby)
  // ============================================
  _renderBaby(color, cx, cy) {
    return `
      <ellipse cx="${cx}" cy="${cy+10}" rx="38" ry="40" fill="${color}" stroke="#333" stroke-width="2"/>
      <ellipse cx="${cx}" cy="${cy+10}" rx="38" ry="40" fill="white" opacity="0.15"/>
      <ellipse cx="${cx}" cy="${cy+22}" rx="24" ry="14" fill="white" opacity="0.3"/>
      <!-- 짧은 팔 -->
      <ellipse cx="${cx-35}" cy="${cy+15}" rx="10" ry="7" fill="${color}" stroke="#333" stroke-width="1.5" transform="rotate(-15 ${cx-35} ${cy+15})"/>
      <ellipse cx="${cx+35}" cy="${cy+15}" rx="10" ry="7" fill="${color}" stroke="#333" stroke-width="1.5" transform="rotate(15 ${cx+35} ${cy+15})"/>
      <!-- 짧은 발 -->
      <ellipse cx="${cx-14}" cy="${cy+47}" rx="14" ry="8" fill="${color}" stroke="#333" stroke-width="1.5"/>
      <ellipse cx="${cx+14}" cy="${cy+47}" rx="14" ry="8" fill="${color}" stroke="#333" stroke-width="1.5"/>
    `;
  },

  // ============================================
  // Stage 3: 어린이 (Child) - 기존 그대로
  // ============================================
  _renderBody(color, cx, cy) {
    return `
      <ellipse cx="${cx}" cy="${cy+10}" rx="55" ry="60" fill="${color}" stroke="#333" stroke-width="2"/>
      <ellipse cx="${cx}" cy="${cy+10}" rx="55" ry="60" fill="white" opacity="0.15"/>
      <ellipse cx="${cx}" cy="${cy+25}" rx="35" ry="20" fill="white" opacity="0.3"/>
      <!-- 팔 -->
      <ellipse cx="${cx-50}" cy="${cy+15}" rx="15" ry="10" fill="${color}" stroke="#333" stroke-width="1.5" transform="rotate(-20 ${cx-50} ${cy+15})"/>
      <ellipse cx="${cx+50}" cy="${cy+15}" rx="15" ry="10" fill="${color}" stroke="#333" stroke-width="1.5" transform="rotate(20 ${cx+50} ${cy+15})"/>
      <!-- 발 -->
      <ellipse cx="${cx-20}" cy="${cy+65}" rx="18" ry="10" fill="${color}" stroke="#333" stroke-width="1.5"/>
      <ellipse cx="${cx+20}" cy="${cy+65}" rx="18" ry="10" fill="${color}" stroke="#333" stroke-width="1.5"/>
    `;
  },

  // ============================================
  // Stage 4: 청소년 (Teen)
  // ============================================
  _renderTeen(color, cx, cy) {
    return `
      <ellipse cx="${cx}" cy="${cy+10}" rx="50" ry="65" fill="${color}" stroke="#333" stroke-width="2"/>
      <ellipse cx="${cx}" cy="${cy+10}" rx="50" ry="65" fill="white" opacity="0.15"/>
      <ellipse cx="${cx}" cy="${cy+28}" rx="32" ry="18" fill="white" opacity="0.3"/>
      <!-- 뿔/귀 -->
      <polygon points="${cx-18},${cy-50} ${cx-12},${cy-65} ${cx-6},${cy-50}" fill="${color}" stroke="#333" stroke-width="1.5"/>
      <polygon points="${cx+6},${cy-50} ${cx+12},${cy-65} ${cx+18},${cy-50}" fill="${color}" stroke="#333" stroke-width="1.5"/>
      <!-- 긴 팔 -->
      <ellipse cx="${cx-48}" cy="${cy+12}" rx="18" ry="10" fill="${color}" stroke="#333" stroke-width="1.5" transform="rotate(-20 ${cx-48} ${cy+12})"/>
      <ellipse cx="${cx+48}" cy="${cy+12}" rx="18" ry="10" fill="${color}" stroke="#333" stroke-width="1.5" transform="rotate(20 ${cx+48} ${cy+12})"/>
      <!-- 긴 발 -->
      <ellipse cx="${cx-18}" cy="${cy+70}" rx="18" ry="12" fill="${color}" stroke="#333" stroke-width="1.5"/>
      <ellipse cx="${cx+18}" cy="${cy+70}" rx="18" ry="12" fill="${color}" stroke="#333" stroke-width="1.5"/>
    `;
  },

  // ============================================
  // Stage 5: 최종 진화 (4가지 형태)
  // ============================================
  _renderFinal(color, cx, cy, finalForm) {
    switch (finalForm) {
      case "warrior": return this._renderWarrior(color, cx, cy);
      case "scholar": return this._renderScholar(color, cx, cy);
      case "star":    return this._renderStar(color, cx, cy);
      case "guardian": return this._renderGuardian(color, cx, cy);
      default: return this._renderWarrior(color, cx, cy);
    }
  },

  _renderWarrior(color, cx, cy) {
    return `
      <!-- 몸체: 각지고 넓은 어깨 -->
      <rect x="${cx-50}" y="${cy-40}" width="100" height="105" rx="20" fill="${color}" stroke="#333" stroke-width="2"/>
      <rect x="${cx-50}" y="${cy-40}" width="100" height="105" rx="20" fill="white" opacity="0.1"/>
      <ellipse cx="${cx}" cy="${cy+25}" rx="30" ry="16" fill="white" opacity="0.25"/>
      <!-- 붉은 뿔 -->
      <polygon points="${cx-15},${cy-40} ${cx-10},${cy-60} ${cx-5},${cy-40}" fill="#E74C3C" stroke="#C0392B" stroke-width="1"/>
      <polygon points="${cx+5},${cy-40} ${cx+10},${cy-60} ${cx+15},${cy-40}" fill="#E74C3C" stroke="#C0392B" stroke-width="1"/>
      <!-- 넓은 팔 -->
      <ellipse cx="${cx-52}" cy="${cy+5}" rx="18" ry="12" fill="${color}" stroke="#333" stroke-width="1.5" transform="rotate(-15 ${cx-52} ${cy+5})"/>
      <ellipse cx="${cx+52}" cy="${cy+5}" rx="18" ry="12" fill="${color}" stroke="#333" stroke-width="1.5" transform="rotate(15 ${cx+52} ${cy+5})"/>
      <!-- 발 -->
      <ellipse cx="${cx-20}" cy="${cy+62}" rx="20" ry="12" fill="${color}" stroke="#333" stroke-width="1.5"/>
      <ellipse cx="${cx+20}" cy="${cy+62}" rx="20" ry="12" fill="${color}" stroke="#333" stroke-width="1.5"/>
      <!-- X 무늬 -->
      <line x1="${cx-15}" y1="${cy+10}" x2="${cx+15}" y2="${cy+30}" stroke="#333" stroke-width="2" opacity="0.3"/>
      <line x1="${cx+15}" y1="${cy+10}" x2="${cx-15}" y2="${cy+30}" stroke="#333" stroke-width="2" opacity="0.3"/>
    `;
  },

  _renderScholar(color, cx, cy) {
    return `
      <!-- 몸체: 둥글고 큰 머리 비율 -->
      <ellipse cx="${cx}" cy="${cy+15}" rx="48" ry="55" fill="${color}" stroke="#333" stroke-width="2"/>
      <ellipse cx="${cx}" cy="${cy-15}" rx="42" ry="38" fill="${color}" stroke="#333" stroke-width="1.5"/>
      <ellipse cx="${cx}" cy="${cy+15}" rx="48" ry="55" fill="white" opacity="0.1"/>
      <ellipse cx="${cx}" cy="${cy+28}" rx="30" ry="16" fill="white" opacity="0.25"/>
      <!-- 별/마법진 -->
      <circle cx="${cx}" cy="${cy-50}" r="8" fill="none" stroke="#F1C40F" stroke-width="1.5" opacity="0.7"/>
      <text x="${cx-5}" y="${cy-46}" font-size="10" fill="#F1C40F" opacity="0.8">★</text>
      <!-- 팔 -->
      <ellipse cx="${cx-46}" cy="${cy+18}" rx="14" ry="10" fill="${color}" stroke="#333" stroke-width="1.5" transform="rotate(-20 ${cx-46} ${cy+18})"/>
      <ellipse cx="${cx+46}" cy="${cy+18}" rx="14" ry="10" fill="${color}" stroke="#333" stroke-width="1.5" transform="rotate(20 ${cx+46} ${cy+18})"/>
      <!-- 발 -->
      <ellipse cx="${cx-16}" cy="${cy+66}" rx="16" ry="10" fill="${color}" stroke="#333" stroke-width="1.5"/>
      <ellipse cx="${cx+16}" cy="${cy+66}" rx="16" ry="10" fill="${color}" stroke="#333" stroke-width="1.5"/>
    `;
  },

  _renderStar(color, cx, cy) {
    return `
      <!-- 몸체: 날씬한 체형 -->
      <ellipse cx="${cx}" cy="${cy+10}" rx="42" ry="65" fill="${color}" stroke="#333" stroke-width="2"/>
      <ellipse cx="${cx}" cy="${cy+10}" rx="42" ry="65" fill="white" opacity="0.15"/>
      <ellipse cx="${cx}" cy="${cy+28}" rx="26" ry="15" fill="white" opacity="0.3"/>
      <!-- 반짝이 별 -->
      <text x="${cx-35}" y="${cy-35}" font-size="12" opacity="0.7">⭐</text>
      <text x="${cx+22}" y="${cy-25}" font-size="10" opacity="0.5">⭐</text>
      <text x="${cx-30}" y="${cy+50}" font-size="9" opacity="0.4">⭐</text>
      <text x="${cx+28}" y="${cy+40}" font-size="11" opacity="0.6">⭐</text>
      <!-- 우아한 팔 (약간 위) -->
      <ellipse cx="${cx-42}" cy="${cy}" rx="16" ry="9" fill="${color}" stroke="#333" stroke-width="1.5" transform="rotate(-25 ${cx-42} ${cy})"/>
      <ellipse cx="${cx+42}" cy="${cy}" rx="16" ry="9" fill="${color}" stroke="#333" stroke-width="1.5" transform="rotate(25 ${cx+42} ${cy})"/>
      <!-- 발 -->
      <ellipse cx="${cx-16}" cy="${cy+70}" rx="16" ry="10" fill="${color}" stroke="#333" stroke-width="1.5"/>
      <ellipse cx="${cx+16}" cy="${cy+70}" rx="16" ry="10" fill="${color}" stroke="#333" stroke-width="1.5"/>
    `;
  },

  _renderGuardian(color, cx, cy) {
    return `
      <!-- 몸체: 크고 든든한 체형 -->
      <ellipse cx="${cx}" cy="${cy+10}" rx="58" ry="62" fill="${color}" stroke="#333" stroke-width="2.5"/>
      <ellipse cx="${cx}" cy="${cy+10}" rx="58" ry="62" fill="white" opacity="0.1"/>
      <ellipse cx="${cx}" cy="${cy+28}" rx="36" ry="20" fill="white" opacity="0.25"/>
      <!-- 방패 무늬 -->
      <path d="M${cx-15} ${cy} L${cx} ${cy-15} L${cx+15} ${cy} L${cx} ${cy+20} Z" fill="none" stroke="#3498DB" stroke-width="2" opacity="0.5"/>
      <circle cx="${cx}" cy="${cy+3}" r="5" fill="#3498DB" opacity="0.4"/>
      <!-- 굵은 팔 -->
      <ellipse cx="${cx-55}" cy="${cy+10}" rx="18" ry="14" fill="${color}" stroke="#333" stroke-width="1.5" transform="rotate(-10 ${cx-55} ${cy+10})"/>
      <ellipse cx="${cx+55}" cy="${cy+10}" rx="18" ry="14" fill="${color}" stroke="#333" stroke-width="1.5" transform="rotate(10 ${cx+55} ${cy+10})"/>
      <!-- 굵은 발 -->
      <ellipse cx="${cx-22}" cy="${cy+68}" rx="22" ry="12" fill="${color}" stroke="#333" stroke-width="1.5"/>
      <ellipse cx="${cx+22}" cy="${cy+68}" rx="22" ry="12" fill="${color}" stroke="#333" stroke-width="1.5"/>
    `;
  },

  // ============================================
  // 공통 렌더링 (눈, 입 - 단계별 조정)
  // ============================================

  _renderEyes(style, cx, cy, stage) {
    // 아기는 눈이 크고, 단계별 약간의 위치 조정
    const scale = stage === 2 ? 1.3 : 1;
    const yOff = stage === 2 ? 3 : 0;
    const eyes = {
      default: `
        <circle cx="${cx-18}" cy="${cy-5+yOff}" r="${8*scale}" fill="white" stroke="#333" stroke-width="1.5"/>
        <circle cx="${cx+18}" cy="${cy-5+yOff}" r="${8*scale}" fill="white" stroke="#333" stroke-width="1.5"/>
        <circle cx="${cx-16}" cy="${cy-5+yOff}" r="${4*scale}" fill="#333"/>
        <circle cx="${cx+20}" cy="${cy-5+yOff}" r="${4*scale}" fill="#333"/>
        <circle cx="${cx-15}" cy="${cy-7+yOff}" r="${1.5*scale}" fill="white"/>
        <circle cx="${cx+21}" cy="${cy-7+yOff}" r="${1.5*scale}" fill="white"/>`,
      sparkle: `
        <circle cx="${cx-18}" cy="${cy-5+yOff}" r="${9*scale}" fill="white" stroke="#333" stroke-width="1.5"/>
        <circle cx="${cx+18}" cy="${cy-5+yOff}" r="${9*scale}" fill="white" stroke="#333" stroke-width="1.5"/>
        <circle cx="${cx-16}" cy="${cy-5+yOff}" r="${5*scale}" fill="#6C5CE7"/>
        <circle cx="${cx+20}" cy="${cy-5+yOff}" r="${5*scale}" fill="#6C5CE7"/>
        <circle cx="${cx-14}" cy="${cy-7+yOff}" r="${2*scale}" fill="white"/>
        <circle cx="${cx+22}" cy="${cy-7+yOff}" r="${2*scale}" fill="white"/>
        <circle cx="${cx-18}" cy="${cy-3+yOff}" r="${1*scale}" fill="white"/>
        <circle cx="${cx+18}" cy="${cy-3+yOff}" r="${1*scale}" fill="white"/>`,
      sleepy: `
        <path d="M${cx-26} ${cy-5+yOff} Q${cx-18} ${cy-10+yOff} ${cx-10} ${cy-5+yOff}" stroke="#333" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <path d="M${cx+10} ${cy-5+yOff} Q${cx+18} ${cy-10+yOff} ${cx+26} ${cy-5+yOff}" stroke="#333" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
      angry: `
        <circle cx="${cx-18}" cy="${cy-3+yOff}" r="${7*scale}" fill="white" stroke="#333" stroke-width="1.5"/>
        <circle cx="${cx+18}" cy="${cy-3+yOff}" r="${7*scale}" fill="white" stroke="#333" stroke-width="1.5"/>
        <circle cx="${cx-17}" cy="${cy-2+yOff}" r="${4*scale}" fill="#E74C3C"/>
        <circle cx="${cx+19}" cy="${cy-2+yOff}" r="${4*scale}" fill="#E74C3C"/>
        <line x1="${cx-26}" y1="${cy-12+yOff}" x2="${cx-12}" y2="${cy-8+yOff}" stroke="#333" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="${cx+12}" y1="${cy-8+yOff}" x2="${cx+26}" y2="${cy-12+yOff}" stroke="#333" stroke-width="2.5" stroke-linecap="round"/>`,
      heart: `
        <path d="M${cx-22} ${cy-5+yOff} C${cx-22} ${cy-10+yOff} ${cx-14} ${cy-12+yOff} ${cx-18} ${cy-2+yOff} C${cx-22} ${cy-12+yOff} ${cx-14} ${cy-10+yOff} ${cx-14} ${cy-5+yOff} Z" fill="#E74C3C"/>
        <path d="M${cx+14} ${cy-5+yOff} C${cx+14} ${cy-10+yOff} ${cx+22} ${cy-12+yOff} ${cx+18} ${cy-2+yOff} C${cx+14} ${cy-12+yOff} ${cx+22} ${cy-10+yOff} ${cx+22} ${cy-5+yOff} Z" fill="#E74C3C"/>`,
    };
    return eyes[style] || eyes.default;
  },

  _renderMouth(cx, cy, stage, mood) {
    const yOff = stage === 2 ? 3 : 0;
    if (stage === 2) {
      return `<path d="M${cx-6} ${cy+12+yOff} Q${cx-3} ${cy+16+yOff} ${cx} ${cy+13+yOff} Q${cx+3} ${cy+16+yOff} ${cx+6} ${cy+12+yOff}" stroke="#333" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
    }
    // 감정별 입 모양
    const mouths = {
      happy:   `<path d="M${cx-10} ${cy+10} Q${cx} ${cy+22} ${cx+10} ${cy+10}" stroke="#333" stroke-width="2" fill="none" stroke-linecap="round"/>`,
      excited: `<ellipse cx="${cx}" cy="${cy+14}" rx="8" ry="6" fill="#333"/><ellipse cx="${cx}" cy="${cy+13}" rx="6" ry="4" fill="#E74C3C"/>`,
      normal:  `<path d="M${cx-8} ${cy+12} Q${cx} ${cy+20} ${cx+8} ${cy+12}" stroke="#333" stroke-width="2" fill="none" stroke-linecap="round"/>`,
      sad:     `<path d="M${cx-8} ${cy+18} Q${cx} ${cy+12} ${cx+8} ${cy+18}" stroke="#333" stroke-width="2" fill="none" stroke-linecap="round"/>`,
      hungry:  `<ellipse cx="${cx}" cy="${cy+15}" rx="6" ry="8" fill="none" stroke="#333" stroke-width="2"/>`,
    };
    return mouths[mood] || mouths.normal;
  },

  // ============================================
  // 배경, 모자, 악세서리, 효과 (기존 유지)
  // ============================================

  _renderBackground(bg, s) {
    const bgs = {
      default: `<rect width="${s}" height="${s}" fill="#F0F8FF" rx="20"/>`,
      space: `<rect width="${s}" height="${s}" fill="#1a1a2e" rx="20"/>
              <circle cx="30" cy="30" r="2" fill="white" opacity="0.8"/>
              <circle cx="80" cy="15" r="1.5" fill="white" opacity="0.6"/>
              <circle cx="150" cy="40" r="2" fill="white" opacity="0.7"/>
              <circle cx="170" cy="80" r="1" fill="white" opacity="0.5"/>
              <circle cx="40" cy="170" r="1.5" fill="white" opacity="0.6"/>
              <circle cx="160" cy="160" r="2" fill="white" opacity="0.8"/>
              <circle cx="100" cy="180" r="1" fill="white" opacity="0.4"/>`,
      ocean: `<rect width="${s}" height="${s}" fill="#E3F2FD" rx="20"/>
              <ellipse cx="${s/2}" cy="${s-20}" rx="${s/2}" ry="30" fill="#90CAF9" opacity="0.5"/>
              <path d="M0 ${s-40} Q${s/4} ${s-55} ${s/2} ${s-40} T${s} ${s-40} V${s} H0Z" fill="#64B5F6" opacity="0.3"/>`,
      forest: `<rect width="${s}" height="${s}" fill="#E8F5E9" rx="20"/>
               <circle cx="30" cy="${s-30}" r="25" fill="#81C784" opacity="0.4"/>
               <circle cx="170" cy="${s-25}" r="20" fill="#66BB6A" opacity="0.3"/>
               <rect x="28" y="${s-55}" width="4" height="25" fill="#8D6E63" opacity="0.4"/>
               <circle cx="30" cy="${s-55}" r="15" fill="#4CAF50" opacity="0.35"/>`,
    };
    return bgs[bg] || bgs.default;
  },

  _renderHat(hatId, cx, cy) {
    const hats = {
      crown: `
        <polygon points="${cx-25},${cy-45} ${cx-20},${cy-65} ${cx-10},${cy-50} ${cx},${cy-70} ${cx+10},${cy-50} ${cx+20},${cy-65} ${cx+25},${cy-45}" fill="#FFD700" stroke="#DAA520" stroke-width="1.5"/>
        <rect x="${cx-25}" y="${cy-47}" width="50" height="6" fill="#FFD700" stroke="#DAA520" stroke-width="1"/>
        <circle cx="${cx}" cy="${cy-67}" r="3" fill="#E74C3C"/>`,
      cap: `
        <ellipse cx="${cx}" cy="${cy-40}" rx="35" ry="12" fill="#3498DB"/>
        <path d="M${cx-35} ${cy-40} Q${cx-35} ${cy-55} ${cx} ${cy-55} Q${cx+35} ${cy-55} ${cx+35} ${cy-40}" fill="#2980B9"/>
        <rect x="${cx-5}" y="${cy-58}" width="10" height="5" rx="2" fill="#2980B9"/>
        <rect x="${cx+15}" y="${cy-43}" width="25" height="6" rx="3" fill="#3498DB"/>`,
      headband: `
        <path d="M${cx-35} ${cy-35} Q${cx} ${cy-50} ${cx+35} ${cy-35}" stroke="#E91E63" stroke-width="4" fill="none"/>
        <circle cx="${cx+10}" cy="${cy-44}" r="8" fill="#E91E63"/>
        <circle cx="${cx+10}" cy="${cy-44}" r="4" fill="#F48FB1"/>`,
      wizard: `
        <polygon points="${cx},${cy-80} ${cx-30},${cy-35} ${cx+30},${cy-35}" fill="#6C3483" stroke="#4A235A" stroke-width="1.5"/>
        <ellipse cx="${cx}" cy="${cy-37}" rx="32" ry="8" fill="#6C3483" stroke="#4A235A" stroke-width="1"/>
        <circle cx="${cx+5}" cy="${cy-55}" r="4" fill="#F1C40F"/>
        <circle cx="${cx-8}" cy="${cy-65}" r="3" fill="#F1C40F" opacity="0.7"/>`,
      santa: `
        <path d="M${cx-30} ${cy-38} Q${cx} ${cy-70} ${cx+30} ${cy-38}" fill="#E74C3C"/>
        <ellipse cx="${cx}" cy="${cy-38}" rx="33" ry="8" fill="white"/>
        <circle cx="${cx+25}" cy="${cy-62}" r="8" fill="white"/>`,
      flower: `
        <circle cx="${cx}" cy="${cy-50}" r="8" fill="#F39C12"/>
        <circle cx="${cx-8}" cy="${cy-56}" r="6" fill="#E74C3C"/>
        <circle cx="${cx+8}" cy="${cy-56}" r="6" fill="#E91E63"/>
        <circle cx="${cx-10}" cy="${cy-47}" r="6" fill="#FF6B6B"/>
        <circle cx="${cx+10}" cy="${cy-47}" r="6" fill="#FD79A8"/>
        <circle cx="${cx}" cy="${cy-42}" r="6" fill="#E74C3C"/>
        <line x1="${cx}" y1="${cy-42}" x2="${cx}" y2="${cy-35}" stroke="#27AE60" stroke-width="2"/>`,
    };
    return hats[hatId] || "";
  },

  _renderAccessoryBehind(accId, cx, cy) {
    const items = {
      wings: `
        <path d="M${cx-55} ${cy} Q${cx-80} ${cy-30} ${cx-55} ${cy-45} Q${cx-45} ${cy-20} ${cx-40} ${cy+5}" fill="#AED6F1" opacity="0.7" stroke="#85C1E9" stroke-width="1"/>
        <path d="M${cx+55} ${cy} Q${cx+80} ${cy-30} ${cx+55} ${cy-45} Q${cx+45} ${cy-20} ${cx+40} ${cy+5}" fill="#AED6F1" opacity="0.7" stroke="#85C1E9" stroke-width="1"/>`,
      cape: `
        <path d="M${cx-35} ${cy-10} L${cx-45} ${cy+70} Q${cx} ${cy+80} ${cx+45} ${cy+70} L${cx+35} ${cy-10}" fill="#8E44AD" opacity="0.6"/>`,
    };
    return items[accId] || "";
  },

  _renderAccessoryFront(accId, cx, cy) {
    const items = {
      glasses: `
        <circle cx="${cx-18}" cy="${cy-5}" r="12" fill="none" stroke="#333" stroke-width="2.5"/>
        <circle cx="${cx+18}" cy="${cy-5}" r="12" fill="none" stroke="#333" stroke-width="2.5"/>
        <line x1="${cx-6}" y1="${cy-5}" x2="${cx+6}" y2="${cy-5}" stroke="#333" stroke-width="2"/>
        <line x1="${cx-30}" y1="${cy-5}" x2="${cx-38}" y2="${cy-8}" stroke="#333" stroke-width="2"/>
        <line x1="${cx+30}" y1="${cy-5}" x2="${cx+38}" y2="${cy-8}" stroke="#333" stroke-width="2"/>`,
      necklace: `
        <path d="M${cx-25} ${cy+20} Q${cx} ${cy+35} ${cx+25} ${cy+20}" stroke="#F1C40F" stroke-width="2" fill="none"/>
        <circle cx="${cx}" cy="${cy+33}" r="5" fill="#F1C40F" stroke="#DAA520" stroke-width="1"/>`,
      bow: `
        <path d="M${cx+25} ${cy-30} Q${cx+40} ${cy-40} ${cx+35} ${cy-25}" fill="#E91E63"/>
        <path d="M${cx+25} ${cy-30} Q${cx+40} ${cy-20} ${cx+35} ${cy-35}" fill="#C2185B"/>
        <circle cx="${cx+25}" cy="${cy-30}" r="3" fill="#AD1457"/>`,
    };
    return items[accId] || "";
  },

  _renderEffectBehind(effectId, cx, cy, s) {
    const effects = {
      halo: `<ellipse cx="${cx}" cy="${cy-55}" rx="30" ry="8" fill="none" stroke="#F1C40F" stroke-width="3" opacity="0.7"/>
             <ellipse cx="${cx}" cy="${cy-55}" rx="30" ry="8" fill="#F1C40F" opacity="0.15"/>`,
      fire: `
        <ellipse cx="${cx}" cy="${cy+60}" rx="50" ry="15" fill="#FF6B35" opacity="0.2"/>
        <path d="M${cx-30} ${cy+60} Q${cx-20} ${cy+30} ${cx-10} ${cy+50} Q${cx} ${cy+20} ${cx+10} ${cy+50} Q${cx+20} ${cy+30} ${cx+30} ${cy+60}" fill="#FF6B35" opacity="0.3"/>`,
    };
    return effects[effectId] || "";
  },

  _renderEffectFront(effectId, cx, cy, s) {
    const effects = {
      sparkle: `
        <text x="${cx-35}" y="${cy-40}" font-size="14" opacity="0.8">✨</text>
        <text x="${cx+25}" y="${cy-30}" font-size="12" opacity="0.6">✨</text>
        <text x="${cx-40}" y="${cy+20}" font-size="10" opacity="0.5">✨</text>
        <text x="${cx+35}" y="${cy+30}" font-size="13" opacity="0.7">✨</text>
        <text x="${cx}" y="${cy-55}" font-size="11" opacity="0.6">✨</text>`,
    };
    return effects[effectId] || "";
  },
};
