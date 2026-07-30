/* ============================================================
   data-kelurahan.js — Buka/tutup akordeon Data per Tahun.
   Konten statis (belum ada data), sepenuhnya offline.
   ============================================================ */
(function () {
  'use strict';

  var view = document.getElementById('view-data-kelurahan');
  if (!view) return;

  view.addEventListener('click', function (e) {
    var kepala = e.target.closest('.kartu-tip .tip-kepala');
    if (!kepala) return;
    var kartu = kepala.closest('.kartu-tip');
    var terbuka = kartu.classList.toggle('terbuka');
    kepala.setAttribute('aria-expanded', terbuka);
  });
})();
