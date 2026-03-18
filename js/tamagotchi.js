// ============================================
// tamagotchi.js - 다마고치 로직 (레벨업, 경험치, 능력치, 진화)
// ============================================

const Tamagotchi = {
  // 경험치 추가 및 레벨업 + 진화 처리
  addExp(student, amount) {
    this.ensureEvolution(student);
    const tama = student.tamagotchi;
    tama.exp += amount;
    const levelUps = [];
    const evolutions = [];

    while (true) {
      const nextLevel = tama.level + 1;
      const needed = getExpForLevel(nextLevel);
      if (needed <= 0) break;
      if (tama.exp >= needed) {
        tama.exp -= needed;
        tama.level = nextLevel;
        const reward = getRewardForLevel(nextLevel);
        tama.points += reward.points;
        if (reward.snackBox) {
          student.snackBoxChances += reward.snackBox;
        }
        levelUps.push({ level: nextLevel, reward });

        // 진화 체크
        const evo = this.checkEvolution(student);
        if (evo) evolutions.push(evo);
      } else {
        break;
      }
    }

    Storage.updateStudent(student);
    return { levelUps, evolutions };
  },

  // 현재 레벨에서 다음 레벨까지 필요한 경험치
  getExpToNext(student) {
    return getExpForLevel(student.tamagotchi.level + 1);
  },

  // 경험치 진행률 (%)
  getExpPercent(student) {
    const needed = this.getExpToNext(student);
    if (needed <= 0) return 100;
    return Math.min(100, Math.floor((student.tamagotchi.exp / needed) * 100));
  },

  // ============================================
  // 진화 시스템
  // ============================================

  // 레벨에 맞는 진화 단계 계산
  getEvolutionStage(level) {
    let result = EVOLUTION_TABLE[0];
    for (const entry of EVOLUTION_TABLE) {
      if (level >= entry.minLevel) result = entry;
    }
    return result;
  },

  // 진화 체크 및 적용
  checkEvolution(student) {
    const tama = student.tamagotchi;
    this.ensureEvolution(student);
    const currentStage = tama.evolution.stage;
    const newEvo = this.getEvolutionStage(tama.level);

    if (newEvo.stage > currentStage) {
      const fromStage = currentStage;
      tama.evolution.stage = newEvo.stage;
      tama.evolution.stageName = newEvo.name;

      // 최종 진화 시 형태 결정
      if (newEvo.stage === 5) {
        tama.evolution.finalForm = this.determineFinalForm(tama.stats);
      }

      return {
        fromStage,
        toStage: newEvo.stage,
        stageName: newEvo.name,
        finalForm: tama.evolution.finalForm,
      };
    }
    return null;
  },

  // 최종 진화 형태 결정 (가장 높은 능력치, 동률 시 str>int>cha>sta)
  determineFinalForm(stats) {
    const order = ["str", "int", "cha", "sta"];
    const formMap = { str: "warrior", int: "scholar", cha: "star", sta: "guardian" };
    let maxStat = order[0];
    for (const key of order) {
      if (stats[key] > stats[maxStat]) maxStat = key;
    }
    return formMap[maxStat];
  },

  // 하위 호환: evolution 필드가 없는 기존 데이터 마이그레이션
  ensureEvolution(student) {
    const tama = student.tamagotchi;
    if (tama.evolution) return;

    const evo = this.getEvolutionStage(tama.level);
    tama.evolution = {
      stage: evo.stage,
      stageName: evo.name,
      finalForm: evo.stage === 5 ? this.determineFinalForm(tama.stats) : null,
    };
  },

  // 능력치 올리기
  addStat(student, statName, amount = 1) {
    const tama = student.tamagotchi;
    const cost = STAT_COST * amount;
    if (tama.points < cost) return false;
    if (!tama.stats.hasOwnProperty(statName)) return false;

    tama.points -= cost;
    tama.stats[statName] += amount;
    Storage.updateStudent(student);
    return true;
  },

  // 아이템 구매
  buyItem(student, itemId) {
    const tama = student.tamagotchi;
    const items = Storage.getItems();
    const item = items.find((i) => i.id === itemId);
    if (!item) return { success: false, message: "아이템을 찾을 수 없어요" };
    if (tama.ownedItems.includes(itemId)) return { success: false, message: "이미 가지고 있어요" };
    if (tama.level < item.unlockLevel) return { success: false, message: `레벨 ${item.unlockLevel} 이상이어야 해요` };
    if (tama.points < item.cost) return { success: false, message: "포인트가 부족해요" };

    tama.points -= item.cost;
    tama.ownedItems.push(itemId);
    Storage.updateStudent(student);
    return { success: true, message: `${item.name} 구매 완료!` };
  },

  // 외형 변경
  equipItem(student, category, value) {
    const tama = student.tamagotchi;
    const app = tama.appearance;

    switch (category) {
      case "bodyColor": app.bodyColor = value; break;
      case "eyeStyle": app.eyeStyle = value; break;
      case "hat": app.hat = app.hat === value ? null : value; break;
      case "accessory": app.accessory = app.accessory === value ? null : value; break;
      case "background": app.background = app.background === value ? "default" : value; break;
      case "effect": app.effect = app.effect === value ? null : value; break;
    }

    Storage.updateStudent(student);
  },

  // 색상 변경 (구매 포함)
  changeBodyColor(student, colorId) {
    const color = BODY_COLORS.find((c) => c.id === colorId);
    if (!color) return false;

    if (color.cost > 0 && !student.tamagotchi.ownedItems.includes("color_" + colorId)) {
      if (student.tamagotchi.points < color.cost) return false;
      student.tamagotchi.points -= color.cost;
      student.tamagotchi.ownedItems.push("color_" + colorId);
    }

    student.tamagotchi.appearance.bodyColor = color.hex;
    Storage.updateStudent(student);
    return true;
  },

  // 눈 스타일 변경
  changeEyeStyle(student, styleId) {
    const style = EYE_STYLES.find((s) => s.id === styleId);
    if (!style) return false;

    if (style.cost > 0 && !student.tamagotchi.ownedItems.includes("eye_" + styleId)) {
      if (student.tamagotchi.level < 3) return false;
      if (student.tamagotchi.points < style.cost) return false;
      student.tamagotchi.points -= style.cost;
      student.tamagotchi.ownedItems.push("eye_" + styleId);
    }

    student.tamagotchi.appearance.eyeStyle = styleId;
    Storage.updateStudent(student);
    return true;
  },

  // 총 능력치 합
  getTotalStats(student) {
    const s = student.tamagotchi.stats;
    return s.str + s.int + s.cha + s.sta;
  },
};
