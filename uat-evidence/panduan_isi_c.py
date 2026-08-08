"""Isi Buku Panduan ConnectOne, bagian C: Bab 11 s.d. Bab 18."""


def bab11_tte(D):
    D.h1('Tanda Tangan Elektronik (TTE / e-Sign)')
    D.p('ConnectOne menyediakan dua menu tanda tangan elektronik yang terintegrasi '
        'dengan layanan Balai Sertifikasi Elektronik (BSrE):')
    D.table(['Menu', 'Kegunaan'], [
        ['e-Sign', 'Menandatangani satu dokumen PDF oleh **satu penanda tangan** '
         '(Anda sendiri) secara langsung. Cocok untuk dokumen yang tidak '
         'memerlukan persetujuan berjenjang.'],
        ['e-Sign Distribution\n(Distribusi e-Sign)', 'Permintaan tanda tangan '
         '**beberapa penanda tangan secara berurutan**, dilanjutkan distribusi '
         'dokumen final kepada penerima atau grup penerima.'],
    ], widths=[1.9, 4.1])

    D.h2(1, 'Prasyarat Sebelum Menandatangani')
    D.steps([
        'Buka menu **Settings** (Pengaturan) pada sidebar.',
        'Pada bagian **Tanda Tangan Elektronik (e-Sign)**, isi **NIK** Anda '
        '(16 digit) sesuai data pada sertifikat elektronik BSrE.',
        'Unggah **Spesimen Tanda Tangan** berupa berkas PNG/JPG. Latar belakang '
        'transparan disarankan agar hasil pembubuhan rapi.',
        'Klik **Simpan Data e-Sign**. Aplikasi menampilkan pesan "Data e-Sign '
        'berhasil disimpan!".',
        'Siapkan **passphrase** sertifikat elektronik Anda. Passphrase diminta '
        'setiap kali menandatangani dan tidak pernah disimpan oleh aplikasi.',
    ])
    D.note('Bila NIK belum diisi, halaman e-Sign menampilkan peringatan "NIK belum '
           'diatur pada profil Anda" dan fitur tanda tangan tidak dapat digunakan '
           'sampai NIK dilengkapi melalui menu Pengaturan.')

    D.h2(2, 'Menandatangani Dokumen (Menu e-Sign)')
    D.steps([
        'Klik menu **e-Sign** pada kelompok TATA KELOLA di sidebar.',
        'Periksa kartu **NIK Status**; pastikan berstatus **Aktif** ("siap '
        'menandatangani").',
        'Klik tombol tanda tangan dokumen (**Sign document** / Tandatangani '
        'dokumen).',
        'Pada bagian **DOKUMEN PDF**, klik untuk mengunggah berkas PDF. Ukuran '
        'maksimum **20 MB** per dokumen.',
        'Isi **JUDUL DOKUMEN** bila diperlukan. Bila dikosongkan, aplikasi memakai '
        'nama berkas sebagai judul.',
        'Masukkan **PASSPHRASE TANDA TANGAN** Anda.',
        'Klik tombol tanda tangani. Selama proses berlangsung, tombol menampilkan '
        '"Menandatangani…".',
        'Aplikasi menampilkan pesan "Dokumen berhasil ditandatangani" dan dokumen '
        'muncul pada tabel di halaman e-Sign.',
    ])
    D.fig_('3.6.1-1a_halaman-esign-sebelum.png', 'Halaman e-Sign sebelum penandatanganan.')
    D.fig_('3.6.1-1b_dialog-tanda-tangan.png',
           'Dialog penandatanganan dokumen, unggah PDF dan masukkan passphrase.')
    D.fig_('3.6.1-1c_hasil-tanda-tangan.png', 'Dokumen berhasil ditandatangani.')
    D.note('Bila berkas melebihi 20 MB, aplikasi menolak dengan pesan "Ukuran file '
           'terlalu besar. Maksimum 20 MB per dokumen untuk e-Sign." Kecilkan '
           'ukuran berkas PDF terlebih dahulu.')

    D.h2(3, 'Membaca Statistik Halaman e-Sign')
    D.bullets([
        '**Dokumen Ditandatangani**: jumlah total dokumen yang telah Anda '
        'tandatangani.',
        '**Tanda Tangan Terlihat**: dokumen yang dibubuhi stempel tanda tangan '
        'yang tampak secara visual pada halaman PDF.',
        '**Tanda Tangan Tersembunyi**: dokumen yang tanda tangannya hanya '
        'tertanam pada berkas (tidak tampak secara visual).',
        '**Status NIK**: menunjukkan apakah NIK Anda sudah diatur dan siap '
        'digunakan.',
    ])

    D.h2(4, 'Memverifikasi Keaslian Dokumen')
    D.steps([
        'Pada tabel dokumen di halaman **e-Sign**, temukan dokumen yang akan '
        'diperiksa.',
        'Klik tombol **Verify** (Verifikasi) pada kolom AKSI.',
        'Aplikasi menampilkan hasil pemeriksaan: **Tanda tangan valid** atau '
        '**Tanda tangan tidak valid**, disertai nama penanda tangan dan waktu '
        'penandatanganan.',
    ])
    D.fig_('3.6.3-1a_daftar-dokumen-tte.png', 'Daftar dokumen yang telah ditandatangani.')
    D.fig_('3.6.3-1b_hasil-verifikasi.png', 'Hasil verifikasi keaslian tanda tangan dokumen.')

    D.h2(5, 'Riwayat dan Mengunduh Dokumen')
    D.steps([
        'Buka menu **e-Sign**. Tabel pada halaman ini berfungsi sebagai riwayat '
        'dokumen yang telah ditandatangani, dengan kolom FILE, DITANDATANGANI, '
        'TANDA TANGAN, dan AKSI.',
        'Klik ikon unduh pada baris dokumen untuk mengambil berkas PDF yang sudah '
        'ditandatangani.',
        'Bila unduhan gagal, aplikasi menampilkan pesan "Gagal mengunduh dokumen"; '
        'ulangi beberapa saat kemudian.',
    ])
    D.fig_('3.6.4-1_riwayat-dokumen-tte.png', 'Riwayat dokumen tertandatangani.')
    D.fig_('3.6.4-2_unduh-dokumen.png', 'Mengunduh dokumen yang telah ditandatangani.')

    D.h2(6, 'Distribusi e-Sign: Tanda Tangan Berurutan')
    D.p('Gunakan menu **e-Sign Distribution** (Distribusi e-Sign) bila sebuah '
        'dokumen harus ditandatangani oleh lebih dari satu orang secara berurutan. '
        'Status dokumen berkembang dari **Draf → Menunggu Tanda Tangan → '
        'Sepenuhnya Ditandatangani → Didistribusikan**.')

    D.h3('a. Membuat Permintaan e-Sign')
    D.steps([
        'Klik menu **e-Sign Distribution** pada sidebar.',
        'Klik tombol **Permintaan e-Sign Baru** (New e-Sign Request).',
        'Isi **Judul Dokumen**, wajib diisi.',
        'Isi **Deskripsi** singkat bila diperlukan.',
        'Unggah **File PDF** (maksimum 20 MB).',
        'Pada **Penanda Tangan**, pilih siapa saja yang harus menandatangani. '
        'Urutan penandatanganan mengikuti urutan pemilihan Anda. Bila Anda juga '
        'perlu menandatangani, pilih nama Anda sendiri pada urutan yang '
        'dikehendaki.',
        'Klik **Buat Permintaan e-Sign**. Aplikasi menampilkan pesan "Permintaan '
        'e-Sign berhasil dibuat!".',
    ])
    D.note('Sebagai pembuat, Anda **tidak otomatis** menjadi penanda tangan. '
           'Anda hanya ikut menandatangani bila memilih diri sendiri pada daftar '
           'penanda tangan. Penanda tangan berikutnya baru dapat menandatangani '
           'setelah penanda tangan sebelumnya menyelesaikan bagiannya. Pembuat '
           'tetap dapat memantau dan mendistribusikan dokumen meskipun bukan '
           'penanda tangan.')
    D.fig_('panduan-esign-pilih-penandatangan.png',
           'Formulir permintaan e-Sign: urutan penanda tangan mengikuti urutan pemilihan.')
    D.fig_('3.6.2-1a_daftar-esign-multi-pihak.png',
           'Daftar permintaan e-Sign multi penanda tangan.')

    D.h3('b. Menandatangani Sesuai Urutan')
    D.steps([
        'Buka permintaan e-Sign yang dituju. Bila giliran Anda, kartu permintaan '
        'diberi penanda **Giliran Anda!**.',
        'Pada tab **Info & Penanda Tangan**, periksa bagian **Urutan Penanda '
        'Tangan** untuk memastikan posisi Anda dan status penanda tangan lain '
        '(keterangan "n/m ditandatangani").',
        'Klik tombol **Tandatangani** (Sign).',
        'Masukkan **passphrase e-Sign** Anda pada dialog yang muncul.',
        'Klik **Konfirmasi Tanda Tangan**. Aplikasi menampilkan pesan "Dokumen '
        'berhasil ditandatangani!" dan giliran berpindah ke penanda tangan '
        'berikutnya.',
        'Setelah seluruh penanda tangan selesai, status dokumen menjadi '
        '**Sepenuhnya Ditandatangani**.',
    ])
    D.fig_('3.6.2-1b_urutan-penandatangan.png', 'Urutan penanda tangan pada sebuah permintaan e-Sign.')
    D.fig_('3.6.2-1c_dialog-tanda-tangan.png', 'Dialog konfirmasi tanda tangan dengan passphrase.')
    D.fig_('3.6.2-1d_semua-penandatangan-selesai.png',
           'Dokumen setelah seluruh penanda tangan menyelesaikan tanda tangan.')
    D.fig_('3.6.2-1e_urutan-penandatangan-lengkap.png',
           'Urutan penanda tangan yang telah lengkap.')

    D.h3('c. Memverifikasi dan Mendistribusikan Dokumen')
    D.steps([
        'Pada dokumen yang sudah **Sepenuhnya Ditandatangani**, klik **Verifikasi '
        'e-Sign** untuk memeriksa tanda tangan digital. Hasil pemeriksaan '
        'menampilkan **Dokumen Valid**, **Integritas OK**, dan **Sertifikat '
        'Terpercaya**.',
        'Klik tombol **Distribusikan** (Distribute).',
        'Pilih penerima distribusi, dapat berupa **Perorangan** maupun **Grup** '
        '(jumlah anggota grup tampil di sampingnya).',
        'Klik **Distribusikan ke n penerima**. Aplikasi menampilkan pesan '
        '"Dokumen berhasil didistribusikan!" dan status berubah menjadi '
        '**Didistribusikan**.',
        'Penerima memperoleh notifikasi bahwa dokumen e-Sign telah dikirimkan '
        'kepada mereka.',
    ])

    D.h3('d. Jejak Audit Dokumen')
    D.p('Buka tab **Jejak Audit** (Log) pada sebuah permintaan e-Sign untuk '
        'melihat seluruh riwayat: **Dokumen dibuat**, **Penanda tangan '
        'ditambahkan**, **Dokumen diajukan**, **Ditandatangani**, **Semua penanda '
        'tangan selesai**, **Ditolak**, dan **Didistribusikan**, lengkap dengan '
        'pelaku dan waktunya.')
    D.fig_('3.6.2-1f_audit-trail.png', 'Jejak audit permintaan e-Sign.')
    D.pagebreak()


