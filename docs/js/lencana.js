/* ============================================================
   lencana.js — Badge Pencapaian (fitur 12)
   Pencapaian sederhana, non-kompetitif, tersimpan PER PROFIL.
   Dievaluasi ulang setiap beranda dibuka; lencana yang sudah
   diraih tersimpan permanen (sampai data profil dihapus).
   ============================================================ */
(function () {
  'use strict';

  function baca(kunci, cadangan) {
    try {
      var v = JSON.parse(localStorage.getItem(window.GamaProfil.kunci(kunci)));
      return v === null || v === undefined ? cadangan : v;
    } catch (e) { return cadangan; }
  }

  /* ---------- Data profil aktif untuk pengecekan ---------- */
  function dataProfil() {
    var riwayat = baca('riwayat_karbon', []);
    var eco = baca('progres_eco', []);
    var jadwal = baca('jadwal', []);
    var ecoSelesai = 0;
    eco.forEach(function (x) { if (x) ecoSelesai++; });

    var hariJadwal = {};
    jadwal.forEach(function (j) { hariJadwal[String(j.waktu).slice(0, 10)] = true; });

    return {
      riwayat: riwayat,
      ecoSelesai: ecoSelesai,
      jadwal: jadwal,
      hariJadwal: Object.keys(hariJadwal).length,
      poin: riwayat.length + ecoSelesai + jadwal.length
    };
  }

  /* ---------- Definisi lencana ---------- */
  var IKON = {
    tunas: '<path d="M12 21 V11 M12 15 C 8.5 15, 6 12.5, 5.5 9 C 9 9, 11.5 11.5, 12 15 Z M12 12 C 15.5 12, 18 9.5, 18.5 6 C 15 6, 12.5 8.5, 12 12 Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    kalender: '<rect x="4" y="5.5" width="16" height="14.5" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4 10 H20 M8.5 4 V7 M15.5 4 V7 M9 14.5 L11 16.5 L15 12.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    botol: '<path d="M10 3.5 H14 M10.5 3.5 V7 L7.5 14.5 C 6.6 17, 8.2 19.5, 10.8 19.5 H13.2 C 15.8 19.5, 17.4 17, 16.5 14.5 L13.5 7 V3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 13.5 H15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    turun: '<path d="M6 5 L6 13 M6 13 L3.5 10.5 M6 13 L8.5 10.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 18.5 C 14 19.5, 10.5 16, 10.5 11 C 15.5 11, 19.5 13.5, 20 18.5 Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
    jagung: '<path d="M12 4 C 15 6.5, 16 10, 16 13 C 16 17, 14.5 20, 12 20 C 9.5 20, 8 17, 8 13 C 8 10, 9 6.5, 12 4 Z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9 9.5 H15 M8.5 13 H15.5 M9 16.5 H15" stroke="currentColor" stroke-width="1.4"/><path d="M16 12 C 19 11, 20.5 9, 21 6.5 C 18 7, 16.5 9, 16 12 Z" fill="currentColor"/>'
  };

  var LENCANA = [
    {
      id: 'tunas', ikon: 'tunas', nama: 'Tunas Pertama',
      desk: 'Menyimpan perhitungan jejak karbon pertama',
      cek: function (d) { return d.riwayat.length >= 1; }
    },
    {
      id: 'petani7', ikon: 'kalender', nama: 'Petani Rajin',
      desk: 'Mengisi jadwal tani di 7 hari berbeda',
      cek: function (d) { return d.hariJadwal >= 7; }
    },
    {
      id: 'eco', ikon: 'botol', nama: 'Ahli Eco-Enzyme',
      desk: 'Menyelesaikan semua langkah modul eco-enzyme',
      cek: function (d) { return d.ecoSelesai >= 6; }
    },
    {
      id: 'turun', ikon: 'turun', nama: 'Emisi Menurun',
      desk: 'Perhitungan terbaru lebih rendah dari sebelumnya',
      cek: function (d) {
        return d.riwayat.length >= 2 && d.riwayat[0].total < d.riwayat[1].total;
      }
    },
    {
      id: 'panen', ikon: 'jagung', nama: 'Panen Kebiasaan',
      desk: 'Tanaman Siklus Tani mencapai tahap berbuah',
      cek: function (d) { return d.poin >= 10; }
    }
  ];

  /* ---------- Evaluasi + render ---------- */
  function perbarui() {
    var wadah = document.getElementById('lencana-wadah');
    if (!wadah || !window.GamaProfil) return;

    var diraih = baca('lencana', {});
    if (typeof diraih !== 'object' || Array.isArray(diraih)) diraih = {};
    var d = dataProfil();
    var adaBaru = false;

    LENCANA.forEach(function (l) {
      if (!diraih[l.id] && l.cek(d)) {
        diraih[l.id] = Date.now();
        adaBaru = true;
      }
    });
    if (adaBaru) {
      try {
        localStorage.setItem(window.GamaProfil.kunci('lencana'), JSON.stringify(diraih));
      } catch (e) { /* abaikan */ }
    }

    var jumlah = Object.keys(diraih).length;

    wadah.innerHTML =
      '<div class="kartu kartu-lencana">' +
        '<h3>Lencana ' + (window.GamaProfil.aktif().nama) + '</h3>' +
        '<p class="keterangan">' +
          (jumlah
            ? jumlah + ' dari ' + LENCANA.length + ' lencana sudah diraih — bukan lomba, sekadar penanda kebiasaan baik.'
            : 'Belum ada lencana — mulai dari satu kegiatan kecil saja dulu.') +
        '</p>' +
        '<ul class="baris-lencana">' +
          LENCANA.map(function (l) {
            var dapat = !!diraih[l.id];
            return (
              '<li class="lencana' + (dapat ? ' diraih' : ' terkunci') + '" ' +
                'aria-label="' + l.nama + ' — ' + (dapat ? 'sudah diraih' : 'belum diraih') + '">' +
                '<span class="lencana-ikon" aria-hidden="true"><svg viewBox="0 0 24 24">' + IKON[l.ikon] + '</svg></span>' +
                '<span class="lencana-teks"><b>' + l.nama + '</b><small>' + l.desk + '</small></span>' +
                (dapat
                  ? '<svg class="lencana-cek" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5 L10 17.5 L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
                  : '') +
              '</li>'
            );
          }).join('') +
        '</ul>' +
      '</div>';
  }

  window.GamaLencana = { perbarui: perbarui };
  perbarui();
})();
