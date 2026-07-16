/* ============================================================
   sampah.js — Tips Kelola Sampah (menggantikan Tips Pertanian)
   Panduan menangani SEMUA jenis sampah rumah tangga & kebun,
   dikelompokkan per jenis. Data statis → sepenuhnya offline.
   Nada hangat, bahasa sehari-hari, cocok untuk Galung Maloang.
   ============================================================ */
(function () {
  'use strict';

  /* Kelompok = jenis sampah (jadi judul bagian sekaligus filter chip) */
  var KATEGORI = [
    { id: 'organik', judul: '🍂 Sampah Organik (sisa dapur & kebun)' },
    { id: 'plastik', judul: '🛍️ Sampah Plastik' },
    { id: 'kertas',  judul: '📦 Kertas & Kardus' },
    { id: 'kaca',    judul: '🥫 Kaca & Logam' },
    { id: 'b3',      judul: '⚠️ Sampah Berbahaya (B3)' },
    { id: 'residu',  judul: '🗑️ Residu & Lain-lain' }
  ];

  var NAMA_KATEGORI = {
    organik: 'Organik',
    plastik: 'Plastik',
    kertas: 'Kertas & Kardus',
    kaca: 'Kaca & Logam',
    b3: 'Berbahaya (B3)',
    residu: 'Residu'
  };

  var TIPS = [
    /* ---------- Organik ---------- */
    {
      kategori: 'organik', emoji: '🥬',
      judul: 'Pisahkan sisa dapur sejak dari dapur',
      isi: 'Sediakan satu wadah khusus untuk kulit buah, sisa sayur, ampas kopi, dan cangkang telur. Kalau sudah terpisah dari awal, sampah organik gampang diolah dan tidak mengotori sampah lain yang bisa dijual.'
    },
    {
      kategori: 'organik', emoji: '🧪',
      judul: 'Ubah jadi eco-enzyme atau kompos',
      isi: 'Kulit buah dan sisa sayur mentah paling bagus dijadikan <b>eco-enzyme</b> (lihat menu Eco-Enzyme) atau dikomposkan. Hasilnya jadi pupuk gratis untuk jagung, sayur, dan tanaman pekarangan — sampah berkurang, tanah makin subur.'
    },
    {
      kategori: 'organik', emoji: '🕳️',
      judul: 'Buat lubang biopori atau rorak untuk daun',
      isi: 'Daun kering dan sampah kebun bisa ditimbun di lubang biopori atau parit kecil (rorak) di antara tanaman. Selain jadi pupuk saat lapuk, lubangnya membantu air hujan meresap sebagai cadangan kemarau.'
    },
    {
      kategori: 'organik', emoji: '🐔',
      judul: 'Sisa sayur untuk pakan ternak',
      isi: 'Sisa sayuran dan nasi yang masih layak bisa diberikan ke ayam, bebek, atau kambing. Hemat pakan sekaligus mengurangi sampah — tapi jangan beri makanan basi atau berjamur.'
    },
    {
      kategori: 'organik', emoji: '🚫',
      judul: 'Jangan bakar sampah kebun',
      isi: 'Membakar daun dan brangkasan mengeluarkan asap yang memanaskan bumi dan mengganggu pernapasan. Padahal kalau dibiarkan melapuk atau dijadikan mulsa, ia mengembalikan kesuburan ke tanah secara cuma-cuma.'
    },

    /* ---------- Plastik ---------- */
    {
      kategori: 'plastik', emoji: '🧺',
      judul: 'Kurangi kantong plastik dari sumbernya',
      isi: 'Bawa keranjang atau tas kain saat ke pasar, dan tolak kantong plastik untuk belanjaan kecil. Cara termurah menangani sampah plastik adalah tidak menghasilkannya sejak awal.'
    },
    {
      kategori: 'plastik', emoji: '🍶',
      judul: 'Botol & gelas plastik: kumpulkan lalu jual',
      isi: 'Botol air mineral, gelas plastik, dan jerigen bersih punya nilai jual. Bilas, keringkan, kumpulkan, lalu setor ke pengepul atau bank sampah. Uang tambahan sekaligus sampah berkurang.'
    },
    {
      kategori: 'plastik', emoji: '🔥',
      judul: 'JANGAN bakar plastik',
      isi: 'Asap plastik yang dibakar mengandung racun berbahaya (dioksin) yang merusak paru-paru dan mencemari udara kampung. Sekali pun repot, jangan pernah membakar plastik — kumpulkan atau setor ke bank sampah.'
    },
    {
      kategori: 'plastik', emoji: '🧱',
      judul: 'Sachet & plastik kotor jadi ecobrick',
      isi: 'Bungkus kopi, mi instan, dan plastik kecil kotor sulit dijual. Cuci, keringkan, lalu padatkan ke dalam botol plastik sampai keras (ecobrick) — bisa dijadikan bahan kursi, meja, atau pot. Ini menahan plastik agar tak berserakan.'
    },

    /* ---------- Kertas & kardus ---------- */
    {
      kategori: 'kertas', emoji: '📦',
      judul: 'Kardus & kertas kering: jual ke loak',
      isi: 'Kardus, koran, kertas HVS, dan buku tulis bekas laku dijual ke pengepul loak. Simpan di tempat kering supaya tidak lembap dan tetap bernilai. Ikat rapi biar mudah ditimbang.'
    },
    {
      kategori: 'kertas', emoji: '✏️',
      judul: 'Pakai ulang kertas satu sisi',
      isi: 'Kertas yang baru terpakai satu sisi masih bisa dipakai untuk corat-coret, catatan, atau PR anak. Menghemat pengeluaran sekaligus mengurangi sampah kertas.'
    },
    {
      kategori: 'kertas', emoji: '🍂',
      judul: 'Kertas kotor/berminyak → kompos',
      isi: 'Kertas nasi, tisu bekas, atau kardus berminyak tidak bisa didaur ulang. Kalau tidak mengandung plastik/laminasi, sobek kecil dan campurkan ke kompos organik — ia ikut melapuk.'
    },

    /* ---------- Kaca & logam ---------- */
    {
      kategori: 'kaca', emoji: '🫙',
      judul: 'Botol & toples kaca: pakai ulang',
      isi: 'Botol kecap, toples selai, dan botol kaca bisa dicuci lalu dipakai lagi untuk menyimpan bumbu, benih, minyak, atau eco-enzyme. Gratis dan lebih awet daripada wadah plastik.'
    },
    {
      kategori: 'kaca', emoji: '🥫',
      judul: 'Kaleng & logam bekas bernilai jual',
      isi: 'Kaleng susu, kaleng cat kosong, dan besi tua termasuk sampah yang paling dicari pengepul. Kumpulkan terpisah dan setorkan — logam hampir selalu bisa didaur ulang.'
    },
    {
      kategori: 'kaca', emoji: '🧤',
      judul: 'Hati-hati dengan pecahan kaca',
      isi: 'Beling atau kaca pecah bisa melukai petugas sampah dan anak-anak. Bungkus rapat dengan koran atau kardus, beri tulisan "AWAS KACA", baru dibuang. Jangan dicampur begitu saja.'
    },

    /* ---------- B3 / berbahaya ---------- */
    {
      kategori: 'b3', emoji: '🔋',
      judul: 'Baterai bekas: kumpulkan terpisah',
      isi: 'Baterai remote, jam, dan senter mengandung logam berat yang meracuni tanah dan sumur bila dibuang sembarangan. Kumpulkan dalam wadah tertutup dan serahkan ke titik pengumpulan B3 atau bank sampah — jangan dibuang ke tanah/sungai.'
    },
    {
      kategori: 'b3', emoji: '💡',
      judul: 'Lampu bekas: jangan dipecah',
      isi: 'Lampu neon/TL dan bohlam hemat energi mengandung sedikit merkuri. Bungkus utuh dengan kertas tebal supaya tidak pecah, lalu setor ke pengumpulan khusus. Uapnya berbahaya jika lampunya remuk di dalam rumah.'
    },
    {
      kategori: 'b3', emoji: '💊',
      judul: 'Obat kadaluarsa: rusakkan dulu',
      isi: 'Jangan buang obat ke WC atau sungai — mencemari air. Keluarkan dari kemasan, hancurkan/larutkan, campur dengan ampas kopi atau tanah, masukkan wadah tertutup, baru dibuang. Kemasannya digunting agar tak disalahgunakan.'
    },
    {
      kategori: 'b3', emoji: '🛢️',
      judul: 'Oli bekas: jangan siram ke tanah',
      isi: 'Satu liter oli bekas bisa mencemari sumber air yang luas. Tampung di jerigen tertutup dan jual ke bengkel atau pengepul oli — banyak yang menerimanya, bahkan dibeli.'
    },
    {
      kategori: 'b3', emoji: '🧴',
      judul: 'Kemasan pestisida & pupuk kimia',
      isi: 'Bilas botol/kemasan pestisida <b>tiga kali</b> (air bilasan disiramkan ke lahan, bukan ke sungai), lubangi agar tak dipakai ulang, lalu kubur jauh dari sumur dan aliran air. <b>Jangan pernah</b> pakai bekas kemasan pestisida untuk menyimpan air minum atau makanan.'
    },
    {
      kategori: 'b3', emoji: '📱',
      judul: 'Elektronik rusak: jangan dibakar',
      isi: 'HP rusak, charger, remote, dan kabel mengandung bahan berharga sekaligus berbahaya. Kumpulkan dan serahkan ke pengepul elektronik atau bank sampah. Membakarnya melepas asap beracun.'
    },

    /* ---------- Residu ---------- */
    {
      kategori: 'residu', emoji: '👶',
      judul: 'Popok & pembalut: bungkus rapat',
      isi: 'Popok dan pembalut bekas tidak bisa didaur ulang maupun dikompos. Bungkus rapat agar tidak menyebar bau dan kuman, lalu buang ke tempat sampah residu. Kurangi dengan memakai popok/kain cuci ulang bila memungkinkan.'
    },
    {
      kategori: 'residu', emoji: '🚭',
      judul: 'Puntung rokok & styrofoam',
      isi: 'Puntung rokok dan styrofoam termasuk residu yang sulit terurai dan tidak bernilai jual. Jangan dibuang ke selokan atau kebun — kumpulkan ke tempat sampah. Paling baik: kurangi pemakaiannya.'
    },
    {
      kategori: 'residu', emoji: '♻️',
      judul: 'Prinsipnya: pilah, kurangi, olah',
      isi: 'Ingat urutannya — <b>kurangi</b> sampah dari awal, <b>pakai ulang</b> yang masih bisa, <b>daur ulang / jual</b> yang bernilai, dan <b>olah</b> yang organik. Yang benar-benar tersisa (residu) sedikit saja kalau tiga langkah pertama dijalankan.'
    }
  ];

  var wadah = document.getElementById('daftar-sampah');
  var barisFilter = document.getElementById('filter-sampah');
  if (!wadah || !barisFilter) return;

  function gambar(kategori) {
    var html = '';
    KATEGORI.forEach(function (kat) {
      var cocok = TIPS.filter(function (t) {
        return t.kategori === kat.id && (kategori === 'semua' || t.kategori === kategori);
      });
      if (!cocok.length) return;
      html += '<h3 class="judul-musim judul-sampah">' + kat.judul + '</h3>';
      html += cocok.map(function (t, i) {
        var terbuka = i === 0;
        var indeksAsli = TIPS.indexOf(t);
        return (
          '<div class="kartu kartu-tip' + (terbuka ? ' terbuka' : '') + '">' +
            '<button type="button" class="tip-kepala" aria-expanded="' + terbuka + '">' +
              '<span class="tip-emoji">' + t.emoji + '</span>' +
              '<h4>' + t.judul + '</h4>' +
              '<svg class="tip-panah" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9 L12 15 L18 9" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
            '</button>' +
            '<div class="tip-badan">' +
              '<div class="tip-badan-isi">' +
                '<p>' + t.isi + '</p>' +
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
      }).join('');
    });
    wadah.innerHTML = html || '<div class="kartu kartu-tengah"><p>Tidak ada tips untuk pilihan ini.</p></div>';
  }

  wadah.addEventListener('click', function (e) {
    var tombolBagi = e.target.closest('.aksi-bagikan-tip');
    if (tombolBagi && window.GamaBagikan) {
      var t = TIPS[parseInt(tombolBagi.dataset.indeks, 10)];
      if (t) {
        window.GamaBagikan.bagikan(
          'Tips Kelola Sampah: ' + t.judul,
          t.judul + '\n\n' + t.isi.replace(/<[^>]+>/g, '') +
          '\n\n(Tips mengelola sampah ' + NAMA_KATEGORI[t.kategori] + ')'
        );
      }
      return;
    }
    var kepala = e.target.closest('.tip-kepala');
    if (!kepala) return;
    var kartu = kepala.closest('.kartu-tip');
    var terbuka = kartu.classList.toggle('terbuka');
    kepala.setAttribute('aria-expanded', terbuka);
  });

  barisFilter.addEventListener('click', function (e) {
    var chip = e.target.closest('.chip');
    if (!chip) return;
    barisFilter.querySelectorAll('.chip').forEach(function (c) {
      c.classList.toggle('aktif', c === chip);
    });
    gambar(chip.dataset.kategori);
  });

  var tombolCetak = document.getElementById('tombol-cetak-sampah');
  if (tombolCetak) {
    tombolCetak.addEventListener('click', function () { window.print(); });
  }

  gambar('semua');
})();
