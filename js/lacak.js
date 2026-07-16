/* ============================================================
   lacak.js — Pelacakan Otomatis Emisi Transportasi via GPS
   PWA murni → padanan expo-location = navigator.geolocation
   (foreground-only, sesuai aturan terkunci). Padanan
   react-native-maps = sketsa rute SVG offline (tanpa ubin peta,
   tanpa internet, tanpa pustaka tambahan).

   Alur:
   - Pengguna menekan "Mulai Lacak" → watchPosition menyala.
   - Jarak dihitung dengan rumus Haversine antar titik yang lolos
     saringan mutu (akurasi ≤30 m, kecepatan tak masuk akal dibuang,
     geser <5 m dianggap diam).
   - Berhenti bergerak beberapa menit → perjalanan otomatis selesai,
     pengguna memilih moda (GPS tak bisa menebak jenis kendaraan).
   - Total per moda hari ini bisa disalin ke Kalkulator Jejak Karbon.
   - Rute tersimpan LOKAL di HP (per profil) & tampil sebagai sketsa;
     ada tombol hapus per perjalanan maupun per profil.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Parameter (mengikuti keputusan terkunci) ---------- */
  var AKURASI_MAKS = 30;          // m — fix lebih buruk dibuang
  var LAJU_MAKS = 150;            // km/j — lompatan GPS tak masuk akal dibuang
  var GESER_MIN = 5;              // m — di bawah ini dianggap diam (jitter)
  var DIAM_SELESAI = 180;         // detik diam → perjalanan otomatis selesai
  var JARAK_MIN_SIMPAN = 0.05;    // km — perjalanan < 50 m tak usah disimpan
  var MAKS_TITIK = 400;           // batas titik per rute (hemat memori)
  var MAKS_PERJALANAN = 60;       // batas jumlah perjalanan tersimpan

  var MODA = [
    { id: 'jalan',  nama: 'Jalan kaki', emisiField: null,       ikon: 'M12 4a2 2 0 1 0 0-.01M11 8 L9 14 M11 8 L14 11 L13 20 M11 11 L8 20 M14 11 L17 13' },
    { id: 'sepeda', nama: 'Sepeda',     emisiField: null,       ikon: 'M6 18 a3 3 0 1 0 .01 0M18 18 a3 3 0 1 0 .01 0M6 18 L10 9 H14 M9 7 H12 L15 13 H18' },
    { id: 'motor',  nama: 'Motor',      emisiField: 'in-motor', ikon: 'M5 17 a2.5 2.5 0 1 0 .01 0M18 17 a2.5 2.5 0 1 0 .01 0M6 10 H11 L14 15 H16 M9 7 H12' },
    { id: 'mobil',  nama: 'Mobil',      emisiField: 'in-mobil', ikon: 'M5 16 H19 V13 L17 8 H7 L5 13 Z M7.5 19 a1.5 1.5 0 1 0 .01 0M16.5 19 a1.5 1.5 0 1 0 .01 0' },
    { id: 'angkot', nama: 'Angkot / mobil umum', emisiField: 'in-umum', ikon: 'M5 16 H19 V7 H5 Z M5 11 H19 M8 19 v1 M16 19 v1 M7 19 a1 1 0 1 0 .01 0M17 19 a1 1 0 1 0 .01 0' },
    { id: 'ojek',   nama: 'Ojek',       emisiField: 'in-umum',  ikon: 'M5 17 a2.5 2.5 0 1 0 .01 0M18 17 a2.5 2.5 0 1 0 .01 0M6 10 H11 L14 15 H16 M9 7 H12' }
  ];
  function moda(id) {
    for (var i = 0; i < MODA.length; i++) if (MODA[i].id === id) return MODA[i];
    return MODA[2];
  }

  /* Faktor emisi (kg CO2/km) — diambil dari Kalkulator (sumber terkunci
     tunggal) supaya nilainya selalu sama. jalan/sepeda = 0. */
  function faktorModa(m) {
    var F = (window.GamaKarbon && window.GamaKarbon.FAKTOR) || { motor: 0.08, mobil: 0.19, umum: 0.05 };
    if (m.emisiField === 'in-motor') return F.motor;
    if (m.emisiField === 'in-mobil') return F.mobil;
    if (m.emisiField === 'in-umum') return F.umum;
    return 0;
  }
  function emisiTrip(p) {
    if (typeof p.emisi === 'number') return p.emisi;   // sudah tersimpan
    return p.jarak * faktorModa(moda(p.moda));
  }

  /* Tebakan moda dari kecepatan rata-rata (hanya usulan; pengguna
     tetap mengonfirmasi karena GPS tak tahu jenis kendaraan). */
  function tebakModa(kmh) {
    if (kmh < 7) return 'jalan';
    if (kmh < 15) return 'sepeda';
    if (kmh < 45) return 'motor';
    return 'mobil';
  }

  function emisiPeriode(samaPeriode) {
    var s = 0;
    ambil().forEach(function (p) { if (samaPeriode(new Date(p.waktu))) s += emisiTrip(p); });
    return s;
  }
  function emisiHariIni() { return emisiPeriode(function (d) { return hariIni(d.getTime()); }); }
  function emisiBulanIni() {
    var n = new Date();
    return emisiPeriode(function (d) {
      return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth();
    });
  }

  /* ---------- Penyimpanan per profil ---------- */
  function kunci() { return window.GamaProfil.kunci('perjalanan'); }
  function ambil() {
    try {
      var d = JSON.parse(localStorage.getItem(kunci()));
      return Array.isArray(d) ? d : [];
    } catch (e) { return []; }
  }
  function simpan(daftar) {
    try { localStorage.setItem(kunci(), JSON.stringify(daftar)); }
    catch (e) { /* penyimpanan penuh — abaikan */ }
  }

  /* ---------- Rumus Haversine (jarak dua koordinat, meter) ---------- */
  function haversine(a, b) {
    var R = 6371000;
    var dLat = (b[0] - a[0]) * Math.PI / 180;
    var dLng = (b[1] - a[1]) * Math.PI / 180;
    var lat1 = a[0] * Math.PI / 180;
    var lat2 = b[0] * Math.PI / 180;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  }

  /* ---------- Sketsa rute SVG offline ---------- */
  function sketsaRute(titik) {
    if (!titik || titik.length < 2) {
      return '<div class="sketsa-kosong">Rute terlalu pendek untuk digambar.</div>';
    }
    var lats = [], lngs = [], i;
    for (i = 0; i < titik.length; i++) { lats.push(titik[i][0]); lngs.push(titik[i][1]); }
    var minLat = Math.min.apply(null, lats), maxLat = Math.max.apply(null, lats);
    var minLng = Math.min.apply(null, lngs), maxLng = Math.max.apply(null, lngs);
    var W = 300, H = 168, pad = 18;
    var cosLat = Math.cos((minLat + maxLat) / 2 * Math.PI / 180) || 1;
    var spanLat = (maxLat - minLat) || 1e-6;
    var spanLng = ((maxLng - minLng) * cosLat) || 1e-6;
    var scale = Math.min((W - 2 * pad) / spanLng, (H - 2 * pad) / spanLat);
    // di-tengah-kan
    var offX = (W - spanLng * scale) / 2;
    var offY = (H - spanLat * scale) / 2;
    function X(lng) { return offX + (lng - minLng) * cosLat * scale; }
    function Y(lat) { return H - (offY + (lat - minLat) * scale); }
    var d = '';
    for (i = 0; i < titik.length; i++) {
      d += (i ? ' L' : 'M') + X(titik[i][1]).toFixed(1) + ' ' + Y(titik[i][0]).toFixed(1);
    }
    var s = titik[0], e = titik[titik.length - 1];
    return '<svg class="sketsa-rute" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Sketsa lintasan perjalanan">' +
      '<path d="' + d + '" fill="none" stroke="#7A9B3F" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<circle cx="' + X(s[1]).toFixed(1) + '" cy="' + Y(s[0]).toFixed(1) + '" r="5.5" fill="#33472E"/>' +
      '<circle cx="' + X(e[1]).toFixed(1) + '" cy="' + Y(e[0]).toFixed(1) + '" r="5.5" fill="#D4A62A" stroke="#6B4A32" stroke-width="1.5"/>' +
      '</svg>';
  }

  /* ---------- Total per moda hari ini ---------- */
  function hariIni(waktu) {
    var d = new Date(waktu), n = new Date();
    return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
  }
  function totalHariIni() {
    var t = { motor: 0, mobil: 0, umum: 0, jalan: 0, sepeda: 0, semua: 0 };
    ambil().forEach(function (p) {
      if (!hariIni(p.waktu)) return;
      t.semua += p.jarak;
      var f = moda(p.moda).emisiField;
      if (f === 'in-motor') t.motor += p.jarak;
      else if (f === 'in-mobil') t.mobil += p.jarak;
      else if (f === 'in-umum') t.umum += p.jarak;
      else if (p.moda === 'jalan') t.jalan += p.jarak;
      else if (p.moda === 'sepeda') t.sepeda += p.jarak;
    });
    return t;
  }

  /* ============================================================
     Status pelacakan langsung
     ============================================================ */
  var idWatch = null;
  var sedangLacak = false;
  var anchor = null;          // titik acuan terakhir untuk jarak
  var waktuAnchor = 0;
  var jarakBerjalan = 0;      // meter
  var titikRute = [];
  var mulaiMs = 0;
  var diamMs = 0;             // kapan mulai diam
  var akurasiTerakhir = null;
  var idTimer = null;

  var wadah = document.getElementById('lacak-isi');

  /* ============================================================
     Wake Lock — jaga layar tetap menyala selama melacak.
     Tanpa ini, HP yang layarnya mati/terkunci akan menghentikan
     GPS diam-diam di tengah jalan (batasan nyata browser).
     Fitur ini opsional: jika HP/peramban tak mendukung, pelacakan
     TETAP jalan — hanya saja pengguna diberi peringatan jujur
     untuk menjaga layar tetap menyala secara manual.
     ============================================================ */
  var wakeLock = null;
  var wakeLockDidukung = 'wakeLock' in navigator;

  function mintaWakeLock() {
    if (!wakeLockDidukung) { perbaruiStatusLayar(); return; }
    navigator.wakeLock.request('screen').then(function (kunci) {
      wakeLock = kunci;
      wakeLock.addEventListener('release', function () {
        wakeLock = null;
        perbaruiStatusLayar();
      });
      perbaruiStatusLayar();
    }).catch(function () {
      // ditolak (mis. baterai hemat daya) — pelacakan tetap jalan
      wakeLock = null;
      perbaruiStatusLayar();
    });
  }
  function lepasWakeLock() {
    if (wakeLock) { wakeLock.release().catch(function () {}); wakeLock = null; }
  }
  // Wake lock otomatis lepas saat tab disembunyikan — minta lagi saat kembali
  document.addEventListener('visibilitychange', function () {
    if (sedangLacak && document.visibilityState === 'visible' && !wakeLock) mintaWakeLock();
  });
  function perbaruiStatusLayar() {
    var el = document.getElementById('lacak-layar');
    if (!el) return;
    if (wakeLock) {
      el.textContent = '✓ Layar dijaga tetap menyala selama melacak.';
      el.className = 'lacak-layar layar-aktif';
    } else if (wakeLockDidukung) {
      el.textContent = 'Layar mungkin mati sendiri — kalau layar terkunci, pelacakan bisa berhenti. Sesekali sentuh layar agar tetap menyala.';
      el.className = 'lacak-layar layar-peringatan';
    } else {
      el.textContent = '⚠ HP ini tidak bisa menjaga layar otomatis. WAJIB jaga layar tetap menyala & aplikasi tetap terbuka selama perjalanan, atau pelacakan berhenti sendiri.';
      el.className = 'lacak-layar layar-peringatan';
    }
  }

  function berhenti() {
    if (idWatch !== null && navigator.geolocation) navigator.geolocation.clearWatch(idWatch);
    idWatch = null;
    if (idTimer) { clearInterval(idTimer); idTimer = null; }
    lepasWakeLock();
    sedangLacak = false;
  }

  function selesaikan(dibatalkan) {
    var jarakKm = jarakBerjalan / 1000;
    var durasi = Math.round((Date.now() - mulaiMs) / 1000);
    var rute = titikRute.slice();
    berhenti();

    if (dibatalkan || jarakKm < JARAK_MIN_SIMPAN) {
      jarakBerjalan = 0; titikRute = []; anchor = null;
      gambar();
      if (!dibatalkan) {
        alertRingan('Perjalanan terlalu pendek untuk disimpan (di bawah 50 m).');
      }
      return;
    }
    // simpan sementara, lalu minta moda
    pilihModa({ jarak: jarakKm, durasi: durasi, titik: rute });
    jarakBerjalan = 0; titikRute = []; anchor = null;
  }

  function terimaFix(pos) {
    var c = pos.coords;
    akurasiTerakhir = c.accuracy;
    if (c.accuracy > AKURASI_MAKS) { perbaruiLangsung('sinyal'); return; }  // tunggu sinyal lebih baik

    var p = [Math.round(c.latitude * 1e5) / 1e5, Math.round(c.longitude * 1e5) / 1e5];
    var t = pos.timestamp || Date.now();

    if (!anchor) {
      anchor = p; waktuAnchor = t; titikRute.push(p);
      diamMs = t;
      perbaruiLangsung();
      return;
    }

    var d = haversine(anchor, p);                 // meter
    var dt = Math.max(1, (t - waktuAnchor) / 1000);
    var laju = (d / dt) * 3.6;                     // km/j

    if (d < GESER_MIN) {
      // dianggap diam; cek apakah sudah cukup lama untuk mengakhiri
      if (t - diamMs >= DIAM_SELESAI * 1000 && jarakBerjalan / 1000 >= JARAK_MIN_SIMPAN) {
        selesaikan(false);
        return;
      }
      perbaruiLangsung();
      return;
    }
    if (laju > LAJU_MAKS) { return; }              // lompatan GPS — buang

    jarakBerjalan += d;
    anchor = p; waktuAnchor = t; diamMs = t;
    if (titikRute.length < MAKS_TITIK) titikRute.push(p);
    perbaruiLangsung();
  }

  function galatFix(err) {
    if (err && err.code === 1) {                   // izin ditolak
      berhenti();
      wadah.querySelector('#lacak-status') && (wadah.innerHTML = '');
      gambar('ditolak');
      return;
    }
    perbaruiLangsung('sinyal');
  }

  function mulai() {
    if (!('geolocation' in navigator)) { gambar('tak-didukung'); return; }
    sedangLacak = true;
    jarakBerjalan = 0; titikRute = []; anchor = null;
    mulaiMs = Date.now(); diamMs = Date.now();
    gambarLacak();
    mintaWakeLock();
    idWatch = navigator.geolocation.watchPosition(terimaFix, galatFix, {
      enableHighAccuracy: true, maximumAge: 4000, timeout: 20000
    });
    idTimer = setInterval(function () {
      perbaruiLangsung();
      // pengaman kalau tak ada fix baru sama sekali tapi sudah lama diam
      if (anchor && Date.now() - diamMs >= DIAM_SELESAI * 1000 &&
          jarakBerjalan / 1000 >= JARAK_MIN_SIMPAN) {
        selesaikan(false);
      }
    }, 1000);
  }

  /* ---------- Pembaruan angka langsung tanpa render ulang ---------- */
  function perbaruiLangsung(mode) {
    var elJarak = document.getElementById('lacak-jarak');
    var elDurasi = document.getElementById('lacak-durasi');
    var elSinyal = document.getElementById('lacak-sinyal');
    if (!elJarak) return;
    elJarak.textContent = (jarakBerjalan / 1000).toFixed(2);
    var dtk = Math.round((Date.now() - mulaiMs) / 1000);
    elDurasi.textContent = Math.floor(dtk / 60) + ' mnt ' + (dtk % 60) + ' dtk';
    if (elSinyal) {
      if (mode === 'sinyal' || akurasiTerakhir === null) {
        elSinyal.textContent = 'Mencari sinyal GPS…';
        elSinyal.className = 'lacak-sinyal sinyal-cari';
      } else {
        var mutu = akurasiTerakhir <= 12 ? 'Bagus' : (akurasiTerakhir <= 25 ? 'Cukup' : 'Lemah');
        elSinyal.textContent = 'Sinyal GPS: ' + mutu + ' (±' + Math.round(akurasiTerakhir) + ' m)';
        elSinyal.className = 'lacak-sinyal sinyal-' + mutu.toLowerCase();
      }
    }
  }

  /* ============================================================
     Dialog pilih moda transportasi
     ============================================================ */
  var dialogModa = null;
  var tripTertunda = null;

  function pilihModa(trip) {
    tripTertunda = trip;
    if (!dialogModa) dialogModa = document.getElementById('dialog-moda');
    var avgKmh = trip.durasi > 0 ? trip.jarak / (trip.durasi / 3600) : 0;
    var tebakan = tebakModa(avgKmh);
    var pilihan = MODA.map(function (m) {
      var emisi = trip.jarak * faktorModa(m);
      var labelEmisi = emisi > 0 ? '≈ ' + emisi.toFixed(2) + ' kg CO₂' : 'tanpa emisi 🌿';
      var ditebak = m.id === tebakan;
      return '<button type="button" class="pilih-moda' + (ditebak ? ' ditebak' : '') + '" data-id="' + m.id + '">' +
        '<span class="moda-ikon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="' + m.ikon + '" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' +
        '<span class="moda-teks"><b>' + m.nama + '</b><small>' + labelEmisi + '</small></span>' +
        (ditebak ? '<span class="moda-tebak">perkiraan</span>' : '') +
      '</button>';
    }).join('');
    dialogModa.innerHTML =
      '<div class="dialog-kotak" role="dialog" aria-modal="true" aria-labelledby="judul-moda">' +
        '<h3 id="judul-moda">Perjalanan selesai!</h3>' +
        '<p class="keterangan">Terekam <b>' + trip.jarak.toFixed(2) + ' km</b> dalam ' +
          Math.floor(trip.durasi / 60) + ' menit (rata-rata ' + Math.round(avgKmh) + ' km/j). ' +
          'Pilih tadi naik apa — emisinya langsung dihitung:</p>' +
        '<div class="grid-moda">' + pilihan + '</div>' +
        '<button type="button" class="tombol tombol-kedua tombol-lebar" id="moda-batal" style="margin-top:12px">Buang perjalanan ini</button>' +
      '</div>';
    dialogModa.classList.remove('tersembunyi');
    var awal = dialogModa.querySelector('.pilih-moda.ditebak') || dialogModa.querySelector('.pilih-moda');
    if (awal) awal.focus();
  }

  function tutupModa() {
    if (dialogModa) dialogModa.classList.add('tersembunyi');
    tripTertunda = null;
  }

  function pasangDialogModa() {
    dialogModa = document.getElementById('dialog-moda');
    if (!dialogModa) return;
    dialogModa.addEventListener('click', function (e) {
      if (e.target === dialogModa || e.target.closest('#moda-batal')) { tutupModa(); gambar(); return; }
      var pil = e.target.closest('.pilih-moda');
      if (!pil || !tripTertunda) return;
      var mPil = moda(pil.dataset.id);
      var emisi = Math.round(tripTertunda.jarak * faktorModa(mPil) * 1000) / 1000;
      var daftar = ambil();
      daftar.unshift({
        id: 'tr' + Date.now(),
        waktu: Date.now(),
        jarak: Math.round(tripTertunda.jarak * 100) / 100,
        durasi: tripTertunda.durasi,
        moda: pil.dataset.id,
        emisi: emisi,
        titik: tripTertunda.titik
      });
      if (daftar.length > MAKS_PERJALANAN) daftar = daftar.slice(0, MAKS_PERJALANAN);
      simpan(daftar);
      tutupModa();
      gambar('tersimpan');
      if (window.GamaSiklus) window.GamaSiklus.perbarui();
    });
    dialogModa.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { tutupModa(); gambar(); }
    });
  }

  /* ============================================================
     Terapkan total hari ini ke Kalkulator Karbon
     ============================================================ */
  function terapkanKeKalkulator() {
    var t = totalHariIni();
    function setF(id, val) {
      var el = document.getElementById(id);
      if (el) el.value = Math.round(val);
    }
    setF('in-motor', t.motor);
    setF('in-mobil', t.mobil);
    setF('in-umum', t.umum);
    var form = document.getElementById('form-karbon');
    if (form) form.dispatchEvent(new Event('input', { bubbles: true }));
    if (window.bukaHalaman) window.bukaHalaman('karbon');
  }

  /* ---------- pesan singkat non-blok ---------- */
  function alertRingan(teks) {
    var el = document.getElementById('lacak-pesan');
    if (!el) return;
    el.textContent = teks;
    el.classList.remove('tersembunyi');
    setTimeout(function () { el.classList.add('tersembunyi'); }, 4000);
  }

  /* ============================================================
     Render
     ============================================================ */
  function amanHtml(t) {
    return String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function gambarLacak() {
    wadah.innerHTML =
      '<div class="kartu kartu-lacak-aktif">' +
        '<div class="lacak-denyut" aria-hidden="true"><span></span></div>' +
        '<p class="lacak-label">Sedang melacak perjalanan…</p>' +
        '<div class="lacak-angka"><span id="lacak-jarak">0.00</span><small>km</small></div>' +
        '<p class="lacak-durasi" id="lacak-durasi">0 mnt 0 dtk</p>' +
        '<p class="lacak-sinyal sinyal-cari" id="lacak-sinyal">Mencari sinyal GPS…</p>' +
        '<div class="aksi-form" style="margin-top:14px">' +
          '<button type="button" class="tombol tombol-utama" id="lacak-selesai">Selesai &amp; Simpan</button>' +
          '<button type="button" class="tombol tombol-kedua" id="lacak-batal">Batalkan</button>' +
        '</div>' +
        '<p class="lacak-layar" id="lacak-layar"></p>' +
        '<p class="keterangan" style="margin-top:6px">Perjalanan juga berhenti otomatis bila Anda diam sekitar 3 menit. Biarkan aplikasi tetap terbuka selama menempuh perjalanan.</p>' +
      '</div>';
    document.getElementById('lacak-selesai').addEventListener('click', function () { selesaikan(false); });
    document.getElementById('lacak-batal').addEventListener('click', function () {
      if (window.confirm('Batalkan perjalanan ini tanpa menyimpan?')) selesaikan(true);
    });
    perbaruiLangsung('sinyal');
    perbaruiStatusLayar();
  }

  function gambar(keadaan) {
    if (sedangLacak) { gambarLacak(); return; }
    if (!wadah) return;

    var t = totalHariIni();
    var daftar = ambil();

    var html = '';

    if (keadaan === 'ditolak') {
      html += '<div class="kartu kartu-izin"><p><b>Izin lokasi ditolak.</b> Untuk melacak perjalanan, buka pengaturan HP/peramban → izinkan akses lokasi untuk aplikasi ini, lalu coba lagi.</p></div>';
    }
    if (keadaan === 'tak-didukung') {
      html += '<div class="kartu kartu-izin"><p>HP/peramban ini belum mendukung GPS lewat aplikasi. Anda tetap bisa mengisi jarak transportasi secara manual di Kalkulator Karbon.</p></div>';
    }

    // Kartu penjelasan + tombol mulai
    html +=
      '<div class="kartu kartu-mulai-lacak">' +
        '<h3>Lacak perjalanan otomatis</h3>' +
        '<p class="keterangan">Aplikasi memakai <b>GPS HP</b> untuk menghitung jarak tempuh Anda, lalu Anda pilih tadi naik apa. Jaraknya otomatis bisa dipakai di Kalkulator Karbon. Semua tersimpan <b>hanya di HP ini</b>.</p>' +
        '<button type="button" class="tombol tombol-utama tombol-lebar" id="lacak-mulai" style="margin-top:12px">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20"><path d="M12 21 C 7 15.5, 5 12, 5 9 A 7 7 0 0 1 19 9 C 19 12, 17 15.5, 12 21 Z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="9" r="2.5" fill="currentColor"/></svg>' +
          'Mulai Lacak Perjalanan' +
        '</button>' +
        '<p class="lacak-pesan tersembunyi" id="lacak-pesan" role="status"></p>' +
      '</div>';

    // Emisi transportasi dihitung OTOMATIS dari jarak GPS × faktor moda
    if (emisiBulanIni() > 0) {
      html +=
        '<div class="kartu kartu-emisi-gps">' +
          '<h3>Emisi transportasimu</h3>' +
          '<p class="emisi-gps-catatan">Dihitung otomatis: jarak dari GPS × faktor emisi tiap moda.</p>' +
          '<div class="emisi-gps-baris">' +
            '<div><b>' + emisiHariIni().toFixed(2) + '</b><small>kg CO₂ hari ini</small></div>' +
            '<div><b>' + emisiBulanIni().toFixed(1) + '</b><small>kg CO₂ bulan ini</small></div>' +
          '</div>' +
        '</div>';
    }

    // Ringkasan hari ini + terapkan ke kalkulator
    if (t.semua > 0) {
      html +=
        '<div class="kartu kartu-lacak-hari">' +
          '<h3>Perjalanan hari ini</h3>' +
          '<ul class="statistik-lacak">' +
            '<li><b>' + t.motor.toFixed(1) + '</b><small>km motor</small></li>' +
            '<li><b>' + t.mobil.toFixed(1) + '</b><small>km mobil</small></li>' +
            '<li><b>' + t.umum.toFixed(1) + '</b><small>km umum</small></li>' +
            '<li><b>' + (t.jalan + t.sepeda).toFixed(1) + '</b><small>km bebas emisi</small></li>' +
          '</ul>' +
          '<button type="button" class="tombol tombol-utama tombol-lebar" id="lacak-terapkan" style="margin-top:12px">' +
            'Pakai angka ini di Kalkulator Karbon' +
          '</button>' +
        '</div>';
    }

    // Riwayat perjalanan + sketsa rute
    html += '<h3 class="judul-bagian">Riwayat perjalanan</h3>';
    if (!daftar.length) {
      html += '<div class="kartu kartu-tengah"><p>Belum ada perjalanan terekam. Ketuk "Mulai Lacak" sebelum berangkat.</p></div>';
    } else {
      html += daftar.map(function (p) {
        var m = moda(p.moda);
        return (
          '<div class="kartu kartu-perjalanan" data-id="' + p.id + '">' +
            sketsaRute(p.titik) +
            '<div class="perjalanan-info">' +
              '<div><span class="perjalanan-jarak">' + p.jarak.toFixed(2) + ' km</span>' +
                '<span class="jadwal-jenis">' + amanHtml(m.nama) + '</span></div>' +
              '<span class="perjalanan-emisi">' +
                (emisiTrip(p) > 0 ? '≈ ' + emisiTrip(p).toFixed(2) + ' kg CO₂' : 'tanpa emisi 🌿') +
              '</span>' +
            '</div>' +
            '<div class="jadwal-waktu perjalanan-waktu">' + window.formatTanggal(p.waktu, true) + ' · ' +
              Math.floor(p.durasi / 60) + ' mnt</div>' +
            '<button type="button" class="tombol-bahaya aksi-hapus-trip">Hapus perjalanan</button>' +
          '</div>'
        );
      }).join('');
    }

    // catatan privasi
    html += '<p class="keterangan" style="text-align:center;margin-top:10px">Rute tersimpan di HP ini saja & tidak dikirim ke mana pun. Hapus semua lewat Tentang → "Hapus data profil ini".</p>';

    wadah.innerHTML = html;

    var bMulai = document.getElementById('lacak-mulai');
    if (bMulai) bMulai.addEventListener('click', mulai);
    var bTerap = document.getElementById('lacak-terapkan');
    if (bTerap) bTerap.addEventListener('click', terapkanKeKalkulator);

    if (keadaan === 'tersimpan') alertRingan('Perjalanan tersimpan. Jangan lupa "Pakai angka ini di Kalkulator".');
  }

  // Hapus satu perjalanan
  if (wadah) {
    wadah.addEventListener('click', function (e) {
      var tombol = e.target.closest('.aksi-hapus-trip');
      if (!tombol) return;
      var kartu = tombol.closest('.kartu-perjalanan');
      if (!kartu) return;
      if (!window.confirm('Hapus perjalanan ini?')) return;
      var id = kartu.dataset.id;
      simpan(ambil().filter(function (x) { return x.id !== id; }));
      gambar();
    });
  }

  pasangDialogModa();

  window.GamaLacak = { segarkan: function () { if (!sedangLacak) gambar(); } };

  gambar();
})();
