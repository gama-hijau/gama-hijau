/* ============================================================
   onboarding.js — Tutorial Sekali Tampil (fitur 9)
   - HANYA muncul saat aplikasi pertama kali dibuka.
   - Status "sudah lihat" disimpan di localStorage (per HP,
     bukan per profil) → tidak muncul lagi setelahnya.
   - Bisa dibuka ulang lewat menu "Bantuan / Cara Pakai"
     di halaman Tentang.
   ============================================================ */
(function () {
  'use strict';

  var KUNCI = 'gama_onboarding_v1';

  /* ---------- Ilustrasi tiap slide (SVG, gaya alam aplikasi) ---------- */
  var GAMBAR = {
    salam:
      '<svg viewBox="0 0 120 120" aria-hidden="true">' +
        '<circle cx="92" cy="24" r="12" fill="#D4A62A" opacity="0.5"/>' +
        '<path d="M8 96 C 30 84, 50 90, 70 84 C 92 78, 106 84, 114 80 L114 110 L8 110 Z" fill="#7A9B3F" opacity="0.4"/>' +
        '<path d="M8 104 C 34 96, 60 100, 86 94 C 100 91, 110 95, 114 93 L114 112 L8 112 Z" fill="#33472E" opacity="0.5"/>' +
        '<rect x="38" y="26" width="44" height="72" rx="9" fill="#FAFAF2" stroke="#33472E" stroke-width="3"/>' +
        '<path d="M60 78 C 60 64, 54 58, 44 54 C 56 55, 60 62, 60 62 C 60 62, 63 51, 74 47 C 66 55, 62 66, 61 78 Z" fill="#7A9B3F"/>' +
        '<circle cx="60" cy="88" r="3.5" fill="#33472E"/>' +
      '</svg>',
    hitung:
      '<svg viewBox="0 0 120 120" aria-hidden="true">' +
        '<circle cx="60" cy="56" r="34" fill="none" stroke="#33472E" stroke-width="3.5"/>' +
        '<path d="M60 22 C 38 38, 38 74, 60 90 M60 22 C 82 38, 82 74, 60 90" fill="none" stroke="#33472E" stroke-width="2"/>' +
        '<path d="M28 46 H92 M28 66 H92" stroke="#33472E" stroke-width="2"/>' +
        '<path d="M82 88 C 82 76, 92 74, 97 66 C 99 78, 94 86, 82 88 Z" fill="#7A9B3F"/>' +
        '<circle cx="30" cy="26" r="9" fill="#D4A62A" opacity="0.6"/>' +
      '</svg>',
    jadwal:
      '<svg viewBox="0 0 120 120" aria-hidden="true">' +
        '<rect x="20" y="26" width="80" height="70" rx="12" fill="#FAFAF2" stroke="#33472E" stroke-width="3.5"/>' +
        '<path d="M20 48 H100 M40 18 V34 M80 18 V34" stroke="#33472E" stroke-width="3.5" stroke-linecap="round"/>' +
        '<path d="M44 76 L54 86 L76 62" fill="none" stroke="#7A9B3F" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<circle cx="98" cy="30" r="14" fill="#D4A62A"/>' +
        '<path d="M98 24 V30 L102 34" fill="none" stroke="#3D2E06" stroke-width="2.5" stroke-linecap="round"/>' +
      '</svg>',
    profil:
      '<svg viewBox="0 0 120 120" aria-hidden="true">' +
        '<path d="M14 100 C 34 90, 54 96, 74 90 C 94 84, 108 90, 114 87 L114 112 L14 112 Z" fill="#7A9B3F" opacity="0.35"/>' +
        '<circle cx="44" cy="46" r="17" fill="#7A9B3F"/>' +
        '<text x="44" y="53" text-anchor="middle" font-size="18" font-weight="bold" fill="#26301F" font-family="Georgia,serif">A</text>' +
        '<circle cx="80" cy="56" r="14" fill="#5C7A8A"/>' +
        '<text x="80" y="62" text-anchor="middle" font-size="15" font-weight="bold" fill="#fff" font-family="Georgia,serif">B</text>' +
        '<path d="M28 92 C 28 76, 60 76, 60 92 M64 92 C 64 80, 94 80, 94 92" fill="none" stroke="#33472E" stroke-width="3.5" stroke-linecap="round"/>' +
        '<path d="M100 26 a8 8 0 1 0 0.1 0 M100 20 V16 M100 40 V44 M88 28 H84 M116 28 H112" stroke="#D4A62A" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
      '</svg>'
  };

  var SLIDE = [
    {
      gambar: 'salam',
      judul: 'Salamaki di GaMa Hijau!',
      isi: 'Aplikasi belajar iklim untuk warga Galung Maloang. Setelah terpasang, semua fitur jalan <b>tanpa internet</b> — hanya info cuaca yang butuh sambungan sesekali.'
    },
    {
      gambar: 'hitung',
      judul: 'Kenali jejak karbonmu',
      isi: 'Isi kebiasaan harian di menu <b>Karbon</b>, lihat perkiraan emisi CO₂-mu, lalu ikuti saran sederhana untuk menguranginya. Ada juga <b>Tips Tani</b> ramah iklim untuk jagung, padi, jati, dan mete.'
    },
    {
      gambar: 'jadwal',
      judul: 'Rencanakan musim tanammu',
      isi: 'Cek bulan terbaik menanam di <b>Kalender Tanam</b>, salin ke <b>Jadwal Tani</b>-mu, dan biarkan aplikasi mengingatkan saat waktunya tiba — tanam, pupuk, siram, panen.'
    },
    {
      gambar: 'profil',
      judul: 'Satu HP, ramai-ramai',
      isi: 'Buat <b>profil</b> untuk tiap anggota keluarga — datanya terpisah dan tersimpan <b>hanya di HP ini</b>, tidak dikirim ke mana-mana. Tanamanmu di beranda akan tumbuh mengikuti kegiatanmu. Selamat mencoba!'
    }
  ];

  var wadah = null;
  var indeks = 0;

  function sudahLihat() {
    try { return !!localStorage.getItem(KUNCI); } catch (e) { return true; }
  }
  function tandaiSudah() {
    try { localStorage.setItem(KUNCI, String(Date.now())); } catch (e) { /* abaikan */ }
  }

  function gambarSlide() {
    var s = SLIDE[indeks];
    var akhir = indeks === SLIDE.length - 1;

    var titik = SLIDE.map(function (_, i) {
      return '<span class="titik-slide' + (i === indeks ? ' aktif' : '') + '"></span>';
    }).join('');

    wadah.innerHTML =
      '<div class="dialog-kotak onboarding-kotak" role="dialog" aria-modal="true" aria-labelledby="judul-onboarding">' +
        '<div class="slide-gambar">' + GAMBAR[s.gambar] + '</div>' +
        '<h3 id="judul-onboarding">' + s.judul + '</h3>' +
        '<p class="slide-isi">' + s.isi + '</p>' +
        '<div class="baris-titik" aria-label="Slide ' + (indeks + 1) + ' dari ' + SLIDE.length + '">' + titik + '</div>' +
        '<div class="onboarding-aksi">' +
          (indeks > 0
            ? '<button type="button" class="tombol tombol-kedua" id="ob-kembali">Kembali</button>'
            : '<button type="button" class="tombol tombol-kedua" id="ob-lewati">Lewati</button>') +
          '<button type="button" class="tombol tombol-utama" id="ob-lanjut">' + (akhir ? 'Mulai!' : 'Lanjut') + '</button>' +
        '</div>' +
      '</div>';

    var lanjut = document.getElementById('ob-lanjut');
    lanjut.focus();
  }

  function buka() {
    if (!wadah) return;
    indeks = 0;
    wadah.classList.remove('tersembunyi');
    gambarSlide();
  }
  function tutup() {
    tandaiSudah();
    wadah.classList.add('tersembunyi');
  }

  function pasang() {
    wadah = document.getElementById('dialog-onboarding');
    if (!wadah) return;

    wadah.addEventListener('click', function (e) {
      if (e.target.closest('#ob-lewati')) { tutup(); return; }
      if (e.target.closest('#ob-kembali')) { indeks--; gambarSlide(); return; }
      if (e.target.closest('#ob-lanjut')) {
        if (indeks === SLIDE.length - 1) { tutup(); return; }
        indeks++; gambarSlide();
      }
    });
    wadah.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') tutup();
    });

    // Hanya tampil otomatis saat pertama kali aplikasi dibuka
    if (!sudahLihat()) buka();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', pasang);
  } else {
    pasang();
  }

  window.GamaOnboarding = { buka: buka };
})();
