/* ============================================================
   karbon.js — Kalkulator Jejak Karbon
   Faktor emisi (perkiraan, sumber umum: IPCC & faktor grid Indonesia):
   - Motor            : 0.08 kg CO2 / km
   - Mobil pribadi    : 0.19 kg CO2 / km
   - Angkutan umum    : 0.05 kg CO2 / km (per penumpang)
   - Listrik PLN      : 0.85 kg CO2 / kWh (grid Indonesia)
   - LPG 3 kg         : ~9 kg CO2 / tabung (3 kg x 2.98)
   - Kayu bakar       : nilai bulanan langsung dari pilihan frekuensi
   - Pola makan       : nilai bulanan langsung dari pilihan
   Hasil disimpan di localStorage — tidak butuh internet sama sekali.
   ============================================================ */
(function () {
  'use strict';

  var KUNCI_RIWAYAT = window.GamaProfil.kunci('riwayat_karbon');   // terpisah per profil
  var RATA_RATA_NASIONAL = 290; // kg CO2/bulan per orang (perkiraan kasar)

  /* Faktor emisi transportasi (kg CO2/km) — nilai TERKUNCI, kini
     dijadikan satu sumber supaya dipakai bersama oleh kalkulator
     ini dan pelacak GPS (js/lacak.js). Jangan ubah tanpa izin. */
  var FAKTOR_TRANSPORT = { motor: 0.08, mobil: 0.19, umum: 0.05 };
  window.GamaKarbon = { FAKTOR: FAKTOR_TRANSPORT };

  var form = document.getElementById('form-karbon');
  var wadahHasil = document.getElementById('hasil-karbon');
  var daftarRiwayat = document.getElementById('daftar-riwayat');

  /* Mode tampilan hasil: 'hari' (BAWAAN — supaya orang langsung tahu
     jejak hariannya tanpa mengira-ngira) atau 'bulan'. Ini cuma
     mengubah tampilan; riwayat/lencana/laporan tetap memakai angka
     bulanan asli yang dikembalikan hitung(), tidak berubah. */
  var modeDurasi = 'hari';

  /* ---------- Penyimpanan riwayat ---------- */
  function ambilRiwayat() {
    try {
      return JSON.parse(localStorage.getItem(KUNCI_RIWAYAT)) || [];
    } catch (e) { return []; }
  }
  function simpanRiwayat(riwayat) {
    try {
      localStorage.setItem(KUNCI_RIWAYAT, JSON.stringify(riwayat));
    } catch (e) { /* penyimpanan penuh — abaikan */ }
  }

  /* ---------- Perhitungan ---------- */
  function nilaiRadio(nama) {
    var pilihan = form.querySelector('input[name="' + nama + '"]:checked');
    return pilihan ? parseFloat(pilihan.value) : 0;
  }

  function hitung() {
    var motor = Math.max(0, parseFloat(document.getElementById('in-motor').value) || 0);
    var mobil = Math.max(0, parseFloat(document.getElementById('in-mobil').value) || 0);
    var umum = Math.max(0, parseFloat(document.getElementById('in-umum').value) || 0);
    var kwh = parseFloat(document.getElementById('in-listrik').value) || 0;
    var lpg = Math.max(0, parseFloat(document.getElementById('in-lpg').value) || 0);

    // Bagian yang ditandai "tidak diisi" dihitung 0 — misalnya orang yang
    // hanya ingin tahu emisi kendaraannya saja.
    var dilewati = {
      transportasi: false,
      listrik: document.getElementById('lewati-listrik').checked,
      memasak: document.getElementById('lewati-masak').checked,
      makanan: document.getElementById('lewati-makan').checked
    };

    var rincian = {
      transportasi: (motor * FAKTOR_TRANSPORT.motor + mobil * FAKTOR_TRANSPORT.mobil + umum * FAKTOR_TRANSPORT.umum) * 30,
      listrik: dilewati.listrik ? 0 : kwh * 0.85,
      memasak: dilewati.memasak ? 0 : (lpg * 9 + nilaiRadio('in-kayu')),
      makanan: dilewati.makanan ? 0 : nilaiRadio('in-makan')
    };
    var total = rincian.transportasi + rincian.listrik + rincian.memasak + rincian.makanan;
    return { total: total, rincian: rincian, dilewati: dilewati };
  }

  /* ---------- Saran pengurangan ---------- */
  var SARAN = {
    transportasi: [
      { emoji: '🚶', teks: 'Untuk jarak dekat di sekitar kelurahan, coba jalan kaki atau bersepeda — hemat bensin, badan pun sehat.' },
      { emoji: '🛵', teks: 'Gabungkan beberapa urusan dalam satu perjalanan, dan ajak tetangga searah untuk berboncengan.' }
    ],
    listrik: [
      { emoji: '💡', teks: 'Matikan lampu dan cabut colokan (TV, cas HP) saat tidak dipakai. Ganti lampu lama dengan lampu LED yang jauh lebih hemat.' },
      { emoji: '🌞', teks: 'Manfaatkan cahaya matahari di siang hari — buka jendela, tunda menyalakan lampu sampai gelap.' }
    ],
    memasak: [
      { emoji: '🔥', teks: 'Kurangi memasak dengan kayu bakar di tungku terbuka — asapnya mengganggu kesehatan dan emisinya besar. Utamakan LPG atau tungku hemat kayu.' },
      { emoji: '🍲', teks: 'Masak dengan panci tertutup dan api secukupnya — makanan lebih cepat matang, gas lebih awet.' }
    ],
    makanan: [
      { emoji: '🥬', teks: 'Perbanyak sayur, ikan, dan hasil kebun sendiri. Daging sapi punya jejak karbon paling besar — tak perlu tiap hari.' },
      { emoji: '🍚', teks: 'Masak secukupnya supaya tidak ada makanan terbuang. Sisa dapur bisa jadi eco-enzyme (lihat menu Eco-E!).' }
    ]
  };

  var NAMA_KATEGORI = {
    transportasi: 'Perjalanan',
    listrik: 'Listrik',
    memasak: 'Memasak',
    makanan: 'Makanan'
  };

  function buatSaran(rincian) {
    // Urutkan kategori dari penyumbang terbesar, ambil saran dua teratas
    var urut = Object.keys(rincian).sort(function (a, b) {
      return rincian[b] - rincian[a];
    });
    var hasil = [];
    hasil = hasil.concat(SARAN[urut[0]]);
    hasil.push(SARAN[urut[1]][0]);
    return hasil;
  }

  /* ---------- Tampilan hasil ---------- */
  function tingkatEmisi(total) {
    if (total < 150) return { kelas: '', label: '🌿 Rendah — pertahankan!' };
    if (total < 300) return { kelas: 'tingkat-sedang', label: '🌤 Sedang — masih bisa dikurangi' };
    return { kelas: 'tingkat-tinggi', label: '🔥 Tinggi — yuk mulai dikurangi' };
  }

  var HARI_PER_BULAN = 30;   // sama dgn asumsi 30 hari/bulan yg sudah dipakai di hitung()

  function tampilkanHasil(hasil, gulirKeHasil) {
    // Total & tingkat SELALU dihitung dari angka bulanan asli — riwayat,
    // lencana, dan laporan dampak semuanya memakai basis bulanan yang sama.
    var total = Math.round(hasil.total);
    var tingkat = tingkatEmisi(total);
    var riwayat = ambilRiwayat();
    var sebelumnya = riwayat.length ? riwayat[0].total : null;

    var pohonPerTahun = Math.max(1, Math.round(total * 12 / 21)); // 1 pohon ≈ 21 kg CO2/tahun

    /* ---- Angka yang ditampilkan mengikuti saklar bulan/hari ---- */
    var harian = modeDurasi === 'hari';
    var angkaUtama = harian ? (hasil.total / HARI_PER_BULAN) : total;
    var teksAngkaUtama = harian ? angkaUtama.toFixed(1) : angkaUtama;
    var satuanUtama = harian ? 'kg CO₂ per hari' : 'kg CO₂ per bulan';

    // Pembanding rata-rata nasional & selisih riwayat: KLASIFIKASI selalu
    // dari basis bulanan (lebih stabil), tapi ANGKA & SATUAN yang tertulis
    // ikut mode aktif supaya tidak beda satuan dengan angka utama di atasnya.
    var satuanSingkat = harian ? 'kg/hari' : 'kg/bulan';
    var rataNasionalTampil = harian
      ? (RATA_RATA_NASIONAL / HARI_PER_BULAN).toFixed(1)
      : RATA_RATA_NASIONAL;

    var adaLewat = hasil.dilewati &&
      (hasil.dilewati.listrik || hasil.dilewati.memasak || hasil.dilewati.makanan);

    var teksBanding = 'Kira-kira setara emisi rata-rata warga Indonesia (± ' + rataNasionalTampil + ' ' + satuanSingkat + ').';
    if (total < RATA_RATA_NASIONAL * 0.8) {
      teksBanding = 'Lebih rendah dari rata-rata warga Indonesia (± ' + rataNasionalTampil + ' ' + satuanSingkat + '). Bagus sekali!';
    } else if (total > RATA_RATA_NASIONAL * 1.2) {
      teksBanding = 'Lebih tinggi dari rata-rata warga Indonesia (± ' + rataNasionalTampil + ' ' + satuanSingkat + ').';
    }
    if (adaLewat) {
      // membandingkan angka yang tidak lengkap dengan rata-rata nasional
      // akan menyesatkan — ganti dengan catatan jujur
      teksBanding = 'Ada bagian yang tidak diisi, jadi ini <b>belum</b> jejak karbon lengkap Anda — hanya dari bagian yang dihitung.';
    }

    var teksPerubahan = '';
    if (sebelumnya !== null) {
      var selisih = total - sebelumnya;
      var selisihTampil = harian ? (Math.abs(selisih) / HARI_PER_BULAN).toFixed(1) : Math.abs(selisih);
      if (selisih < -2) {
        teksPerubahan = '<p class="banding-teks">📉 Turun <b>' + selisihTampil + ' kg' + (harian ? '/hari' : '') + '</b> dari perhitungan sebelumnya. Hebat!</p>';
      } else if (selisih > 2) {
        teksPerubahan = '<p class="banding-teks">📈 Naik <b>' + selisihTampil + ' kg' + (harian ? '/hari' : '') + '</b> dari perhitungan sebelumnya.</p>';
      }
    }

    var totalUntukBatang = Math.max(hasil.total, 1);
    var barisBatang = Object.keys(hasil.rincian).map(function (k) {
      var lewatiIni = hasil.dilewati && hasil.dilewati[k];
      var nilaiBulan = hasil.rincian[k];
      var persen = lewatiIni ? 0 : Math.round(nilaiBulan / totalUntukBatang * 100); // rasio sama di kedua mode
      var nilaiTampil = harian ? (nilaiBulan / HARI_PER_BULAN).toFixed(1) : Math.round(nilaiBulan);
      var teksNilai = lewatiIni ? 'tidak diisi' : (nilaiTampil + ' kg (' + persen + '%)');
      return (
        '<div class="batang-baris' + (lewatiIni ? ' batang-lewati' : '') + '">' +
          '<div class="batang-label"><span>' + NAMA_KATEGORI[k] + '</span><b>' + teksNilai + '</b></div>' +
          '<div class="batang-luar"><div class="batang-dalam" style="width:' + persen + '%"></div></div>' +
        '</div>'
      );
    }).join('');

    var barisSaran = buatSaran(hasil.rincian).map(function (s) {
      return '<li><span class="emoji">' + s.emoji + '</span><span>' + s.teks + '</span></li>';
    }).join('');

    wadahHasil.innerHTML =
      '<div class="kartu hasil-utama ' + tingkat.kelas + '">' +
        '<div class="grup-toggle-durasi" role="group" aria-label="Pilih satuan waktu">' +
          '<button type="button" class="toggle-durasi' + (harian ? '' : ' aktif') + '" data-mode="bulan" aria-pressed="' + (!harian) + '">Per Bulan</button>' +
          '<button type="button" class="toggle-durasi' + (harian ? ' aktif' : '') + '" data-mode="hari" aria-pressed="' + harian + '">Per Hari</button>' +
        '</div>' +
        '<p>Perkiraan jejak karbon Anda</p>' +
        '<div class="angka-besar">' + teksAngkaUtama + '</div>' +
        '<div class="satuan-besar">' + satuanUtama + '</div>' +
        '<span class="lencana-tingkat">' + tingkat.label + '</span>' +
        '<p class="banding-teks">' + teksBanding + '</p>' +
        '<p class="banding-teks">🌳 Perlu sekitar <b>' + pohonPerTahun + ' pohon</b> tumbuh setahun penuh untuk menyerap emisi ini.</p>' +
        teksPerubahan +
      '</div>' +
      '<div class="kartu">' +
        '<h3>Dari mana emisinya?</h3>' +
        '<p class="keterangan" style="margin-bottom:4px">' + (harian ? 'Rincian per hari:' : 'Rincian per bulan:') + '</p>' +
        '<div class="batang-rincian">' + barisBatang + '</div>' +
      '</div>' +
      '<div class="kartu">' +
        '<h3>Cara mudah menguranginya</h3>' +
        '<ul class="daftar-saran">' + barisSaran + '</ul>' +
      '</div>';

    if (gulirKeHasil) {
      wadahHasil.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /* ---------- Saklar Per Bulan / Per Hari (tampilan saja) ---------- */
  wadahHasil.addEventListener('click', function (e) {
    var tombol = e.target.closest('.toggle-durasi');
    if (!tombol) return;
    modeDurasi = tombol.dataset.mode;
    hitungLangsung();
  });

  /* ---------- Riwayat ---------- */
  function gambarRiwayat() {
    var riwayat = ambilRiwayat();
    if (!riwayat.length) {
      daftarRiwayat.innerHTML = '<li class="riwayat-kosong">Belum ada perhitungan tersimpan.</li>';
      return;
    }
    daftarRiwayat.innerHTML = riwayat.map(function (item, i) {
      return (
        '<li>' +
          '<span>' + window.formatTanggal(item.tanggal, true) + '</span>' +
          '<span class="riwayat-nilai">' + item.total + ' kg</span>' +
          '<button type="button" class="tombol-hapus" data-indeks="' + i + '">Hapus</button>' +
        '</li>'
      );
    }).join('');
  }

  daftarRiwayat.addEventListener('click', function (e) {
    var tombol = e.target.closest('.tombol-hapus');
    if (!tombol) return;
    var riwayat = ambilRiwayat();
    riwayat.splice(parseInt(tombol.dataset.indeks, 10), 1);
    simpanRiwayat(riwayat);
    gambarRiwayat();
  });

  /* ---------- Preset cepat listrik (klik → isi angka, tetap bisa diketik) ---------- */
  var inputListrik = document.getElementById('in-listrik');
  var grupPreset = document.getElementById('preset-listrik');

  function tandaiPresetAktif() {
    var nilai = parseFloat(inputListrik.value);
    grupPreset.querySelectorAll('.chip-preset').forEach(function (chip) {
      chip.classList.toggle('aktif', parseFloat(chip.dataset.kwh) === nilai);
    });
  }

  grupPreset.addEventListener('click', function (e) {
    var chip = e.target.closest('.chip-preset');
    if (!chip) return;
    inputListrik.value = chip.dataset.kwh;
    tandaiPresetAktif();
    hitungLangsung();
  });

  /* ---------- Saklar "tidak diisi" per bagian ----------
     Bagian yang dilewati diredupkan & isiannya dinonaktifkan,
     supaya jelas bahwa angkanya tidak ikut dihitung. */
  var DAFTAR_LEWATI = [
    ['lewati-listrik', 'bagian-listrik'],
    ['lewati-masak', 'bagian-masak'],
    ['lewati-makan', 'bagian-makan']
  ];
  function perbaruiLewati() {
    DAFTAR_LEWATI.forEach(function (ps) {
      var cek = document.getElementById(ps[0]);
      var bagian = document.getElementById(ps[1]);
      if (!cek || !bagian) return;
      bagian.classList.toggle('terlewati', cek.checked);
      bagian.querySelectorAll('.isian-bagian input, .isian-bagian button').forEach(function (el) {
        el.disabled = cek.checked;
      });
    });
  }

  /* ---------- Kalkulasi otomatis (real-time, tanpa tombol hitung) ---------- */
  function hitungLangsung() {
    tampilkanHasil(hitung(), false);
  }

  form.addEventListener('input', function () {
    perbaruiLewati();
    tandaiPresetAktif();
    hitungLangsung();
  });
  form.addEventListener('change', function () {
    perbaruiLewati();
    tandaiPresetAktif();
    hitungLangsung();
  });

  /* ---------- Simpan ke riwayat (tombol) ---------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var hasil = hitung();

    var riwayat = ambilRiwayat();
    riwayat.unshift({ tanggal: Date.now(), total: Math.round(hasil.total) });
    if (riwayat.length > 20) riwayat = riwayat.slice(0, 20); // simpan maksimal 20
    simpanRiwayat(riwayat);
    gambarRiwayat();

    // umpan balik singkat pada tombol (isi asli mengandung ikon SVG)
    var tombol = document.getElementById('tombol-simpan');
    if (tombol) {
      var isiAsli = tombol.innerHTML;
      tombol.textContent = '✓ Tersimpan!';
      tombol.disabled = true;
      setTimeout(function () {
        tombol.innerHTML = isiAsli;
        tombol.disabled = false;
      }, 1500);
    }
    tampilkanHasil(hasil, false);

    // aktivitas nyata → tanaman Siklus Tani di beranda ikut tumbuh
    if (window.GamaSiklus) window.GamaSiklus.perbarui();
  });

  /* ---------- Bagikan hasil (Web Share / WhatsApp) ---------- */
  var wadahAksi = document.getElementById('aksi-karbon');
  if (wadahAksi && window.GamaBagikan) {
    wadahAksi.innerHTML =
      '<button type="button" class="tombol tombol-kedua tombol-lebar" id="tombol-bagikan-karbon">' +
        window.GamaBagikan.IKON + ' Bagikan Hasil' +
      '</button>';
    document.getElementById('tombol-bagikan-karbon').addEventListener('click', function () {
      var hasil = hitung();
      var harian = modeDurasi === 'hari';
      var bagi = harian ? HARI_PER_BULAN : 1;
      var satuan = harian ? 'per hari' : 'bulan ini';
      function angka(n) {
        var v = n / bagi;
        return harian ? v.toFixed(1) : Math.round(v);
      }
      function bagian(n, dilewati) {
        return dilewati ? 'tidak diisi' : angka(n) + ' kg';
      }
      var teks =
        'Jejak karbon saya ' + satuan + ' kira-kira ' + angka(hasil.total) + ' kg CO₂.\n' +
        'Rinciannya — perjalanan: ' + bagian(hasil.rincian.transportasi, false) + ', ' +
        'listrik: ' + bagian(hasil.rincian.listrik, hasil.dilewati.listrik) + ', ' +
        'memasak: ' + bagian(hasil.rincian.memasak, hasil.dilewati.memasak) + ', ' +
        'makanan: ' + bagian(hasil.rincian.makanan, hasil.dilewati.makanan) + '.\n' +
        'Yuk hitung juga punyamu di aplikasi GaMa Hijau!';
      window.GamaBagikan.bagikan('Jejak Karbon Saya', teks);
    });
  }

  gambarRiwayat();
  perbaruiLewati();
  hitungLangsung(); // hasil langsung tampil sejak halaman dibuka
})();
