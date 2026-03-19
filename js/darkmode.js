// ============================================
// darkmode.js - 다크 모드 토글
// ============================================

const DarkMode = {
  KEY: "atg_dark_mode",

  init() {
    if (this.isEnabled()) document.body.classList.add("dark-mode");
  },

  isEnabled() {
    return localStorage.getItem(this.KEY) === "true";
  },

  toggle() {
    const enabled = !this.isEnabled();
    localStorage.setItem(this.KEY, enabled);
    document.body.classList.toggle("dark-mode", enabled);
    return enabled;
  },
};
