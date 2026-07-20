/* ============================================================
   karbon.js — Kalkulator Jejak Karbon (model CATATAN HARIAN)
   Faktor emisi (perkiraan, sumber umum: IPCC & faktor grid Indonesia):
   - Motor            : 0.08 kg CO2 / km
   - Mobil pribadi    : 0.19 kg CO2 / km
   - Angkutan umum    : 0.05 kg CO2 / km (per penumpang)
   - Listrik PLN      : 0.85 kg CO2 / kWh (grid Indonesia)
   - LPG 3 kg         : ~9 kg CO2 / tabung (3 kg x 2.98)
   - Kayu bakar       : nilai bulanan langsung dari pilihan frekuensi
   - Pola makan       : nilai bulanan langsung dari pilihan

   Cara kerja (mengikuti kebiasaan nyata warga):
   - Perjalanan diisi UNTUK HARI INI saja — tidak digeneralisasi
     sebulan. Hari ini 150 km mobil, besok 1 km motor? Catat saja
     tiap hari; angkanya tidak saling menimpa.
   - Listrik/memasak/pola makan adalah kebiasaan bulanan; yang masuk
     hitungan hari ini adalah PORSI seharinya (dibagi 30).
   - "Simpan Catatan Hari Ini" menyimpan SATU catatan per tanggal
     (menyimpan ulang di hari yang sama = memperbarui).
   - Catatan harian sebulan dirangkum jadi LAPORAN BULANAN: hari
     tercatat, total, rata-rata/hari, dan perkiraan sebulan penuh
     (rata-rata × jumlah hari bulan itu).
   - riwayat_karbon berisi SATU entri per bulan (total = perkiraan
     sebulan penuh) — dipakai fitur Dampak Bersama & Lencana.
   Semua di localStorage — tidak butuh internet sama sekali.
   ============================================================ */