def bab12_arsip(D):
    D.h1('Arsip: Penyimpanan, Dokumen Resmi, dan Aset')
    D.p('Kelompok menu **ARSIP** (Records) memuat tiga menu dengan fungsi yang '
        'berbeda. Pilih menu yang sesuai agar arsip organisasi tetap tertata:')
    D.table(['Menu', 'Digunakan untuk'], [
        ['Storage (Penyimpanan)', 'Berkas kerja sehari-hari yang ditata dalam '
         'folder, dengan pengaturan siapa yang boleh melihatnya.'],
        ['Official Documents\n(Dokumen Resmi)', 'Dokumen resmi bernomor yang '
         'memiliki masa berlaku dan riwayat versi, misalnya surat keputusan atau '
         'perjanjian kerja sama.'],
        ['Physical Assets\n(Aset Fisik)', 'Inventaris barang milik unit beserta '
         'kondisi, lokasi, dan penanggung jawabnya.'],
    ], widths=[1.9, 4.1])

    D.h2(1, 'Penyimpanan (Storage)')
    D.p('Halaman **Storage** menampilkan pemakaian kuota, jumlah berkas, serta dua '
        'tab: **Penyimpanan Saya** (My Storage) untuk berkas pribadi Anda, dan '
        '**Internal / Bersama** (Internal / Shared) untuk berkas internal dari '
        'seluruh pengguna.')

    D.h3('a. Membuat Folder')
    D.steps([
        'Klik menu **Storage** pada sidebar.',
        'Klik tombol **Folder Baru** (New Folder).',
        'Isi **Nama folder**, misalnya "Kontrak 2026".',
        'Tentukan **Visibilitas**: **Ikuti folder induk**, **Privat**, atau '
        '**Internal**.',
        'Klik simpan. Aplikasi menampilkan pesan "Folder dibuat".',
    ])
    D.note('Berkas dan subfolder di dalam sebuah folder mengikuti visibilitas '
           'folder induknya, kecuali diatur secara terpisah. Visibilitas '
           '**Internal** membuat isi folder dapat dilihat pengguna lain melalui '
           'tab **Internal / Bersama**.')

    D.h3('b. Mengunggah Berkas')
    D.steps([
        'Masuk ke folder tujuan.',
        'Klik tombol unggah (**Upload**), lalu pilih berkas dari komputer Anda. '
        'Anda juga dapat menyeret berkas langsung ke area folder, area tersebut '
        'menampilkan keterangan "Lepaskan berkas Anda di sini".',
        'Selama proses berlangsung, aplikasi menampilkan keterangan '
        '"Mengunggah…".',
        'Setelah selesai, muncul pesan "[nama berkas] berhasil diunggah" dan '
        'berkas tampil pada tabel dengan kolom NAMA, VISIBILITAS, PEMILIK, dan '
        'TANGGAL.',
    ])
    D.fig_('panduan-storage.png',
           'Halaman Penyimpanan (Storage): folder, kolom visibilitas, dan pemakaian kuota.')

    D.h3('c. Mengelola Berkas dan Folder')
    D.bullets([
        '**Mencari**: gunakan kolom **Cari di folder ini** untuk menyaring isi '
        'folder yang sedang dibuka.',
        '**Mengunduh**: klik ikon unduh pada baris berkas.',
        '**Mengganti nama**: pilih tindakan ganti nama pada berkas atau folder, '
        'isi nama baru, lalu simpan. Muncul pesan "Nama diubah".',
        '**Memindahkan**: pindahkan berkas ke folder lain; muncul pesan '
        '"[nama berkas] dipindahkan".',
        '**Mengubah visibilitas**: ubah antara Privat dan Internal; muncul pesan '
        '"Visibilitas diperbarui".',
        '**Menghapus berkas**: konfirmasikan pada dialog **Hapus Berkas?**. '
        'Tindakan ini tidak dapat dibatalkan.',
        '**Menghapus folder**: bila folder berisi data, dialog konfirmasi '
        'menyebutkan jumlah berkas dan subfolder yang akan ikut terhapus. Klik '
        '**Hapus semuanya** untuk melanjutkan.',
    ])
    D.note('Penghapusan berkas maupun folder bersifat permanen. Pastikan Anda '
           'sudah mengunduh salinan yang masih diperlukan sebelum menghapus.',
           label='Perhatian')

    D.h2(2, 'Dokumen Resmi (Official Documents)')
    D.p('Menu ini mencatat dokumen resmi beserta nomor, kategori, masa berlaku, '
        'dan riwayat versinya. Sistem mengirimkan pengingat perpanjangan kepada '
        'pemilik dokumen pada **30, 14, dan 3 hari** sebelum tanggal kedaluwarsa.')

    D.h3('a. Menambah Dokumen')
    D.steps([
        'Klik menu **Official Documents** pada sidebar.',
        'Klik tombol **Unggah dokumen** (Upload document).',
        'Isi **Judul Dokumen**, wajib diisi, misalnya "Perjanjian Kerja Sama '
        'dengan BSrE".',
        'Pilih **Kategori** dokumen, wajib diisi.',
        'Isi **Nomor Dokumen**, misalnya "SK/2026/019".',
        'Tentukan **Tanggal Terbit** dan **Tanggal Kedaluwarsa**.',
        'Isi **Deskripsi** bila diperlukan, lalu pilih **Berkas** yang akan '
        'diunggah.',
        'Klik simpan. Aplikasi menampilkan pesan "Dokumen diunggah" dan dokumen '
        'muncul pada tabel.',
    ])
    D.fig_('4.2-1a_form-tambah-dokumen.png', 'Formulir penambahan dokumen resmi.')
    D.fig_('4.2-1b_dokumen-tersimpan.png', 'Dokumen resmi tersimpan pada daftar.')

    D.h3('b. Melihat, Mencari, dan Menyaring Dokumen')
    D.steps([
        'Kartu statistik menampilkan **Total** dokumen, **Akan Kedaluwarsa** '
        '(dalam 30 hari), **Kedaluwarsa** (perlu diperbarui), dan **Menunggu '
        'Tanda Tangan** (dalam antrean e-Sign).',
        'Gunakan kolom **Cari judul atau nomor dokumen** untuk mencari dokumen.',
        'Gunakan penyaring **Kategori** dan **Status**: **Berlaku**, **Akan '
        'kedaluwarsa**, atau **Kedaluwarsa**.',
        'Tabel menampilkan kolom DOKUMEN, KATEGORI, VERSI, STATUS, BERLAKU '
        'HINGGA, dan TINDAKAN.',
    ])
    D.fig_('panduan-documents.png', 'Daftar dokumen resmi.')
    D.fig_('4.2-3_cari-dokumen.png', 'Hasil pencarian dokumen.')
    D.fig_('4.2-4_filter-segera-kadaluarsa.png',
           'Penyaringan dokumen yang akan segera kedaluwarsa.')

    D.h3('c. Mengubah Metadata dan Mengunduh Dokumen')
    D.steps([
        'Klik menu tindakan pada baris dokumen, lalu pilih ubah (**Edit**).',
        'Perbarui kolom yang diperlukan. Bagian **Berkas** dapat dibiarkan kosong '
        'untuk mempertahankan berkas yang sudah ada, atau diisi berkas baru untuk '
        'membuat versi berikutnya.',
        'Klik simpan. Aplikasi menampilkan pesan "Dokumen diperbarui".',
        'Untuk mengunduh, klik ikon unduh pada baris dokumen.',
        'Klik tautan **riwayat** untuk melihat seluruh versi berkas yang pernah '
        'diunggah pada dokumen tersebut.',
    ])
    D.fig_('4.2-5b_form-edit-dokumen.png', 'Formulir pengubahan dokumen resmi.')
    D.fig_('4.2-6_unduh-dokumen.png', 'Mengunduh berkas dokumen resmi.')

    D.h2(3, 'Aset Fisik (Physical Assets)')
    D.p('Menu **Physical Assets** mencatat inventaris barang beserta nilai '
        'perolehan, kondisi, lokasi, dan penanggung jawabnya. Setiap perubahan '
        'data aset tercatat pada riwayat.')

    D.h3('a. Menambah Aset')
    D.steps([
        'Klik menu **Physical Assets** pada sidebar.',
        'Klik tombol **Tambah aset** (Add asset).',
        'Isi **Nama Aset**, wajib diisi, misalnya "HSM Thales Luna 7".',
        'Pilih **Kategori** aset, wajib diisi.',
        'Isi **Nomor Seri**, misalnya "HSM-2024-011".',
        'Isi **Lokasi** penyimpanan, misalnya "Ruang data - rak B3".',
        'Isi **Tanggal Perolehan** dan **Nilai Perolehan (Rp)**.',
        'Pilih **Kondisi**: **Baik**, **Rusak ringan**, atau **Rusak berat**.',
        'Tentukan **Penanggung Jawab** dan isi **Catatan** bila diperlukan.',
        'Klik simpan. Aplikasi menampilkan pesan "Aset ditambahkan".',
    ])

    D.h3('b. Memantau dan Mengelola Aset')
    D.bullets([
        'Kartu statistik menampilkan **Total Aset** (beserta jumlah kategori), '
        '**Nilai Buku**, **Rusak Ringan** (dapat diperbaiki), dan **Rusak Berat** '
        '(tinjauan penghapusan).',
        'Gunakan kolom **Cari nama atau nomor seri** dan penyaring **Kondisi** '
        'untuk menemukan aset.',
        'Tabel menampilkan kolom ASET, NO. SERI, NILAI PEROLEHAN, KONDISI, LOKASI, '
        'dan PENANGGUNG JAWAB.',
        'Klik **Riwayat** pada sebuah aset untuk melihat catatan pergerakan dan '
        'perubahan datanya.',
        'Untuk menghapus aset, gunakan tindakan **Hapus** lalu konfirmasikan. '
        'Catatan aset akan dihapus secara permanen.',
    ])
    D.note('Hanya **penanggung jawab aset** dan **Administrator** yang dapat '
           'mengubah data sebuah aset.')
    D.fig_('panduan-assets.png', 'Halaman Aset Fisik (Physical Assets).')
    D.pagebreak()


