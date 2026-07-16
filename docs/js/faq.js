/* ============================================================
   faq.js — FAQ Perubahan Iklim (fitur 13)
   Pertanyaan warga sehari-hari, dijawab singkat tanpa istilah
   teknis. Statis → sepenuhnya offline. Memakai pola accordion
   yang sama dengan Tips Tani.
   ============================================================ */
(function () {
  'use strict';

  var FAQ = [
    {
      emoji: '🌦',
      tanya: 'Kenapa cuaca sekarang susah ditebak?',
      jawab: 'Bumi makin panas karena gas buangan (CO₂) dari kendaraan, listrik, dan pembakaran menumpuk di udara seperti selimut. Panas berlebih ini mengacaukan pola angin dan hujan — makanya musim hujan bisa telat, kemarau bisa lebih panjang, dan hujan deras datang tiba-tiba.'
    },
    {
      emoji: '🌍',
      tanya: 'Apa itu perubahan iklim, dengan bahasa sederhana?',
      jawab: 'Iklim itu "kebiasaan cuaca" selama puluhan tahun. Perubahan iklim artinya kebiasaan itu bergeser: bumi rata-rata makin panas, musim makin tidak teratur. Bedanya dengan cuaca: cuaca itu harian, iklim itu jangka panjang.'
    },
    {
      emoji: '🌽',
      tanya: 'Apa hubungannya dengan sawah dan kebun saya?',
      jawab: 'Sangat erat. Hujan yang telat membuat semai padi tadah hujan gagal, kemarau panjang mengeringkan jagung, dan hama berkembang di cuaca yang berubah-ubah. Karena itu aplikasi ini menyediakan kalender tanam dan prakiraan cuaca — supaya jadwal tanam bisa menyesuaikan.'
    },
    {
      emoji: '💧',
      tanya: 'Kenapa kita diminta hemat air, padahal sering hujan?',
      jawab: 'Hujan besar sekaligus itu airnya cepat lewat — mengalir deras lalu hilang, tidak sempat meresap. Yang penting bukan banyaknya hujan, tapi cadangan air saat kemarau. Menampung air hujan dan menghemat air sumur membuat kita siap menghadapi kemarau yang makin panjang.'
    },
    {
      emoji: '🔥',
      tanya: 'Membakar sampah dan jerami, apa salahnya?',
      jawab: 'Asapnya berisi gas yang memanaskan bumi sekaligus merusak paru-paru — apalagi bagi anak dan lansia. Padahal jerami dan sampah dapur bisa jadi kompos atau eco-enzyme yang menyuburkan tanah secara gratis. Membakar sama saja membuang pupuk.'
    },
    {
      emoji: '🍃',
      tanya: 'Saya cuma satu orang, apa pengaruhnya?',
      jawab: 'Satu keluarga yang hemat listrik, tidak membakar sampah, dan menanam pohon memang kecil dampaknya sendirian — tapi satu kampung yang melakukannya bersama itu besar. Halaman beranda aplikasi ini menjumlahkan dampak semua orang di HP ini sebagai bukti nyata.'
    },
    {
      emoji: '🌳',
      tanya: 'Kenapa menanam jati dan mete disebut membantu iklim?',
      jawab: 'Pohon menyerap CO₂ dari udara dan menyimpannya di batang serta akar selama puluhan tahun. Jati dan jambu mete cocok di lahan kering Galung Maloang: akarnya menahan longsor, hasilnya jadi tabungan keluarga, dan daunnya meneduhkan tanah.'
    },
    {
      emoji: '⚡',
      tanya: 'Hemat listrik itu hubungannya apa dengan iklim?',
      jawab: 'Sebagian besar listrik kita masih dibuat dengan membakar batu bara, yang mengeluarkan banyak CO₂. Makin hemat listrik di rumah, makin sedikit batu bara dibakar — tagihan pun ikut turun. Dua keuntungan sekaligus.'
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
          '<div class="tip-badan-isi"><p>' + f.jawab + '</p></div>' +
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
