/* ============================================================
   bagikan.js — Fitur Bagikan (Web Share API + fallback wa.me)
   Dipakai oleh: hasil kalkulator karbon, tips pertanian,
   dan modul eco-enzyme.
   - HP modern  : navigator.share (menu bagikan bawaan HP)
   - HP lama    : buka tautan wa.me berisi teks ringkasan
   ============================================================ */
(function () {
  'use strict';

  var TANDA_APLIKASI = '\n\n— dibagikan dari aplikasi GaMa Hijau, Kel. Galung Maloang';

  function bagikan(judul, teks) {
    var isi = teks + TANDA_APLIKASI;

    if (navigator.share) {
      navigator.share({ title: judul, text: isi }).catch(function () {
        /* pengguna membatalkan — tidak apa-apa */
      });
      return;
    }

    // Fallback: kirim lewat WhatsApp (paling umum dipakai warga)
    var url = 'https://wa.me/?text=' + encodeURIComponent(judul + '\n\n' + isi);
    window.open(url, '_blank', 'noopener');
  }

  /* Ikon bagikan (SVG) untuk dipakai modul lain saat membuat tombol */
  var IKON_BAGIKAN =
    '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<circle cx="6" cy="12" r="2.6" fill="none" stroke="currentColor" stroke-width="1.8"/>' +
      '<circle cx="17.5" cy="5.5" r="2.6" fill="none" stroke="currentColor" stroke-width="1.8"/>' +
      '<circle cx="17.5" cy="18.5" r="2.6" fill="none" stroke="currentColor" stroke-width="1.8"/>' +
      '<path d="M8.4 10.8 L15.2 6.8 M8.4 13.2 L15.2 17.2" stroke="currentColor" stroke-width="1.8"/>' +
    '</svg>';

  window.GamaBagikan = {
    bagikan: bagikan,
    IKON: IKON_BAGIKAN
  };
})();