def bab13_notifikasi(D):
    D.h1('Notifikasi')
    D.p('ConnectOne mengirimkan notifikasi melalui dua saluran: **di dalam '
        'aplikasi** (selalu aktif) dan **Telegram** (bila akun Anda sudah '
        'ditautkan).')

    D.h2(1, 'Membuka Pusat Notifikasi')
    D.steps([
        'Klik menu **Notifications** (Notifikasi) pada sidebar, atau klik ikon '
        'lonceng pada header.',
        'Angka di sebelah menu **Notifications** menunjukkan jumlah notifikasi '
        'yang belum dibaca.',
        'Subjudul halaman merangkum jumlah yang belum dibaca dan berapa di '
        'antaranya yang memerlukan tindakan Anda.',
    ])
    D.fig_('panduan-notifications.png',
           'Halaman pusat notifikasi beserta panel saluran pengiriman.')

    D.h2(2, 'Menyaring dan Menindaklanjuti Notifikasi')
    D.steps([
        'Gunakan tab penyaring: **Needs action** (Perlu tindakan), **Unread** '
        '(Belum dibaca), **All** (Semua), dan **Mentions** (Sebutan).',
        'Notifikasi yang memerlukan tindakan Anda ditandai dengan garis dan '
        'latar berwarna sehingga mudah dibedakan dari notifikasi biasa.',
        'Titik berwarna di ujung kanan baris menandakan notifikasi tersebut belum '
        'dibaca.',
        'Untuk menindaklanjuti, buka modul terkait melalui sidebar, atau gunakan '
        'menu **Daily Brief** (Ringkasan Harian) yang menyediakan tombol pintasan '
        'langsung ke tugas, permohonan perubahan, dan dokumen yang menunggu Anda '
        '(lihat sub-bab 4.6).',
        'Klik **Tandai semua telah dibaca** (Mark all read) untuk menandai seluruh '
        'notifikasi sebagai sudah dibaca.',
    ])
    D.note('Tidak ada notifikasi yang otomatis ditandai sudah dibaca. Penandaan '
           'dilakukan secara sengaja oleh pengguna agar tidak ada tindakan yang '
           'terlewat.')

    D.h2(3, 'Jenis Notifikasi')
    D.table(['Jenis', 'Dikirim ketika'], [
        ['Tugas ditugaskan', 'Sebuah tugas ditetapkan kepada Anda.'],
        ['Komentar tugas', 'Ada komentar baru pada tugas Anda.'],
        ['Sebutan (Mention)', 'Nama Anda disebut dengan tanda @ pada sebuah '
         'komentar.'],
        ['Sprint dimulai / ditutup', 'Sebuah sprint dimulai atau diselesaikan.'],
        ['Acara baru / Ditambahkan ke acara', 'Acara kalender baru dibuat atau '
         'Anda ditambahkan sebagai peserta.'],
        ['Pengingat acara', 'Satu hari sebelum (H-1) dan pada hari pelaksanaan '
         'acara (H-0).'],
        ['Permintaan tanda tangan', 'Anda diminta menandatangani dokumen e-Sign.'],
        ['Dokumen selesai ditandatangani', 'Seluruh penanda tangan telah selesai.'],
        ['Dokumen didistribusikan', 'Dokumen e-Sign dikirimkan kepada Anda.'],
        ['CR baru diajukan', 'Ada permohonan perubahan yang perlu Anda tinjau.'],
        ['CR disetujui / ditolak', 'Permohonan perubahan Anda disetujui atau '
         'ditolak.'],
        ['Dokumen akan kedaluwarsa', 'Masa berlaku dokumen resmi Anda mendekati '
         'batas.'],
    ], widths=[2.2, 3.8])

    D.h2(4, 'Mengatur Saluran dan Preferensi Notifikasi')
    D.p('Pengaturan notifikasi berada di dua tempat yang saling melengkapi.')
    D.h3('a. Memeriksa status saluran (halaman Notifikasi)')
    D.steps([
        'Pada halaman **Notifications**, panel **Delivery channels** (Saluran '
        'pengiriman) di sisi kanan menampilkan status **In-app** (Dalam aplikasi) '
        'yang **selalu aktif**, serta status **Telegram**.',
        'Klik tombol **Preferences** (Preferensi) di kanan atas untuk membuka '
        'dialog **Notification Preferences**.',
        'Dialog menampilkan saluran **Telegram** beserta **Chat ID** yang sedang '
        'tertaut pada akun Anda, atau keterangan **Belum diatur** bila belum '
        'ditautkan.',
        'Klik **Close** (Tutup) untuk menutup dialog.',
    ])
    D.fig_('panduan-notif-preferences.png', 'Dialog Notification Preferences.')

    D.h3('b. Memilih jenis notifikasi per saluran (menu Pengaturan)')
    D.steps([
        'Klik menu **Settings** (Pengaturan) pada sidebar, lalu buka tab '
        '**Notifications**.',
        'Pada tabel **Pengaturan Notifikasi**, tersedia kolom **Telegram** dan '
        '**Dalam Aplikasi** untuk setiap jenis notifikasi.',
        'Aktifkan atau nonaktifkan sesuai kebutuhan Anda. Perubahan tersimpan '
        'otomatis.',
    ])

    D.h2(5, 'Menghubungkan Akun Telegram')
    D.steps([
        'Buka **Telegram** dan cari bot **@BLPIDWorkloadBot**.',
        'Kirim perintah **/start** kepada bot tersebut.',
        'Salin **Chat ID** yang diberikan bot.',
        'Buka menu **Settings** (Pengaturan) di ConnectOne, lalu buka tab '
        '**Notifications**.',
        'Tempelkan Chat ID pada kolom **Telegram Chat ID**, lalu simpan. Aplikasi '
        'menampilkan pesan "Telegram Chat ID berhasil disimpan!" dan status '
        'berubah menjadi **Terhubung**.',
    ])
    D.fig_('3.7.2-1_bukti-telegram-task.png',
           'Notifikasi penugasan tugas yang diterima melalui Telegram.')
    D.fig_('3.7.2-2_bukti-telegram-change-request.png',
           'Notifikasi permohonan perubahan yang diterima melalui Telegram.')
    D.note('Bila Chat ID belum diisi, halaman notifikasi menampilkan peringatan '
           '"ID Chat Telegram belum diatur" dan notifikasi hanya dikirim di dalam '
           'aplikasi.')
    D.pagebreak()


