/* ============================================================
   eco.js — Modul Edukasi Eco-Enzyme
   Konten statis + ilustrasi SVG inline → sepenuhnya offline.
   Rumus dasar eco-enzyme: 1 gula : 3 sampah organik : 10 air,
   fermentasi 3 bulan.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Ilustrasi SVG sederhana per langkah ---------- */
  var GAMBAR = {

    bahan:
      '<svg class="langkah-gambar" viewBox="0 0 240 120" aria-hidden="true">' +
        // gula merah
        '<rect x="18" y="62" width="44" height="34" rx="8" fill="#6B4A32"/>' +
        '<rect x="24" y="52" width="32" height="18" rx="6" fill="#C9A87C"/>' +
        '<text x="40" y="112" text-anchor="middle" font-size="11" fill="#26301F">1 gula</text>' +
        // kulit buah
        '<path d="M95 90 Q 118 66 142 90 Q 118 102 95 90 Z" fill="#7A9B3F"/>' +
        '<path d="M100 78 Q 118 58 138 76 Q 118 88 100 78 Z" fill="#D4A62A"/>' +
        '<path d="M112 60 Q 118 50 126 56" stroke="#33472E" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<text x="118" y="112" text-anchor="middle" font-size="11" fill="#26301F">3 sampah organik</text>' +
        // air
        '<path d="M196 52 C 186 66, 182 74, 182 82 A 14 14 0 0 0 210 82 C 210 74, 206 66, 196 52 Z" fill="#5C7A8A"/>' +
        '<text x="196" y="112" text-anchor="middle" font-size="11" fill="#26301F">10 air</text>' +
      '</svg>',

    potong:
      '<svg class="langkah-gambar" viewBox="0 0 240 120" aria-hidden="true">' +
        // talenan
        '<rect x="30" y="70" width="180" height="16" rx="8" fill="#C9A87C"/>' +
        // potongan kulit buah
        '<path d="M60 70 Q 70 52 84 70 Z" fill="#D4A62A"/>' +
        '<path d="M92 70 Q 102 54 116 70 Z" fill="#7A9B3F"/>' +
        '<path d="M124 70 Q 134 52 148 70 Z" fill="#D4A62A"/>' +
        // pisau
        '<path d="M150 34 L 196 56 Q 200 60 194 62 L 152 46 Z" fill="#D8D8D0"/>' +
        '<rect x="192" y="52" width="30" height="10" rx="5" transform="rotate(24 192 52)" fill="#6B4A32"/>' +
      '</svg>',

    campur:
      '<svg class="langkah-gambar" viewBox="0 0 240 120" aria-hidden="true">' +
        // botol
        '<path d="M100 14 H140 V26 L152 44 V96 A12 12 0 0 1 140 108 H100 A12 12 0 0 1 88 96 V44 L100 26 Z" fill="none" stroke="#33472E" stroke-width="4" stroke-linejoin="round"/>' +
        // isi cairan 60%
        '<path d="M90 62 H150 V96 A10 10 0 0 1 140 106 H100 A10 10 0 0 1 90 96 Z" fill="#C9A87C"/>' +
        '<path d="M104 74 Q 110 68 116 74" stroke="#6B4A32" stroke-width="3" fill="none"/>' +
        '<path d="M124 86 Q 130 80 136 86" stroke="#6B4A32" stroke-width="3" fill="none"/>' +
        // garis batas isi + label ruang udara
        '<line x1="82" y1="62" x2="158" y2="62" stroke="#A34F2E" stroke-width="2" stroke-dasharray="5 4"/>' +
        '<text x="176" y="46" font-size="11" fill="#26301F">sisakan</text>' +
        '<text x="176" y="59" font-size="11" fill="#26301F">ruang</text>' +
        '<text x="176" y="72" font-size="11" fill="#26301F">udara</text>' +
      '</svg>',

    gas:
      '<svg class="langkah-gambar" viewBox="0 0 240 120" aria-hidden="true">' +
        '<path d="M100 30 H140 V40 L152 56 V98 A10 10 0 0 1 142 108 H98 A10 10 0 0 1 88 98 V56 L100 40 Z" fill="#DCE3C8" stroke="#33472E" stroke-width="4" stroke-linejoin="round"/>' +
        // tutup sedikit terbuka
        '<rect x="96" y="14" width="48" height="14" rx="6" fill="#6B4A32" transform="rotate(-8 96 14)"/>' +
        // gelembung gas keluar
        '<circle cx="126" cy="6" r="4" fill="none" stroke="#5C7A8A" stroke-width="2.5"/>' +
        '<circle cx="140" cy="0" r="3" fill="none" stroke="#5C7A8A" stroke-width="2.5"/>' +
        '<circle cx="118" cy="66" r="4" fill="#fff"/>' +
        '<circle cx="130" cy="82" r="5" fill="#fff"/>' +
        '<circle cx="112" cy="90" r="3" fill="#fff"/>' +
        '<text x="176" y="30" font-size="11" fill="#26301F">buka tiap</text>' +
        '<text x="176" y="43" font-size="11" fill="#26301F">hari, minggu</text>' +
        '<text x="176" y="56" font-size="11" fill="#26301F">1–2</text>' +
      '</svg>',

    simpan:
      '<svg class="langkah-gambar" viewBox="0 0 240 120" aria-hidden="true">' +
        // tiga botol = tiga bulan
        '<g>' +
          '<path d="M36 46 H60 V52 L68 62 V96 A8 8 0 0 1 60 104 H36 A8 8 0 0 1 28 96 V62 L36 52 Z" fill="#DCE3C8" stroke="#33472E" stroke-width="3"/>' +
          '<rect x="34" y="36" width="28" height="10" rx="4" fill="#6B4A32"/>' +
          '<text x="48" y="118" text-anchor="middle" font-size="11" fill="#26301F">bulan 1</text>' +
        '</g>' +
        '<g>' +
          '<path d="M108 46 H132 V52 L140 62 V96 A8 8 0 0 1 132 104 H108 A8 8 0 0 1 100 96 V62 L108 52 Z" fill="#CFD9B8" stroke="#33472E" stroke-width="3"/>' +
          '<rect x="106" y="36" width="28" height="10" rx="4" fill="#6B4A32"/>' +
          '<text x="120" y="118" text-anchor="middle" font-size="11" fill="#26301F">bulan 2</text>' +
        '</g>' +
        '<g>' +
          '<path d="M180 46 H204 V52 L212 62 V96 A8 8 0 0 1 204 104 H180 A8 8 0 0 1 172 96 V62 L180 52 Z" fill="#8A5A36" stroke="#33472E" stroke-width="3"/>' +
          '<rect x="178" y="36" width="28" height="10" rx="4" fill="#6B4A32"/>' +
          '<text x="192" y="118" text-anchor="middle" font-size="11" fill="#26301F">bulan 3 ✓</text>' +
        '</g>' +
        '<path d="M72 70 H94 M144 70 H166" stroke="#6E7A66" stroke-width="2.5" stroke-dasharray="4 4"/>' +
      '</svg>',

    saring:
      '<svg class="langkah-gambar" viewBox="0 0 240 120" aria-hidden="true">' +
        // saringan
        '<path d="M78 22 H162 L146 52 H94 Z" fill="none" stroke="#6B4A32" stroke-width="4" stroke-linejoin="round"/>' +
        '<line x1="96" y1="30" x2="144" y2="30" stroke="#6B4A32" stroke-width="2"/>' +
        '<line x1="92" y1="38" x2="148" y2="38" stroke="#6B4A32" stroke-width="2"/>' +
        // tetesan
        '<path d="M120 58 C 116 64, 114 68, 114 71 A 6 6 0 0 0 126 71 C 126 68, 124 64, 120 58 Z" fill="#8A5A36"/>' +
        // wadah hasil
        '<path d="M92 80 H148 L142 108 H98 Z" fill="#8A5A36" stroke="#33472E" stroke-width="3" stroke-linejoin="round"/>' +
        '<text x="185" y="95" font-size="11" fill="#26301F">cairan siap</text>' +
        '<text x="185" y="108" font-size="11" fill="#26301F">dipakai!</text>' +
      '</svg>'
  };

  /* ---------- Langkah-langkah ---------- */
  var LANGKAH = [
    {
      judul: 'Siapkan bahan dengan takaran 1 : 3 : 10',
      isi: 'Takarannya gampang diingat: <b>1 bagian gula, 3 bagian sampah organik, 10 bagian air</b> (ditimbang beratnya, bukan volumenya). Contoh untuk botol besar: <b>100 gram gula merah</b> (atau molase/gula aren), <b>300 gram sampah organik</b>, dan <b>1 liter air</b> bersih (air sumur atau air hujan yang sudah diendapkan juga boleh). Gula ini jadi "makanan" bagi mikroba yang memfermentasi campuran ini, jadi jangan dikurangi takarannya. Mau bikin lebih banyak? Tinggal kalikan semua angka sama besar, misalnya 2 kali lipat jadi 200 gram : 600 gram : 2 liter.',
      gambar: 'bahan'
    },
    {
      judul: 'Potong kecil sampah organiknya',
      isi: 'Gunakan <b>kulit buah dan sisa sayuran mentah</b>: kulit pisang, pepaya, jeruk, mangga, atau sisa kangkung dan sawi. <b>Jangan</b> pakai sisa makanan bersantan, berminyak, daging, atau ikan, karena bahan-bahan ini gampang busuk duluan dan mengundang belatung sebelum sempat terfermentasi jadi eco-enzyme. Potong kecil-kecil (seukuran satu-dua ruas jari) supaya permukaannya lebih luas, gulanya lebih cepat meresap, dan fermentasinya juga lebih cepat jadi.',
      gambar: 'potong'
    },
    {
      judul: 'Campur semua dalam wadah plastik',
      isi: 'Larutkan dulu gula ke dalam air sampai benar-benar tercampur, baru masukkan potongan sampah organiknya, lalu aduk rata. Gunakan <b>botol atau jeriken plastik</b> bertutup rapat, jangan pakai wadah kaca atau logam. Isi wadah <b>paling banyak 60%</b> saja, sisakan ruang udara di bagian atas, karena proses fermentasi menghasilkan gas yang butuh tempat mengembang. Kalau wadah diisi penuh, gasnya bisa mendesak dan membuat wadah bocor atau meletup.',
      gambar: 'campur'
    },
    {
      judul: 'Buang gas di 2 minggu pertama',
      isi: 'Selama <b>1-2 minggu pertama</b>, fermentasi sedang aktif-aktifnya dan menghasilkan banyak gas. Buka tutup wadahnya sebentar saja setiap hari (cukup beberapa detik) untuk melepas gas yang terkumpul, lalu tutup rapat lagi. Lakukan di tempat terbuka supaya baunya tidak menyengat di dalam rumah. Kalau sampai lupa berhari-hari, gas yang menumpuk bisa membuat wadah menggembung, bahkan bisa meletup dan mengotori sekitarnya. Setelah 2 minggu, gasnya mulai mereda, jadi cukup dibuka sesekali saja, misalnya seminggu sekali.',
      gambar: 'gas'
    },
    {
      judul: 'Simpan dan tunggu 3 bulan',
      isi: 'Simpan wadahnya di tempat <b>teduh dan tidak kena matahari langsung</b> (sinar matahari bisa merusak proses fermentasi), serta jauh dari jangkauan anak-anak. Goyang atau aduk perlahan seminggu sekali supaya campurannya merata. Selama menunggu, jangan kaget kalau muncul lapisan putih tipis di permukaan cairan, itu normal dan justru pertanda fermentasinya berjalan baik. Kalau sampai muncul belatung, jangan dibuang, cukup tambahkan sedikit gula lagi dan pastikan tutupnya benar-benar rapat, biasanya itu tanda takaran gula kurang atau tutupnya kurang rapat.',
      gambar: 'simpan'
    },
    {
      judul: 'Saring dan panen',
      isi: 'Setelah genap <b>3 bulan</b>, saring cairannya memakai kain bersih atau saringan halus. Eco-enzyme yang sudah jadi berwarna <b>cokelat tua dan beraroma asam segar</b> seperti cuka, itu tandanya berhasil. Kalau baunya busuk atau menyengat tidak sedap, kemungkinan prosesnya gagal, biasanya karena bahan yang dipakai tidak cocok atau tutupnya kurang rapat. Ampasnya jangan dibuang, masih berguna: benamkan ke tanah sebagai kompos, atau simpan sedikit untuk jadi starter (bibit fermentasi) supaya adonan berikutnya lebih cepat jadi.',
      gambar: 'saring'
    }
  ];

  var MANFAAT = [
    { emoji: '🌱', teks: '<b>Pupuk cair tanaman</b> — menyuburkan sayuran, jagung muda, dan tanaman pekarangan.' },
    { emoji: '🧴', teks: '<b>Pembersih serbaguna</b> — mengepel lantai, mencuci piring, membersihkan kamar mandi.' },
    { emoji: '🐛', teks: '<b>Pengusir hama alami</b> — semprotan encer untuk mengusir serangga di tanaman.' },
    { emoji: '🗑', teks: '<b>Mengurangi sampah</b> — sampah dapur tidak lagi dibakar atau membusuk jadi gas metana yang memanaskan bumi.' },
    { emoji: '💰', teks: '<b>Hemat uang</b> — mengurangi belanja pupuk dan cairan pembersih pabrikan.' }
  ];

  var TAKARAN = [
    ['Pupuk cair (siram)', '2 tutup botol per 2 liter air, seminggu 1–2 kali'],
    ['Semprot hama', '1 tutup botol per 1 liter air'],
    ['Pel lantai', '1 tutup botol per 1 ember air'],
    ['Cuci piring', 'campur sedikit dengan sabun biasa']
  ];

  var TIPS_SIMPAN = [
    { emoji: '🍶', teks: 'Selalu pakai <b>wadah plastik</b>, jangan kaca atau logam — gas fermentasi bisa memecahkan kaca.' },
    { emoji: '🌳', teks: 'Simpan di tempat <b>sejuk dan gelap</b>, tidak perlu kulkas.' },
    { emoji: '⏳', teks: 'Eco-enzyme <b>tidak punya kedaluwarsa</b> — makin lama disimpan justru makin bagus.' },
    { emoji: '🏷', teks: 'Tulis <b>tanggal pembuatan</b> di wadah supaya tahu kapan genap 3 bulan.' }
  ];

  /* ---------- Progres langkah (checklist, tersimpan di HP) ---------- */
  var KUNCI_PROGRES = window.GamaProfil.kunci('progres_eco');   // terpisah per profil

  function ambilProgres() {
    try {
      var p = JSON.parse(localStorage.getItem(KUNCI_PROGRES));
      return Array.isArray(p) ? p : [];
    } catch (e) { return []; }
  }
  function simpanProgres(p) {
    try { localStorage.setItem(KUNCI_PROGRES, JSON.stringify(p)); } catch (e) { /* abaikan */ }
  }

  /* ---------- Render ---------- */
  var wadah = document.getElementById('isi-eco');

  var html =
    '<div class="kartu">' +
      '<h3>Apa itu eco-enzyme?</h3>' +
      '<p>Eco-enzyme adalah <b>cairan hasil fermentasi sampah dapur</b> (kulit buah dan sisa sayur) dengan gula dan air. ' +
      'Membuatnya sangat mudah, tanpa alat khusus, dan hasilnya bisa dipakai untuk banyak keperluan rumah dan kebun.</p>' +
    '</div>' +

    '<div class="kartu kartu-rasio">' +
      '<h3 style="color:#fff">Rumus mudahnya</h3>' +
      '<div class="rasio-angka">' +
        '<span class="rasio-kotak">1<small>gula</small></span><span>:</span>' +
        '<span class="rasio-kotak">3<small>sampah</small></span><span>:</span>' +
        '<span class="rasio-kotak">10<small>air</small></span>' +
      '</div>' +
      '<p>ditimbang beratnya, lalu difermentasi <b>3 bulan</b></p>' +
    '</div>' +

    '<h3 class="judul-bagian">Langkah demi langkah</h3>' +

    '<div class="kartu kartu-progres">' +
      '<div class="progres-label"><b>Progres saya</b><span id="progres-teks">0 dari ' + LANGKAH.length + ' langkah</span></div>' +
      '<div class="progres-luar"><div class="progres-dalam" id="progres-batang"></div></div>' +
      '<p class="keterangan">Centang tiap langkah yang sudah dikerjakan — tersimpan di HP ini.</p>' +
    '</div>' +

    LANGKAH.map(function (langkah, i) {
      return (
        '<div class="kartu langkah-eco" data-langkah="' + i + '">' +
          '<div class="langkah-nomor">' + (i + 1) + '</div>' +
          '<div style="flex:1">' +
            '<h4>' + langkah.judul + '</h4>' +
            '<p>' + langkah.isi + '</p>' +
            GAMBAR[langkah.gambar] +
            '<label class="cek-langkah">' +
              '<input type="checkbox" data-indeks="' + i + '">' +
              '<span class="cek-kotak" aria-hidden="true"></span>' +
              '<span>Sudah saya kerjakan</span>' +
            '</label>' +
          '</div>' +
        '</div>'
      );
    }).join('') +

    '<h3 class="judul-bagian">Manfaatnya untuk kita</h3>' +
    '<div class="kartu"><ul class="daftar-manfaat">' +
      MANFAAT.map(function (m) {
        return '<li><span class="emoji">' + m.emoji + '</span><span>' + m.teks + '</span></li>';
      }).join('') +
    '</ul></div>' +

    '<div class="kartu">' +
      '<h3>Takaran pemakaian</h3>' +
      '<table class="tabel-takaran">' +
        '<tr><th>Keperluan</th><th>Campuran</th></tr>' +
        TAKARAN.map(function (t) {
          return '<tr><td>' + t[0] + '</td><td>' + t[1] + '</td></tr>';
        }).join('') +
      '</table>' +
    '</div>' +

    '<div class="kartu kartu-peringatan">' +
      '<h3>Tips penyimpanan</h3>' +
      '<ul class="daftar-manfaat">' +
        TIPS_SIMPAN.map(function (t) {
          return '<li><span class="emoji">' + t.emoji + '</span><span>' + t.teks + '</span></li>';
        }).join('') +
      '</ul>' +
    '</div>';

  wadah.innerHTML = html;

  /* ---------- Checklist & progress bar ---------- */
  var batang = document.getElementById('progres-batang');
  var teksProgres = document.getElementById('progres-teks');

  function gambarProgres() {
    var progres = ambilProgres();
    var selesai = 0;
    wadah.querySelectorAll('.cek-langkah input').forEach(function (cek) {
      var i = parseInt(cek.dataset.indeks, 10);
      var sudah = !!progres[i];
      cek.checked = sudah;
      cek.closest('.langkah-eco').classList.toggle('selesai', sudah);
      if (sudah) selesai++;
    });
    var persen = Math.round(selesai / LANGKAH.length * 100);
    batang.style.width = persen + '%';
    teksProgres.textContent = selesai + ' dari ' + LANGKAH.length + ' langkah';
    if (selesai === LANGKAH.length) {
      teksProgres.textContent = 'Selesai semua — selamat! 🎉';
    }
  }

  wadah.addEventListener('change', function (e) {
    var cek = e.target.closest('.cek-langkah input');
    if (!cek) return;
    var progres = ambilProgres();
    progres[parseInt(cek.dataset.indeks, 10)] = cek.checked;
    simpanProgres(progres);
    gambarProgres();

    // aktivitas nyata → tanaman Siklus Tani di beranda ikut tumbuh
    if (window.GamaSiklus) window.GamaSiklus.perbarui();
  });

  gambarProgres();

  /* ---------- Bagikan modul (Web Share / WhatsApp) ---------- */
  var tombolBagikan = document.getElementById('tombol-bagikan-eco');
  if (tombolBagikan && window.GamaBagikan) {
    tombolBagikan.addEventListener('click', function () {
      var teks =
        'Cara membuat ECO-ENZYME dari sampah dapur:\n' +
        'Rumus takaran 1 : 3 : 10 (gula : sampah organik : air), fermentasi 3 bulan.\n\n' +
        LANGKAH.map(function (l, i) {
          return (i + 1) + '. ' + l.judul;
        }).join('\n') +
        '\n\nHasilnya bisa jadi pupuk cair, pembersih lantai, dan pengusir hama alami. Langkah lengkapnya ada di aplikasi GaMa Hijau!';
      window.GamaBagikan.bagikan('Cara Membuat Eco-Enzyme', teks);
    });
  }

  /* ---------- Mode cetak ---------- */
  var tombolCetak = document.getElementById('tombol-cetak-eco');
  if (tombolCetak) {
    tombolCetak.addEventListener('click', function () { window.print(); });
  }
})();
