/* ============================================================
   faq.js — FAQ Perubahan Iklim (fitur 13)
   Pertanyaan warga sehari-hari, dijawab lebih detail tapi tetap
   bahasa sederhana, dilengkapi ilustrasi SVG datar per pertanyaan.
   Statis → sepenuhnya offline. Memakai pola accordion yang sama
   dengan Tips Tani.
   ============================================================ */
(function () {
  'use strict';

  /* Ilustrasi sederhana per pertanyaan — flat, 2-3 warna dari
     palet yang sudah ada, tanpa gambar bitmap. */
  var ILUSTRASI = {
    cuaca:
      '<circle cx="32" cy="32" r="30" fill="var(--biru-pucat)"/>' +
      '<circle cx="26" cy="24" r="11" fill="var(--kuning-jagung)"/>' +
      '<path d="M16 40 Q20 30 30 32 Q34 24 44 28 Q52 30 50 40 Q52 46 44 46 H22 Q14 46 16 40 Z" fill="var(--biru-hujan)"/>',
    iklim:
      '<circle cx="32" cy="32" r="30" fill="var(--hijau-pucat)"/>' +
      '<circle cx="32" cy="32" r="18" fill="var(--biru-hujan)"/>' +
      '<path d="M20 24 Q26 20 30 26 Q24 30 20 24 Z" fill="var(--hijau-muda-jagung)"/>' +
      '<path d="M34 36 Q42 32 46 38 Q40 42 34 36 Z" fill="var(--hijau-muda-jagung)"/>' +
      '<circle cx="32" cy="32" r="24" fill="none" stroke="var(--kuning-jagung)" stroke-width="2" stroke-dasharray="4 3"/>',
    kebun:
      '<circle cx="32" cy="32" r="30" fill="var(--kuning-pucat)"/>' +
      '<path d="M14 46 H50" stroke="var(--tanah-basah)" stroke-width="3"/>' +
      '<path d="M20 46 L24 40 M30 46 L27 39 M40 46 L36 40" stroke="var(--tanah-basah)" stroke-width="2"/>' +
      '<path d="M32 44 C28 36 30 26 32 18 C34 26 36 36 32 44 Z" fill="var(--hijau-muda-jagung)"/>' +
      '<circle cx="32" cy="16" r="6" fill="var(--kuning-jagung)"/>',
    air:
      '<circle cx="32" cy="32" r="30" fill="var(--biru-pucat)"/>' +
      '<path d="M20 18 C24 26 28 30 28 36 A8 8 0 0 1 12 36 C12 30 16 26 20 18 Z" fill="var(--biru-hujan)"/>' +
      '<rect x="34" y="30" width="20" height="20" rx="3" fill="var(--tanah-basah)"/>' +
      '<rect x="34" y="30" width="20" height="6" fill="var(--hijau-muda-jagung)"/>',
    'stop-bakar':
      '<circle cx="32" cy="32" r="30" fill="var(--hijau-pucat)"/>' +
      '<path d="M32 12 C40 20 40 28 34 32 C38 34 36 42 30 44 C24 42 22 34 26 30 C22 28 24 18 32 12 Z" fill="var(--terracotta)"/>' +
      '<circle cx="32" cy="32" r="23" fill="none" stroke="var(--hijau-jati)" stroke-width="4"/>' +
      '<line x1="15" y1="49" x2="49" y2="15" stroke="var(--hijau-jati)" stroke-width="4"/>',
    bersama:
      '<circle cx="32" cy="32" r="30" fill="var(--hijau-pucat)"/>' +
      '<path d="M16 40 C20 34 26 34 28 38 C24 42 18 42 16 40 Z" fill="var(--hijau-muda-jagung)"/>' +
      '<path d="M36 40 C40 34 46 34 48 38 C44 42 38 42 36 40 Z" fill="var(--hijau-muda-jagung)"/>' +
      '<path d="M26 24 C30 16 38 16 40 22 C34 28 28 28 26 24 Z" fill="var(--kuning-jagung)"/>' +
      '<path d="M20 46 Q32 52 44 46" stroke="var(--tanah-basah)" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
    pohon:
      '<circle cx="32" cy="32" r="30" fill="var(--hijau-pucat)"/>' +
      '<rect x="28" y="36" width="8" height="18" fill="var(--tanah-basah)"/>' +
      '<circle cx="32" cy="26" r="16" fill="var(--hijau-muda-jagung)"/>' +
      '<path d="M32 10 V16 M20 30 Q14 28 12 32 M44 30 Q50 28 52 32" stroke="var(--hijau-jati)" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
    listrik:
      '<circle cx="32" cy="32" r="30" fill="var(--kuning-pucat)"/>' +
      '<circle cx="26" cy="26" r="12" fill="var(--kuning-jagung)"/>' +
      '<rect x="22" y="38" width="8" height="6" fill="var(--tanah-basah)"/>' +
      '<path d="M44 44 V30 Q44 24 50 24 V44 Z" fill="var(--biru-hujan)"/>' +
      '<circle cx="47" cy="18" r="4" fill="var(--teks-samar)" opacity="0.5"/>'
  };

  function svgIlustrasi(kunci) {
    var isi = ILUSTRASI[kunci] || ILUSTRASI.iklim;
    return '<svg class="tip-ilustrasi-img" viewBox="0 0 64 64" aria-hidden="true">' + isi + '</svg>';
  }

  var FAQ = [
    {
      emoji: '🌦', ikon: 'cuaca',
      tanya: 'Kenapa cuaca sekarang susah ditebak?',
      jawab: 'Setiap hari kita menghasilkan gas buangan (terutama CO₂) dari kendaraan, pemakaian listrik, dan pembakaran, termasuk bakar sampah dan jerami. Gas ini menumpuk di udara seperti selimut yang menahan panas matahari, jadi bumi makin lama makin panas. Panas berlebih ini mengacaukan pola angin dan awan yang biasanya teratur, sehingga musim hujan bisa telat datang, kemarau bisa lebih panjang dari biasanya, dan hujan deras kadang datang tiba-tiba di waktu yang tidak terduga. Itu sebabnya perkiraan cuaca dan musim tanam yang dulu bisa diandalkan, sekarang jadi lebih sulit ditebak.'
    },
    {
      emoji: '🌍', ikon: 'iklim',
      tanya: 'Apa itu perubahan iklim, dengan bahasa sederhana?',
      jawab: 'Cuaca itu keadaan hari ini: panas atau hujan, mendung atau cerah, dan bisa berubah dalam hitungan jam. Iklim itu berbeda, iklim adalah "kebiasaan cuaca" suatu tempat selama puluhan tahun, misalnya "Parepare biasanya kemarau bulan Juni sampai September". Perubahan iklim artinya kebiasaan jangka panjang itu bergeser: suhu rata-rata bumi makin naik, musim hujan dan kemarau jadi tidak lagi mengikuti pola lama. Jadi kalau cuaca hari ini panas, itu belum tentu tanda perubahan iklim, tapi kalau pola musim selama bertahun-tahun makin kacau, itu baru tanda perubahan iklim sedang terjadi.'
    },
    {
      emoji: '🌽', ikon: 'kebun',
      tanya: 'Apa hubungannya dengan sawah dan kebun saya?',
      jawab: 'Sangat erat, bahkan langsung terasa di kebun dan sawah kita sehari-hari. Hujan yang telat datang bisa membuat semai padi tadah hujan gagal tumbuh karena tanah keburu kering. Kemarau yang lebih panjang dari biasanya membuat jagung dan tanaman lain kekurangan air di masa pertumbuhannya yang paling penting. Cuaca yang naik turun tidak menentu juga membuat hama dan penyakit tanaman lebih mudah berkembang biak. Karena itu aplikasi ini menyediakan Kalender Tanam dan Perkiraan Cuaca, supaya jadwal tanam, pupuk, dan panen bisa disesuaikan dengan kondisi cuaca yang sebenarnya, bukan hanya mengandalkan kebiasaan lama yang sekarang sudah bergeser.'
    },
    {
      emoji: '💧', ikon: 'air',
      tanya: 'Kenapa kita diminta hemat air, padahal sering hujan?',
      jawab: 'Ini memang kedengarannya aneh, tapi masuk akal kalau dipikir lagi. Hujan yang turun sekaligus dalam jumlah besar itu airnya justru cepat lewat: mengalir deras di permukaan tanah lalu hilang ke sungai, tidak sempat meresap ke dalam tanah untuk jadi cadangan air tanah dan sumur. Jadi yang penting bukan seberapa sering atau seberapa deras hujannya, tapi seberapa banyak cadangan air yang benar-benar tersimpan untuk dipakai saat kemarau tiba. Dengan menampung air hujan (misalnya pakai bak atau drum penampung) dan tetap berhemat memakai air sumur sehari-hari, kita jadi lebih siap menghadapi musim kemarau yang sekarang cenderung makin panjang dan makin kering.'
    },
    {
      emoji: '🔥', ikon: 'stop-bakar',
      tanya: 'Membakar sampah dan jerami, apa salahnya?',
      jawab: 'Asap dari bakar sampah dan jerami mengandung gas yang ikut memanaskan bumi, dan sekaligus mengandung partikel yang merusak paru-paru kalau terhirup, apalagi bagi anak-anak, lansia, dan orang dengan asma. Padahal jerami, daun kering, dan sampah dapur sebenarnya bahan yang berharga: kalau diolah jadi kompos atau eco-enzyme, semua itu bisa menyuburkan tanah kebun dan sawah secara gratis. Jadi membakarnya sama saja dengan membuang pupuk gratis sekaligus mengotori udara yang kita hirup sendiri. Coba lihat menu Tips Kelola Sampah dan Eco-Enzyme di aplikasi ini untuk cara mengolahnya.'
    },
    {
      emoji: '🍃', ikon: 'bersama',
      tanya: 'Saya cuma satu orang, apa pengaruhnya?',
      jawab: 'Memang benar, satu keluarga yang hemat listrik, tidak membakar sampah, dan menanam pohon, dampaknya kelihatan kecil kalau dihitung sendirian. Tapi bayangkan kalau satu kelurahan, ratusan rumah tangga, melakukan hal yang sama setiap hari, jumlahnya jadi sangat besar. Ibaratnya satu tetes air memang kecil, tapi ribuan tetes bisa mengisi satu ember penuh. Halaman Beranda aplikasi ini menjumlahkan dampak semua orang yang memakai aplikasi ini di Kelurahan Galung Maloang, supaya usaha kecil setiap rumah tangga bisa terlihat sebagai bukti nyata yang besar bersama-sama.'
    },
    {
      emoji: '🌳', ikon: 'pohon',
      tanya: 'Kenapa menanam jati dan mete disebut membantu iklim?',
      jawab: 'Setiap pohon yang tumbuh menyerap gas CO₂ dari udara lewat daunnya, lalu menyimpannya di batang, cabang, dan akar selama puluhan tahun selama pohon itu masih hidup. Makin banyak dan makin besar pohonnya, makin banyak pula CO₂ yang tersimpan dan tidak lagi memanaskan bumi. Jati dan jambu mete dipilih karena cocok dengan lahan kering di Galung Maloang: akarnya yang kuat membantu menahan tanah supaya tidak longsor saat hujan deras, hasil kayu dan bijinya bisa jadi tabungan keluarga bertahun-tahun ke depan, dan daunnya yang rimbun meneduhkan tanah supaya tidak cepat kering saat kemarau.'
    },
    {
      emoji: '⚡', ikon: 'listrik',
      tanya: 'Hemat listrik itu hubungannya apa dengan iklim?',
      jawab: 'Sebagian besar listrik PLN di Indonesia, termasuk yang mengalir ke rumah kita, masih dibuat dengan cara membakar batu bara di pembangkit listrik, dan proses pembakaran itu mengeluarkan banyak gas CO₂ ke udara. Jadi setiap kali kita memakai listrik, sebenarnya ada jejak pembakaran batu bara di baliknya, walau kita tidak melihatnya secara langsung. Makin hemat listrik di rumah, misalnya mematikan lampu yang tidak dipakai atau mencabut colokan yang tidak perlu, makin sedikit batu bara yang perlu dibakar di pembangkit. Hasilnya dua keuntungan sekaligus: emisi CO₂ berkurang, dan tagihan listrik bulanan pun ikut turun.'
    }
  ];

  var wadah = document.getElementById('daftar-faq');
  if (!wadah) return;

  wadah.innerHTML = FAQ.map(function (f, i) {
    var terbuka = i === 0;
    return (
      '<div class="kartu kartu-tip' + (terbuka ? ' terbuka' : '') + '">' +
        '<button type="button" class="tip-kepala" aria-expanded="' + terbuka + '">' +
          '<span class="tip-emoji">' + f.emoji + '</span>' +
          '<h4>' + f.tanya + '</h4>' +
          '<svg class="tip-panah" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9 L12 15 L18 9" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</button>' +
        '<div class="tip-badan">' +
          '<div class="tip-badan-isi">' +
            '<div class="tip-ilustrasi">' + svgIlustrasi(f.ikon) + '</div>' +
            '<p>' + f.jawab + '</p>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }).join('');

  wadah.addEventListener('click', function (e) {
    var kepala = e.target.closest('.tip-kepala');
    if (!kepala) return;
    var kartu = kepala.closest('.kartu-tip');
    var terbuka = kartu.classList.toggle('terbuka');
    kepala.setAttribute('aria-expanded', terbuka);
  });
})();