def bab14_pengaturan(D):
    D.h1('Pengaturan Akun')
    D.p('Menu **Settings** (Pengaturan) pada bagian bawah sidebar digunakan untuk '
        'mengelola profil, data tanda tangan elektronik, preferensi notifikasi, '
        'keamanan akun, dan bahasa tampilan. Halaman ini terbagi menjadi tiga tab: '
        '**Profil**, **Notifikasi**, dan **Keamanan**.')

    D.h2(1, 'Tab Profil')
    D.bullets([
        'Kartu profil menampilkan nama, email, peran, status akun (**Active** / '
        '**Inactive**), serta **Division** (Divisi) dan **Position** (Jabatan).',
        'Bagian **Language** (Bahasa) digunakan untuk mengganti tampilan antara '
        '**English** dan **Bahasa Indonesia**.',
        'Bagian **Electronic Signature (e-Sign)** memuat **NIK** dan **Signature '
        'Specimen** (Spesimen Tanda Tangan) yang digunakan saat Anda ditetapkan '
        'sebagai penanda tangan dokumen. Gunakan **Choose File** untuk mengunggah '
        'spesimen, lalu klik **Save e-Sign Data** (Simpan Data e-Sign). Langkah '
        'lengkapnya dijelaskan pada Bab 11.',
    ])

    D.h2(2, 'Tab Notifikasi')
    D.bullets([
        '**Notifikasi Telegram**: status koneksi dan kolom **Telegram Chat ID** '
        'beserta petunjuk cara memperolehnya.',
        '**Pengaturan Notifikasi**: tabel jenis notifikasi dengan pilihan saluran '
        '**Telegram** dan **Dalam Aplikasi** untuk masing-masing jenis.',
    ])

    D.h2(3, 'Tab Keamanan')
    D.p('Digunakan untuk mengubah kata sandi akun. Langkah lengkapnya dijelaskan '
        'pada sub-bab 3.6.')
    D.note('Setelah kata sandi berhasil diubah, Anda otomatis dikeluarkan dari '
           'aplikasi dan harus masuk kembali menggunakan kata sandi baru.')
    D.fig_('panduan-settings-profile.png', 'Halaman Pengaturan, tab Profile.')
    D.pagebreak()


