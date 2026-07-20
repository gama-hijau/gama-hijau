/* ============================================================
   jadwal.js — Jadwal Tani Personal
   - Tambah / ubah / hapus kegiatan tani (tanam, pupuk, siram, panen)
   - Tersimpan di localStorage → sepenuhnya offline, di HP ini saja
   - Pengingat: Notification API lokal (lewat service worker bila ada),
     TANPA server. Izin diminta dengan penjelasan Bahasa Indonesia.
   - Fallback yang selalu terlihat: daftar "Hari ini" & "Mendatang"
     (pengingat otomatis hanya berbunyi saat aplikasi sedang dibuka —
     keterbatasan HP tanpa server push).
   ============================================================ */
(function () {
  'use strict';

  var KUNCI = window.GamaProfil.kunci('jadwal');   // terpisah per profil
  var JEDA_INGAT_MENIT = 30;          // ingatkan 30 menit sebelum waktunya

  var NAMA_JENIS = {
    tanam: 'Tanam', pupuk: 'Pemupukan', siram: 'Penyiraman',
    panen: 'Panen', lain: 'Lainnya'
  };

  /* ---------- Penyimpanan ---------- */
  function ambilSemua() {
    try {
      var d = JSON.parse(localStorage.getItem(KUNCI));
      return Array.isArray(d) ? d : [];
    } catch (e) { return []; }
  }
  function simpanSemua(daftar) {
    try { localStorage.setItem(KUNCI, JSON.stringify(daftar)); }
    catch (e) { /* penyimpanan penuh — abaikan */ }
  }

  function amanHtml(teks) {
    return String(teks || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------- Elemen ---------- */
  var form = document.getElementById('form-jadwal');
  var judulForm = document.getElementById('form-jadwal-judul');
  var inputId = document.getElementById('jadwal-id-edit');
  var inputJudul = document.getElementById('jadwal-judul-input');
  var inputTanggal = document.getElementById('jadwal-tanggal');
  var inputJam = document.getElementById('jadwal-jam');
  var inputCatatan = document.getElementById('jadwal-catatan');
  var galat = document.getElementById('jadwal-galat');
  var tombolTambah = document.getElementById('tombol-tambah-jadwal');
  var tombolBatal = document.getElementById('tombol-batal-jadwal');
  var wadahIzin = document.getElementById('izin-notifikasi');
  var wadahDaftar = document.getElementById('jadwal-daftar');

  /* ---------- Banner yang bisa ditutup (status tersimpan lokal) ---------- */
  var KUNCI_TUTUP_IZIN = 'gama_jadwal_tutup_izin';
  var KUNCI_TUTUP_KALENDER = 'gama_jadwal_tutup_kalender';

  var bannerKalender = document.getElementById('banner-kalender');
  var tutupBannerKalender = document.getElementById('tutup-banner-kalender');
  if (bannerKalender && localStorage.getItem(KUNCI_TUTUP_KALENDER)) {
    bannerKalender.classList.add('tersembunyi');
  }
  if (tutupBannerKalender) {
    tutupBannerKalender.addEventListener('click', function () {
      bannerKalender.classList.add('tersembunyi');
      try { localStorage.setItem(KUNCI_TUTUP_KALENDER, '1'); } catch (e) { /* abaikan */ }
    });
  }

  /* ---------- Form buka / tutup ---------- */
  function bukaForm(item) {
    form.classList.remove('tersembunyi');
    tombolTambah.classList.add('tersembunyi');
    galat.classList.add('tersembunyi');

    if (item) {
      judulForm.textContent = 'Ubah kegiatan';
      inputId.value = item.id;
      inputJudul.value = item.judul;
      inputTanggal.value = item.waktu.slice(0, 10);
      inputJam.value = item.waktu.slice(11, 16);
      inputCatatan.value = item.catatan || '';
      var radio = form.querySelector('input[name="jadwal-jenis"][value="' + item.jenis + '"]');
      if (radio) radio.checked = true;
    } else {
      judulForm.textContent = 'Kegiatan baru';
      inputId.value = '';
      form.reset();
      // form.reset() mengosongkan jam — kembalikan bawaan pagi hari
      inputJam.value = '07:00';
      inputTanggal.value = tanggalLokal(new Date());
    }
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    inputJudul.focus();
  }
  function tutupForm() {
    form.classList.add('tersembunyi');
    tombolTambah.classList.remove('tersembunyi');
    form.reset();
    inputId.value = '';
  }

  tombolTambah.addEventListener('click', function () { bukaForm(null); });
  tombolBatal.addEventListener('click', tutupForm);

  /* tanggal lokal YYYY-MM-DD (bukan UTC) */
  function tanggalLokal(d) {
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  /* ---------- Simpan (tambah / ubah) ---------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var judul = inputJudul.value.trim();
    if (!judul) {
      galat.classList.remove('tersembunyi');
      inputJudul.focus();
      return;
    }
    galat.classList.add('tersembunyi');

    var tanggal = inputTanggal.value || tanggalLokal(new Date());
    var jam = inputJam.value || '07:00';
    var jenisEl = form.querySelector('input[name="jadwal-jenis"]:checked');

    var daftar = ambilSemua();
    var idEdit = inputId.value;

    if (idEdit) {
      for (var i = 0; i < daftar.length; i++) {
        if (daftar[i].id === idEdit) {
          daftar[i].judul = judul;
          daftar[i].jenis = jenisEl ? jenisEl.value : 'lain';
          daftar[i].waktu = tanggal + 'T' + jam;
          daftar[i].catatan = inputCatatan.value.trim();
          daftar[i].diingatkan = false;   // waktu berubah → ingatkan lagi
          break;
        }
      }
    } else {
      daftar.push({
        id: 'j' + Date.now() + Math.floor(Math.random() * 999),
        judul: judul,
        jenis: jenisEl ? jenisEl.value : 'lain',
        waktu: tanggal + 'T' + jam,
        catatan: inputCatatan.value.trim(),
        selesai: false,
        diingatkan: false
      });
    }

    simpanSemua(daftar);
    tutupForm();
    gambar();
    cekPengingat();
    if (window.GamaSiklus) window.GamaSiklus.perbarui();
  });

  /* ---------- Render daftar ---------- */
  function barisItem(item, tampilkanTanggal) {
    var d = new Date(item.waktu);
    var jam = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    var teksWaktu = tampilkanTanggal
      ? window.formatTanggal(d, true)
      : 'Jam ' + jam;

    var kelas = 'item-jadwal';
    if (item.selesai) kelas += ' selesai';
    else if (d.getTime() < Date.now() && !hariSama(d, new Date())) kelas += ' lewat';

    return (
      '<div class="' + kelas + '" data-id="' + item.id + '">' +
        '<label class="cek-jadwal" title="Tandai selesai">' +
          '<input type="checkbox" class="cek-selesai"' + (item.selesai ? ' checked' : '') + '>' +
          '<span class="cek-kotak" aria-hidden="true"></span>' +
          '<span class="tersembunyi">Tandai selesai</span>' +
        '</label>' +
        '<div>' +
          '<span class="jadwal-judul">' + amanHtml(item.judul) + '</span>' +
          '<span class="jadwal-jenis">' + NAMA_JENIS[item.jenis] + '</span>' +
        '</div>' +
        '<div class="jadwal-waktu">' + teksWaktu + '</div>' +
        (item.catatan ? '<div class="jadwal-catatan">' + amanHtml(item.catatan) + '</div>' : '') +
        '<div class="jadwal-aksi">' +
          '<button type="button" class="tombol-bahaya aksi-ubah">Ubah</button>' +
          '<button type="button" class="tombol-bahaya aksi-hapus">Hapus</button>' +
        '</div>' +
      '</div>'
    );
  }

  function hariSama(a, b) {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() &&
           a.getDate() === b.getDate();
  }

  function gambar() {
    var daftar = ambilSemua().slice().sort(function (a, b) {
      return a.waktu < b.waktu ? -1 : 1;
    });
    var kini = new Date();

    var hariIni = [], mendatang = [], lewat = [];
    daftar.forEach(function (item) {
      var d = new Date(item.waktu);
      if (item.selesai) lewat.push(item);
      else if (hariSama(d, kini)) hariIni.push(item);
      else if (d.getTime() > kini.getTime()) mendatang.push(item);
      else lewat.push(item);
    });

    if (!wadahDaftar) return;

    // Semuanya kosong → satu pesan ringkas, tanpa tiga blok judul terpisah
    if (!hariIni.length && !mendatang.length && !lewat.length) {
      wadahDaftar.innerHTML =
        '<p class="jadwal-semua-kosong">Belum ada jadwal tani. Ketuk <b>"Tambah Kegiatan"</b> di atas, atau salin dari Kalender Tanam.</p>';
      return;
    }

    function seksi(judul, daftarIsi, tampilkanTanggal, teksKosong, dipotong) {
      if (daftarIsi.length) {
        var isi = dipotong ? daftarIsi.slice(-10).reverse() : daftarIsi;
        return '<h3 class="judul-bagian">' + judul + '</h3>' +
          isi.map(function (x) { return barisItem(x, tampilkanTanggal); }).join('');
      }
      // Kosong tapi bukan semuanya kosong → satu baris pendek, bukan blok besar
      return '<p class="jadwal-baris-ringkas"><b>' + judul + ':</b> ' + teksKosong + '</p>';
    }

    wadahDaftar.innerHTML =
      seksi('Hari ini', hariIni, false, 'tidak ada kegiatan.', false) +
      seksi('Mendatang', mendatang, true, 'belum ada rencana.', false) +
      seksi('Lewat & selesai', lewat, true, 'belum ada riwayat.', true);
  }

  /* ---------- Aksi pada item (selesai / ubah / hapus) ---------- */
  document.getElementById('view-jadwal').addEventListener('click', function (e) {
    var wadahItem = e.target.closest('.item-jadwal');
    if (!wadahItem) return;
    var id = wadahItem.dataset.id;
    var daftar = ambilSemua();
    var item = null;
    for (var i = 0; i < daftar.length; i++) {
      if (daftar[i].id === id) { item = daftar[i]; break; }
    }
    if (!item) return;

    if (e.target.classList.contains('cek-selesai')) {
      item.selesai = e.target.checked;
      simpanSemua(daftar);
      gambar();
      if (window.GamaSiklus) window.GamaSiklus.perbarui();
      return;
    }
    if (e.target.closest('.aksi-ubah')) {
      bukaForm(item);
      return;
    }
    if (e.target.closest('.aksi-hapus')) {
      var yakin = window.confirm('Hapus kegiatan "' + item.judul + '"?\nData yang dihapus tidak bisa dikembalikan.');
      if (!yakin) return;
      simpanSemua(daftar.filter(function (x) { return x.id !== id; }));
      gambar();
      if (window.GamaSiklus) window.GamaSiklus.perbarui();
    }
  });

  /* ---------- Izin notifikasi (banner ringkas, bisa ditutup) ---------- */
  function bungkusBannerIzin(ikon, teks, tombolAksiHtml) {
    return (
      '<div class="banner-jadwal" id="banner-izin">' +
        '<span class="banner-ikon" aria-hidden="true">' + ikon + '</span>' +
        '<span class="banner-teks">' + teks + '</span>' +
        (tombolAksiHtml || '') +
        '<button type="button" class="banner-tutup" id="tutup-banner-izin" aria-label="Tutup, jangan tampilkan lagi">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>' +
        '</button>' +
      '</div>'
    );
  }

  function pasangTutupBannerIzin() {
    var tombol = document.getElementById('tutup-banner-izin');
    if (!tombol) return;
    tombol.addEventListener('click', function () {
      wadahIzin.innerHTML = '';
      try { localStorage.setItem(KUNCI_TUTUP_IZIN, '1'); } catch (e) { /* abaikan */ }
    });
  }

  function gambarIzin() {
    if (localStorage.getItem(KUNCI_TUTUP_IZIN)) { wadahIzin.innerHTML = ''; return; }

    if (!('Notification' in window)) {
      // HP tak mendukung — fallback "Hari ini" di bawah sudah cukup, tak perlu banner
      wadahIzin.innerHTML = '';
      return;
    }

    if (Notification.permission === 'granted') {
      wadahIzin.innerHTML = bungkusBannerIzin('✓', '<b>Pengingat menyala.</b> Muncul ' + JEDA_INGAT_MENIT + ' menit sebelum waktunya, selama aplikasi terbuka.', '');
      pasangTutupBannerIzin();
      return;
    }

    if (Notification.permission === 'denied') {
      wadahIzin.innerHTML = bungkusBannerIzin('🔕', 'Pengingat belum diizinkan. Daftar "Hari ini" di bawah tetap tampil.', '');
      pasangTutupBannerIzin();
      return;
    }

    // permission === 'default' → jelaskan singkat, minta izin saat tombol diketuk
    wadahIzin.innerHTML = bungkusBannerIzin(
      '🔔', 'Mau diingatkan lewat notifikasi HP menjelang jadwal tani?',
      '<button type="button" class="tombol tombol-utama tombol-kecil banner-aksi" id="tombol-izin">Nyalakan</button>'
    );
    pasangTutupBannerIzin();
    var tombolIzin = document.getElementById('tombol-izin');
    if (tombolIzin) {
      tombolIzin.addEventListener('click', function () {
        Notification.requestPermission().then(function () {
          gambarIzin();
          cekPengingat();
        });
      });
    }
  }

  /* ---------- Pengingat lokal ----------
     Berjalan saat aplikasi terbuka: tiap menit dicek apakah ada
     kegiatan yang waktunya <= 30 menit lagi dan belum diingatkan. */
  function tampilkanNotifikasi(item) {
    var d = new Date(item.waktu);
    var jam = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    var judul = '🌱 ' + NAMA_JENIS[item.jenis] + ': ' + item.judul;
    var badan = 'Jadwal tani Anda jam ' + jam +
      (item.catatan ? '\nCatatan: ' + item.catatan : '');

    // Lewat service worker bila siap (lebih andal di HP Android)
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then(function (reg) {
        if (reg && reg.showNotification) {
          reg.showNotification(judul, {
            body: badan,
            tag: 'gama-jadwal-' + item.id,
            icon: 'icons/icon-192.png',
            badge: 'icons/icon-192.png',
            lang: 'id'
          });
        } else {
          new Notification(judul, { body: badan });
        }
      }).catch(function () {
        try { new Notification(judul, { body: badan }); } catch (e) { /* abaikan */ }
      });
    } else {
      try { new Notification(judul, { body: badan }); } catch (e) { /* abaikan */ }
    }
  }

  function cekPengingat() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    var kini = Date.now();
    var batasDepan = kini + JEDA_INGAT_MENIT * 60 * 1000;
    var batasBelakang = kini - 12 * 60 * 60 * 1000;   // yang sudah lewat >12 jam tidak perlu
    var daftar = ambilSemua();
    var adaPerubahan = false;

    daftar.forEach(function (item) {
      if (item.selesai || item.diingatkan) return;
      var w = new Date(item.waktu).getTime();
      if (w <= batasDepan && w >= batasBelakang) {
        tampilkanNotifikasi(item);
        item.diingatkan = true;
        adaPerubahan = true;
      }
    });

    if (adaPerubahan) simpanSemua(daftar);
  }

  setInterval(cekPengingat, 60 * 1000);

  /* ---------- API untuk modul lain ---------- */
  window.GamaJadwal = {
    /* dipanggil Kalender Tanam: isi form dengan usulan kegiatan */
    prefill: function (usulan) {
      if (window.bukaHalaman) window.bukaHalaman('jadwal');
      bukaForm(null);
      inputJudul.value = usulan.judul || '';
      if (usulan.tanggal) inputTanggal.value = usulan.tanggal;
      if (usulan.jam) inputJam.value = usulan.jam;
      if (usulan.catatan) inputCatatan.value = usulan.catatan;
      var radio = form.querySelector('input[name="jadwal-jenis"][value="' + (usulan.jenis || 'tanam') + '"]');
      if (radio) radio.checked = true;
      inputJudul.focus();
    },
    ambilSemua: ambilSemua,
    segarkan: gambar
  };

  /* ---------- Mulai ---------- */
  gambarIzin();
  gambar();
  cekPengingat();
})();
