/* ============================================================
   profil.js — Multi-Profil Tanpa Login (fitur 10)
   - Beberapa profil lokal per HP (anggota keluarga berbeda),
     tanpa akun/kata sandi. Data TIDAK tersinkron antar perangkat.
   - Setiap data fitur disimpan dengan kunci ber-awalan profil:
     gama_<idProfil>_<nama-data>  →  GamaProfil.kunci('jadwal')
   - Dimuat PALING AWAL supaya modul lain tinggal memakainya.
   - Ganti profil = simpan pilihan lalu muat ulang halaman
     (paling sederhana & andal untuk HP low-end).
   ============================================================ */
(function () {
  'use strict';

  var KUNCI_REGISTRI = 'gama_profil';
  var MAKS_PROFIL = 6;
  var JUMLAH_WARNA = 5;               // kelas .avatar-w0 … .avatar-w4
  /* nama-nama data milik satu profil (dipakai saat hapus/reset) */
  var DATA_PROFIL = ['riwayat_karbon', 'catatan_harian', 'progres_eco', 'jadwal', 'siklus_tahap', 'lencana', 'perjalanan'];

  function amanHtml(teks) {
    return String(teks || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------- Registri profil ---------- */
  function ambilRegistri() {
    try {
      var r = JSON.parse(localStorage.getItem(KUNCI_REGISTRI));
      if (r && r.aktif && Array.isArray(r.daftar) && r.daftar.length) return r;
    } catch (e) { /* rusak → buat baru */ }
    return null;
  }
  function simpanRegistri(r) {
    try { localStorage.setItem(KUNCI_REGISTRI, JSON.stringify(r)); } catch (e) { /* abaikan */ }
  }

  var registri = ambilRegistri();

  /* Pertama kali (atau pembaruan dari versi lama): buat profil awal
     dan PINDAHKAN data lama yang dulunya tanpa profil. */
  if (!registri) {
    registri = { aktif: 'p1', daftar: [{ id: 'p1', nama: 'Saya', warna: 0 }] };
    var KUNCI_LAMA = {
      'gama_riwayat_karbon': 'riwayat_karbon',
      'gama_progres_eco': 'progres_eco',
      'gama_jadwal': 'jadwal',
      'gama_siklus_tahap': 'siklus_tahap'
    };
    Object.keys(KUNCI_LAMA).forEach(function (lama) {
      try {
        var isi = localStorage.getItem(lama);
        if (isi !== null) {
          localStorage.setItem('gama_p1_' + KUNCI_LAMA[lama], isi);
          localStorage.removeItem(lama);
        }
      } catch (e) { /* abaikan */ }
    });
    simpanRegistri(registri);
  }

  function profilAktif() {
    for (var i = 0; i < registri.daftar.length; i++) {
      if (registri.daftar[i].id === registri.aktif) return registri.daftar[i];
    }
    // pilihan tidak valid (profil sudah dihapus) → pakai yang pertama
    registri.aktif = registri.daftar[0].id;
    simpanRegistri(registri);
    return registri.daftar[0];
  }

  function kunci(dasar) {
    return 'gama_' + registri.aktif + '_' + dasar;
  }

  function hapusDataProfil(id) {
    DATA_PROFIL.forEach(function (d) {
      try { localStorage.removeItem('gama_' + id + '_' + d); } catch (e) { /* abaikan */ }
    });
  }

  /* ---------- Dialog pemilih profil ---------- */
  var dialog = null;       // diisi saat DOM siap
  var pembukaTerakhir = null;

  function gambarDialog() {
    if (!dialog) return;
    var aktif = profilAktif();

    var barisProfil = registri.daftar.map(function (p) {
      var dipakai = p.id === aktif.id;
      return (
        '<li class="baris-profil' + (dipakai ? ' dipakai' : '') + '">' +
          '<button type="button" class="pilih-profil" data-id="' + p.id + '"' +
            (dipakai ? ' aria-current="true"' : '') + '>' +
            '<span class="avatar-blob avatar-w' + (p.warna % JUMLAH_WARNA) + '" aria-hidden="true">' +
              amanHtml(p.nama.charAt(0).toUpperCase()) +
            '</span>' +
            '<span class="profil-nama">' + amanHtml(p.nama) +
              (dipakai ? '<small>Sedang dipakai</small>' : '<small>Ketuk untuk berpindah</small>') +
            '</span>' +
          '</button>' +
          (registri.daftar.length > 1
            ? '<button type="button" class="hapus-profil" data-id="' + p.id + '" aria-label="Hapus profil ' + amanHtml(p.nama) + '">' +
                '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7 H19 M10 7 V5 A1 1 0 0 1 11 4 H13 A1 1 0 0 1 14 5 V7 M8 7 L9 20 H15 L16 7 M10.5 11 V16 M13.5 11 V16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
              '</button>'
            : '') +
        '</li>'
      );
    }).join('');

    var bolehTambah = registri.daftar.length < MAKS_PROFIL;

    dialog.innerHTML =
      '<div class="dialog-kotak" role="dialog" aria-modal="true" aria-labelledby="judul-dialog-profil">' +
        '<button type="button" class="tutup-dialog" aria-label="Tutup">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>' +
        '</button>' +
        '<h3 id="judul-dialog-profil">Siapa yang memakai?</h3>' +
        '<p class="keterangan">Satu HP bisa dipakai bergantian — data tiap orang terpisah, tersimpan <b>hanya di HP ini</b> dan tidak tersinkron ke perangkat lain.</p>' +
        '<ul class="daftar-profil">' + barisProfil + '</ul>' +
        (bolehTambah
          ? '<form class="form-profil-baru" id="form-profil-baru">' +
              '<label for="nama-profil-baru">Tambah orang baru</label>' +
              '<div class="baris-profil-baru">' +
                '<input type="text" id="nama-profil-baru" maxlength="20" placeholder="Nama panggilan" autocomplete="off">' +
                '<button type="submit" class="tombol tombol-utama tombol-kecil">Tambah</button>' +
              '</div>' +
              '<small class="keterangan tersembunyi" id="galat-profil" role="alert">Isi namanya dulu, ya.</small>' +
            '</form>'
          : '<p class="keterangan">Maksimal ' + MAKS_PROFIL + ' profil per HP.</p>') +
      '</div>';
  }

  function bukaDialog(pembuka) {
    if (!dialog) return;
    pembukaTerakhir = pembuka || null;
    gambarDialog();
    dialog.classList.remove('tersembunyi');
    var pertama = dialog.querySelector('.pilih-profil');
    if (pertama) pertama.focus();
  }
  function tutupDialog() {
    if (!dialog) return;
    dialog.classList.add('tersembunyi');
    if (pembukaTerakhir) pembukaTerakhir.focus();
  }

  function pasangDialog() {
    dialog = document.getElementById('dialog-profil');
    if (!dialog) return;

    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) { tutupDialog(); return; }   // ketuk latar → tutup

      if (e.target.closest('.tutup-dialog')) { tutupDialog(); return; }

      var pilih = e.target.closest('.pilih-profil');
      if (pilih) {
        if (pilih.dataset.id !== registri.aktif) {
          registri.aktif = pilih.dataset.id;
          simpanRegistri(registri);
          location.reload();                                // muat ulang dengan data profil baru
        } else {
          tutupDialog();
        }
        return;
      }

      var hapus = e.target.closest('.hapus-profil');
      if (hapus) {
        var id = hapus.dataset.id;
        var p = null;
        registri.daftar.forEach(function (x) { if (x.id === id) p = x; });
        if (!p) return;
        var yakin = window.confirm(
          'Hapus profil "' + p.nama + '"?\n' +
          'SEMUA datanya (riwayat karbon, jadwal tani, progres eco-enzyme, lencana) ikut terhapus dan tidak bisa dikembalikan.'
        );
        if (!yakin) return;
        hapusDataProfil(id);
        registri.daftar = registri.daftar.filter(function (x) { return x.id !== id; });
        if (registri.aktif === id) {
          registri.aktif = registri.daftar[0].id;
          simpanRegistri(registri);
          location.reload();
          return;
        }
        simpanRegistri(registri);
        gambarDialog();
      }
    });

    dialog.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') tutupDialog();
    });

    dialog.addEventListener('submit', function (e) {
      if (e.target.id !== 'form-profil-baru') return;
      e.preventDefault();
      var input = document.getElementById('nama-profil-baru');
      var galat = document.getElementById('galat-profil');
      var nama = input.value.trim();
      if (!nama) {
        galat.classList.remove('tersembunyi');
        input.focus();
        return;
      }
      var idBaru = 'p' + Date.now();
      registri.daftar.push({
        id: idBaru,
        nama: nama,
        warna: registri.daftar.length % JUMLAH_WARNA
      });
      registri.aktif = idBaru;
      simpanRegistri(registri);
      location.reload();                                    // langsung masuk sebagai profil baru
    });

    /* Tombol profil di kepala aplikasi */
    var tombolProfil = document.getElementById('tombol-profil');
    if (tombolProfil) {
      var aktif = profilAktif();
      tombolProfil.innerHTML =
        '<span class="avatar-blob avatar-kecil avatar-w' + (aktif.warna % JUMLAH_WARNA) + '" aria-hidden="true">' +
          amanHtml(aktif.nama.charAt(0).toUpperCase()) +
        '</span>';
      tombolProfil.setAttribute('aria-label', 'Ganti profil — sedang dipakai: ' + aktif.nama);
      tombolProfil.title = 'Profil: ' + aktif.nama;
      tombolProfil.addEventListener('click', function () { bukaDialog(tombolProfil); });
    }

    /* Pemilih profil saat aplikasi dibuka (kalau profilnya lebih dari satu
       dan onboarding tidak sedang tampil) */
    var onboardingBelum = !localStorage.getItem('gama_onboarding_v1');
    if (registri.daftar.length > 1 && !onboardingBelum) {
      bukaDialog(null);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', pasangDialog);
  } else {
    pasangDialog();
  }

  /* ---------- API untuk modul lain ---------- */
  window.GamaProfil = {
    kunci: kunci,
    aktif: profilAktif,
    daftar: function () { return registri.daftar.slice(); },
    semuaId: function () { return registri.daftar.map(function (p) { return p.id; }); },
    kunciUntuk: function (id, dasar) { return 'gama_' + id + '_' + dasar; },
    hapusDataProfil: hapusDataProfil,
    bukaDialog: bukaDialog
  };
})();
