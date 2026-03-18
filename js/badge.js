// ============================================
// badge.js - 업적/뱃지 시스템
// ============================================

const Badge = {
  // 새로 획득한 뱃지 확인
  checkNewBadges(student) {
    if (!student.badges) student.badges = [];
    const newBadges = [];

    BADGES.forEach((badge) => {
      if (!student.badges.includes(badge.id) && badge.condition(student)) {
        student.badges.push(badge.id);
        newBadges.push(badge);
      }
    });

    if (newBadges.length > 0) {
      Storage.updateStudent(student);
    }
    return newBadges;
  },

  // 뱃지 목록 렌더
  render(container) {
    const student = Storage.getCurrentStudent();
    if (!student) return;
    if (!student.badges) student.badges = [];

    let html = `
      <div class="badge-screen">
        <h2>🏅 업적</h2>
        <p class="badge-count">${student.badges.length} / ${BADGES.length} 달성</p>
        <div class="badge-grid">
    `;

    BADGES.forEach((badge) => {
      const earned = student.badges.includes(badge.id);
      html += `
        <div class="badge-card ${earned ? 'earned' : 'locked'}">
          <div class="badge-icon">${earned ? badge.icon : '🔒'}</div>
          <div class="badge-name">${badge.name}</div>
          <div class="badge-desc">${earned ? badge.description : '???'}</div>
        </div>
      `;
    });

    html += '</div></div>';
    container.innerHTML = html;
  },

  // 뱃지 획득 알림
  showBadgeNotification(badge) {
    Sound.badge();
    UI.showModal("🏅 업적 달성!", `
      <div class="badge-notification">
        <div class="badge-big-icon">${badge.icon}</div>
        <div class="badge-big-name">${badge.name}</div>
        <div class="badge-big-desc">${badge.description}</div>
      </div>
    `, [{ text: "확인", class: "btn btn-primary" }]);
  },
};
