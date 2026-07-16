/* ============================================================
   dampak.js — Dashboard Dampak Bersama (fitur 11)
   Menjumlahkan dampak dari SEMUA profil di HP ini menjadi satu
   angka kumulatif — untuk laporan / bukti keberhasilan proker.
   Cara hitung (jujur & sederhana):
   - "CO₂ dihindari" = penurunan dari perhitungan PERTAMA ke
     perhitungan TERBARU tiap profil (hanya yang turun), dijumlah.
   - Angka kegiatan = seluruh perhitungan, jadwal, dan langkah
     eco-enzyme yang tercatat di HP ini.
   ============================================================ */
(function () {
  'use strict';

  function bacaUntuk(idProfil, dasar, cadangan) {
    try {
      var v = JSON.parse(localStorage.getItem(window.GamaProfil.kunciUntuk(idProfil, dasar)));
      return v === null || v === undefined ? cadangan : v;
    } catch (e) { return cadangan; }
  }

  function hitungSemua() {
    var hasil = {
      turun: 0,            // kg CO2/bulan yang berhasil dihindari
      perhitungan: 0,
      jadwal: 0,
      langkahEco: 0,
      profil: window.GamaProfil.daftar().length,
      profilAktifData: 0,  // profil yang punya data
      perProfil: []         // rincian per profil, untuk laporan
    };

    window.GamaProfil.daftar().forEach(function (p) {
      var id = p.id;
      var riwayat = bacaUntuk(id, 'riwayat_karbon', []);
      var jadwal = bacaUntuk(id, 'jadwal', []);
      var eco = bacaUntuk(id, 'progres_eco', []);
      var ecoSelesai = 0;
      eco.forEach(function (x) { if (x) ecoSelesai++; });

      hasil.perhitungan += riwayat.length;
      hasil.jadwal += jadwal.length;
      hasil.langkahEco += ecoSelesai;
      if (riwayat.length || jadwal.length || ecoSelesai) hasil.profilAktifData++;

      var turunProfil = 0;
      if (riwayat.length >= 2) {
        // riwayat tersimpan terbaru-dulu: elemen terakhir = perhitungan pertama
        var pertama = riwayat[riwayat.length - 1].total;
        var terbaru = riwayat[0].total;
        if (pertama > terbaru) turunProfil = pertama - terbaru;
      }
      hasil.turun += turunProfil;

      hasil.perProfil.push({
        nama: p.nama, perhitungan: riwayat.length, jadwal: jadwal.length,
        eco: ecoSelesai, turun: turunProfil
      });
    });

    return hasil;
  }

  /* ---------- Teks ringkasan siap-tempel untuk laporan proker ---------- */
  function teksLaporan(d) {
    var totalKegiatan = d.perhitungan + d.jadwal + d.langkahEco;
    var pohon = Math.round(d.turun * 12 / 21);
    var tgl = window.formatTanggal ? window.formatTanggal(new Date(), true) : new Date().toLocaleString('id-ID');

    var baris = [];
    baris.push('RINGKASAN DAMPAK — Aplikasi GaMa Hijau');
    baris.push('Kelurahan Galung Maloang, Kec. Bacukiki, Kota Parepare');
    baris.push('Diambil: ' + tgl);
    baris.push('');
    baris.push('CO2 dihindari (akumulasi penurunan jejak karbon): ' + Math.round(d.turun) + ' kg/bulan' +
      (pohon > 0 ? ' (setara kerja ' + pohon + ' pohon/tahun)' : ''));
    baris.push('Total kegiatan tercatat: ' + totalKegiatan);
    baris.push('  - Perhitungan jejak karbon: ' + d.perhitungan);
    baris.push('  - Jadwal tani diisi: ' + d.jadwal);
    baris.push('  - Langkah eco-enzyme diselesaikan: ' + d.langkahEco);
    baris.push('Jumlah profil (pengguna) di perangkat ini: ' + d.profil + ' (' + d.profilAktifData + ' aktif mengisi data)');
    baris.push('');
    baris.push('Rincian per profil:');
    d.perProfil.forEach(function (p) {
      baris.push('  - ' + p.nama + ': ' + p.perhitungan + ' perhitungan, ' + p.jadwal + ' jadwal, ' +
        p.eco + ' langkah eco-enzyme' + (p.turun > 0 ? ', turun ' + Math.round(p.turun) + ' kg/bulan' : ''));
    });
    baris.push('');
    baris.push('Sumber: data lokal perangkat, KKN Tematik Perubahan Iklim, Universitas Hasanuddin Gel. 116.');
    return baris.join('\n');
  }

  function salinLaporan(tombol) {
    var teks = teksLaporan(hitungSemua());
    var teksAsli = tombol.innerHTML;
    function sukses() {
      tombol.textContent = '✓ Ringkasan tersalin!';
      setTimeout(function () { tombol.innerHTML = teksAsli; }, 2200);
    }
    function gagal() {
      // fallback: textarea sementara + execCommand (peramban lama/non-HTTPS)
      try {
        var ta = document.createElement('textarea');
        ta.value = teks;
        ta.style.position = 'fixed'; ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        sukses();
      } catch (e) {
        tombol.textContent = 'Gagal menyalin — coba lagi';
        setTimeout(function () { tombol.innerHTML = teksAsli; }, 2200);
      }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(teks).then(sukses).catch(gagal);
    } else {
      gagal();
    }
  }

  function perbarui() {
    var wadah = document.getElementById('dampak-wadah');
    if (!wadah || !window.GamaProfil) return;

    var d = hitungSemua();
    var totalKegiatan = d.perhitungan + d.jadwal + d.langkahEco;
    var pohon = Math.round(d.turun * 12 / 21);   // 1 pohon ≈ 21 kg CO2/tahun

    var isiUtama;
    if (d.turun > 0) {
      isiUtama =
        '<div class="dampak-angka">' + Math.round(d.turun) + '<small>kg CO₂/bulan</small></div>' +
        '<p class="dampak-sub">berhasil dihindari bersama-sama di HP ini' +
          (pohon > 0 ? ' — setara kerja <b>' + pohon + ' pohon</b> selama setahun' : '') + '</p>';
    } else if (totalKegiatan > 0) {
      isiUtama =
        '<div class="dampak-angka">' + totalKegiatan + '<small>kegiatan hijau</small></div>' +
        '<p class="dampak-sub">sudah tercatat di HP ini. Simpan perhitungan karbon secara rutin — begitu angkanya turun, penghematannya muncul di sini.</p>';
    } else {
      isiUtama =
        '<p class="dampak-sub" style="margin-top:6px">Belum ada data. Mulai dari <b>menghitung jejak karbon</b> — dampak baikmu akan terkumpul di sini sebagai bukti nyata.</p>';
    }

    wadah.innerHTML =
      '<div class="kartu kartu-dampak">' +
        '<h3>Dampak Bersama Kampung Kita</h3>' +
        isiUtama +
        (totalKegiatan > 0
          ? '<ul class="statistik-dampak">' +
              '<li><b>' + d.perhitungan + '</b><small>perhitungan karbon</small></li>' +
              '<li><b>' + d.jadwal + '</b><small>jadwal tani</small></li>' +
              '<li><b>' + d.langkahEco + '</b><small>langkah eco-enzyme</small></li>' +
              '<li><b>' + d.profil + '</b><small>profil di HP ini</small></li>' +
            '</ul>'
          : '') +
        (totalKegiatan > 0
          ? '<button type="button" class="tombol tombol-kedua tombol-lebar tombol-kecil dampak-tombol-salin" id="dampak-salin">' +
              '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="13" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M5.5 15.5 H5 A1.5 1.5 0 0 1 3.5 14 V5 A1.5 1.5 0 0 1 5 3.5 H14 A1.5 1.5 0 0 1 15.5 5 V5.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>' +
              ' Salin Ringkasan Laporan' +
            '</button>'
          : '') +
        '<p class="keterangan dampak-catatan">Dihitung dari penurunan jejak karbon seluruh profil di HP ini — cocok untuk laporan program kerja.</p>' +
      '</div>';

    var tombolSalin = document.getElementById('dampak-salin');
    if (tombolSalin) {
      tombolSalin.addEventListener('click', function () { salinLaporan(tombolSalin); });
    }
  }

  window.GamaDampak = { perbarui: perbarui };
  perbarui();
})();