def bab15_admin(D):
    D.h1('Administrasi Sistem')
    D.p('Kelompok menu **Admin** hanya tampil bagi pengguna dengan hak '
        'administrasi. Menu ini digunakan untuk mengelola pengguna, hak akses, '
        'serta konfigurasi layanan pendukung.')

    D.h2(1, 'Kelola Pengguna, Melihat Daftar')
    D.steps([
        'Klik menu **Manage Users** (Kelola Pengguna) pada kelompok Admin.',
        'Kartu statistik menampilkan **Total Pengguna** dan jumlah pengguna '
        '**Aktif** beserta yang tidak aktif.',
        'Gunakan kolom **Cari berdasarkan nama atau email** dan penyaring peran '
        'untuk menemukan pengguna. Klik **Reset** untuk membersihkan penyaring.',
        'Tabel menampilkan kolom PENGGUNA, EMAIL, DIVISI / JABATAN, PERAN, dan '
        'STATUS.',
        'Klik **Ekspor PDF** untuk mengunduh daftar pengguna.',
    ])
    D.fig_('3.8.1-1_daftar-pengguna.png', 'Halaman kelola pengguna.')

    D.h2(2, 'Menambah Pengguna Baru')
    D.steps([
        'Klik tombol **Tambah Pengguna** (Add User).',
        'Isi **Nama Lengkap** dan **Email**, keduanya wajib diisi.',
        'Isi **Kata Sandi**. Indikator syarat menampilkan: minimal 8 karakter, '
        'mengandung huruf, dan mengandung angka.',
        'Pilih **Peran** pengguna, wajib diisi.',
        'Isi **Divisi** dan **Jabatan**, misalnya "Teknologi" dan "Software '
        'Engineer".',
        'Klik **Buat Pengguna**. Aplikasi menampilkan pesan "Pengguna berhasil '
        'dibuat" dan pengguna baru muncul pada tabel.',
    ])
    D.fig_('3.8.1-2a_form-tambah-pengguna.png', 'Formulir penambahan pengguna baru.')
    D.fig_('3.8.1-2b_pengguna-baru-terdaftar.png', 'Pengguna baru terdaftar pada daftar pengguna.')
    D.note('Bila ada kolom wajib yang belum terisi, aplikasi menampilkan pesan '
           '"Harap lengkapi semua kolom wajib".')

    D.h2(3, 'Mengubah Peran Pengguna')
    D.steps([
        'Pada tabel pengguna, klik menu tindakan (ikon titik tiga) pada baris '
        'pengguna yang dituju.',
        'Pilih **Ubah Peran** (Change Role).',
        'Pilih peran baru: Administrator, Kepala Balai, Kepala Seksi, Manajer '
        'Proyek, Scrum Master, atau Staf.',
        'Simpan. Aplikasi menampilkan pesan "Peran berhasil diperbarui!" dan '
        'kolom PERAN pada tabel langsung menyesuaikan.',
    ])
    D.fig_('3.8.1-3a_menu-aksi-pengguna.png', 'Menu tindakan pada baris pengguna.')
    D.fig_('3.8.1-3b_pilih-role-baru.png', 'Memilih peran baru untuk pengguna.')
    D.fig_('3.8.1-3c_role-terupdate.png', 'Peran pengguna setelah diperbarui.')
    D.note('Perubahan peran langsung mengubah menu yang tampil bagi pengguna '
           'tersebut pada sesi berikutnya.')

    D.h2(4, 'Mengelola Privilege Tambahan')
    D.p('Privilege digunakan untuk **menambah** atau **mencabut** izin tertentu di '
        'luar bawaan peran pengguna, tanpa harus mengubah perannya.')
    D.steps([
        'Klik menu tindakan pada baris pengguna, lalu pilih **Kelola Privilege** '
        '(Manage Privileges).',
        'Daftar izin ditampilkan per kelompok, misalnya "Membuat proyek baru", '
        '"Menyetujui/menolak Change Request", "Membuat/mengubah acara untuk semua '
        'pengguna", "Mengekspor laporan ke berkas", dan sebagainya.',
        'Alihkan sakelar pada izin yang ingin diberikan atau dicabut. Penanda '
        '**DEFAULT** berarti izin bawaan peran, **+EKSTRA** berarti izin tambahan, '
        'dan **DICABUT** berarti izin bawaan yang dinonaktifkan.',
        'Klik **Selesai**. Perubahan privilege langsung berlaku.',
        'Untuk mengembalikan ke kondisi awal, klik **Reset ke default**. Aplikasi '
        'menampilkan pesan "Privilege berhasil direset ke default".',
    ])
    D.fig_('3.8.2-1a_kelola-privilege.png', 'Panel pengelolaan privilege pengguna.')
    D.fig_('3.8.2-1b_izin-dipilih.png', 'Izin tambahan yang dipilih untuk seorang pengguna.')
    D.fig_('3.8.2-1c_privilege-tersimpan.png', 'Privilege tersimpan.')
    D.fig_('3.8.2-2b_setelah-reset.png', 'Privilege setelah direset ke pengaturan bawaan peran.')

    D.h2(5, 'Menonaktifkan dan Menghapus Pengguna')
    D.steps([
        'Klik menu tindakan pada baris pengguna.',
        'Pilih **Nonaktifkan** (Deactivate) untuk menghentikan akses pengguna '
        'tanpa menghapus datanya. Status pada tabel berubah menjadi tidak aktif '
        'dan muncul pesan "Pengguna dinonaktifkan".',
        'Untuk mengaktifkan kembali, pilih **Aktifkan** (Activate) pada menu yang '
        'sama.',
        'Untuk menghapus permanen, pilih hapus lalu konfirmasikan pada dialog '
        '**Hapus Pengguna?**.',
    ])
    D.fig_('3.8.1-4a_menu-nonaktifkan.png', 'Menu tindakan menonaktifkan pengguna.')
    D.fig_('3.8.1-4b_pengguna-nonaktif.png', 'Pengguna dengan status tidak aktif.')
    D.note('Utamakan **menonaktifkan** dibandingkan menghapus, agar riwayat '
           'aktivitas dan keterkaitan data pengguna tetap terjaga.')

    D.h2(6, 'Grup Pengguna')
    D.p('Grup pengguna mempermudah pengiriman notifikasi dan undangan kalender ke '
        'sekelompok orang sekaligus, misalnya "All Squad" atau "Tech Team".')
    D.steps([
        'Klik menu **User Groups** (Grup Pengguna) pada kelompok Admin.',
        'Klik tombol **Grup Baru** (New Group).',
        'Isi **Nama Grup**, wajib diisi, dan deskripsi grup bila diperlukan.',
        'Pilih **Anggota** grup. Jumlah yang dipilih tampil sebagai "n dipilih".',
        'Klik **Buat Grup**. Aplikasi menampilkan pesan "Grup dibuat".',
        'Untuk mengubah, pilih grup lalu gunakan **Ubah Grup** dan **Simpan '
        'Perubahan**. Untuk menghapus, konfirmasikan pada dialog "Hapus grup ini?".',
    ])
    D.fig_('panduan-admin-user-groups.png', 'Halaman Grup Pengguna (Admin).')

    D.h2(7, 'Kelola Proyek')
    D.steps([
        'Klik menu **Manage Projects** (Kelola Proyek).',
        'Kartu statistik menampilkan **Total Proyek**, **Tugas Selesai**, '
        '**Sedang Berjalan**, dan **Tugas Terlambat**.',
        'Gunakan kolom **Cari proyek** dan penyaring status untuk menemukan '
        'proyek.',
        'Klik **Lihat Detail** pada sebuah proyek untuk melihat rincian tugas dan '
        'anggotanya.',
        'Gunakan **Ubah Proyek** untuk memperbarui nama, deskripsi, status (Aktif, '
        'Nonaktif, Selesai, Diarsipkan), serta tanggal mulai dan selesai.',
        'Klik **Ekspor PDF** untuk mengunduh rekap proyek.',
    ])
    D.note('Menghapus proyek akan menghapus **seluruh data terkait** proyek '
           'tersebut secara permanen. Konfirmasikan dengan saksama pada dialog '
           '"Hapus Proyek?".', label='Perhatian')
    D.fig_('panduan-admin-projects.png', 'Halaman Kelola Proyek (Admin).')

    D.h2(8, 'Kelola Kalender')
    D.steps([
        'Klik menu **Manage Calendar** (Kelola Kalender).',
        'Halaman menampilkan seluruh acara pada bulan berjalan beserta jumlahnya.',
        'Gunakan **Tambah Acara** untuk membuat acara bagi pengguna mana pun, '
        'lengkap dengan peserta perorangan maupun **Grup Peserta**.',
        'Gunakan **Ubah Acara** untuk memperbarui, dan tindakan hapus untuk '
        'menghapus acara.',
        'Klik **Ekspor PDF**, tentukan **Rentang laporan** (kosongkan untuk '
        'memakai bulan berjalan), lalu klik **Unduh PDF**.',
    ])
    D.fig_('panduan-admin-calendar.png', 'Halaman Kelola Kalender (Admin).')

    D.h2(9, 'Monitor Beban Kerja')
    D.steps([
        'Klik menu **Workload Monitor** (Monitor Beban Kerja).',
        'Pilih proyek pada **Pilih Proyek**, lalu pilih sprint (atau **Semua '
        'sprint**).',
        'Halaman menampilkan **Grafik Burndown**, **Velositas per Sprint**, dan '
        '**Beban Kerja per Anggota** beserta persentase utilisasi.',
        'Ringkasan bawah menampilkan **Total**, **Selesai**, **Estimasi Jam**, dan '
        '**Aktual**.',
        'Klik **Ekspor PDF** untuk mengunduh laporan.',
    ])
    D.fig_('panduan-admin-workload.png', 'Halaman Monitor Beban Kerja (Admin).')

    D.h2(10, 'Bot Telegram')
    D.steps([
        'Klik menu **Telegram Bot** (Bot Telegram).',
        'Halaman mengelompokkan data menjadi **Groups** (Grup), **Connected '
        'Users** (Pengguna Terhubung), dan **Unlinked Chats** (Chat Belum '
        'Tertaut). Kelompok yang tidak memiliki data tidak ditampilkan.',
        'Setiap pengguna yang sudah tertaut diberi penanda **Connected** '
        '(Terhubung) beserta Chat ID-nya.',
        'Untuk menautkan sebuah chat ke akun pengguna, gunakan pilihan **Tautkan '
        'ke pengguna…** pada chat yang bersangkutan di kelompok Unlinked Chats.',
        'Klik **Copy ID** (Salin ID) untuk menyalin Chat ID sebuah grup atau '
        'pengguna.',
        'Klik **Refresh** untuk memuat ulang daftar.',
        'Bila belum ada data sama sekali, aplikasi menampilkan keterangan "Belum '
        'ada yang mengirim pesan ke bot", minta anggota tim mengirim pesan ke bot '
        'terlebih dahulu.',
    ])
    D.fig_('panduan-admin-telegram.png', 'Halaman Bot Telegram (Admin).')

    D.h2(11, 'Konfigurasi e-Sign')
    D.steps([
        'Klik menu **e-Sign Config** (Konfigurasi e-Sign).',
        'Pada bagian **Kredensial API**, isi **URL Dasar**, **Nama Pengguna**, '
        '**Kata Sandi**, dan **Kunci API** layanan BSrE. Kolom kata sandi dapat '
        'dikosongkan bila tidak ingin diubah.',
        'Klik **Simpan Konfigurasi**. Aplikasi menampilkan pesan "Konfigurasi '
        'tanda tangan elektronik disimpan".',
        'Pada bagian **Uji Koneksi**, isi **NIK untuk pengujian** (16 digit), lalu '
        'klik **Uji Koneksi Tanda Tangan Elektronik**.',
        'Hasil pengujian ditampilkan sebagai **Koneksi berhasil**, **Autentikasi '
        'gagal, periksa nama pengguna/kata sandi/kunci API**, atau **Koneksi '
        'gagal**.',
    ])
    D.fig_('probe-admin-tte.png', 'Halaman Konfigurasi e-Sign (Admin).')

    D.h2(12, 'Log Aktivitas')
    D.steps([
        'Klik menu **Activity Log** (Log Aktivitas).',
        'Kartu statistik menampilkan **Total Aktivitas**, **Login Hari Ini**, '
        '**Login Gagal**, dan **Dokumen Ditandatangani**.',
        'Gunakan kolom **Cari berdasarkan nama, email, atau deskripsi**, penyaring '
        '**Semua Aktivitas**, penyaring **Semua Pengguna**, serta penyaring '
        '**Periode** untuk mempersempit hasil.',
        'Tabel menampilkan kolom WAKTU, PENGGUNA, AKTIVITAS, DESKRIPSI, IP, dan '
        'STATUS.',
    ])
    D.p('Jenis aktivitas yang tercatat antara lain: Login, Logout, Login Gagal, '
        'Buat CR, Tanda Tangan CR, Tanda Tangan Elektronik Dokumen, Unggah '
        'Dokumen, dan Tambah Aset.')
    D.fig_('3.8.3-1_riwayat-login-aktivitas.png', 'Halaman Log Aktivitas (Admin).')
    D.pagebreak()


