/* ============================================================
   sampah.js — Tips Kelola Sampah (menggantikan Tips Pertanian)
   Panduan menangani SEMUA jenis sampah rumah tangga & kebun,
   dikelompokkan per jenis. Data statis → sepenuhnya offline.
   Nada hangat, bahasa sehari-hari, cocok untuk Galung Maloang.

   Alur: kisi kategori dulu (pilih jenis sampah) → baru daftar
   tips kategori itu saja, semua kartu tertutup di awal. Ini
   supaya layar tidak langsung penuh dengan puluhan tips sekaligus.
   ============================================================ */
(function () {
  'use strict';

  /* Kelompok = jenis sampah (jadi judul bagian sekaligus kotak kisi) */
  var KATEGORI = [
    { id: 'organik', emoji: '🍂', label: 'Organik', judul: '🍂 Sampah Organik (sisa dapur & kebun)', warna: 'hijau' },
    { id: 'plastik', emoji: '🛍️', label: 'Plastik', judul: '🛍️ Sampah Plastik', warna: 'biru' },
    { id: 'kertas',  emoji: '📦', label: 'Kertas & Kardus', judul: '📦 Kertas & Kardus', warna: 'cokelat' },
    { id: 'kaca',    emoji: '🥫', label: 'Kaca & Logam', judul: '🥫 Kaca & Logam', warna: 'kuning' },
    { id: 'b3',      emoji: '⚠️', label: 'Berbahaya (B3)', judul: '⚠️ Sampah Berbahaya (B3)', warna: 'terracotta' },
    { id: 'residu',  emoji: '🗑️', label: 'Residu', judul: '🗑️ Residu & Lain-lain', warna: 'hijau' }
  ];

  var NAMA_KATEGORI = {
    organik: 'Organik',
    plastik: 'Plastik',
    kertas: 'Kertas & Kardus',
    kaca: 'Kaca & Logam',
    b3: 'Berbahaya (B3)',
    residu: 'Residu'
  };

  /* Bentuk-bentuk ilustrasi dipakai ulang untuk tips dengan aksi serupa,
     supaya tidak perlu 24 gambar berbeda — tetap sederhana, 2-3 warna
     dari palet yang sudah ada, tanpa gambar bitmap. */
  var ILUSTRASI = {
    pilah:
      '<circle cx="32" cy="32" r="30" fill="var(--hijau-pucat)"/>' +
      '<rect x="10" y="30" width="12" height="16" rx="2" fill="var(--hijau-muda-jagung)"/>' +
      '<rect x="26" y="24" width="12" height="22" rx="2" fill="var(--kuning-jagung)"/>' +
      '<rect x="42" y="28" width="12" height="18" rx="2" fill="var(--tanah-basah)"/>',
    tolak:
      '<circle cx="32" cy="32" r="30" fill="var(--hijau-pucat)"/>' +
      '<path d="M22 24 H42 L39 48 H25 Z" fill="var(--tanah-basah)"/>' +
      '<path d="M26 24 C26 17 38 17 38 24" fill="none" stroke="var(--hijau-jati)" stroke-width="3"/>' +
      '<circle cx="46" cy="18" r="12" fill="none" stroke="var(--terracotta)" stroke-width="4"/>' +
      '<line x1="38" y1="26" x2="54" y2="10" stroke="var(--terracotta)" stroke-width="4"/>',
    kompos:
      '<circle cx="32" cy="32" r="30" fill="var(--hijau-pucat)"/>' +
      '<path d="M10 46 Q32 30 54 46 Z" fill="var(--tanah-basah)"/>' +
      '<path d="M32 34 C24 30 22 20 28 14 C30 22 34 26 32 34 Z" fill="var(--hijau-muda-jagung)"/>' +
      '<circle cx="32" cy="14" r="3" fill="var(--kuning-jagung)"/>',
    lubang:
      '<circle cx="32" cy="32" r="30" fill="var(--hijau-pucat)"/>' +
      '<ellipse cx="32" cy="46" rx="20" ry="8" fill="var(--tanah-basah)"/>' +
      '<ellipse cx="32" cy="46" rx="12" ry="4.5" fill="var(--hijau-jati)"/>' +
      '<path d="M30 14 C36 18 36 26 30 30 C28 24 26 18 30 14 Z" fill="var(--hijau-muda-jagung)"/>',
    ternak:
      '<circle cx="32" cy="32" r="30" fill="var(--hijau-pucat)"/>' +
      '<ellipse cx="28" cy="32" rx="14" ry="11" fill="var(--kuning-jagung)"/>' +
      '<circle cx="40" cy="23" r="6" fill="var(--kuning-jagung)"/>' +
      '<path d="M45 19 L50 21 L45 23 Z" fill="var(--tanah-basah)"/>' +
      '<ellipse cx="30" cy="48" rx="16" ry="5" fill="var(--hijau-muda-jagung)"/>',
    'stop-bakar':
      '<circle cx="32" cy="32" r="30" fill="var(--hijau-pucat)"/>' +
      '<path d="M32 12 C40 20 40 28 34 32 C38 34 36 42 30 44 C24 42 22 34 26 30 C22 28 24 18 32 12 Z" fill="var(--terracotta)"/>' +
      '<circle cx="32" cy="32" r="23" fill="none" stroke="var(--hijau-jati)" stroke-width="4"/>' +
      '<line x1="15" y1="49" x2="49" y2="15" stroke="var(--hijau-jati)" stroke-width="4"/>',
    jual:
      '<circle cx="32" cy="32" r="30" fill="var(--hijau-pucat)"/>' +
      '<path d="M20 26 L44 26 L40 50 L24 50 Z" fill="var(--tanah-basah)"/>' +
      '<path d="M24 26 C24 18 40 18 40 26" fill="none" stroke="var(--tanah-basah)" stroke-width="3"/>' +
      '<circle cx="44" cy="18" r="10" fill="var(--kuning-jagung)"/>' +
      '<path d="M40 18 L43 21 L49 15" fill="none" stroke="var(--hijau-jati)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
    ecobrick:
      '<circle cx="32" cy="32" r="30" fill="var(--hijau-pucat)"/>' +
      '<path d="M27 10 H37 V16 C41 18 43 22 43 27 V50 A3 3 0 0 1 40 53 H24 A3 3 0 0 1 21 50 V27 C21 22 23 18 27 16 Z" fill="none" stroke="var(--hijau-jati)" stroke-width="3"/>' +
      '<rect x="24.5" y="30" width="6" height="18" fill="var(--kuning-jagung)"/>' +
      '<rect x="31" y="24" width="6" height="24" fill="var(--tanah-basah)"/>' +
      '<rect x="37.5" y="34" width="4" height="14" fill="var(--hijau-muda-jagung)"/>',
    'pakai-ulang':
      '<circle cx="32" cy="32" r="30" fill="var(--hijau-pucat)"/>' +
      '<rect x="22" y="24" width="20" height="24" rx="4" fill="var(--tanah-basah)"/>' +
      '<rect x="26" y="18" width="12" height="7" rx="2" fill="var(--hijau-jati)"/>' +
      '<path d="M14 26 A18 18 0 0 1 30 11" fill="none" stroke="var(--hijau-muda-jagung)" stroke-width="3.5" stroke-linecap="round"/>' +
      '<path d="M50 38 A18 18 0 0 1 34 53" fill="none" stroke="var(--hijau-muda-jagung)" stroke-width="3.5" stroke-linecap="round"/>' +
      '<path d="M12 20 L14 26 L20 24" fill="none" stroke="var(--hijau-muda-jagung)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M52 44 L50 38 L44 40" fill="none" stroke="var(--hijau-muda-jagung)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>',
    'hati-hati':
      '<circle cx="32" cy="32" r="30" fill="var(--hijau-pucat)"/>' +
      '<path d="M32 12 L54 50 H10 Z" fill="var(--kuning-jagung)"/>' +
      '<rect x="29" y="26" width="6" height="14" rx="2" fill="var(--hijau-jati)"/>' +
      '<circle cx="32" cy="44" r="3.4" fill="var(--hijau-jati)"/>',
    'b3-racun':
      '<circle cx="32" cy="32" r="30" fill="var(--hijau-pucat)"/>' +
      '<path d="M32 10 L54 32 L32 54 L10 32 Z" fill="var(--terracotta)"/>' +
      '<path d="M32 22 C38 30 38 38 32 42 C26 38 26 30 32 22 Z" fill="var(--kuning-jagung)"/>',
    bungkus:
      '<circle cx="32" cy="32" r="30" fill="var(--hijau-pucat)"/>' +
      '<rect x="16" y="20" width="32" height="26" rx="8" fill="var(--tanah-basah)"/>' +
      '<line x1="32" y1="20" x2="32" y2="46" stroke="var(--kuning-jagung)" stroke-width="3.5"/>' +
      '<line x1="16" y1="33" x2="48" y2="33" stroke="var(--kuning-jagung)" stroke-width="3.5"/>' +
      '<circle cx="32" cy="33" r="4" fill="var(--hijau-jati)"/>'
  };

  function svgIlustrasi(kunci) {
    var isi = ILUSTRASI[kunci] || ILUSTRASI.pilah;
    return '<svg class="tip-ilustrasi-img" viewBox="0 0 64 64" aria-hidden="true">' + isi + '</svg>';
  }

  var TIPS = [
    /* ---------- Organik ---------- */
    {
      kategori: 'organik', emoji: '🥬', ikon: 'pilah',
      judul: 'Pisahkan sisa dapur sejak dari dapur',
      kenapa: 'Kalau sampah dapur tercampur dari awal, semuanya jadi basah dan bau — barang yang sebenarnya masih bisa dijual pun ikut kotor dan tidak laku.',
      cara: [
        'Sediakan satu wadah khusus dekat tempat masak, untuk kulit buah, sisa sayur, ampas kopi, dan cangkang telur.',
        'Kosongkan wadah ini setiap hari supaya tidak bau.',
        'Jangan campur dengan plastik, kertas, atau sampah kering lainnya.'
      ],
      nilai: 'Sampah kering (plastik, kertas, logam) yang tidak ikut basah jadi lebih gampang dijual ke pengepul.'
    },
    {
      kategori: 'organik', emoji: '🧪', ikon: 'kompos',
      judul: 'Ubah jadi eco-enzyme atau kompos',
      kenapa: 'Sisa dapur yang dibiarkan begitu saja hanya jadi bau dan lalat. Padahal kalau diolah, ia berubah jadi pupuk gratis.',
      cara: [
        'Kulit buah dan sisa sayur mentah cocok dijadikan eco-enzyme (lihat menu Eco-Enzyme).',
        'Atau tumpuk di lubang/kompos sederhana, biarkan melapuk beberapa minggu.',
        'Gunakan hasilnya untuk menyuburkan jagung, sayur, atau tanaman pekarangan.'
      ],
      nilai: 'Hemat biaya pupuk, dan tanah di kebun ikut lebih subur.'
    },
    {
      kategori: 'organik', emoji: '🕳️', ikon: 'lubang',
      judul: 'Buat lubang biopori atau rorak untuk daun',
      kenapa: 'Daun kering yang menumpuk sering dibakar, padahal itu buang-buang kesuburan tanah dan mencemari udara.',
      cara: [
        'Gali lubang kecil (biopori) atau parit dangkal (rorak) di antara tanaman.',
        'Timbun daun kering dan sampah kebun ke dalamnya sedikit demi sedikit.',
        'Biarkan melapuk sendiri — tidak perlu dibalik atau diaduk.'
      ],
      nilai: 'Tanah jadi lebih subur, dan lubangnya membantu air hujan meresap sebagai cadangan air saat kemarau.'
    },
    {
      kategori: 'organik', emoji: '🐔', ikon: 'ternak',
      judul: 'Sisa sayur untuk pakan ternak',
      kenapa: 'Banyak sisa sayur dan nasi masih layak makan — sayang kalau langsung dibuang, padahal ternak di rumah butuh pakan.',
      cara: [
        'Kumpulkan sisa sayur dan nasi yang masih segar, pisahkan dari yang basi.',
        'Berikan langsung ke ayam, bebek, atau kambing.',
        'Jangan pernah beri makanan yang sudah basi atau berjamur.'
      ],
      nilai: 'Hemat biaya pakan, sekaligus sampah dapur berkurang banyak.'
    },
    {
      kategori: 'organik', emoji: '🚫', ikon: 'stop-bakar',
      judul: 'Jangan bakar sampah kebun',
      kenapa: 'Asap dari bakar daun dan brangkasan memanaskan udara dan bikin sesak napas — padahal sampahnya sendiri sebenarnya berharga.',
      cara: [
        'Kumpulkan daun dan brangkasan, jangan disulut api.',
        'Jadikan mulsa (ditebar di permukaan tanah) atau masukkan ke kompos/lubang biopori.',
        'Ajak tetangga melakukan hal sama, supaya asap bakaran di kampung berkurang.'
      ],
      nilai: 'Tanah yang ditutup mulsa lebih lembap dan tidak perlu sering disiram.'
    },

    /* ---------- Plastik ---------- */
    {
      kategori: 'plastik', emoji: '🧺', ikon: 'tolak',
      judul: 'Kurangi kantong plastik dari sumbernya',
      kenapa: 'Sampah plastik paling murah ditangani dengan cara tidak menghasilkannya sejak awal, daripada repot mengelolanya nanti.',
      cara: [
        'Bawa keranjang atau tas kain setiap kali belanja ke pasar/warung.',
        'Tolak kantong plastik untuk belanjaan kecil yang bisa dipegang langsung.',
        'Simpan tas kain di motor atau dekat pintu supaya tidak lupa.'
      ]
    },
    {
      kategori: 'plastik', emoji: '🍶', ikon: 'jual',
      judul: 'Botol & gelas plastik: kumpulkan lalu jual',
      kenapa: 'Botol dan gelas plastik bersih termasuk sampah yang paling dicari pengepul — sayang kalau dicampur begitu saja dengan sampah lain.',
      cara: [
        'Bilas botol/gelas plastik sampai bersih dari sisa minuman.',
        'Keringkan supaya tidak berjamur dan lebih ringan.',
        'Kumpulkan di karung, lalu setor ke pengepul atau bank sampah.'
      ],
      nilai: 'Uang tambahan buat keluarga, sekaligus sampah plastik berkurang.'
    },
    {
      kategori: 'plastik', emoji: '🔥', ikon: 'stop-bakar',
      judul: 'JANGAN bakar plastik',
      kenapa: 'Asap plastik yang dibakar mengandung racun (dioksin) yang merusak paru-paru dan mencemari udara sekampung.',
      cara: [
        'Sekalipun repot, jangan pernah menyulut api pada sampah plastik.',
        'Kumpulkan dulu di satu wadah/karung.',
        'Setor ke pengepul atau bank sampah terdekat.'
      ]
    },
    {
      kategori: 'plastik', emoji: '🧱', ikon: 'ecobrick',
      judul: 'Sachet & plastik kotor jadi ecobrick',
      kenapa: 'Bungkus kopi, mi instan, dan plastik kecil kotor sulit dijual karena tidak ada yang mau menerimanya — tapi bisa ditahan supaya tidak berserakan.',
      cara: [
        'Cuci dan keringkan bungkus plastik kecil sampai benar-benar kering.',
        'Potong kecil-kecil, lalu padatkan ke dalam botol plastik bekas.',
        'Tekan terus sampai botolnya keras dan padat penuh — itulah ecobrick.'
      ],
      nilai: 'Ecobrick yang sudah jadi bisa dirangkai jadi kursi, meja, atau pot tanaman.'
    },

    /* ---------- Kertas & kardus ---------- */
    {
      kategori: 'kertas', emoji: '📦', ikon: 'jual',
      judul: 'Kardus & kertas kering: jual ke loak',
      kenapa: 'Kardus dan kertas kering termasuk sampah bernilai tinggi — asal disimpan rapi dan kering, pasti laku dijual.',
      cara: [
        'Simpan kardus dan kertas di tempat kering, jangan sampai kena hujan.',
        'Lipat rapi dan ikat jadi satu supaya mudah ditimbang.',
        'Setor ke pengepul loak terdekat.'
      ],
      nilai: 'Kardus/kertas yang basah nilainya turun jauh — menjaganya tetap kering saja sudah menaikkan harganya.'
    },
    {
      kategori: 'kertas', emoji: '✏️', ikon: 'pakai-ulang',
      judul: 'Pakai ulang kertas satu sisi',
      kenapa: 'Kertas yang baru kepakai satu sisi sebenarnya masih separuh kosong — sayang kalau langsung dibuang.',
      cara: [
        'Sisihkan kertas bekas satu sisi di satu tumpukan khusus.',
        'Pakai untuk corat-coret, catatan belanja, atau latihan PR anak.',
        'Baru dibuang/dijual kalau kedua sisinya sudah terpakai penuh.'
      ],
      nilai: 'Hemat beli buku tulis baru.'
    },
    {
      kategori: 'kertas', emoji: '🍂', ikon: 'kompos',
      judul: 'Kertas kotor/berminyak → kompos',
      kenapa: 'Kertas nasi, tisu bekas, dan kardus berminyak tidak laku dijual dan tidak bisa didaur ulang pabrik.',
      cara: [
        'Pastikan tidak ada lapisan plastik/laminasi mengkilap pada kertasnya.',
        'Sobek jadi potongan kecil.',
        'Campurkan ke tumpukan kompos organik supaya ikut melapuk.'
      ]
    },

    /* ---------- Kaca & logam ---------- */
    {
      kategori: 'kaca', emoji: '🫙', ikon: 'pakai-ulang',
      judul: 'Botol & toples kaca: pakai ulang',
      kenapa: 'Wadah kaca itu kuat dan tahan lama — jauh lebih awet daripada wadah plastik sekali pakai.',
      cara: [
        'Cuci bersih botol kecap, toples selai, atau botol kaca lain.',
        'Pakai lagi untuk menyimpan bumbu, benih, minyak, atau eco-enzyme.',
        'Kalau sudah terlalu banyak, sisihkan yang tidak terpakai untuk dijual.'
      ],
      nilai: 'Gratis pengganti wadah plastik, dan bisa dipakai bertahun-tahun.'
    },
    {
      kategori: 'kaca', emoji: '🥫', ikon: 'jual',
      judul: 'Kaleng & logam bekas bernilai jual',
      kenapa: 'Logam termasuk sampah yang paling dicari pengepul dan hampir selalu bisa didaur ulang.',
      cara: [
        'Kumpulkan kaleng susu, kaleng cat kosong, dan besi tua di satu tempat.',
        'Pisahkan dari sampah lain supaya tidak berkarat bercampur.',
        'Setor ke pengepul logam/besi tua.'
      ],
      nilai: 'Harga logam biasanya lebih tinggi dibanding sampah lain — lumayan buat tambahan uang belanja.'
    },
    {
      kategori: 'kaca', emoji: '🧤', ikon: 'hati-hati',
      judul: 'Hati-hati dengan pecahan kaca',
      kenapa: 'Beling atau kaca pecah bisa melukai petugas sampah, anak-anak, atau diri sendiri kalau dibuang sembarangan.',
      cara: [
        'Jangan pernah membuang pecahan kaca begitu saja ke tempat sampah biasa.',
        'Bungkus rapat dengan koran atau kardus tebal.',
        'Tulis "AWAS KACA" di bungkusnya, baru dibuang.'
      ]
    },

    /* ---------- B3 / berbahaya ---------- */
    {
      kategori: 'b3', emoji: '🔋', ikon: 'b3-racun',
      judul: 'Baterai bekas: kumpulkan terpisah',
      kenapa: 'Baterai mengandung logam berat yang bisa meracuni tanah dan sumur kalau dibuang sembarangan.',
      cara: [
        'Sediakan satu wadah tertutup khusus baterai bekas (remote, jam, senter).',
        'Jangan dibuang ke tanah, sungai, atau tempat sampah biasa.',
        'Serahkan ke titik pengumpulan B3 atau bank sampah.'
      ]
    },
    {
      kategori: 'b3', emoji: '💡', ikon: 'b3-racun',
      judul: 'Lampu bekas: jangan dipecah',
      kenapa: 'Lampu neon/TL dan bohlam hemat energi mengandung sedikit merkuri — uapnya berbahaya kalau lampunya remuk di dalam rumah.',
      cara: [
        'Bungkus lampu bekas utuh dengan kertas atau kardus tebal, jangan sampai pecah.',
        'Simpan di tempat aman, jauh dari jangkauan anak-anak.',
        'Setor ke titik pengumpulan khusus, bukan tempat sampah biasa.'
      ]
    },
    {
      kategori: 'b3', emoji: '💊', ikon: 'b3-racun',
      judul: 'Obat kadaluarsa: rusakkan dulu',
      kenapa: 'Obat yang dibuang ke WC atau sungai begitu saja bisa mencemari air yang dipakai banyak orang.',
      cara: [
        'Keluarkan obat dari kemasannya.',
        'Hancurkan atau larutkan, lalu campur dengan ampas kopi atau tanah supaya tidak menarik perhatian.',
        'Masukkan ke wadah tertutup sebelum dibuang; gunting kemasannya agar tidak disalahgunakan.'
      ]
    },
    {
      kategori: 'b3', emoji: '🛢️', ikon: 'b3-racun',
      judul: 'Oli bekas: jangan siram ke tanah',
      kenapa: 'Satu liter oli bekas saja bisa mencemari sumber air yang sangat luas kalau meresap ke tanah.',
      cara: [
        'Tampung oli bekas di jerigen tertutup rapat, jangan disiram ke tanah/selokan.',
        'Bawa ke bengkel langganan atau pengepul oli.',
        'Tanyakan dulu — banyak bengkel yang justru mau membelinya.'
      ],
      nilai: 'Oli bekas termasuk yang dibeli, bukan cuma diterima gratis.'
    },
    {
      kategori: 'b3', emoji: '🧴', ikon: 'b3-racun',
      judul: 'Kemasan pestisida & pupuk kimia',
      kenapa: 'Sisa pestisida yang menempel di kemasan tetap beracun, dan kemasannya berbahaya kalau dipakai ulang untuk air minum atau makanan.',
      cara: [
        'Bilas kemasan tiga kali; air bilasannya disiramkan ke lahan (bukan ke sungai).',
        'Lubangi kemasan supaya benar-benar tidak bisa dipakai ulang.',
        'Kubur jauh dari sumur dan aliran air.',
        'Jangan pernah pakai bekas kemasannya untuk menyimpan air minum atau makanan.'
      ]
    },
    {
      kategori: 'b3', emoji: '📱', ikon: 'stop-bakar',
      judul: 'Elektronik rusak: jangan dibakar',
      kenapa: 'HP rusak, charger, remote, dan kabel mengandung bahan berharga sekaligus berbahaya — membakarnya melepas asap beracun.',
      cara: [
        'Jangan pernah membakar elektronik rusak.',
        'Kumpulkan di satu tempat, terpisah dari sampah lain.',
        'Serahkan ke pengepul elektronik atau bank sampah.'
      ],
      nilai: 'Beberapa komponen di dalamnya justru laku dijual ke pengepul elektronik.'
    },

    /* ---------- Residu ---------- */
    {
      kategori: 'residu', emoji: '👶', ikon: 'bungkus',
      judul: 'Popok & pembalut: bungkus rapat',
      kenapa: 'Popok dan pembalut bekas tidak bisa didaur ulang maupun dikompos, dan bisa menyebarkan bau serta kuman kalau dibiarkan terbuka.',
      cara: [
        'Bungkus rapat setiap kali sebelum dibuang.',
        'Buang ke tempat sampah residu, bukan dicampur ke organik.',
        'Kalau memungkinkan, coba popok/kain cuci ulang untuk mengurangi jumlahnya.'
      ]
    },
    {
      kategori: 'residu', emoji: '🚭', ikon: 'bungkus',
      judul: 'Puntung rokok & styrofoam',
      kenapa: 'Puntung rokok dan styrofoam sulit terurai bertahun-tahun dan tidak ada yang mau membelinya.',
      cara: [
        'Jangan buang ke selokan, kebun, atau sembarang tempat.',
        'Kumpulkan di tempat sampah residu.',
        'Cara terbaik: kurangi pemakaiannya sejak awal.'
      ]
    },
    {
      kategori: 'residu', emoji: '♻️', ikon: 'pilah',
      judul: 'Prinsipnya: pilah, kurangi, olah',
      kenapa: 'Kalau langkah-langkah ini dijalankan berurutan, sampah yang benar-benar terbuang sia-sia (residu) jadi sedikit sekali.',
      cara: [
        'Kurangi sampah sejak awal — bawa tas sendiri, tolak kemasan berlebih.',
        'Pakai ulang barang yang masih bisa dipakai.',
        'Jual/daur ulang yang bernilai — plastik, kertas, kaca, logam.',
        'Olah yang organik jadi kompos atau pakan ternak.'
      ]
    }
  ];

  /* Penjelasan tiap JENIS sampah (definisi/ciri/contoh) — beda dari
     Tips Kelola Sampah di bawahnya yang isinya CARA menangani. */
  var INFO_JENIS = {
    organik: {
      definisi: 'Sampah yang berasal dari makhluk hidup (tumbuhan atau hewan) dan bisa membusuk/terurai sendiri secara alami.',
      ciri: [
        'Mudah membusuk dan berbau kalau dibiarkan lama.',
        'Berasal dari sisa makanan, tumbuhan, atau hewan.',
        'Bisa diolah jadi kompos, pakan ternak, atau eco-enzyme.'
      ],
      contoh: ['Sisa sayur & kulit buah', 'Ampas kopi/teh', 'Nasi basi', 'Daun & ranting kering', 'Sisa ikan/tulang', 'Kotoran ternak']
    },
    plastik: {
      definisi: 'Sampah berbahan dasar plastik (polimer sintetis) yang tidak bisa membusuk dan butuh ratusan tahun untuk terurai sendiri.',
      ciri: [
        'Ringan, licin, tidak menyerap air.',
        'Tidak membusuk — kalau dibakar melepas asap beracun.',
        'Sebagian punya nilai jual kalau bersih (botol, gelas plastik).'
      ],
      contoh: ['Kantong kresek', 'Botol & gelas plastik', 'Bungkus sachet mi/kopi', 'Sedotan', 'Kemasan sabun/sampo', 'Mainan/ember plastik rusak']
    },
    kertas: {
      definisi: 'Sampah berbahan dasar serat kayu/kertas. Bisa didaur ulang selama tidak basah, berminyak, atau berlapis plastik mengkilap.',
      ciri: [
        'Mudah sobek dan menyerap air.',
        'Yang kering & bersih bernilai jual tinggi.',
        'Yang kotor/berminyak sebaiknya masuk kompos, bukan dijual.'
      ],
      contoh: ['Kardus bekas', 'Koran & majalah', 'Buku tulis bekas', 'Kertas HVS', 'Kantong kertas', 'Kertas nasi/tisu (kotor → kompos)']
    },
    kaca: {
      definisi: 'Sampah dari bahan kaca atau berbagai jenis logam. Umumnya tidak membusuk, tapi bisa didaur ulang berkali-kali tanpa kehilangan kualitas.',
      ciri: [
        'Berat dan keras; kaca mudah pecah dan tajam.',
        'Hampir selalu punya nilai jual ke pengepul.',
        'Pecahan kaca perlu dibungkus rapat sebelum dibuang.'
      ],
      contoh: ['Botol kecap/sirup', 'Toples selai', 'Pecahan kaca jendela', 'Kaleng susu/makanan', 'Besi tua & paku bekas', 'Panci/wajan rusak']
    },
    b3: {
      definisi: 'Bahan Berbahaya dan Beracun — sampah yang mengandung zat yang bisa meracuni tanah, air, dan tubuh manusia kalau salah dibuang.',
      ciri: [
        'TIDAK boleh dicampur sampah biasa, apalagi dibakar.',
        'Perlu wadah tertutup dan penanganan khusus.',
        'Diserahkan ke titik pengumpulan B3 atau bank sampah, bukan tempat sampah rumah.'
      ],
      contoh: ['Baterai bekas', 'Lampu neon/bohlam bekas', 'Obat kadaluarsa', 'Oli bekas kendaraan', 'Kemasan pestisida/pupuk kimia', 'Aki & elektronik rusak']
    },
    residu: {
      definisi: 'Sampah sisa yang sudah tidak bisa dipilah lagi — bukan organik, tidak bisa didaur ulang, dan tidak punya nilai jual.',
      ciri: [
        'Biasanya campuran bahan atau terlalu kotor untuk dipisah.',
        'Jumlahnya seharusnya paling sedikit kalau pemilahan sudah dilakukan dengan baik.',
        'Tetap harus dibuang rapi ke tempat sampah, bukan dibakar/dibuang sembarangan.'
      ],
      contoh: ['Popok & pembalut bekas', 'Puntung rokok', 'Styrofoam kotor', 'Tisu bekas', 'Plastik sangat kotor', 'Sisa sapuan/debu']
    }
  };

  var wadahInfo = document.getElementById('info-jenis-sampah');
  if (wadahInfo) {
    wadahInfo.innerHTML = KATEGORI.map(function (kat) {
      var info = INFO_JENIS[kat.id];
      var ciriHtml = info.ciri.map(function (c) { return '<li>' + c + '</li>'; }).join('');
      var contohHtml = info.contoh.map(function (c) { return '<li>' + c + '</li>'; }).join('');
      return (
        '<div class="kartu kartu-tip">' +
          '<button type="button" class="tip-kepala" aria-expanded="false">' +
            '<span class="tip-emoji">' + kat.emoji + '</span>' +
            '<h4>' + kat.label + '</h4>' +
            svgPanah() +
          '</button>' +
          '<div class="tip-badan">' +
            '<div class="tip-badan-isi">' +
              '<p>' + info.definisi + '</p>' +
              '<p class="tip-label">Ciri-ciri</p>' +
              '<ul class="tip-langkah">' + ciriHtml + '</ul>' +
              '<p class="tip-label">Contoh sehari-hari</p>' +
              '<ul class="tip-langkah">' + contohHtml + '</ul>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    wadahInfo.addEventListener('click', function (e) {
      var kepala = e.target.closest('.tip-kepala');
      if (!kepala) return;
      var kartu = kepala.closest('.kartu-tip');
      var terbuka = kartu.classList.toggle('terbuka');
      kepala.setAttribute('aria-expanded', terbuka);
    });
  }

  var wadah = document.getElementById('daftar-sampah');
  if (!wadah) return;

  var kategoriAktif = null; /* null = tampil kisi kategori */

  function svgPanah() {
    return '<svg class="tip-panah" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9 L12 15 L18 9" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  function htmlKartuTip(t) {
    var indeksAsli = TIPS.indexOf(t);
    var langkahHtml = t.cara.map(function (langkah) { return '<li>' + langkah + '</li>'; }).join('');
    var nilaiHtml = t.nilai
      ? '<p class="tip-label">Nilai / manfaat</p><p>' + t.nilai + '</p>'
      : '';
    return (
      '<div class="kartu kartu-tip">' +
        '<button type="button" class="tip-kepala" aria-expanded="false">' +
          '<span class="tip-emoji">' + t.emoji + '</span>' +
          '<h4>' + t.judul + '</h4>' +
          svgPanah() +
        '</button>' +
        '<div class="tip-badan">' +
          '<div class="tip-badan-isi">' +
            '<div class="tip-ilustrasi">' + svgIlustrasi(t.ikon) + '</div>' +
            '<p class="tip-label">Kenapa penting</p>' +
            '<p>' + t.kenapa + '</p>' +
            '<p class="tip-label">Cara melakukannya</p>' +
            '<ol class="tip-langkah">' + langkahHtml + '</ol>' +
            nilaiHtml +
            '<span class="tip-tag">' + NAMA_KATEGORI[t.kategori] + '</span>' +
            '<div class="tip-aksi">' +
              '<button type="button" class="tombol tombol-kedua tombol-kecil aksi-bagikan-tip" data-indeks="' + indeksAsli + '">' +
                (window.GamaBagikan ? window.GamaBagikan.IKON : '') + ' Bagikan tips ini' +
              '</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  /* ---------- Kisi kategori (tampilan awal) ---------- */
  function gambarKisi() {
    kategoriAktif = null;
    var html = '<div class="kisi-kategori">' + KATEGORI.map(function (kat) {
      return (
        '<button type="button" class="kartu-fitur kotak-kategori" data-kategori="' + kat.id + '">' +
          '<span class="kartu-fitur-ikon ikon-latar-' + kat.warna + ' kotak-kategori-emoji">' + kat.emoji + '</span>' +
          '<span class="kartu-fitur-teks"><strong>' + kat.label + '</strong></span>' +
        '</button>'
      );
    }).join('') + '</div>';
    wadah.innerHTML = html;
  }

  /* ---------- Daftar tips satu kategori saja ---------- */
  function gambarKategori(kategoriId) {
    var kat = KATEGORI.filter(function (k) { return k.id === kategoriId; })[0];
    if (!kat) { gambarKisi(); return; }
    kategoriAktif = kategoriId;
    var cocok = TIPS.filter(function (t) { return t.kategori === kategoriId; });
    var html =
      '<div class="baris-kembali-kategori">' +
        '<button type="button" class="tombol tombol-kedua tombol-kecil" id="kembali-kategori">← Semua Kategori</button>' +
      '</div>' +
      '<h3 class="judul-musim judul-sampah">' + kat.judul + '</h3>' +
      cocok.map(htmlKartuTip).join('');
    wadah.innerHTML = html;
  }

  /* ---------- Semua kategori sekaligus, khusus mode cetak ---------- */
  function gambarSemuaUntukCetak() {
    var html = KATEGORI.map(function (kat) {
      var cocok = TIPS.filter(function (t) { return t.kategori === kat.id; });
      if (!cocok.length) return '';
      return '<h3 class="judul-musim judul-sampah">' + kat.judul + '</h3>' + cocok.map(htmlKartuTip).join('');
    }).join('');
    wadah.innerHTML = html;
  }

  wadah.addEventListener('click', function (e) {
    var kotakKategori = e.target.closest('.kotak-kategori');
    if (kotakKategori) {
      gambarKategori(kotakKategori.dataset.kategori);
      return;
    }
    var tombolKembali = e.target.closest('#kembali-kategori');
    if (tombolKembali) {
      gambarKisi();
      return;
    }
    var tombolBagi = e.target.closest('.aksi-bagikan-tip');
    if (tombolBagi && window.GamaBagikan) {
      var t = TIPS[parseInt(tombolBagi.dataset.indeks, 10)];
      if (t) {
        var teksBagikan = t.judul + '\n\n' +
          'Kenapa penting: ' + t.kenapa + '\n\n' +
          'Cara melakukannya:\n' + t.cara.map(function (l, i) { return (i + 1) + '. ' + l; }).join('\n') +
          (t.nilai ? '\n\nNilai / manfaat: ' + t.nilai : '') +
          '\n\n(Tips mengelola sampah ' + NAMA_KATEGORI[t.kategori] + ')';
        window.GamaBagikan.bagikan('Tips Kelola Sampah: ' + t.judul, teksBagikan.replace(/<[^>]+>/g, ''));
      }
      return;
    }
    var kepala = e.target.closest('.tip-kepala');
    if (!kepala) return;
    var kartu = kepala.closest('.kartu-tip');
    var terbuka = kartu.classList.toggle('terbuka');
    kepala.setAttribute('aria-expanded', terbuka);
  });

  var tombolCetak = document.getElementById('tombol-cetak-sampah');
  if (tombolCetak) {
    tombolCetak.addEventListener('click', function () {
      var kategoriSebelumnya = kategoriAktif;
      gambarSemuaUntukCetak();
      window.print();
      if (kategoriSebelumnya) { gambarKategori(kategoriSebelumnya); } else { gambarKisi(); }
    });
  }

  gambarKisi();
})();
