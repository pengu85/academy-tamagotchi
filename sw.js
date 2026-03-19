// ============================================
// sw.js - Service Worker (PWA 오프라인 지원)
// ============================================

const CACHE_NAME = "tamagotchi-v4";
const ASSETS = [
  "./index.html",
  "./icon.svg",
  "./css/reset.css",
  "./css/style.css",
  "./css/tamagotchi.css",
  "./css/mission.css",
  "./css/shop.css",
  "./css/contest.css",
  "./css/admin.css",
  "./css/badge.css",
  "./css/minigame.css",
  "./css/event.css",
  "./css/team.css",
  "./css/ranking.css",
  "./css/share.css",
  "./css/care.css",
  "./css/diary.css",
  "./css/challenge.css",
  "./css/dashboard.css",
  "./css/house.css",
  "./css/tutorial.css",
  "./css/friend.css",
  "./css/attendance.css",
  "./css/mood.css",
  "./css/report.css",
  "./css/calendar.css",
  "./css/quickquiz.css",
  "./js/data.js",
  "./js/storage.js",
  "./js/sound.js",
  "./js/ui.js",
  "./js/tamagotchi.js",
  "./js/tamagotchi-renderer.js",
  "./js/event.js",
  "./js/care.js",
  "./js/secret.js",
  "./js/diary.js",
  "./js/challenge.js",
  "./js/dashboard.js",
  "./js/house.js",
  "./js/badge.js",
  "./js/minigame.js",
  "./js/mission.js",
  "./js/shop.js",
  "./js/team.js",
  "./js/ranking.js",
  "./js/mood.js",
  "./js/report.js",
  "./js/calendar.js",
  "./js/quickquiz.js",
  "./js/friend.js",
  "./js/attendance.js",
  "./js/share.js",
  "./js/contest.js",
  "./js/admin.js",
  "./js/tutorial.js",
  "./js/app.js",
];

// 설치: 에셋 캐시
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// 활성화: 이전 캐시 삭제
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 요청 가로채기: 캐시 우선, 없으면 네트워크
self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