def bab16_troubleshooting(D):
    D.h1('Penanganan Kendala Umum (Troubleshooting)')
    D.table(['No.', 'Kendala', 'Penyebab Umum', 'Solusi'], [
        ['1', 'Tidak dapat masuk; muncul pesan "Email atau kata sandi salah."',
         'Kredensial keliru, atau akun telah dinonaktifkan Administrator.',
         'Periksa kembali email dan kata sandi (perhatikan huruf besar/kecil). '
         'Bila tetap gagal, hubungi Administrator untuk memastikan status akun '
         'dan melakukan pengaturan ulang kata sandi.'],
        ['2', 'Menu tertentu tidak tampil pada sidebar.',
         'Peran atau privilege Anda tidak mencakup menu tersebut.',
         'Menu menyesuaikan peran. Ajukan permohonan penyesuaian peran atau '
         'privilege kepada Administrator melalui menu Kelola Pengguna.'],
        ['3', 'Muncul halaman "Akses Ditolak" saat membuka proyek.',
         'Anda bukan anggota proyek tersebut.',
         'Hubungi Project Manager proyek agar menambahkan Anda pada tab Members.'],
        ['4', 'Dokumen e-Sign gagal ditandatangani.',
         'Ukuran berkas melebihi 20 MB, passphrase salah, NIK belum diisi, atau '
         'layanan BSrE sedang tidak tersedia.',
         'Pastikan berkas PDF di bawah 20 MB dan NIK sudah diisi pada menu '
         'Pengaturan. Periksa kembali passphrase. Bila tetap gagal, minta '
         'Administrator menguji koneksi pada menu Konfigurasi e-Sign.'],
        ['5', 'Tombol tanda tangan tidak aktif pada Distribusi e-Sign.',
         'Belum giliran Anda dalam urutan penanda tangan.',
         'Tunggu hingga penanda tangan sebelumnya menyelesaikan bagiannya. '
         'Penanda **Giliran Anda!** akan muncul bila sudah waktunya.'],
        ['6', 'Notifikasi Telegram tidak diterima.',
         'Chat ID belum diisi, atau Anda belum pernah mengirim pesan ke bot.',
         'Kirim perintah /start ke @BLPIDWorkloadBot, salin Chat ID, lalu isikan '
         'pada Pengaturan → Notifikasi.'],
        ['7', 'Data beban kerja atau laporan tidak muncul.',
         'Proyek dan/atau sprint belum dipilih, atau sprint belum memiliki data.',
         'Lengkapi seluruh filter yang ditandai WAJIB. Pastikan sprint sudah '
         'dimulai dan memiliki tugas.'],
        ['8', 'Ekspor PDF gagal.',
         'Filter belum lengkap atau proses ekspor melampaui batas waktu.',
         'Pastikan proyek sudah dipilih, lalu ulangi ekspor beberapa saat '
         'kemudian.'],
        ['9', 'Unggahan berkas ditolak pada menu Penyimpanan.',
         'Kuota penyimpanan hampir penuh atau ukuran berkas terlalu besar.',
         'Periksa keterangan pemakaian kuota di bagian atas halaman Penyimpanan. '
         'Hapus berkas yang tidak diperlukan atau hubungi Administrator.'],
        ['10', 'Berkas internal tidak terlihat oleh rekan kerja.',
         'Visibilitas folder/berkas masih Privat.',
         'Ubah visibilitas menjadi Internal. Berkas akan muncul pada tab '
         '"Internal / Bersama" bagi pengguna lain.'],
        ['11', 'Halaman tidak dapat diakses atau tampil kosong.',
         'Gangguan jaringan internal, sesi telah berakhir, atau sedang ada '
         'pemeliharaan sistem.',
         'Muat ulang halaman (F5). Bila diarahkan ke halaman masuk, lakukan '
         'login kembali. Bila berlanjut, hubungi tim dukungan.'],
        ['12', 'Perubahan tidak tersimpan.',
         'Ada kolom wajib yang belum terisi.',
         'Perhatikan pesan galat yang muncul, misalnya "Judul dan tanggal mulai '
         'wajib diisi" atau "Pilih minimal 1 penilai", lalu lengkapi kolom '
         'tersebut.'],
    ], widths=[0.4, 1.5, 1.7, 2.4])
    D.pagebreak()


