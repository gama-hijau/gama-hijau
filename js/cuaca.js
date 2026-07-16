/* ============================================================
   cuaca.js — Perkiraan Cuaca Galung Maloang
   Sumber: BMKG (Badan Meteorologi, Klimatologi, dan Geofisika),
   API data terbuka publik — resmi & khusus wilayah Indonesia.
   Endpoint prakiraan per kelurahan (adm4). Satu-satunya fitur
   yang butuh internet.

   Offline-first:
   - Data BMKG dinormalkan, disimpan ke localStorage + waktu ambil.
   - Saat offline/gagal → tampilkan data tersimpan dengan label
     "Data terakhir diperbarui: [waktu]". Tidak pernah error.

   Atribusi wajib: sumber data ditampilkan sebagai "BMKG".
   ============================================================ */
(function () {
  'use strict';

  var KUNCI_CACHE = 'gama_cache_cuaca';
  // Kode wilayah adm4 Kelurahan Galung Maloang, Kec. Bacukiki, Kota Parepare
  var ADM4 = '73.72.01.1010';
  var URL_API = 'https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=' + ADM4;

  var wadah = document.getElementById('isi-cuaca');
  var sedangMemuat = false;

  /* ============================================================
     Kode cuaca BMKG → deskripsi, tingkat hujan, ikon
     ============================================================ */
  function tingkatHujan(kode, tp) {
    // 0 kering · 1 ringan · 2 sedang · 3 lebat/petir
    if (kode >= 95) return 3;
    if (kode === 63 || kode === 80) return 2;
    if (kode === 60 || kode === 61) return 1;
    if (tp >= 10) return 3;
    if (tp >= 3) return 2;
    if (tp >= 0.5) return 1;
    return 0;
  }

  function teksKode(kode) {
    if (kode === 0) return 'Cerah';
    if (kode === 1 || kode === 2) return 'Cerah berawan';
    if (kode === 3) return 'Berawan';
    if (kode === 4) return 'Berawan tebal';
    if (kode === 5) return 'Udara kabur';
    if (kode === 10) return 'Berasap';
    if (kode === 45) return 'Berkabut';
    if (kode === 60 || kode === 61) return 'Hujan ringan';
    if (kode === 63) return 'Hujan sedang';
    if (kode === 80) return 'Hujan lokal';
    if (kode >= 95) return 'Hujan petir';
    return 'Berawan';
  }

  function emojiKode(kode) {
    if (kode === 0) return '☀️';
    if (kode <= 2) return '🌤';
    if (kode <= 4) return '☁️';
    if (kode <= 45) return '🌫';
    if (kode <= 61) return '🌦';
    if (kode <= 80) return '🌧';
    return '⛈';
  }

  /* ---------- Ikon cuaca SVG (offline, palet aplikasi) ---------- */
  var AWAN = '<path d="M20 40 C 13 40, 8 35.5, 8 30 C 8 25, 12 21, 17.5 21 C 19.5 14.5, 26 10.5, 33 12.5 C 38 14, 41.5 18, 42 22.8 C 47.5 22.8, 51.5 26.5, 51.5 32 C 51.5 37, 47.5 40, 42 40 Z" fill="#FBFDFF" stroke="#9FB0BC" stroke-width="2"/>';
  var AWAN_GELAP = '<path d="M20 40 C 13 40, 8 35.5, 8 30 C 8 25, 12 21, 17.5 21 C 19.5 14.5, 26 10.5, 33 12.5 C 38 14, 41.5 18, 42 22.8 C 47.5 22.8, 51.5 26.5, 51.5 32 C 51.5 37, 47.5 40, 42 40 Z" fill="#DCE4E9" stroke="#7C8B96" stroke-width="2"/>';
  var MATAHARI =
    '<g stroke="#F4C430" stroke-width="3" stroke-linecap="round">' +
      '<path d="M32 11 V4"/><path d="M32 48 V41"/><path d="M53 26 H60"/><path d="M4 26 H11"/>' +
      '<path d="M46.8 11.2 L51.8 6.2"/><path d="M12.2 39.8 L17.2 34.8"/><path d="M46.8 40.8 L51.8 45.8"/><path d="M12.2 12.2 L17.2 17.2"/>' +
    '</g><circle cx="32" cy="26" r="11" fill="#F4C430"/>';
  var BULAN = '<path d="M40 13 A 13.5 13.5 0 1 0 40 40 A 10.5 10.5 0 1 1 40 13 Z" fill="#ECD98C"/><circle cx="20" cy="14" r="1.4" fill="#ECD98C"/><circle cx="15" cy="22" r="1" fill="#ECD98C"/>';
  var SUN_KECIL =
    '<g stroke="#F4C430" stroke-width="2.4" stroke-linecap="round">' +
      '<path d="M22 6 V1.5"/><path d="M8.5 19 H4"/><path d="M12.2 9.2 L9 6"/><path d="M31.8 9.2 L35 6"/>' +
    '</g><circle cx="22" cy="19" r="8" fill="#F4C430"/>';
  var BULAN_KECIL = '<path d="M27 10 A 9 9 0 1 0 27 27 A 7 7 0 1 1 27 10 Z" fill="#ECD98C"/>';

  function hujanTetes(n) {
    var x = [20, 30, 40, 25, 35];
    var s = '<g stroke="#5C7A8A" stroke-width="2.6" stroke-linecap="round">';
    for (var i = 0; i < n; i++) s += '<path d="M' + x[i] + ' 43 L' + (x[i] - 3) + ' 51"/>';
    return s + '</g>';
  }

  var IKON = {
    cerah:        MATAHARI,
    cerahMalam:   BULAN,
    cerahAwan:    SUN_KECIL + AWAN,
    cerahAwanMlm: BULAN_KECIL + AWAN,
    awan:         AWAN,
    awanTebal:    '<path d="M14 34 C 9 34, 6 31, 6 27 C 6 23, 9.5 20, 13.5 20.5 C 15 15.5, 20 12.5, 25 14 C 28 8.5, 36 8.5, 39 15 C 45 14, 50 18.5, 49.5 24" fill="#EDF1F4" stroke="#9FB0BC" stroke-width="1.8"/>' + AWAN_GELAP,
    kabut:        AWAN + '<g stroke="#9FB0BC" stroke-width="2.6" stroke-linecap="round"><path d="M13 46 H41"/><path d="M20 51 H47"/></g>',
    hujanRingan:  AWAN + hujanTetes(2),
    hujan:        AWAN_GELAP + hujanTetes(3),
    petir:        AWAN_GELAP + '<path d="M34 41 L26 51 H31.5 L27 56.5" fill="none" stroke="#F4C430" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><g stroke="#5C7A8A" stroke-width="2.4" stroke-linecap="round"><path d="M20 43 L17 50"/><path d="M43 43 L40 50"/></g>'
  };

  function tipeIkon(kode, malam) {
    if (kode === 0) return malam ? 'cerahMalam' : 'cerah';
    if (kode === 1 || kode === 2) return malam ? 'cerahAwanMlm' : 'cerahAwan';
    if (kode === 3) return 'awan';
    if (kode === 4) return 'awanTebal';
    if (kode === 5 || kode === 10 || kode === 45) return 'kabut';
    if (kode === 60 || kode === 61) return 'hujanRingan';
    if (kode === 63 || kode === 80) return 'hujan';
    if (kode >= 95) return 'petir';
    return 'awan';
  }
  function ikonSVG(kode, malam, kelas) {
    return '<svg class="ikon-cuaca ' + (kelas || '') + '" viewBox="0 0 64 58" aria-hidden="true">' +
      IKON[tipeIkon(kode, malam)] + '</svg>';
  }

  /* ---------- Arah angin (singkatan → Bahasa Indonesia) ---------- */
  var ARAH = {
    N: 'Utara', NE: 'Timur Laut', E: 'Timur', SE: 'Tenggara',
    S: 'Selatan', SW: 'Barat Daya', W: 'Barat', NW: 'Barat Laut',
    C: 'Tenang', VARIABLE: 'Berubah-ubah'
  };
  function arahAngin(wd) {
    if (!wd) return '';
    var k = String(wd).toUpperCase().replace(/\s/g, '');
    return ARAH[k] || wd;
  }

  /* ---------- Waktu lokal dari "YYYY-MM-DD HH:MM:SS" ---------- */
  function tsLokal(s) {
    var m = /(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(s || '');
    if (!m) return 0;
    return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]).getTime();
  }
  function jamDari(s) {
    var m = /[ T](\d{2}):(\d{2})/.exec(s || '');
    return m ? m[1] + ':' + m[2] : '';
  }
  function malamDari(s) {
    var m = /[ T](\d{2}):/.exec(s || '');
    var h = m ? +m[1] : 12;
    return h < 6 || h >= 18;
  }

  /* ============================================================
     Normalisasi respons BMKG → bentuk internal
     ============================================================ */
  function normalisasi(resp) {
    var blok = resp && resp.data && resp.data[0];
    var lok = (blok && blok.lokasi) || (resp && resp.lokasi) || {};
    var cuaca = (blok && blok.cuaca) || [];

    var semua = [];
    cuaca.forEach(function (hari) {
      (hari || []).forEach(function (e) {
        if (e && e.local_datetime) { e._ts = tsLokal(e.local_datetime); semua.push(e); }
      });
    });
    semua.sort(function (a, b) { return a._ts - b._ts; });
    if (!semua.length) return null;

    var now = Date.now();

    // Saat ini: entri terakhir yang waktunya sudah lewat, atau yang paling awal
    var cur = semua[0];
    for (var i = 0; i < semua.length; i++) {
      if (semua[i]._ts <= now + 90 * 60 * 1000) cur = semua[i]; else break;
    }

    // Per jam: mulai dari sekitar sekarang, ambil hingga 8 slot ke depan
    var jam = semua.filter(function (e) { return e._ts >= now - 90 * 60 * 1000; });
    if (jam.length < 3) jam = semua.slice(-8);
    jam = jam.slice(0, 8);

    // Harian: kelompokkan per tanggal (maks 3 hari)
    var perTgl = {};
    semua.forEach(function (e) {
      var t = e.local_datetime.slice(0, 10);
      (perTgl[t] = perTgl[t] || []).push(e);
    });
    var harian = Object.keys(perTgl).sort().slice(0, 3).map(function (t) {
      var arr = perTgl[t];
      var tMax = -99, tMin = 99, tpMax = 0, huSum = 0, wsMax = 0;
      var dom = arr[0];
      arr.forEach(function (e) {
        if (e.t > tMax) tMax = e.t;
        if (e.t < tMin) tMin = e.t;
        if ((e.tp || 0) > tpMax) tpMax = e.tp || 0;
        huSum += e.hu || 0;
        if ((e.ws || 0) > wsMax) wsMax = e.ws;
        // dominan = tingkat hujan tertinggi; seri → kode terbesar
        var a = tingkatHujan(dom.weather, dom.tp || 0);
        var b = tingkatHujan(e.weather, e.tp || 0);
        if (b > a || (b === a && e.weather > dom.weather)) dom = e;
      });
      return {
        tanggal: t, tMax: tMax, tMin: tMin, tpMax: tpMax,
        huAvg: Math.round(huSum / arr.length), wsMax: Math.round(wsMax),
        weather: dom.weather, weather_desc: dom.weather_desc || teksKode(dom.weather)
      };
    });

    return {
      sumber: 'BMKG',
      lokasi: lok,
      current: {
        local_datetime: cur.local_datetime,
        t: cur.t, hu: cur.hu, weather: cur.weather,
        weather_desc: cur.weather_desc || teksKode(cur.weather),
        ws: cur.ws, wd: cur.wd, tcc: cur.tcc, tp: cur.tp || 0, vs_text: cur.vs_text
      },
      jam: jam.map(function (e) {
        return {
          local_datetime: e.local_datetime, t: e.t, weather: e.weather,
          weather_desc: e.weather_desc || teksKode(e.weather), tp: e.tp || 0, hu: e.hu
        };
      }),
      harian: harian
    };
  }

  /* ---------- Cache localStorage ---------- */
  function ambilCache() {
    try { return JSON.parse(localStorage.getItem(KUNCI_CACHE)); }
    catch (e) { return null; }
  }
  function cacheValid(c) {
    return c && c.data && c.data.sumber === 'BMKG' && c.data.current && c.data.harian;
  }
  function simpanCache(data) {
    try { localStorage.setItem(KUNCI_CACHE, JSON.stringify({ waktu: Date.now(), data: data })); }
    catch (e) { /* abaikan */ }
  }

  /* ============================================================
     Peringatan cuaca ekstrem (fitur 14) — dari data ternormalkan.
     Dipakai juga beranda lewat cache.
     ============================================================ */
  function analisisEkstrem(data) {
    if (!data || !data.harian || !data.harian.length) return null;
    var label = ['hari ini', 'besok', 'lusa'];

    for (var i = 0; i < data.harian.length; i++) {
      var h = data.harian[i];
      if (tingkatHujan(h.weather, h.tpMax) >= 3 || h.tpMax >= 20) {
        return {
          tipe: 'hujan',
          judul: 'Waspada hujan lebat ' + (label[i] || 'beberapa hari lagi'),
          saran: 'Amankan jemuran panen dan ternak, periksa saluran air sawah-kebun, dan saat petir jangan berteduh di bawah pohon tinggi.'
        };
      }
    }

    var kering = true;
    for (var j = 0; j < data.harian.length; j++) {
      if (tingkatHujan(data.harian[j].weather, data.harian[j].tpMax) > 0) { kering = false; break; }
    }
    if (kering && data.harian.length >= 2) {
      return {
        tipe: 'kering',
        judul: 'Cenderung kering beberapa hari ke depan',
        saran: 'Hemat air tampungan, siram hanya pagi/sore, tutup tanah dengan mulsa jerami, dan tunda menanam bibit baru sampai ada tanda hujan.'
      };
    }
    return null;
  }

  var IKON_EKSTREM = {
    hujan: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 14 C 5 14, 3.5 12.6, 3.5 11 C 3.5 9.5, 4.6 8.4, 6 8.3 C 6.5 6, 8.5 4.4, 11 4.4 C 13.4 4.4, 15.4 6, 15.9 8.3 L 17.5 8.3 C 19.4 8.3, 21 9.9, 21 11.7 C 21 13.5, 19.5 14, 17.6 14 Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12.5 15.5 L10 19 H12.5 L10.5 22.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.5 16.5 L5.5 18.6 M17 16.5 L16 18.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    kering: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 3 V5.4 M12 18.6 V21 M3 12 H5.4 M18.6 12 H21 M5.6 5.6 L7.3 7.3 M16.7 16.7 L18.4 18.4 M18.4 5.6 L16.7 7.3 M7.3 16.7 L5.6 18.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
  };
  function htmlBanner(p) {
    if (!p) return '';
    return '<div class="banner-ekstrem ekstrem-' + p.tipe + '" role="alert">' +
      '<span class="banner-ikon">' + IKON_EKSTREM[p.tipe] + '</span>' +
      '<span><b>' + p.judul + '.</b> ' + p.saran + '</span></div>';
  }

  /* ---------- Saran petani ---------- */
  function saranTani(int0, int1) {
    if (int0 >= 2) return '🌧 Kemungkinan besar hujan hari ini. Tunda menjemur gabah/jagung/mete, dan periksa saluran air di sawah-kebun.';
    if (int0 === 0 && int1 === 0) return '☀️ Dua hari ke depan cenderung kering. Waktu yang baik untuk menjemur hasil panen — tapi jangan lupa siram tanaman muda.';
    if (int0 === 0 && int1 >= 2) return '🌦 Hari ini kering tapi besok kemungkinan hujan. Selesaikan jemuran hari ini; besok saat hujan cocok untuk menanam bibit.';
    return '🌤 Cuaca berubah-ubah. Amati langit sebelum menjemur panen, dan manfaatkan hujan untuk mengisi tampungan air.';
  }
  function saranHarian(intensitas) {
    if (intensitas >= 3) return '⛈ Waspada hujan lebat/petir — jangan berteduh di bawah pohon tinggi, amankan jemuran dan ternak.';
    if (intensitas === 2) return '🌧 Kemungkinan hujan. Tunda menjemur panen; hari baik untuk menanam bibit dan mengisi tampungan air.';
    if (intensitas === 1) return '🌦 Hujan ringan mungkin turun. Jemur panen hanya setengah hari dan siapkan terpal penutup.';
    return '☀️ Cenderung kering. Cocok menjemur gabah/jagung/mete — tanaman muda jangan lupa disiram.';
  }

  /* ============================================================
     Render
     ============================================================ */
  function chipHujan(intensitas, tp) {
    if (intensitas === 0) return '<span class="chip-hujan kering">cerah</span>';
    var teks = intensitas >= 3 ? 'lebat' : (intensitas === 2 ? 'sedang' : 'ringan');
    return '<span class="chip-hujan basah">hujan ' + teks + (tp > 0 ? ' · ' + tp + ' mm' : '') + '</span>';
  }

  function gambar(data, waktuData, dariCache) {
    var c = data.current;
    var malam = malamDari(c.local_datetime);
    var lok = data.lokasi || {};
    var html = '';

    if (dariCache) {
      html += '<div class="peringatan-offline">' +
        '<span>📡</span><span><b>Sedang offline.</b> Menampilkan data tersimpan.<br>' +
        'Data terakhir diperbarui: <b>' + window.formatTanggal(waktuData, true) + '</b></span></div>';
    }

    html += htmlBanner(analisisEkstrem(data));

    // ----- Kartu utama -----
    html += '<div class="kartu kartu-cuaca-utama">' +
      '<div class="cuaca-lokasi">' + (lok.desa || 'Galung Maloang') +
        (lok.kecamatan ? ', ' + lok.kecamatan : '') + '</div>' +
      '<div class="cuaca-atas">' +
        ikonSVG(c.weather, malam, 'ikon-cuaca-besar') +
        '<div class="cuaca-suhu-blok">' +
          '<div class="cuaca-suhu">' + Math.round(c.t) + '°<span>C</span></div>' +
          '<div class="cuaca-desk">' + (c.weather_desc || teksKode(c.weather)) + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="cuaca-detail">' +
        '<span title="Kelembapan udara">💧 Lembap ' + c.hu + '%</span>' +
        '<span title="Angin">🍃 ' + Math.round(c.ws) + ' km/j' + (arahAngin(c.wd) ? ' ' + arahAngin(c.wd) : '') + '</span>' +
        '<span title="Tutupan awan">☁️ Awan ' + c.tcc + '%</span>' +
      '</div>' +
      '<div class="cuaca-jam-ambil">Kondisi pukul ' + jamDari(c.local_datetime) + ' WITA</div>' +
    '</div>';

    // ----- Info petani -----
    var int0 = data.harian[0] ? tingkatHujan(data.harian[0].weather, data.harian[0].tpMax) : 0;
    var int1 = data.harian[1] ? tingkatHujan(data.harian[1].weather, data.harian[1].tpMax) : 0;
    html += '<div class="kartu saran-tani"><h3>Info untuk petani</h3><p>' + saranTani(int0, int1) + '</p></div>';

    // ----- Prakiraan per jam -----
    if (data.jam && data.jam.length) {
      html += '<h3 class="judul-bagian">Per 3 jam</h3><div class="strip-jam">';
      data.jam.forEach(function (j, idx) {
        var mlm = malamDari(j.local_datetime);
        html += '<div class="jam-item' + (idx === 0 ? ' jam-kini' : '') + '">' +
          '<span class="jam-waktu">' + (idx === 0 ? 'Kini' : jamDari(j.local_datetime)) + '</span>' +
          ikonSVG(j.weather, mlm, 'ikon-cuaca-mini') +
          '<span class="jam-suhu">' + Math.round(j.t) + '°</span>' +
          '<span class="jam-hujan">' + (j.tp > 0 ? '💧' + j.tp + 'mm' : '—') + '</span>' +
        '</div>';
      });
      html += '</div>';
    }

    // ----- Prakiraan 3 hari -----
    html += '<h3 class="judul-bagian">Prakiraan 3 hari</h3>' +
      '<p class="keterangan keterangan-tengah">👆 Ketuk salah satu hari untuk saran tani</p>' +
      '<div class="grid-harian">';
    var namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    var labelHari = ['Hari ini', 'Besok', 'Lusa'];
    data.harian.forEach(function (h, i) {
      var tgl = new Date(h.tanggal + 'T00:00:00');
      var mlm = false; // ikon harian pakai versi siang
      var intensitas = tingkatHujan(h.weather, h.tpMax);
      html += '<div class="baris-hari" role="button" tabindex="0" aria-expanded="false">' +
        '<span class="hari-nama">' + (labelHari[i] || namaHari[tgl.getDay()]) +
          '<small>' + tgl.getDate() + '/' + (tgl.getMonth() + 1) + '</small></span>' +
        ikonSVG(h.weather, mlm, 'ikon-cuaca-mini hari-ikon-svg') +
        chipHujan(intensitas, h.tpMax) +
        '<span class="hari-suhu">' + Math.round(h.tMax) + '° <small>/ ' + Math.round(h.tMin) + '°</small></span>' +
        '<div class="hari-detail"><div class="hari-detail-isi">' +
          '<b>' + (h.weather_desc || teksKode(h.weather)) + '</b> · lembap ' + h.huAvg + '%, angin ' + h.wsMax + ' km/j.<br>' +
          saranHarian(intensitas) +
        '</div></div>' +
      '</div>';
    });
    html += '</div>';

    html += '<p class="info-pembaruan">Diperbarui: ' + window.formatTanggal(waktuData, true) +
      ' · Sumber: <b>BMKG</b></p>';
    html += '<button type="button" id="tombol-segarkan" class="tombol tombol-kedua tombol-lebar">🔄 Perbarui data cuaca</button>';

    wadah.innerHTML = html;
    var tombol = document.getElementById('tombol-segarkan');
    if (tombol) tombol.addEventListener('click', function () { muat(true); });
  }

  function gambarKosong() {
    wadah.innerHTML = '<div class="kartu kartu-tengah">' +
      '<p style="font-size:2.2rem">📡</p><h3>Belum ada data cuaca</h3>' +
      '<p>Sambungkan HP ke internet sekali saja untuk mengambil prakiraan cuaca dari BMKG. ' +
      'Setelah itu, data terakhir tetap bisa dilihat walau tanpa jaringan.</p>' +
      '<br><button type="button" id="tombol-segarkan" class="tombol tombol-utama">🔄 Coba ambil data</button></div>';
    var tombol = document.getElementById('tombol-segarkan');
    if (tombol) tombol.addEventListener('click', function () { muat(true); });
  }

  /* ---------- Muat data ---------- */
  function muat(paksa) {
    if (sedangMemuat) return;
    var cache = ambilCache();
    var valid = cacheValid(cache);

    if (valid) gambar(cache.data, cache.waktu, !navigator.onLine);

    if (!paksa && valid && Date.now() - cache.waktu < 30 * 60 * 1000) return;

    if (!navigator.onLine) {
      if (!valid) gambarKosong();
      return;
    }

    sedangMemuat = true;
    fetch(URL_API)
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (resp) {
        var data = normalisasi(resp);
        if (!data) throw new Error('data kosong');
        simpanCache(data);
        gambar(data, Date.now(), false);
        if (window.GamaStrip) window.GamaStrip();
      })
      .catch(function () {
        var t = ambilCache();
        if (cacheValid(t)) gambar(t.data, t.waktu, true);
        else gambarKosong();
      })
      .then(function () { sedangMemuat = false; });
  }

  /* ---------- Buka/tutup saran harian ---------- */
  function alihkanHari(baris) {
    var terbuka = baris.classList.toggle('terbuka');
    baris.setAttribute('aria-expanded', terbuka);
  }
  wadah.addEventListener('click', function (e) {
    var baris = e.target.closest('.baris-hari');
    if (baris) alihkanHari(baris);
  });
  wadah.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var baris = e.target.closest('.baris-hari');
    if (baris) { e.preventDefault(); alihkanHari(baris); }
  });

  window.GamaCuaca = { muat: muat, analisis: analisisEkstrem, emoji: emojiKode };

  if (window.GamaStrip) window.GamaStrip();

  window.addEventListener('online', function () {
    var v = document.getElementById('view-cuaca');
    if (v && v.classList.contains('aktif')) muat(true);
  });
})();
