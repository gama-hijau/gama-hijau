/* ============================================================
   Service Worker — GaMa Hijau
   Strategi:
   - Aset aplikasi (HTML/CSS/JS/ikon): precache saat instal,
     lalu dilayani cache-first → aplikasi jalan penuh tanpa internet.
   - Font Google: runtime cache (stale-while-revalidate) → setelah
     kunjungan pertama, font pun tersedia offline.
   - API cuaca (BMKG): TIDAK di-cache di sini; selalu lewat
     jaringan. Penyimpanan data terakhir ditangani js/cuaca.js
     lewat localStorage supaya ada label waktu pembaruan.
   ============================================================ */

var VERSI_CACHE = 'gama-hijau-v17';
var CACHE_FONT = 'gama-font-v1';

var ASET_APLIKASI = [
  './',
  'index.html',
  'manifest.json',
  'css/style.css',
  'css/print.css',
  'js/profil.js',
  'js/bagikan.js',
  'js/app.js',
  'js/karbon.js',
  'js/lacak.js',
  'js/sampah.js',
  'js/cuaca.js',
  'js/eco.js',
  'js/jadwal.js',
  'js/kalender.js',
  'js/dampak.js',
  'js/lencana.js',
  'js/faq.js',
  'js/tentang.js',
  'js/onboarding.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png'
];

/* ---------- Instal: simpan seluruh aset aplikasi ---------- */
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(VERSI_CACHE).then(function (cache) {
      return cache.addAll(ASET_APLIKASI);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

/* ---------- Aktif: bersihkan cache versi lama ---------- */
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (kunci) {
      return Promise.all(
        kunci.filter(function (k) {
          return k !== VERSI_CACHE && k !== CACHE_FONT;
        }).map(function (k) {
          return caches.delete(k);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

/* ---------- Klik notifikasi pengingat Jadwal Tani ----------
   Buka / fokuskan aplikasi lalu arahkan ke halaman jadwal. */
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (daftar) {
      for (var i = 0; i < daftar.length; i++) {
        if ('focus' in daftar[i]) {
          daftar[i].navigate && daftar[i].navigate('#jadwal');
          return daftar[i].focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow('./#jadwal');
    })
  );
});

/* ---------- Fetch ---------- */
self.addEventListener('fetch', function (event) {
  var url = new URL(event.request.url);

  if (event.request.method !== 'GET') return;

  // API cuaca BMKG: biarkan langsung ke jaringan (kegagalan ditangani aplikasi,
  // penyimpanan offline lewat localStorage di js/cuaca.js)
  if (url.hostname.indexOf('bmkg.go.id') !== -1) return;

  // Font Google: stale-while-revalidate
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(CACHE_FONT).then(function (cache) {
        return cache.match(event.request).then(function (tersimpan) {
          var ambilBaru = fetch(event.request).then(function (respons) {
            if (respons && respons.status === 200) {
              cache.put(event.request, respons.clone());
            }
            return respons;
          }).catch(function () {
            return tersimpan;
          });
          return tersimpan || ambilBaru;
        });
      })
    );
    return;
  }

  // Aset aplikasi (asal sama): cache-first, jaringan sebagai cadangan.
  // Berkas di luar daftar precache (mis. icons/logo-unhas.png) ikut
  // disimpan saat pertama berhasil diambil → tersedia offline juga.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then(function (tersimpan) {
        if (tersimpan) return tersimpan;
        return fetch(event.request).then(function (respons) {
          if (respons && respons.status === 200) {
            var salinan = respons.clone();
            caches.open(VERSI_CACHE).then(function (cache) {
              cache.put(event.request, salinan);
            });
          }
          return respons;
        }).catch(function () {
          // Navigasi saat offline → kembalikan halaman utama
          if (event.request.mode === 'navigate') {
            return caches.match('index.html');
          }
        });
      })
    );
  }
});
