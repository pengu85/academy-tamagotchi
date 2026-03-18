// ============================================
// storage.js - localStorage CRUD 래퍼
// ============================================

const Storage = {
  PREFIX: "atg_",

  _key(name) {
    return this.PREFIX + name;
  },

  get(name, defaultValue = null) {
    const raw = localStorage.getItem(this._key(name));
    if (raw === null) return defaultValue;
    try {
      return JSON.parse(raw);
    } catch {
      return defaultValue;
    }
  },

  set(name, value) {
    localStorage.setItem(this._key(name), JSON.stringify(value));
  },

  remove(name) {
    localStorage.removeItem(this._key(name));
  },

  // 학생 관련
  getStudents() {
    return this.get("students", []);
  },

  saveStudents(students) {
    this.set("students", students);
  },

  getStudent(id) {
    return this.getStudents().find((s) => s.id === id) || null;
  },

  updateStudent(student) {
    const students = this.getStudents();
    const idx = students.findIndex((s) => s.id === student.id);
    if (idx >= 0) {
      students[idx] = student;
    } else {
      students.push(student);
    }
    this.saveStudents(students);
  },

  deleteStudent(id) {
    const students = this.getStudents().filter((s) => s.id !== id);
    this.saveStudents(students);
    if (this.getCurrentStudentId() === id) {
      this.setCurrentStudentId(null);
    }
  },

  getCurrentStudentId() {
    return this.get("current_student", null);
  },

  setCurrentStudentId(id) {
    this.set("current_student", id);
  },

  getCurrentStudent() {
    const id = this.getCurrentStudentId();
    return id ? this.getStudent(id) : null;
  },

  // 미션 관련
  getMissions() {
    return this.get("missions", null);
  },

  saveMissions(missions) {
    this.set("missions", missions);
  },

  initMissions() {
    if (!this.getMissions()) {
      this.saveMissions(DEFAULT_MISSIONS);
    }
  },

  // 아이템 관련
  getItems() {
    return this.get("items", null);
  },

  saveItems(items) {
    this.set("items", items);
  },

  initItems() {
    if (!this.getItems()) {
      this.saveItems(DEFAULT_ITEMS);
    }
  },

  // 경연대회 관련
  getContest() {
    return this.get("contest", null);
  },

  saveContest(contest) {
    this.set("contest", contest);
  },

  // 관리자 PIN
  getAdminPin() {
    return this.get("admin_pin", "0000");
  },

  setAdminPin(pin) {
    this.set("admin_pin", pin);
  },

  // 인증코드
  getVerificationCode() {
    return this.get("verification_code", "1234");
  },

  setVerificationCode(code) {
    this.set("verification_code", code);
  },

  // 이벤트 관련
  getEvent() {
    return this.get("event", null);
  },

  saveEvent(event) {
    this.set("event", event);
  },

  // 팀 관련
  getTeams() {
    return this.get("teams", []);
  },

  saveTeams(teams) {
    this.set("teams", teams);
  },

  getTeamBattle() {
    return this.get("team_battle", null);
  },

  saveTeamBattle(battle) {
    this.set("team_battle", battle);
  },

  // 학원 이름
  getAcademyName() {
    return this.get("academy_name", "수학학원");
  },

  setAcademyName(name) {
    this.set("academy_name", name);
  },

  // 초기화
  initAll() {
    this.initMissions();
    this.initItems();
  },
};
