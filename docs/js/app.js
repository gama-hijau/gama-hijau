/* ============================================================
   app.js — navigasi antar halaman, status jaringan, Siklus Tani,
   strip ringkasan beranda, service worker
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Navigasi antar tampilan (dengan riwayat hash,
     supaya tombol "kembali" HP tidak langsung menutup aplikasi) ---------- */
  var semuaView = document.querySelectorAll('.view');
  var tombolNav = document.querySelectorAll('.nav-tombol');
  var NAMA_VALID = [];
  semuaView.forEach(function (v) { NAMA_VALID.push(v.id.replace('view-', '')); });

  function tampilkan(nama) {
    if (NAMA_VALID.indexOf(nama) === -1) nama = 'beranda';
    semuaView.forEach(function (v) {
      v.classList.toggle('aktif', v.id === 'view-' + nama);
    });
    tombolNav.forEach(function (t) {
      t.classList.toggle('aktif', t.dataset.tuju === nama);
    });
    window.scrollTo(0, 0);

    if (nama === 'cuaca' && window.GamaCuaca) window.GamaCuaca.muat();
    if (nama === 'jadwal' && window.GamaJadwal) window.GamaJadwal.segarkan();
    if (nama === 'lacak' && window.GamaLacak) window.GamaLacak.segarkan();
    if (nama === 'tentang' && window.GamaTentang) window.GamaTentang.perbaruiStorage();
    if (nama === 'beranda') {
      gambarStripStatus();
      perbaruiSiklus();
      if (window.GamaDampak) window.GamaDampak.perbarui();
      if (window.GamaLencana) window.GamaLencana.perbarui();
    }
  }

  function bukaHalaman(nama) {
    if (location.hash === '#' + nama) tampilkan(nama);
    else location.hash = nama;               // memicu hashchange → tampilkan
  }
  window.bukaHalaman = bukaHalaman;

  window.addEventListener('hashchange', function () {
    tampilkan((location.hash || '#beranda').slice(1));
  });

  // Tombol nav bawah, kartu fitur, dan tombol tautan memakai data-tuju
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-tuju]');
    if (el) bukaHalaman(el.dataset.tuju);
  });

  /* ---------- Indikator online / offline ---------- */
  var statusEl = document.getElementById('status-jaringan');
  var statusTeks = document.getElementById('status-teks');

  function perbaruiStatus() {
    var online = navigator.onLine;
    statusEl.classList.toggle('offline', !online);
    statusTeks.textContent = online ? 'Online' : 'Offline';
  }
  window.addEventListener('online', perbaruiStatus);
  window.addEventListener('offline', perbaruiStatus);
  perbaruiStatus();

  /* ---------- Logo lembaga di kepala: pakai berkas resmi bila ada,
     kalau berkasnya belum dipasang → tampilkan monogram teks ---------- */
  (function siapkanLogoKepala() {
    var logos = document.querySelectorAll('.pita-lembaga .logo-kepala');
    logos.forEach(function (bungkus) {
      var img = bungkus.querySelector('.logo-kepala-img');
      if (!img) return;
      function pakaiCadangan() { bungkus.classList.add('tanpa-gambar'); }
      img.addEventListener('error', pakaiCadangan);
      if (img.complete && img.naturalWidth === 0) pakaiCadangan();
    });
  })();

  /* ---------- Format tanggal Indonesia (dipakai fitur lain) ---------- */
  window.formatTanggal = function (tgl, denganJam) {
    var hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    var bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
                 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    var d = (tgl instanceof Date) ? tgl : new Date(tgl);
    var teks = hari[d.getDay()] + ', ' + d.getDate() + ' ' + bulan[d.getMonth()] + ' ' + d.getFullYear();
    if (denganJam) {
      teks += ' · ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    }
    return teks;
  };

  /* ============================================================
     SIKLUS TANI — tanda tangan visual aplikasi.
     Tanaman jagung tumbuh mengikuti aktivitas NYATA pengguna:
     + tiap perhitungan karbon tersimpan
     + tiap langkah eco-enzyme dicentang
     + tiap kegiatan di Jadwal Tani
     ============================================================ */
  var TANAH =
    /* langit: matahari, awan, burung */
    '<circle cx="100" cy="20" r="14" fill="#D4A62A" opacity="0.18"/>' +
    '<circle cx="100" cy="20" r="9" fill="#D4A62A" opacity="0.55"/>' +
    '<path d="M14 26 C 10 26, 8 23.5, 8 21.5 C 8 19.3, 9.8 17.6, 12 17.6 C 12.5 14.6, 15 12.6, 18 12.6 C 21 12.6, 23.4 14.5, 24 17.4 L 26 17.4 C 28.5 17.4, 30.5 19.4, 30.5 21.8 C 30.5 24.1, 28.6 26, 26.2 26 Z" fill="#5C7A8A" opacity="0.22"/>' +
    '<path d="M34 12 c 2.4 -2.4 4.8 -2.4 7.2 0 M45 7 c 2 -2 4 -2 6 0" stroke="#33472E" stroke-width="1.5" fill="none" opacity="0.45" stroke-linecap="round"/>' +
    /* tanah bergunduk + rumput kecil */
    '<ellipse cx="60" cy="101" rx="38" ry="9" fill="#6B4A32"/>' +
    '<ellipse cx="60" cy="98" rx="27" ry="6" fill="#84603F"/>' +
    '<path d="M28 96 C 28 92.5, 27 90.5, 25.6 89 M31 96 C 31 93, 32 91, 33.6 89.6" stroke="#7A9B3F" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.85"/>' +
    '<path d="M90 97 C 90 93.5, 89 91.5, 87.6 90 M93 97 C 93 94, 94 92, 95.6 90.6" stroke="#7A9B3F" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.85"/>';

  var TAHAP_SVG = [
    /* 0 — benih */
    TANAH +
    '<g class="tumbuh">' +
      '<ellipse cx="60" cy="93" rx="6.5" ry="8" fill="#D4A62A" stroke="#6B4A32" stroke-width="2"/>' +
      '<path d="M60 85 C 60 80, 62 77, 65 75" stroke="#7A9B3F" stroke-width="2" fill="none" stroke-linecap="round" stroke-dasharray="3 4"/>' +
    '</g>',

    /* 1 — bibit */
    TANAH +
    '<g class="tumbuh">' +
      '<path d="M60 97 V78" stroke="#33472E" stroke-width="3.5" stroke-linecap="round"/>' +
      '<path d="M60 88 C 51 86, 45 80, 44 72 C 52 74, 58 80, 60 88 Z" fill="#7A9B3F"/>' +
      '<path d="M60 84 C 69 82, 75 76, 76 68 C 68 70, 62 76, 60 84 Z" fill="#33472E"/>' +
    '</g>',

    /* 2 — tunas */
    TANAH +
    '<g class="tumbuh">' +
      '<path d="M60 97 V58" stroke="#33472E" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M60 88 C 49 86, 42 79, 41 70 C 51 72, 58 79, 60 88 Z" fill="#7A9B3F"/>' +
      '<path d="M60 80 C 71 78, 78 71, 79 62 C 69 64, 62 71, 60 80 Z" fill="#33472E"/>' +
      '<path d="M60 70 C 51 68, 45 62, 44 54 C 53 56, 58 62, 60 70 Z" fill="#7A9B3F"/>' +
      '<path d="M60 63 C 68 61, 73 56, 74 49 C 66 51, 61 56, 60 63 Z" fill="#7A9B3F"/>' +
    '</g>',

    /* 3 — tanaman muda */
    TANAH +
    '<g class="tumbuh">' +
      '<path d="M60 97 V42" stroke="#33472E" stroke-width="4.5" stroke-linecap="round"/>' +
      '<path d="M60 90 C 47 88, 39 80, 38 70 C 50 73, 58 80, 60 90 Z" fill="#7A9B3F"/>' +
      '<path d="M60 81 C 73 79, 81 71, 82 61 C 70 64, 62 71, 60 81 Z" fill="#33472E"/>' +
      '<path d="M60 70 C 49 68, 42 61, 41 52 C 52 55, 58 61, 60 70 Z" fill="#7A9B3F"/>' +
      '<path d="M60 60 C 70 58, 76 52, 77 44 C 68 46, 62 52, 60 60 Z" fill="#33472E"/>' +
      '<path d="M60 50 C 53 48, 49 44, 48 38 C 55 40, 59 44, 60 50 Z" fill="#7A9B3F"/>' +
      '<path d="M60 42 C 60 37, 61 34, 63 31" stroke="#7A9B3F" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
    '</g>',

    /* 4 — berbuah */
    TANAH +
    '<g class="tumbuh">' +
      '<path d="M60 97 V34" stroke="#33472E" stroke-width="4.5" stroke-linecap="round"/>' +
      '<path d="M60 90 C 47 88, 39 80, 38 70 C 50 73, 58 80, 60 90 Z" fill="#7A9B3F"/>' +
      '<path d="M60 81 C 73 79, 81 71, 82 61 C 70 64, 62 71, 60 81 Z" fill="#33472E"/>' +
      '<path d="M60 68 C 49 66, 42 59, 41 50 C 52 53, 58 59, 60 68 Z" fill="#7A9B3F"/>' +
      '<path d="M60 56 C 70 54, 76 48, 77 40 C 68 42, 62 48, 60 56 Z" fill="#33472E"/>' +
      /* tongkol jagung */
      '<ellipse cx="48" cy="64" rx="6.5" ry="12" fill="#D4A62A" transform="rotate(14 48 64)"/>' +
      '<path d="M44 74 C 40 68, 40 58, 45 53 C 42 62, 43 69, 44 74 Z" fill="#7A9B3F"/>' +
      '<path d="M52 55 C 54 51, 55 49, 57 48" stroke="#B8916B" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      /* malai di pucuk */
      '<path d="M60 34 V20 M60 26 L51 16 M60 26 L69 16 M60 30 L54 24 M60 30 L66 24" stroke="#D4A62A" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
    '</g>'
  ];

  var TAHAP_INFO = [
    { nama: 'Benih',        pesan: 'Mulai satu kegiatan untuk menumbuhkan benih ini.' },
    { nama: 'Bibit',        pesan: 'Benih sudah tumbuh! Teruskan kebiasaan baiknya.' },
    { nama: 'Tunas',        pesan: 'Tunas makin tinggi — sama seperti semangat Anda.' },
    { nama: 'Tanaman Muda', pesan: 'Sebentar lagi berbuah. Jangan berhenti sekarang!' },
    { nama: 'Berbuah',      pesan: 'Panen! Kebiasaan ramah iklim Anda sudah berbuah nyata.' }
  ];

  function hitungPoin() {
    var poin = 0;
    var kunci = window.GamaProfil.kunci;
    try {
      // catatan harian (model baru); data lama bulanan tetap dihargai
      var catatanK = JSON.parse(localStorage.getItem(kunci('catatan_harian'))) || [];
      var riwayatK = JSON.parse(localStorage.getItem(kunci('riwayat_karbon'))) || [];
      poin += catatanK.length || riwayatK.length;
    } catch (e) { /* abaikan */ }
    try {
      var eco = JSON.parse(localStorage.getItem(kunci('progres_eco'))) || [];
      eco.forEach(function (x) { if (x) poin++; });
    } catch (e) { /* abaikan */ }
    try {
      poin += (JSON.parse(localStorage.getItem(kunci('jadwal'))) || []).length;
    } catch (e) { /* abaikan */ }
    return poin;
  }

  function tahapDariPoin(poin) {
    if (poin >= 10) return 4;
    if (poin >= 6) return 3;
    if (poin >= 3) return 2;
    if (poin >= 1) return 1;
    return 0;
  }

  function perbaruiSiklus() {
    var wadahGambar = document.getElementById('siklus-gambar');
    var labelTahap = document.getElementById('siklus-tahap');
    var keterangan = document.getElementById('siklus-keterangan');
    if (!wadahGambar) return;

    var poin = hitungPoin();
    var tahap = tahapDariPoin(poin);

    // Animasi tumbuh hanya saat tahap NAIK sejak render terakhir
    var kunciTahap = window.GamaProfil.kunci('siklus_tahap');
    var tahapLalu = -1;
    try { tahapLalu = parseInt(localStorage.getItem(kunciTahap), 10); } catch (e) { /* abaikan */ }
    if (isNaN(tahapLalu)) tahapLalu = -1;
    var naik = tahap > tahapLalu;
    try { localStorage.setItem(kunciTahap, String(tahap)); } catch (e) { /* abaikan */ }

    var svg = '<svg class="siklus-svg" viewBox="0 0 120 120" role="img" ' +
      'aria-label="Ilustrasi tanaman tahap ' + TAHAP_INFO[tahap].nama + '">' +
      TAHAP_SVG[tahap] + '</svg>';
    if (!naik) svg = svg.replace(/class="tumbuh"/g, '');

    wadahGambar.innerHTML = svg;
    labelTahap.textContent = TAHAP_INFO[tahap].nama;
    keterangan.textContent =
      TAHAP_INFO[tahap].pesan +
      (poin > 0
        ? ' Sudah ' + poin + ' kegiatan: hitung karbon, isi jadwal tani, dan kerjakan eco-enzyme untuk terus menumbuhkannya.'
        : ' Tanaman ini tumbuh dari aktivitas nyata Anda di aplikasi.');
  }
  window.GamaSiklus = { perbarui: perbaruiSiklus };

  /* ---------- Strip ringkasan di beranda (dari data tersimpan) ---------- */
  function gambarStripStatus() {
    var strip = document.getElementById('strip-status');
    if (!strip) return;
    var isi = '';

    // Peringatan cuaca ekstrem (fitur 14) — dari data cuaca tersimpan
    try {
      var cacheCuaca = JSON.parse(localStorage.getItem('gama_cache_cuaca'));
      if (cacheCuaca && cacheCuaca.data && cacheCuaca.data.sumber === 'BMKG' &&
          window.GamaCuaca && window.GamaCuaca.analisis) {
        var ekstrem = window.GamaCuaca.analisis(cacheCuaca.data);
        if (ekstrem) {
          isi +=
            '<button type="button" class="kartu-mini kartu-mini-peringatan" data-tuju="cuaca">' +
              '<span class="kartu-mini-ikon" aria-hidden="true">⚠️</span>' +
              '<span><small>Peringatan cuaca</small><b>' + ekstrem.judul + '</b></span>' +
            '</button>';
        }
      }
    } catch (e) { /* abaikan */ }

    try {
      var riwayat = JSON.parse(localStorage.getItem(window.GamaProfil.kunci('riwayat_karbon'))) || [];
      if (riwayat.length) {
        isi +=
          '<button type="button" class="kartu-mini" data-tuju="karbon">' +
            '<span class="kartu-mini-ikon">🍃</span>' +
            '<span><small>Perkiraan karbon sebulan</small><b>' + riwayat[0].total + ' kg CO₂</b></span>' +
          '</button>';
      }
    } catch (e) { /* abaikan */ }

    try {
      var jadwal = JSON.parse(localStorage.getItem(window.GamaProfil.kunci('jadwal'))) || [];
      var kini = Date.now();
      var terdekat = null;
      jadwal.forEach(function (j) {
        if (j.selesai) return;
        var w = new Date(j.waktu).getTime();
        if (w >= kini - 6 * 60 * 60 * 1000 && (!terdekat || w < new Date(terdekat.waktu).getTime())) {
          terdekat = j;
        }
      });
      if (terdekat) {
        var d = new Date(terdekat.waktu);
        isi +=
          '<button type="button" class="kartu-mini" data-tuju="jadwal">' +
            '<span class="kartu-mini-ikon">🌱</span>' +
            '<span><small>Jadwal terdekat · ' + d.getDate() + '/' + (d.getMonth() + 1) + '</small><b>' +
              String(terdekat.judul).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') +
            '</b></span>' +
          '</button>';
      }
    } catch (e) { /* abaikan */ }

    try {
      var cuaca = JSON.parse(localStorage.getItem('gama_cache_cuaca'));
      if (cuaca && cuaca.data && cuaca.data.sumber === 'BMKG' && cuaca.data.current) {
        var kode = cuaca.data.current.weather;
        var ikon = window.GamaCuaca && window.GamaCuaca.emoji
          ? window.GamaCuaca.emoji(kode)
          : (kode >= 95 ? '⛈' : (kode >= 60 ? '🌧' : (kode >= 3 ? '☁️' : '🌤')));
        isi +=
          '<button type="button" class="kartu-mini" data-tuju="cuaca">' +
            '<span class="kartu-mini-ikon">' + ikon + '</span>' +
            '<span><small>Cuaca tersimpan · BMKG</small><b>' + Math.round(cuaca.data.current.t) + '°C</b></span>' +
          '</button>';
      }
    } catch (e) { /* abaikan */ }

    strip.innerHTML = isi;
    strip.classList.toggle('tersembunyi', !isi);
  }
  window.GamaStrip = gambarStripStatus;   // dipakai cuaca.js untuk banner ekstrem

  /* ---------- Animasi muncul saat di-scroll (hormati reduced-motion) ---------- */
  var bolehAnimasi = 'IntersectionObserver' in window &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (bolehAnimasi) {
    var ioAktif = false;  // jadi true begitu observer terbukti berfungsi
    var ioRusak = false;  // beberapa WebView lama tidak pernah memanggil callback

    var pengamat = new IntersectionObserver(function (entri) {
      ioAktif = true;
      entri.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('terlihat');
          pengamat.unobserve(e.target);
        }
      });
    }, { threshold: 0.08 });

    var amati = function (akar) {
      if (ioRusak) return;
      akar.querySelectorAll('.kartu, .kartu-fitur').forEach(function (el) {
        // Hasil kalkulator diperbarui tiap ketikan — jangan dianimasikan ulang
        if (el.closest('#hasil-karbon') || el.classList.contains('anim-muncul')) return;
        el.classList.add('anim-muncul');
        pengamat.observe(el);
      });
    };
    amati(document);

    // Pengaman: jika observer tidak merespons, tampilkan semuanya tanpa animasi
    setTimeout(function () {
      if (ioAktif) return;
      ioRusak = true;
      pengamat.disconnect();
      document.querySelectorAll('.anim-muncul').forEach(function (el) {
        el.classList.add('terlihat');
      });
    }, 1200);

    // Konten yang dirender ulang (tips, cuaca, jadwal) ikut diamati otomatis
    new MutationObserver(function () {
      amati(document.getElementById('isi-utama'));
    }).observe(document.getElementById('isi-utama'), { childList: true, subtree: true });
  }

  /* ---------- Registrasi Service Worker ---------- */
  if ('serviceWorker' in navigator) {
    // Saat versi baru aplikasi selesai terunduh dan mengambil alih,
    // muat ulang otomatis SEKALI — supaya pengguna tidak terjebak
    // menatap tampilan lama dari simpanan offline.
    var adaPengendaliSebelumnya = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (adaPengendaliSebelumnya) location.reload();
      adaPengendaliSebelumnya = true;
    });

    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function (err) {
        // Gagal daftar SW tidak boleh mengganggu aplikasi
        console.warn('Service worker gagal didaftarkan:', err);
      });
    });
  }

  /* ---------- Mulai: buka halaman sesuai hash (tautan dalam/refresh) ---------- */
  tampilkan((location.hash || '#beranda').slice(1));
  gambarStripStatus();
  perbaruiSiklus();
})();
