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

    var rincian = {
      transportasi: (motor * FAKTOR_TRANSPORT.motor + mobil * FAKTOR_TRANSPORT.mobil + umum * FAKTOR_TRANSPORT.umum) * 30,
      listrik: kwh * 0.85,
      memasak: lpg * 9 + nilaiRadio('in-kayu'),
      makanan: nilaiRadio('in-makan')
    };
    var total = rincian.transportasi + rincian.listrik + rincian.memasak + rincian.makanan;
    return { total: total, rincian: rincian };
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

  function tampilkanHasil(hasil, gulirKeHasil) {
    var total = Math.round(hasil.total);
    var tingkat = tingkatEmisi(total);
    var riwayat = ambilRiwayat();
    var sebelumnya = riwayat.length ? riwayat[0].total : null;

    var pohonPerTahun = Math.max(1, Math.round(total * 12 / 21)); // 1 pohon ≈ 21 kg CO2/tahun

    var teksBanding = 'Kira-kira setara emisi rata-rata warga Indonesia (± ' + RATA_RATA_NASIONAL + ' kg/bulan).';
    if (total < RATA_RATA_NASIONAL * 0.8) {
      teksBanding = 'Lebih rendah dari rata-rata warga Indonesia (± ' + RATA_RATA_NASIONAL + ' kg/bulan). Bagus sekali!';
    } else if (total > RATA_RATA_NASIONAL * 1.2) {
      teksBanding = 'Lebih tinggi dari rata-rata warga Indonesia (± ' + RATA_RATA_NASIONAL + ' kg/bulan).';
    }

    var teksPerubahan = '';
    if (sebelumnya !== null) {
      var selisih = total - sebelumnya;
      if (selisih < -2) {
        teksPerubahan = '<p class="banding-teks">📉 Turun <b>' + Math.abs(selisih) + ' kg</b> dari perhitungan sebelumnya. Hebat!</p>';
      } else if (selisih > 2) {
        teksPerubahan = '<p class="banding-teks">📈 Naik <b>' + selisih + ' kg</b> dari perhitungan sebelumnya.</p>';
      }
    }

    var totalUntukBatang = Math.max(hasil.total, 1);
    var barisBatang = Object.keys(hasil.rincian).map(function (k) {
      var nilai = hasil.rincian[k];
      var persen = Math.round(nilai / totalUntukBatang * 100);
      return (
        '<div class="batang-baris">' +
          '<div class="batang-label"><span>' + NAMA_KATEGORI[k] + '</span><b>' + Math.round(nilai) + ' kg (' + persen + '%)</b></div>' +
          '<div class="batang-luar"><div class="batang-dalam" style="width:' + persen + '%"></div></div>' +
        '</div>'
      );
    }).join('');

    var barisSaran = buatSaran(hasil.rincian).map(function (s) {
      return '<li><span class="emoji">' + s.emoji + '</span><span>' + s.teks + '</span></li>';
    }).join('');

    wadahHasil.innerHTML =
      '<div class="kartu hasil-utama ' + tingkat.kelas + '">' +
        '<p>Perkiraan jejak karbon Anda</p>' +
        '<div class="angka-besar">' + total + '</div>' +
        '<div class="satuan-besar">kg CO₂ per bulan</div>' +
        '<span class="lencana-tingkat">' + tingkat.label + '</span>' +
        '<p class="banding-teks">' + teksBanding + '</p>' +
        '<p class="banding-teks">🌳 Perlu sekitar <b>' + pohonPerTahun + ' pohon</b> tumbuh setahun penuh untuk menyerap emisi ini.</p>' +
        teksPerubahan +
      '</div>' +
      '<div class="kartu">' +
        '<h3>Dari mana emisinya?</h3>' +
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

  /* ---------- Kalkulasi otomatis (real-time, tanpa tombol hitung) ---------- */
  function hitungLangsung() {
    tampilkanHasil(hitung(), false);
  }

  form.addEventListener('input', function () {
    tandaiPresetAktif();
    hitungLangsung();
  });
  form.addEventListener('change', function () {
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
      var total = Math.round(hasil.total);
      var teks =
        'Jejak karbon saya bulan ini kira-kira ' + total + ' kg CO₂.\n' +
        'Rinciannya — perjalanan: ' + Math.round(hasil.rincian.transportasi) + ' kg, ' +
        'listrik: ' + Math.round(hasil.rincian.listrik) + ' kg, ' +
        'memasak: ' + Math.round(hasil.rincian.memasak) + ' kg, ' +
        'makanan: ' + Math.round(hasil.rincian.makanan) + ' kg.\n' +
        'Yuk hitung juga punyamu di aplikasi GaMa Hijau!';
      window.GamaBagikan.bagikan('Jejak Karbon Saya', teks);
    });
  }

  gambarRiwayat();
  hitungLangsung(); // hasil langsung tampil sejak halaman dibuka
})();