def bab17_faq(D):
    D.h1('Pertanyaan yang Sering Diajukan (FAQ)')

    def qa(q, a):
        D.h3(q)
        D.p(a)

    qa('Bagaimana cara mengubah bahasa aplikasi menjadi bahasa Indonesia?',
       'Buka menu Settings (Pengaturan) pada bagian bawah sidebar, lalu pilih '
       'Bahasa Indonesia pada bagian pilihan bahasa. Pilihan ini tersimpan pada '
       'peramban Anda dan tetap berlaku pada kunjungan berikutnya.')

    qa('Saya lupa kata sandi. Apa yang harus dilakukan?',
       'Hubungi Administrator ConnectOne untuk melakukan pengaturan ulang kata '
       'sandi melalui menu Kelola Pengguna. Setelah menerima kata sandi '
       'sementara, segera ganti melalui Pengaturan → Keamanan.')

    qa('Apa perbedaan menu e-Sign dan e-Sign Distribution?',
       'Menu e-Sign digunakan bila dokumen cukup ditandatangani oleh Anda sendiri. '
       'Menu e-Sign Distribution digunakan bila dokumen harus ditandatangani '
       'beberapa orang secara berurutan, lalu didistribusikan kepada penerima '
       'atau grup penerima.')

    qa('Berapa ukuran maksimum berkas yang dapat ditandatangani?',
       'Maksimum 20 MB per dokumen PDF, berlaku pada menu e-Sign maupun e-Sign '
       'Distribution.')

    qa('Apakah passphrase tanda tangan saya disimpan oleh aplikasi?',
       'Tidak. Passphrase hanya digunakan pada saat proses penandatanganan '
       'berlangsung dan tidak pernah disimpan dalam sistem. Dokumen ditandatangani '
       'menggunakan sertifikat elektronik yang diterbitkan oleh BSrE.')

    qa('Apa perbedaan menu Storage dan Official Documents?',
       'Storage digunakan untuk berkas kerja sehari-hari yang ditata dalam folder. '
       'Official Documents digunakan untuk dokumen resmi bernomor yang memiliki '
       'kategori, masa berlaku, riwayat versi, serta pengingat perpanjangan '
       'otomatis.')

    qa('Kapan pengingat dokumen kedaluwarsa dikirim?',
       'Pengingat perpanjangan dikirimkan kepada pemilik dokumen pada 30 hari, '
       '14 hari, dan 3 hari sebelum tanggal kedaluwarsa.')

    qa('Mengapa saya tidak dapat memulai sprint baru?',
       'Dalam satu proyek hanya boleh ada satu sprint aktif. Selesaikan sprint '
       'yang sedang berjalan terlebih dahulu melalui tombol Complete pada tab '
       'Sprints.')

    qa('Mengapa acara kalender saya tidak terlihat oleh rekan kerja?',
       'Kemungkinan acara diatur sebagai Private (Privat), sehingga hanya '
       'terlihat oleh Anda dan peserta yang diundang. Ubah visibilitas menjadi '
       'Public (Publik) atau tambahkan rekan Anda sebagai peserta.')

    qa('Siapa yang dapat mengubah data aset fisik?',
       'Hanya penanggung jawab (custodian) aset tersebut dan Administrator.')

    qa('Apakah notifikasi otomatis ditandai sudah dibaca ketika saya membukanya?',
       'Tidak. Penandaan dilakukan secara sengaja agar tidak ada tindakan yang '
       'terlewat. Gunakan tombol "Tandai semua telah dibaca" bila diperlukan.')

    qa('Bagaimana cara memastikan sebuah dokumen benar-benar asli?',
       'Gunakan tombol Verify (Verifikasi) pada menu e-Sign, atau Verifikasi '
       'e-Sign pada menu e-Sign Distribution. Sistem akan menampilkan status '
       'keabsahan tanda tangan, integritas berkas, dan keterpercayaan sertifikat.')
    D.pagebreak()


def bab18_kontak(D):
    D.h1('Bantuan dan Kontak')
    D.p('Apabila Anda mengalami kendala yang tidak tercantum dalam dokumen ini, '
        'silakan menghubungi:')
    D.kv_table([
        ('Unit', '[Tim Dukungan ConnectOne / BLPID]'),
        ('Email', '[email dukungan]'),
        ('Telepon / Ekstensi', '[nomor]'),
        ('Jam Layanan', '[Senin s.d. Jumat, 08.00 s.d. 16.00 WIB]'),
    ])
    D.p('Saat melaporkan kendala, sertakan informasi berikut agar penanganan lebih '
        'cepat:')
    D.bullets([
        'Nama pengguna dan peran Anda.',
        'Menu atau halaman tempat kendala terjadi.',
        'Langkah yang dilakukan sebelum kendala muncul.',
        'Pesan galat yang tampil (bila ada) beserta tangkapan layarnya.',
        'Tanggal dan jam kejadian.',
    ])
