/* ============================================================
   kalender.js — Kalender Tanam Lokal (referensi statis, offline)
   Pola musim acuan Parepare & sekitarnya:
   - Musim hujan  : ± November – April/Mei
   - Musim kemarau: ± Juni – Oktober
   Setiap komoditas punya strip 12 bulan + tombol
   "Pakai sebagai jadwalku" yang menyalin ke fitur Jadwal Tani.
   ============================================================ */
(function () {
  'use strict';

  var NAMA_BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
                    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  var NAMA_FASE = {
    persiapan: 'persiapan lahan',
    tanam: 'waktu tanam',
    rawat: 'perawatan',
    panen: 'panen',
    istirahat: ''
  };

  /* Fase per bulan (indeks 0 = Januari) */
  var KOMODITAS = [
    {
      id: 'jagung', nama: 'Jagung', emoji: '🌽',
      fase: ['rawat', 'panen', 'tanam', 'tanam', 'rawat', 'panen',
             'panen', 'istirahat', 'istirahat', 'persiapan', 'tanam', 'tanam'],
      keterangan: 'Dua kali musim tanam: <b>November–Desember</b> (awal hujan, panen Februari) dan <b>Maret–April</b> (hujan kedua, panen Juni–Juli). Pilih varietas umur pendek bila hujan datang terlambat.',
      usulanJudul: 'Tanam jagung', usulanJenis: 'tanam'
    },
    {
      id: 'padi', nama: 'Padi Tadah Hujan', emoji: '🌾',
      fase: ['tanam', 'rawat', 'rawat', 'panen', 'panen', 'istirahat',
             'istirahat', 'istirahat', 'istirahat', 'persiapan', 'persiapan', 'tanam'],
      keterangan: 'Semai setelah hujan turun rutin ± 2 minggu (biasanya <b>November</b>), pindah tanam <b>Desember–Januari</b>, panen <b>April–Mei</b>. Setelah panen, isi sawah dengan palawija hemat air.',
      usulanJudul: 'Tanam padi tadah hujan', usulanJenis: 'tanam'
    },
    {
      id: 'jati', nama: 'Jati', emoji: '🌳',
      fase: ['tanam', 'tanam', 'rawat', 'rawat', 'rawat', 'rawat',
             'rawat', 'rawat', 'istirahat', 'persiapan', 'persiapan', 'tanam'],
      keterangan: 'Tanam bibit saat tanah basah penuh, <b>Desember–Februari</b>. Siapkan lubang tanam sejak Oktober–November. Pangkas cabang di kemarau — kayunya panen jangka panjang, tabungan keluarga.',
      usulanJudul: 'Tanam bibit jati', usulanJenis: 'tanam'
    },
    {
      id: 'mete', nama: 'Jambu Mete', emoji: '🥜',
      fase: ['tanam', 'rawat', 'rawat', 'rawat', 'rawat', 'rawat',
             'rawat', 'rawat', 'panen', 'panen', 'panen', 'tanam'],
      keterangan: 'Tanam bibit awal musim hujan (<b>Desember–Januari</b>). Pangkas menjelang kemarau karena mete berbunga di musim kering. Panen gelondong <b>September–November</b>.',
      usulanJudul: 'Tanam bibit jambu mete', usulanJenis: 'tanam'
    }
  ];

  var wadah = document.getElementById('daftar-komoditas');

  /* ---------- Usulan tanggal: bulan tanam terdekat ---------- */
  function tanggalUsulan(fase) {
    var kini = new Date();
    var bulanIni = kini.getMonth();

    for (var tambah = 0; tambah < 12; tambah++) {
      var b = (bulanIni + tambah) % 12;
      if (fase[b] !== 'tanam') continue;

      var tahun = kini.getFullYear() + (bulanIni + tambah >= 12 ? 1 : 0);
      // Bulan ini juga bulan tanam → usulkan besok; selain itu tanggal 1
      var hari = (tambah === 0) ? kini.getDate() + 1 : 1;
      var d = new Date(tahun, b, hari);
      return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
    }
    return null;
  }

  function ringkasanFase(fase) {
    // teks untuk pembaca layar: "waktu tanam: Nov, Des; panen: Feb"
    var kelompok = {};
    fase.forEach(function (f, i) {
      if (!NAMA_FASE[f]) return;
      (kelompok[f] = kelompok[f] || []).push(NAMA_BULAN[i]);
    });
    return Object.keys(kelompok).map(function (f) {
      return NAMA_FASE[f] + ': ' + kelompok[f].join(', ');
    }).join('; ');
  }

  /* ---------- Render ---------- */
  function gambar() {
    var bulanSekarang = new Date().getMonth();

    wadah.innerHTML = KOMODITAS.map(function (k) {
      var sel = k.fase.map(function (f, i) {
        return (
          '<span class="sel-bulan b-' + f + (i === bulanSekarang ? ' bulan-ini' : '') + '"' +
            (i === bulanSekarang ? ' title="Bulan ini"' : '') + '>' +
            NAMA_BULAN[i] +
          '</span>'
        );
      }).join('');

      return (
        '<div class="kartu kartu-komoditas">' +
          '<h3><span aria-hidden="true">' + k.emoji + '</span> ' + k.nama + '</h3>' +
          '<div class="strip-bulan" role="img" aria-label="Kalender ' + k.nama + ' — ' + ringkasanFase(k.fase) + '">' +
            sel +
          '</div>' +
          '<p class="keterangan-komoditas">' + k.keterangan + '</p>' +
          '<button type="button" class="tombol tombol-utama tombol-kecil aksi-salin" data-id="' + k.id + '">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="13" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M5.5 15.5 H5 A1.5 1.5 0 0 1 3.5 14 V5 A1.5 1.5 0 0 1 5 3.5 H14 A1.5 1.5 0 0 1 15.5 5 V5.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>' +
            'Pakai sebagai jadwalku' +
          '</button>' +
        '</div>'
      );
    }).join('');
  }

  /* ---------- Salin ke Jadwal Tani ---------- */
  wadah.addEventListener('click', function (e) {
    var tombol = e.target.closest('.aksi-salin');
    if (!tombol || !window.GamaJadwal) return;

    var k = null;
    for (var i = 0; i < KOMODITAS.length; i++) {
      if (KOMODITAS[i].id === tombol.dataset.id) { k = KOMODITAS[i]; break; }
    }
    if (!k) return;

    window.GamaJadwal.prefill({
      judul: k.usulanJudul,
      jenis: k.usulanJenis,
      tanggal: tanggalUsulan(k.fase),
      jam: '07:00',
      catatan: 'Disalin dari Kalender Tanam — sesuaikan tanggalnya dengan kondisi hujan.'
    });
  });

  gambar();
})();
