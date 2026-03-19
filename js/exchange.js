// ============================================
// exchange.js - 아이템 교환 시스템
// ============================================

const Exchange = {
  // 아이템 선물하기 (보유 아이템 → 친구에게 전달)
  sendItem(sender, receiverId, itemId) {
    const receiver = Storage.getStudent(receiverId);
    if (!receiver) return { success: false, message: "\uC0C1\uB300\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC5B4\uC694" };
    if (!sender.friends || !sender.friends.includes(receiverId)) return { success: false, message: "\uCE5C\uAD6C\uAC00 \uC544\uB2C8\uC5D0\uC694" };
    if (!sender.tamagotchi.ownedItems.includes(itemId)) return { success: false, message: "\uBCF4\uC720\uD558\uC9C0 \uC54A\uC740 \uC544\uC774\uD15C\uC774\uC5D0\uC694" };
    if (receiver.tamagotchi.ownedItems.includes(itemId)) return { success: false, message: "\uC0C1\uB300\uAC00 \uC774\uBBF8 \uBCF4\uC720 \uC911\uC774\uC5D0\uC694" };

    // 장착 해제
    const app = sender.tamagotchi.appearance;
    if (app.hat === itemId) app.hat = null;
    if (app.accessory === itemId) app.accessory = null;
    if (app.background === itemId) app.background = "default";
    if (app.effect === itemId) app.effect = null;

    sender.tamagotchi.ownedItems = sender.tamagotchi.ownedItems.filter((i) => i !== itemId);
    receiver.tamagotchi.ownedItems.push(itemId);

    Storage.updateStudent(sender);
    Storage.updateStudent(receiver);

    return { success: true, message: `${UI.esc(receiver.name)}\uC5D0\uAC8C \uC120\uBB3C \uC644\uB8CC!` };
  },

  // 교환 모달 표시
  showExchangeModal(student) {
    const friends = Friend.getFriends(student);
    const items = Storage.getItems() || [];
    const ownedItems = items.filter((i) => student.tamagotchi.ownedItems.includes(i.id));

    if (ownedItems.length === 0) {
      UI.showToast("\uC120\uBB3C\uD560 \uC544\uC774\uD15C\uC774 \uC5C6\uC5B4\uC694!", "error");
      return;
    }
    if (friends.length === 0) {
      UI.showToast("\uCE5C\uAD6C\uAC00 \uC5C6\uC5B4\uC694!", "error");
      return;
    }

    let html = `
      <div class="exchange-form">
        <div class="form-group">
          <label>\uC120\uBB3C\uD560 \uC544\uC774\uD15C</label>
          <select id="exchange-item">
            ${ownedItems.map((i) => `<option value="${i.id}">${i.name}</option>`).join("")}
          </select>
        </div>
        <div class="form-group">
          <label>\uBC1B\uC744 \uCE5C\uAD6C</label>
          <select id="exchange-friend">
            ${friends.map((f) => `<option value="${f.id}">${UI.esc(f.name)}</option>`).join("")}
          </select>
        </div>
      </div>
    `;

    UI.showModal("\u{1F381} \uC544\uC774\uD15C \uC120\uBB3C", html, [
      { text: "\uCDE8\uC18C", class: "btn btn-secondary" },
      {
        text: "\uC120\uBB3C\uD558\uAE30", class: "btn btn-primary",
        onClick: () => {
          const itemId = document.getElementById("exchange-item").value;
          const friendId = document.getElementById("exchange-friend").value;
          const result = this.sendItem(student, friendId, itemId);
          UI.showToast(result.message, result.success ? "success" : "error");
        },
        closeOnClick: true,
      },
    ]);
  },
};