(function () {
  'use strict';

  var KUNCI_RIWAYAT = window.GamaProfil.kunci('riwayat_karbon');   // rangkuman bulanan, per profil
  var KUNCI_HARIAN = window.GamaProfil.kunci('catatan_harian');    // catatan per hari, per profil
  var RATA_RATA_NASIONAL = 290;   // kg CO2/bulan per orang (perkiraan kasar)
  var HARI_PER_BULAN = 30;        // pembagi porsi harian kebiasaan bulanan
  var MAKS_CATATAN = 90;          // simpan ± 3 bulan catatan harian
  var MAKS_BULAN = 24;            // simpan maks 24 rangkuman bulanan

  /* Faktor emisi transportasi (kg CO2/km) — nilai TERKUNCI, satu
     sumber bersama kalkulator ini dan pelacak GPS (js/lacak.js). */
  var FAKTOR_TRANSPORT = { motor: 0.08, mobil: 0.19, umum: 0.05 };
  window.GamaKarbon = { FAKTOR: FAKTOR_TRANSPORT };

  /* Faktor per "kali masak" — diturunkan dari baseline lama supaya
     hasilnya tetap setara: gas 1 tabung/bulan (9kg) ÷30 hari ÷~2 kali
     masak/hari ≈ 0.15 kg/kali; kayu bakar "hampir tiap hari" lama
     (150kg/bulan) ÷30 ÷~2 kali/hari ≈ 2.5 kg/kali (kayu memang jauh
     lebih besar emisinya per pemakaian daripada gas). */
  var FAKTOR_GAS_PER_KALI = 0.15;
  var FAKTOR_KAYU_PER_KALI = 2.5;

  /* Pola makan: boleh centang lebih dari satu, dijumlah. Nilai per
     kg CO2/hari kira-kira mengikuti selisih jejak protein hewani
     (daging merah jauh lebih besar dari unggas/ikan). */
  var DAFTAR_MAKAN = ['makan-daging-merah', 'makan-ayam', 'makan-ikan', 'makan-sayur'];

  var form = document.getElementById('form-karbon');
  var wadahHasil = document.getElementById('hasil-karbon');
  var daftarRiwayat = document.getElementById('daftar-riwayat');
  var wadahLaporan = document.getElementById('laporan-bulanan');

  var NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  /* ---------- Tanggal lokal ---------- */
  function tglHariIni() {
    var d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }
  function bulanDariTgl(tgl) { return String(tgl).slice(0, 7); }             // 'YYYY-MM'
  function bulanDariTs(ts) { return bulanDariTgl(new Date(ts).getFullYear() + '-' +
    String(new Date(ts).getMonth() + 1).padStart(2, '0') + '-01'); }
  function namaBulan(kunciBulan) {
    var b = parseInt(kunciBulan.slice(5, 7), 10) - 1;
    return (NAMA_BULAN[b] || '') + ' ' + kunciBulan.slice(0, 4);
  }
  function jumlahHariBulan(kunciBulan) {
    var t = parseInt(kunciBulan.slice(0, 4), 10);
    var b = parseInt(kunciBulan.slice(5, 7), 10);
    return new Date(t, b, 0).getDate();
  }

  /* ---------- Penyimpanan ---------- */
  function ambilCatatan() {
    try { return JSON.parse(localStorage.getItem(KUNCI_HARIAN)) || []; }
    catch (e) { return []; }
  }
  function simpanCatatan(c) {
    try { localStorage.setItem(KUNCI_HARIAN, JSON.stringify(c)); }
    catch (e) { /* penyimpanan penuh — abaikan */ }
  }
  function ambilRiwayat() {
    try { return JSON.parse(localStorage.getItem(KUNCI_RIWAYAT)) || []; }
    catch (e) { return []; }
  }
  function simpanRiwayat(riwayat) {
    try { localStorage.setItem(KUNCI_RIWAYAT, JSON.stringify(riwayat)); }
    catch (e) { /* penyimpanan penuh — abaikan */ }
  }

  /* ---------- Perhitungan (HARIAN) ---------- */
  function hitung() {
    var motor = Math.max(0, parseFloat(document.getElementById('in-motor').value) || 0);
    var mobil = Math.max(0, parseFloat(document.getElementById('in-mobil').value) || 0);
    var umum = Math.max(0, parseFloat(document.getElementById('in-umum').value) || 0);
    var kwh = parseFloat(document.getElementById('in-listrik').value) || 0;
    var kaliGas = Math.max(0, parseFloat(document.getElementById('in-gas-kali').value) || 0);
    var kaliKayu = Math.max(0, parseFloat(document.getElementById('in-kayu-kali').value) || 0);

    var totalMakan = 0;
    DAFTAR_MAKAN.forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.checked) totalMakan += parseFloat(el.value) || 0;
    });

    // Bagian yang ditandai "tidak diisi" dihitung 0 — misalnya orang yang
    // hanya ingin tahu emisi kendaraannya saja.
    var dilewati = {
      transportasi: false,
      listrik: document.getElementById('lewati-listrik').checked,
      memasak: document.getElementById('lewati-masak').checked,
      makanan: document.getElementById('lewati-makan').checked
    };

    // Semua kategori diisi untuk HARI INI, kecuali Listrik: itu tetap
    // dijawab sebagai kebiasaan bulanan (kWh/bulan dari tagihan PLN,
    // karena orang memang tidak bisa tahu pemakaian persis hari ini),
    // lalu diambil porsi seharinya (dibagi 30) untuk masuk total hari ini.
    var rincian = {
      transportasi: motor * FAKTOR_TRANSPORT.motor + mobil * FAKTOR_TRANSPORT.mobil + umum * FAKTOR_TRANSPORT.umum,
      listrik: dilewati.listrik ? 0 : (kwh * 0.85) / HARI_PER_BULAN,
      memasak: dilewati.memasak ? 0 : (kaliGas * FAKTOR_GAS_PER_KALI + kaliKayu * FAKTOR_KAYU_PER_KALI),
      makanan: dilewati.makanan ? 0 : totalMakan
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
    var urut = Object.keys(rincian).sort(function (a, b) {
      return rincian[b] - rincian[a];
    });
    var hasil = [];
    hasil = hasil.concat(SARAN[urut[0]]);
    hasil.push(SARAN[urut[1]][0]);
    return hasil;
  }

  /* ---------- Tampilan hasil hari ini ---------- */
  function tingkatEmisiHarian(totalHarian) {
    // padanan harian dari ambang bulanan lama (150/300 kg per bulan)
    if (totalHarian < 5) return { kelas: '', label: '🌿 Rendah — pertahankan!' };
    if (totalHarian < 10) return { kelas: 'tingkat-sedang', label: '🌤 Sedang — masih bisa dikurangi' };
    return { kelas: 'tingkat-tinggi', label: '🔥 Tinggi — yuk mulai dikurangi' };
  }

  function tampilkanHasil(hasil, gulirKeHasil) {
    var tingkat = tingkatEmisiHarian(hasil.total);

    var adaLewat = hasil.dilewati &&
      (hasil.dilewati.listrik || hasil.dilewati.memasak || hasil.dilewati.makanan);

    var rataNasionalHarian = (RATA_RATA_NASIONAL / HARI_PER_BULAN).toFixed(1);
    var teksBanding = 'Kira-kira setara emisi harian rata-rata warga Indonesia (± ' + rataNasionalHarian + ' kg/hari).';
    if (hasil.total < (RATA_RATA_NASIONAL / HARI_PER_BULAN) * 0.8) {
      teksBanding = 'Lebih rendah dari rata-rata harian warga Indonesia (± ' + rataNasionalHarian + ' kg/hari). Bagus sekali!';
    } else if (hasil.total > (RATA_RATA_NASIONAL / HARI_PER_BULAN) * 1.2) {
      teksBanding = 'Lebih tinggi dari rata-rata harian warga Indonesia (± ' + rataNasionalHarian + ' kg/hari).';
    }
    if (adaLewat) {
      teksBanding = 'Ada bagian yang tidak diisi, jadi ini <b>belum</b> jejak karbon lengkap Anda — hanya dari bagian yang dihitung.';
    }

    // dibandingkan catatan KEMARIN (kalau ada)
    var teksPerubahan = '';
    var kemarin = new Date(); kemarin.setDate(kemarin.getDate() - 1);
    var tglKemarin = kemarin.getFullYear() + '-' +
      String(kemarin.getMonth() + 1).padStart(2, '0') + '-' +
      String(kemarin.getDate()).padStart(2, '0');
    var catatanKemarin = null;
    ambilCatatan().forEach(function (c) { if (c.tgl === tglKemarin) catatanKemarin = c; });
    if (catatanKemarin) {
      var selisih = hasil.total - catatanKemarin.total;
      if (selisih < -0.2) {
        teksPerubahan = '<p class="banding-teks">📉 Turun <b>' + Math.abs(selisih).toFixed(1) + ' kg</b> dibanding kemarin. Hebat!</p>';
      } else if (selisih > 0.2) {
        teksPerubahan = '<p class="banding-teks">📈 Naik <b>' + selisih.toFixed(1) + ' kg</b> dibanding kemarin.</p>';
      }
    }

    var totalUntukBatang = Math.max(hasil.total, 0.001);
    var barisBatang = Object.keys(hasil.rincian).map(function (k) {
      var lewatiIni = hasil.dilewati && hasil.dilewati[k];
      var nilai = hasil.rincian[k];
      var persen = lewatiIni ? 0 : Math.round(nilai / totalUntukBatang * 100);
      var teksNilai = lewatiIni ? 'tidak diisi' : (nilai.toFixed(1) + ' kg (' + persen + '%)');
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
        '<p>Emisi Anda <b>hari ini</b> (' + window.formatTanggal(new Date()) + ')</p>' +
        '<div class="angka-besar">' + hasil.total.toFixed(1) + '</div>' +
        '<div class="satuan-besar">kg CO₂ hari ini</div>' +
        '<span class="lencana-tingkat">' + tingkat.label + '</span>' +
        '<p class="banding-teks">' + teksBanding + '</p>' +
        teksPerubahan +
      '</div>' +
      '<div class="kartu kartu-tip hasil-akordeon">' +
        '<button type="button" class="tip-kepala" aria-expanded="false">' +
          '<h4>Dari mana emisinya?</h4>' +
          '<svg class="tip-panah" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9 L12 15 L18 9" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</button>' +
        '<div class="tip-badan"><div class="tip-badan-isi">' +
          '<p class="keterangan" style="margin-bottom:4px">Rincian hari ini:</p>' +
          '<div class="batang-rincian">' + barisBatang + '</div>' +
        '</div></div>' +
      '</div>' +
      '<div class="kartu kartu-tip hasil-akordeon">' +
        '<button type="button" class="tip-kepala" aria-expanded="false">' +
          '<h4>Cara mudah menguranginya</h4>' +
          '<svg class="tip-panah" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9 L12 15 L18 9" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</button>' +
        '<div class="tip-badan"><div class="tip-badan-isi">' +
          '<ul class="daftar-saran">' + barisSaran + '</ul>' +
        '</div></div>' +
      '</div>';

    if (gulirKeHasil) {
      wadahHasil.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  wadahHasil.addEventListener('click', function (e) {
    var tombol = e.target.closest('.hasil-akordeon .tip-kepala');
    if (!tombol) return;
    var kartu = tombol.closest('.hasil-akordeon');
    var terbuka = kartu.classList.toggle('terbuka');
    tombol.setAttribute('aria-expanded', terbuka);
  });

  /* ============================================================
     Rangkuman bulanan (dari catatan harian yang benar-benar diisi)
     ============================================================ */
  function ringkasBulan(kunciBulan) {
    var entri = ambilCatatan().filter(function (c) { return bulanDariTgl(c.tgl) === kunciBulan; });
    if (!entri.length) return null;
    var jumlah = 0;
    entri.forEach(function (c) { jumlah += c.total; });
    var rata = jumlah / entri.length;
    var hariBulan = jumlahHariBulan(kunciBulan);
    return {
      bulan: kunciBulan,
      hariTercatat: entri.length,
      hariBulan: hariBulan,
      totalTercatat: Math.round(jumlah * 10) / 10,
      rata: Math.round(rata * 100) / 100,
      proyeksi: Math.round(rata * hariBulan)   // perkiraan sebulan penuh
    };
  }

  /* Perbarui entri bulan berjalan di riwayat_karbon (dipakai
     Dampak Bersama & Lencana — total = perkiraan sebulan penuh,
     supaya bulan yang baru terisi sebagian tidak tampak "turun"
     padahal hanya belum lengkap). */
  function perbaruiRiwayatBulanan(kunciBulan) {
    var ringkas = ringkasBulan(kunciBulan);
    var riwayat = ambilRiwayat().filter(function (item) {
      var bulanItem = item.bulan || bulanDariTs(item.tanggal);
      return bulanItem !== kunciBulan;                 // buang entri lama bulan ini
    });
    if (ringkas) {
      riwayat.unshift({
        tanggal: Date.now(),
        bulan: kunciBulan,
        total: ringkas.proyeksi,
        hariTercatat: ringkas.hariTercatat,
        totalTercatat: ringkas.totalTercatat
      });
    }
    riwayat.sort(function (a, b) { return (b.tanggal || 0) - (a.tanggal || 0); });
    if (riwayat.length > MAKS_BULAN) riwayat = riwayat.slice(0, MAKS_BULAN);
    simpanRiwayat(riwayat);
  }

  /* ---------- Kartu Laporan Bulanan ---------- */
  function gambarLaporan() {
    if (!wadahLaporan) return;
    var bulanKini = bulanDariTgl(tglHariIni());
    var ringkas = ringkasBulan(bulanKini);

    var isiKini;
    if (!ringkas) {
      isiKini =
        '<p class="keterangan">Belum ada catatan bulan ini. Isi kegiatan hari ini lalu ketuk <b>"Simpan Catatan Hari Ini"</b> — lakukan tiap hari, dan laporan bulanannya tersusun sendiri di sini.</p>';
    } else {
      var persen = Math.round(ringkas.hariTercatat / ringkas.hariBulan * 100);
      var pohon = Math.max(1, Math.round(ringkas.proyeksi * 12 / 21));
      isiKini =
        '<div class="laporan-baris-atas">' +
          '<span class="laporan-hari"><b>' + ringkas.hariTercatat + '</b> dari ' + ringkas.hariBulan + ' hari tercatat</span>' +
        '</div>' +
        '<div class="progres-luar"><div class="progres-dalam" style="width:' + persen + '%"></div></div>' +
        '<ul class="statistik-laporan">' +
          '<li><b>' + ringkas.totalTercatat.toFixed(1) + '</b><small>kg total tercatat</small></li>' +
          '<li><b>' + ringkas.rata.toFixed(1) + '</b><small>kg rata-rata/hari</small></li>' +
          '<li><b>' + ringkas.proyeksi + '</b><small>kg perkiraan sebulan</small></li>' +
        '</ul>' +
        '<p class="keterangan">🌳 Perkiraan sebulan penuh setara kerja <b>' + pohon + ' pohon</b> selama setahun. ' +
          (ringkas.hariTercatat < ringkas.hariBulan
            ? 'Makin rajin mencatat tiap hari, makin akurat laporannya.'
            : 'Sebulan penuh tercatat — laporan ini sudah lengkap!') + '</p>' +
        '<button type="button" class="tombol tombol-kedua tombol-lebar tombol-kecil" id="tombol-bagikan-laporan" style="margin-top:10px">' +
          (window.GamaBagikan ? window.GamaBagikan.IKON : '') + ' Bagikan Laporan Bulan Ini' +
        '</button>';
    }

    // bulan-bulan sebelumnya (dari rangkuman bulanan tersimpan)
    var lalu = ambilRiwayat().filter(function (item) {
      var bulanItem = item.bulan || bulanDariTs(item.tanggal);
      return bulanItem !== bulanKini;
    });
    var isiLalu = '';
    if (lalu.length) {
      isiLalu =
        '<h4 class="laporan-sub">Bulan-bulan sebelumnya</h4>' +
        '<ul class="daftar-riwayat">' +
        lalu.map(function (item) {
          var bulanItem = item.bulan || bulanDariTs(item.tanggal);
          var ket = item.hariTercatat
            ? item.hariTercatat + ' hari tercatat'
            : 'perkiraan versi lama';
          return '<li><span>' + namaBulan(bulanItem) + ' <small class="keterangan">(' + ket + ')</small></span>' +
            '<span class="riwayat-nilai">' + item.total + ' kg</span></li>';
        }).join('') +
        '</ul>';
    }

    wadahLaporan.innerHTML =
      '<div class="kartu kartu-tip kartu-laporan hasil-akordeon">' +
        '<button type="button" class="tip-kepala" aria-expanded="false">' +
          '<h4>Laporan ' + namaBulan(bulanKini) + '</h4>' +
          '<svg class="tip-panah" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9 L12 15 L18 9" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</button>' +
        '<div class="tip-badan"><div class="tip-badan-isi">' +
          isiKini + isiLalu +
        '</div></div>' +
      '</div>';

    var tombolLaporan = document.getElementById('tombol-bagikan-laporan');
    if (tombolLaporan && window.GamaBagikan && ringkas) {
      tombolLaporan.addEventListener('click', function () {
        var teks =
          'Laporan jejak karbon saya — ' + namaBulan(bulanKini) + ':\n' +
          '• ' + ringkas.hariTercatat + ' dari ' + ringkas.hariBulan + ' hari tercatat\n' +
          '• Total tercatat: ' + ringkas.totalTercatat.toFixed(1) + ' kg CO₂\n' +
          '• Rata-rata: ' + ringkas.rata.toFixed(1) + ' kg/hari\n' +
          '• Perkiraan sebulan penuh: ' + ringkas.proyeksi + ' kg CO₂\n' +
          'Dicatat harian lewat aplikasi GaMa Hijau — yuk catat juga punyamu!';
        window.GamaBagikan.bagikan('Laporan Jejak Karbon ' + namaBulan(bulanKini), teks);
      });
    }
  }

  /* ---------- Daftar catatan harian bulan ini ---------- */
  function gambarRiwayat() {
    var bulanKini = bulanDariTgl(tglHariIni());
    var entri = ambilCatatan().filter(function (c) { return bulanDariTgl(c.tgl) === bulanKini; });
    if (!entri.length) {
      daftarRiwayat.innerHTML = '<li class="riwayat-kosong">Belum ada catatan bulan ini.</li>';
      return;
    }
    entri.sort(function (a, b) { return a.tgl < b.tgl ? 1 : -1; });
    daftarRiwayat.innerHTML = entri.map(function (c) {
      return (
        '<li>' +
          '<span>' + window.formatTanggal(c.tgl + 'T12:00:00') + '</span>' +
          '<span class="riwayat-nilai">' + c.total.toFixed(1) + ' kg</span>' +
          '<button type="button" class="tombol-hapus" data-tgl="' + c.tgl + '">Hapus</button>' +
        '</li>'
      );
    }).join('');
  }

  daftarRiwayat.addEventListener('click', function (e) {
    var tombol = e.target.closest('.tombol-hapus');
    if (!tombol) return;
    var tgl = tombol.dataset.tgl;
    simpanCatatan(ambilCatatan().filter(function (c) { return c.tgl !== tgl; }));
    perbaruiRiwayatBulanan(bulanDariTgl(tgl));
    gambarRiwayat();
    gambarLaporan();
  });

  /* Toggle buka/tutup kartu Laporan Bulanan (didaftarkan sekali;
     isi wadahLaporan berganti-ganti lewat gambarLaporan()). */
  if (wadahLaporan) {
    wadahLaporan.addEventListener('click', function (e) {
      var tombolAkordeon = e.target.closest('.hasil-akordeon .tip-kepala');
      if (!tombolAkordeon) return;
      var kartu = tombolAkordeon.closest('.hasil-akordeon');
      var terbuka = kartu.classList.toggle('terbuka');
      tombolAkordeon.setAttribute('aria-expanded', terbuka);
    });
  }

  /* ---------- Preset cepat (listrik / gas / kayu bakar) ----------
     Pola yang sama di ketiganya: kolom angka bebas + tombol pilihan
     cepat yang mengisi angka itu. Warga tetap boleh ketik sendiri. */
  var DAFTAR_PRESET = [
    ['in-listrik', 'preset-listrik'],
    ['in-gas-kali', 'preset-gas'],
    ['in-kayu-kali', 'preset-kayu']
  ];

  function tandaiPresetAktif() {
    DAFTAR_PRESET.forEach(function (ps) {
      var input = document.getElementById(ps[0]);
      var grup = document.getElementById(ps[1]);
      if (!input || !grup) return;
      var nilai = parseFloat(input.value);
      grup.querySelectorAll('.chip-preset').forEach(function (chip) {
        chip.classList.toggle('aktif', parseFloat(chip.dataset.nilai) === nilai);
      });
    });
  }

  DAFTAR_PRESET.forEach(function (ps) {
    var input = document.getElementById(ps[0]);
    var grup = document.getElementById(ps[1]);
    if (!input || !grup) return;
    grup.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip-preset');
      if (!chip) return;
      input.value = chip.dataset.nilai;
      tandaiPresetAktif();
      hitungLangsung();
    });
  });

  /* ---------- Akordeon 4 seksi (hanya satu terbuka sekaligus) ----------
     Reuse pola .kartu-tip/.tip-kepala/.tip-badan yang sudah ada;
     seksi tertutup menampilkan ringkasan satu baris dari isiannya. */
  var DAFTAR_AKORDEON = ['bagian-perjalanan', 'bagian-listrik', 'bagian-masak', 'bagian-makan'];

  function bukaAkordeon(idTarget) {
    DAFTAR_AKORDEON.forEach(function (id) {
      var fs = document.getElementById(id);
      if (!fs) return;
      var terbuka = id === idTarget ? !fs.classList.contains('terbuka') : false;
      fs.classList.toggle('terbuka', terbuka);
      var tombol = fs.querySelector('.akordeon-kepala');
      if (tombol) tombol.setAttribute('aria-expanded', terbuka);
    });
  }

  form.addEventListener('click', function (e) {
    var tombol = e.target.closest('.akordeon-kepala');
    if (!tombol) return;
    var fs = tombol.closest('fieldset');
    if (fs) bukaAkordeon(fs.id);
  });

  function ringkasPerjalanan() {
    var km = (parseFloat(document.getElementById('in-motor').value) || 0) +
      (parseFloat(document.getElementById('in-mobil').value) || 0) +
      (parseFloat(document.getElementById('in-umum').value) || 0);
    return km > 0 ? km + ' km hari ini' : 'Belum ada perjalanan';
  }
  function ringkasListrik() {
    if (document.getElementById('lewati-listrik').checked) return 'Tidak diisi';
    var kwh = document.getElementById('in-listrik').value || 0;
    return kwh + ' kWh/bulan';
  }
  function ringkasMasak() {
    if (document.getElementById('lewati-masak').checked) return 'Tidak diisi';
    var gas = document.getElementById('in-gas-kali').value || 0;
    var kayu = document.getElementById('in-kayu-kali').value || 0;
    if (gas == 0 && kayu == 0) return 'Tidak masak hari ini';
    var bagian = [];
    if (gas > 0) bagian.push('Gas ' + gas + '×');
    if (kayu > 0) bagian.push('Kayu ' + kayu + '×');
    return bagian.join(', ');
  }
  function ringkasMakan() {
    if (document.getElementById('lewati-makan').checked) return 'Tidak diisi';
    var LABEL = { 'makan-daging-merah': 'Daging merah', 'makan-ayam': 'Ayam', 'makan-ikan': 'Ikan', 'makan-sayur': 'Sayur' };
    var dipilih = DAFTAR_MAKAN.filter(function (id) {
      var el = document.getElementById(id);
      return el && el.checked;
    }).map(function (id) { return LABEL[id]; });
    return dipilih.length ? dipilih.join(', ') : 'Belum dipilih';
  }

  function perbaruiRingkasanAkordeon() {
    var el;
    if ((el = document.getElementById('ringkasan-perjalanan'))) el.textContent = ringkasPerjalanan();
    if ((el = document.getElementById('ringkasan-listrik'))) el.textContent = ringkasListrik();
    if ((el = document.getElementById('ringkasan-masak'))) el.textContent = ringkasMasak();
    if ((el = document.getElementById('ringkasan-makan'))) el.textContent = ringkasMakan();
  }

  /* ---------- Saklar "tidak diisi" per bagian ---------- */
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

  /* ---------- Kalkulasi otomatis ---------- */
  function hitungLangsung() {
    var hasil = hitung();
    tampilkanHasil(hasil, false);
    var stickyAngka = document.getElementById('sticky-angka');
    if (stickyAngka) stickyAngka.textContent = hasil.total.toFixed(1);
  }

  form.addEventListener('input', function () {
    perbaruiLewati();
    tandaiPresetAktif();
    perbaruiRingkasanAkordeon();
    hitungLangsung();
  });
  form.addEventListener('change', function () {
    perbaruiLewati();
    tandaiPresetAktif();
    perbaruiRingkasanAkordeon();
    hitungLangsung();
  });

  /* ---------- Simpan catatan HARI INI ---------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var hasil = hitung();
    var tgl = tglHariIni();

    // satu catatan per tanggal — simpan ulang = perbarui
    var catatan = ambilCatatan().filter(function (c) { return c.tgl !== tgl; });
    var sudahAda = catatan.length !== ambilCatatan().length;
    catatan.unshift({
      tgl: tgl,
      total: Math.round(hasil.total * 100) / 100,
      rincian: {
        transportasi: Math.round(hasil.rincian.transportasi * 100) / 100,
        listrik: Math.round(hasil.rincian.listrik * 100) / 100,
        memasak: Math.round(hasil.rincian.memasak * 100) / 100,
        makanan: Math.round(hasil.rincian.makanan * 100) / 100
      },
      dilewati: hasil.dilewati
    });
    if (catatan.length > MAKS_CATATAN) catatan = catatan.slice(0, MAKS_CATATAN);
    simpanCatatan(catatan);

    perbaruiRiwayatBulanan(bulanDariTgl(tgl));
    gambarRiwayat();
    gambarLaporan();

    // umpan balik singkat pada tombol (isi asli mengandung ikon SVG)
    var tombol = document.getElementById('tombol-simpan');
    if (tombol) {
      var isiAsli = tombol.innerHTML;
      tombol.textContent = sudahAda ? '✓ Catatan hari ini diperbarui!' : '✓ Tercatat untuk hari ini!';
      tombol.disabled = true;
      setTimeout(function () {
        tombol.innerHTML = isiAsli;
        tombol.disabled = false;
      }, 1800);
    }
    tampilkanHasil(hasil, false);

    // aktivitas nyata → tanaman Siklus Tani di beranda ikut tumbuh
    if (window.GamaSiklus) window.GamaSiklus.perbarui();
  });

  /* ---------- Bagikan hasil hari ini (Web Share / WhatsApp) ---------- */
  var wadahAksi = document.getElementById('aksi-karbon');
  if (wadahAksi && window.GamaBagikan) {
    wadahAksi.innerHTML =
      '<button type="button" class="tombol tombol-kedua tombol-lebar" id="tombol-bagikan-karbon">' +
        window.GamaBagikan.IKON + ' Bagikan Hasil Hari Ini' +
      '</button>';
    document.getElementById('tombol-bagikan-karbon').addEventListener('click', function () {
      var hasil = hitung();
      function bagian(n, dilewati) {
        return dilewati ? 'tidak diisi' : n.toFixed(1) + ' kg';
      }
      var teks =
        'Jejak karbon saya hari ini kira-kira ' + hasil.total.toFixed(1) + ' kg CO₂.\n' +
        'Rinciannya — perjalanan: ' + bagian(hasil.rincian.transportasi, false) + ', ' +
        'listrik: ' + bagian(hasil.rincian.listrik, hasil.dilewati.listrik) + ', ' +
        'memasak: ' + bagian(hasil.rincian.memasak, hasil.dilewati.memasak) + ', ' +
        'makanan: ' + bagian(hasil.rincian.makanan, hasil.dilewati.makanan) + '.\n' +
        'Yuk catat juga punyamu di aplikasi GaMa Hijau!';
      window.GamaBagikan.bagikan('Jejak Karbon Hari Ini', teks);
    });
  }

  gambarRiwayat();
  gambarLaporan();
  perbaruiLewati();
  perbaruiRingkasanAkordeon();
  hitungLangsung(); // hasil langsung tampil sejak halaman dibuka
})();
