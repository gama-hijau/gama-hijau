/* ============================================================
   tentang.js — Halaman Tentang (fitur 17) + Indikator Storage
   (fitur 15) + Reset Data per Profil (fitur 16) + tombol
   "Cara Pakai" (buka ulang onboarding, bagian fitur 9).
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Indikator penyimpanan (fitur 15) ----------
     Transparan untuk HP bermemori kecil: perkiraan ukuran
     data aplikasi + cache offline. */
  function formatUkuran(byte) {
    if (byte < 1024) return byte + ' B';
    if (byte < 1024 * 1024) return (byte / 1024).toFixed(0) + ' KB';
    return (byte / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function ukuranLocalStorage() {
    var total = 0;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf('gama') === 0) {
          total += (k.length + (localStorage.getItem(k) || '').length) * 2; // UTF-16 ≈ 2 byte/karakter
        }
      }
    } catch (e) { /* abaikan */ }
    return total;
  }

  function perbaruiStorage() {
    var el = document.getElementById('info-storage');
    if (!el) return;

    var dataPengguna = ukuranLocalStorage();

    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(function (est) {
        var total = (est.usage || 0) + dataPengguna;
        el.innerHTML =
          'Aplikasi ini memakai sekitar <b>' + formatUkuran(total) + '</b> di HP Anda' +
          ' — sudah termasuk simpanan offline. Data pengguna sendiri hanya <b>' +
          formatUkuran(dataPengguna) + '</b>.';
      }).catch(function () {
        el.innerHTML = 'Data pengguna di HP ini sekitar <b>' + formatUkuran(dataPengguna) + '</b>.';
      });
    } else {
      el.innerHTML = 'Data pengguna di HP ini sekitar <b>' + formatUkuran(dataPengguna) + '</b>.';
    }
  }

  /* ---------- Reset data profil aktif (fitur 16) ---------- */
  function pasangReset() {
    var tombol = document.getElementById('tombol-reset-profil');
    if (!tombol || !window.GamaProfil) return;

    var nama = window.GamaProfil.aktif().nama;
    tombol.addEventListener('click', function () {
      var yakin = window.confirm(
        'Hapus SEMUA data profil "' + nama + '"?\n\n' +
        'Riwayat karbon, jadwal tani, progres eco-enzyme, dan lencana profil ini ' +
        'akan terhapus permanen dari HP ini. Profil lain tidak terpengaruh.'
      );
      if (!yakin) return;
      window.GamaProfil.hapusDataProfil(window.GamaProfil.aktif().id);
      window.alert('Data profil "' + nama + '" sudah dihapus bersih.');
      location.reload();
    });
  }

  /* ---------- Tombol bantuan / cara pakai (fitur 9) ---------- */
  function pasangBantuan() {
    var tombol = document.getElementById('tombol-cara-pakai');
    if (!tombol) return;
    tombol.addEventListener('click', function () {
      if (window.GamaOnboarding) window.GamaOnboarding.buka();
    });
  }

  /* ---------- Logo Unhas: pakai berkas resmi bila ada ----------
     Letakkan berkas logo di icons/logo-unhas.png. Kalau belum ada,
     tampilkan monogram sederhana sebagai pengganti sementara. */
  function pasangLogo() {
    var img = document.getElementById('logo-unhas');
    if (!img) return;
    function pakaiCadangan() {
      img.classList.add('tersembunyi');
      var cadangan = document.getElementById('logo-unhas-cadangan');
      if (cadangan) cadangan.classList.remove('tersembunyi');
    }
    img.addEventListener('error', pakaiCadangan);
    // gambar bisa saja sudah gagal SEBELUM skrip ini berjalan
    if (img.complete && img.naturalWidth === 0) pakaiCadangan();
  }

  pasangReset();
  pasangBantuan();
  pasangLogo();
  perbaruiStorage();

  window.GamaTentang = { perbaruiStorage: perbaruiStorage };
})();
