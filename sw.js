// Service Worker: يتيح تثبيت التطبيق (PWA) وتشغيله دون اتصال بالإنترنت
// عبر تخزين الملفات الأساسية في ذاكرة تخزين مؤقت محلية (Cache).

const CACHE_NAME = "bac-calc-2027-v3"; // رفع رقم الإصدار عند أي تحديث جوهري للملفات
const ASSETS = [
  "./index.html",
  "./styles.css",
  "./script.js",
  "./last-update.html",
  "./about.html",
  "./privacy.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// عند التثبيت: تحميل كل الملفات الأساسية إلى الكاش دفعة واحدة
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// عند التفعيل: حذف أي نسخ كاش قديمة من إصدارات سابقة للتطبيق
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// عند كل طلب: إرجاع النسخة المخزّنة إن وُجدت، وإلا الجلب من الشبكة
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
