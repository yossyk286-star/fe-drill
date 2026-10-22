// オフラインでも開けるようにするキャッシュ。ファイルを更新したら VERSION を上げる
const VERSION = "fe-drill-v5";
const FILES = [
  "./", "index.html", "style.css", "app.js",
  "questions.js", "questions-2.js", "questions-3.js", "questions-b.js", "questions-b2.js",
  "glossary.js", "glossary-2.js", "manifest.json",
  "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 自分のサイトのファイルは「ネットにつながればそれを使い、だめならキャッシュ」
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match("index.html")))
  );
});
