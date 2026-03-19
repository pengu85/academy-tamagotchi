// ============================================
// mission.js - 미션 관리 및 완료 처리
// ============================================

const Mission = {
  // 미션 목록 가져오기 (활성 상태만)
  getActiveMissions() {
    const missions = Storage.getMissions() || [];
    return missions.filter((m) => m.active);
  },

  // 오늘 완료 여부 확인 (반복 미션용)
  isCompletedToday(student, missionId) {
    const today = new Date().toISOString().split("T")[0];
    return student.completedMissions.some(
      (c) => c.missionId === missionId && c.completedAt === today
    );
  },

  // 비반복 미션 완료 여부
  isCompleted(student, missionId) {
    return student.completedMissions.some((c) => c.missionId === missionId);
  },

  // 미션 완료 처리
  completeMission(student, missionId, code = null) {
    const missions = Storage.getMissions() || [];
    const mission = missions.find((m) => m.id === missionId);
    if (!mission) return { success: false, message: "미션을 찾을 수 없어요" };
    if (!mission.active) return { success: false, message: "비활성 미션이에요" };

    // 반복 미션: 오늘 이미 완료했는지 확인
    if (mission.repeatable && this.isCompletedToday(student, missionId)) {
      return { success: false, message: "오늘은 이미 완료했어요!" };
    }

    // 비반복 미션: 이미 완료했는지 확인
    if (!mission.repeatable && this.isCompleted(student, missionId)) {
      return { success: false, message: "이미 완료한 미션이에요" };
    }

    // 인증코드 확인
    if (mission.requireVerification) {
      const correctCode = Storage.getVerificationCode();
      if (!code || code !== correctCode) {
        return { success: false, message: "인증코드가 틀렸어요! 선생님께 확인하세요." };
      }
    }

    // 완료 기록
    student.completedMissions.push({
      missionId: missionId,
      completedAt: new Date().toISOString().split("T")[0],
    });

    // 출석 미션이면 연속 출석 체크
    if (mission.type === "attendance") {
      this._updateStreak(student);
    }

    // 경험치 추가 (이벤트 배율 + INT 보너스 + 아픔 페널티)
    let expAmount = mission.exp;
    const eventMultiplier = GameEvent.getExpMultiplier();
    const intBonus = student.tamagotchi.stats.int * 0.02;
    const carePenalty = Care.getExpPenalty(student);
    expAmount = Math.floor(expAmount * eventMultiplier * (1 + intBonus) * carePenalty);

    // 돌봄 게이지 약간 회복 (미션 완료 시)
    Care.ensure(student);
    student.care.clean = Math.min(100, student.care.clean + 5);

    const result = Tamagotchi.addExp(student, expAmount);

    // 깜짝 보물 이벤트 (10% 확률)
    const treasureBonus = Secret.rollBonusTreasure(student);

    // 비밀 진화 체크
    const secretEvo = Secret.checkSecretEvolution(student);

    // 연속 출석 7일 달성 시 체력 보너스 (간식상자)
    if (student.streakDays > 0 && student.streakDays % 7 === 0) {
      student.snackBoxChances += 1;
      student.totalSnackBoxEarned = (student.totalSnackBoxEarned || 0) + 1;
      Storage.updateStudent(student);
    }

    return {
      success: true,
      message: `미션 완료! +${expAmount} EXP` + (carePenalty < 1 ? " (아픔 감소)" : ""),
      expGained: expAmount,
      levelUps: result.levelUps,
      treasureBonus,
      secretEvo,
      evolutions: result.evolutions,
    };
  },

  _updateStreak(student) {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    if (student.lastAttendance === yesterday) {
      student.streakDays += 1;
    } else if (student.lastAttendance !== today) {
      student.streakDays = 1;
    }
    student.lastAttendance = today;
  },

  // 미션 추가 (관리자)
  addMission(missionData) {
    const missions = Storage.getMissions() || [];
    const mission = {
      id: "msn_" + Date.now(),
      title: missionData.title,
      description: missionData.description || "",
      type: missionData.type || "special",
      exp: parseInt(missionData.exp) || 10,
      repeatable: !!missionData.repeatable,
      requireVerification: true,
      verificationCode: null,
      active: true,
    };
    missions.push(mission);
    Storage.saveMissions(missions);
    return mission;
  },

  // 미션 삭제 (관리자)
  deleteMission(missionId) {
    const missions = Storage.getMissions() || [];
    const filtered = missions.filter((m) => m.id !== missionId);
    Storage.saveMissions(filtered);
  },

  // 미션 수정 (관리자)
  updateMission(missionId, updates) {
    const missions = Storage.getMissions() || [];
    const idx = missions.findIndex((m) => m.id === missionId);
    if (idx >= 0) {
      Object.assign(missions[idx], updates);
      Storage.saveMissions(missions);
    }
  },
};
