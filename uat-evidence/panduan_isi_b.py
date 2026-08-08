"""Isi Buku Panduan ConnectOne, bagian B: Bab 6 s.d. Bab 10."""


def bab6_proyek(D):
    D.h1('Manajemen Proyek')
    D.p('Menu **Projects** (Proyek) adalah pusat pengelolaan pekerjaan dengan '
        'kerangka kerja Scrum. Satu proyek memuat anggota, epik, backlog, sprint, '
        'dan papan Kanban. Alur kerja yang disarankan: **buat proyek → tambahkan '
        'anggota → susun epik → susun backlog → buat sprint → masukkan backlog ke '
        'sprint → mulai sprint → kerjakan melalui papan Kanban → selesaikan '
        'sprint**.')

    D.h2(1, 'Melihat Daftar Proyek')
    D.steps([
        'Klik menu **Projects** pada sidebar.',
        'Kartu statistik di bagian atas menampilkan **Total Projects**, **Active** '
        '(Aktif), **Needs Attention** (Perlu Perhatian, berisiko/menunggu), dan '
        '**Completed** (Selesai).',
        'Gunakan kolom **Search projects** (Cari proyek) untuk mencari proyek '
        'berdasarkan nama.',
        'Gunakan penyaring **Status** untuk menampilkan proyek dengan status '
        'tertentu, dan penyaring **Sort** (Urutkan) untuk mengurutkan berdasarkan '
        'tanggal jatuh tempo, nama, atau status.',
        'Tabel menampilkan kolom PROJECT (Proyek), OWNER (Pemilik), TEAM (Tim), '
        'STATUS, PROGRESS (Progres), dan DUE (Jatuh Tempo).',
        'Klik salah satu baris proyek untuk membuka halaman detail proyek.',
    ])
    D.fig_('3.4.1-2_daftar-proyek.png', 'Halaman daftar proyek.')

    D.h2(2, 'Membuat Proyek Baru')
    D.steps([
        'Pada halaman **Projects**, klik tombol **New project** (Proyek baru) di '
        'kanan atas.',
        'Isi **NAMA** proyek, kolom ini wajib diisi.',
        'Isi **DESKRIPSI** berupa ruang lingkup dan tujuan proyek.',
        'Tentukan **TANGGAL MULAI** dan **TANGGAL SELESAI** proyek.',
        'Isi **DIVISI**, yaitu nama divisi atau unit yang menaungi proyek.',
        'Klik **Create project** (Buat proyek). Aplikasi menampilkan pesan '
        '"Proyek berhasil dibuat!" dan proyek baru langsung muncul pada daftar.',
    ])
    D.fig_('3.4.1-1a_form-buat-proyek.png', 'Formulir pembuatan proyek baru.')
    D.fig_('3.4.1-1b_proyek-baru-di-daftar.png', 'Proyek baru muncul pada daftar proyek.')
    D.note('Tombol pembuatan proyek hanya tampil bagi peran yang memiliki '
           'privilege "Membuat proyek baru". Bila tombol tidak terlihat, hubungi '
           'Administrator untuk penyesuaian privilege.')

    D.h2(3, 'Halaman Detail Proyek')
    D.p('Halaman detail proyek terbagi menjadi lima tab.')
    D.table(['Tab', 'Isi'], [
        ['Overview (Ringkasan)', 'Detail proyek (divisi, tanggal mulai dan '
         'selesai), sprint yang sedang aktif, serta ringkasan jumlah sprint, '
         'epik, dan anggota.'],
        ['Board (Papan)', 'Pintasan menuju papan Kanban proyek.'],
        ['Sprints (Sprint)', 'Daftar seluruh sprint beserta tombol untuk membuat, '
         'memulai, dan menyelesaikan sprint.'],
        ['Epics (Epik)', 'Daftar epik dan item backlog yang berada di bawahnya.'],
        ['Members (Anggota)', 'Daftar anggota proyek dan pengelolaannya.'],
    ], widths=[1.8, 4.2])
    D.p('Di kanan atas halaman tersedia dua tombol pintasan: **Roadmap** (Peta '
        'Jalan) dan **Open Board** (Buka Papan).')
    D.fig_('panduan-project-detail.png', 'Halaman detail proyek, tab Overview.')
    D.note('Bila Anda bukan anggota proyek, aplikasi menampilkan halaman '
           '**Akses Ditolak** dengan keterangan untuk menghubungi Project Manager.')

    D.h2(4, 'Mengelola Anggota Proyek')
    D.p('Anggota dapat ditambahkan **per orang**, **per grup pengguna**, atau '
        'keduanya sekaligus dalam satu kali proses.')
    D.steps([
        'Buka detail proyek, lalu klik tab **Members** (Anggota).',
        'Klik tombol **+ Add Member** (Tambah Anggota).',
        'Pada bagian **Perorangan**, gunakan kolom pencarian untuk menyaring '
        'daftar, lalu centang nama pengguna yang akan ditambahkan. Jumlah yang '
        'dipilih tampil sebagai penanda "n dipilih".',
        'Pada bagian **Grup Pengguna**, centang grup yang ingin dimasukkan. '
        'Jumlah anggota tiap grup tampil di bawah namanya.',
        'Tentukan **Project Role** (Peran Proyek): **Member** (Anggota), '
        '**Scrum Master**, atau **Manager** (Manajer). Peran ini berlaku untuk '
        'semua orang yang ditambahkan pada proses tersebut.',
        'Klik **+ Add Member**. Aplikasi menampilkan jumlah anggota yang '
        'berhasil ditambahkan dan daftar anggota langsung diperbarui.',
    ])
    D.note('Bila Anda memilih sebuah grup, **seluruh anggota grup tersebut '
           'langsung menjadi anggota proyek**, sehingga mereka dapat ditugaskan '
           'task dan disebut (mention) pada komentar. Pengguna yang sudah '
           'terdaftar tidak akan terduplikasi. Grup pengguna dikelola '
           'Administrator melalui menu **User Groups** (lihat sub-bab 15.6).')
    D.fig_('3.4.1-4a_tab-anggota.png', 'Tab Members pada detail proyek.')
    D.fig_('panduan-proyek-tambah-anggota-grup.png',
           'Formulir penambahan anggota proyek: pilihan Perorangan dan Grup Pengguna.')
    D.fig_('3.4.1-4c_anggota-terdaftar.png', 'Anggota baru terdaftar pada proyek.')

    D.h2(5, 'Mengelola Epik')
    D.p('Epik adalah kelompok pekerjaan besar yang menaungi beberapa item backlog, '
        'misalnya "Modul Autentikasi" atau "Integrasi BSrE".')
    D.steps([
        'Buka detail proyek, lalu klik tab **Epics** (Epik).',
        'Klik tombol **+ Create Epic** (Buat Epik).',
        'Isi **Judul Epik** dan **Deskripsi** epik.',
        'Pilih **Warna** penanda epik agar mudah dibedakan pada papan dan daftar.',
        'Tentukan status awal epik (bawaan: **Belum Dimulai**).',
        'Klik **+ Buat Epik**. Aplikasi menampilkan pesan "Epik berhasil dibuat!" '
        'dan epik muncul pada daftar.',
    ])
    D.fig_('3.4.2-1a_tab-epic.png', 'Tab Epics pada detail proyek.')
    D.fig_('3.4.2-1b_form-tambah-epic.png', 'Formulir pembuatan epik.')
    D.fig_('3.4.2-1c_epic-di-daftar.png', 'Epik baru muncul pada daftar epik proyek.')

    D.h2(6, 'Mengelola Backlog')
    D.p('Backlog adalah daftar item pekerjaan yang belum masuk ke dalam sprint. '
        'Setiap item backlog berada di bawah sebuah epik.')
    D.steps([
        'Pada tab **Epics**, klik epik yang dituju untuk memperluas (expand) '
        'daftar item backlog di bawahnya.',
        'Klik tombol tambah backlog (**Add Backlog** / Tambah Backlog) pada epik '
        'tersebut.',
        'Isi **Judul Backlog**, jelaskan pekerjaan secara singkat. Kolom ini '
        'wajib diisi.',
        'Isi **Deskripsi** untuk detail tambahan.',
        'Tentukan **Prioritas** dan **Tipe** item: **Story**, **Bug**, **Fitur**, '
        'atau **Tugas**.',
        'Isi **Story Points** (ukuran pekerjaan), **Estimasi (Jam)**, dan '
        '**Tanggal Jatuh Tempo** bila diperlukan.',
        'Klik **+ Tambah Backlog**. Aplikasi menampilkan pesan "Backlog berhasil '
        'dibuat!" dan item muncul di bawah epiknya dengan penanda **Backlog** '
        '(belum masuk sprint).',
    ])
    D.fig_('3.4.2-2a_epic-diperluas.png', 'Epik yang diperluas menampilkan item backlog di bawahnya.')
    D.fig_('3.4.2-2b_form-tambah-backlog.png', 'Formulir penambahan item backlog.')
    D.fig_('3.4.2-2c_backlog-di-daftar.png', 'Item backlog baru pada daftar.')

    D.h2(7, 'Mengelola Sprint')
    D.h3('a. Membuat Sprint Baru')
    D.steps([
        'Buka detail proyek, lalu klik tab **Sprints** (Sprint).',
        'Klik tombol **Create Sprint** (Buat Sprint).',
        'Isi **Nama Sprint**, misalnya "Sprint 1".',
        'Isi **Tujuan Sprint**, sasaran yang ingin dicapai pada sprint tersebut.',
        'Tentukan **Tanggal Mulai** dan **Tanggal Selesai** sprint.',
        'Klik **+ Buat Sprint**. Aplikasi menampilkan pesan "Sprint berhasil '
        'dibuat!" dan sprint muncul pada daftar dengan status **Planned** '
        '(Direncanakan).',
    ])
    D.fig_('4.1-1a_tab-sprint.png', 'Tab Sprints pada detail proyek.')
    D.fig_('4.1-1b_form-buat-sprint.png', 'Formulir pembuatan sprint.')
    D.fig_('4.1-1c_sprint-terbuat.png', 'Sprint baru muncul pada daftar sprint.')

    D.h3('b. Memasukkan Backlog ke dalam Sprint')
    D.steps([
        'Pada tab **Sprints**, pilih sprint yang dituju.',
        'Klik tombol **Add Backlog** (Tambah Backlog).',
        'Dialog **Pilih Backlog untuk Sprint** menampilkan seluruh item backlog '
        'yang belum masuk sprint mana pun, lengkap dengan story point-nya.',
        'Centang item backlog yang akan dimasukkan. Jumlah yang dipilih tampil '
        'sebagai "**n dipilih**".',
        'Klik **Tambah (n)**. Aplikasi menampilkan pesan "n backlog ditambahkan '
        'ke sprint!" dan item berpindah ke dalam sprint dengan penanda **Dalam '
        'sprint**.',
    ])
    D.fig_('4.1-3b_modal-pilih-backlog.png', 'Dialog pemilihan backlog untuk sprint.')
    D.fig_('4.1-3d_backlog-masuk-sprint.png', 'Backlog yang telah masuk ke dalam sprint.')

    D.h3('c. Memulai Sprint')
    D.steps([
        'Pada tab **Sprints**, temukan sprint berstatus **Planned** '
        '(Direncanakan).',
        'Klik tombol **Start Sprint** (Mulai Sprint).',
        'Aplikasi menampilkan pesan "Sprint dimulai!" dan status sprint berubah '
        'menjadi **Active** (Aktif). Sprint aktif juga tampil pada tab Overview.',
    ])
    D.fig_('4.1-2a_sprint-sebelum-dimulai.png', 'Sprint sebelum dimulai (status Planned).')
    D.fig_('4.1-2b_sprint-aktif.png', 'Sprint setelah dimulai (status Active).')
    D.note('Dalam satu proyek hanya boleh ada satu sprint aktif pada satu waktu. '
           'Selesaikan sprint yang sedang berjalan sebelum memulai sprint '
           'berikutnya.')

    D.h3('d. Menyelesaikan Sprint')
    D.steps([
        'Pada tab **Sprints**, temukan sprint berstatus **Active** (Aktif).',
        'Klik tombol **Complete** (Selesaikan).',
        'Aplikasi menampilkan pesan "Sprint selesai!" dan status sprint berubah '
        'menjadi **Completed** (Selesai). Data sprint tersebut selanjutnya '
        'diperhitungkan pada grafik velositas.',
    ])
    D.fig_('4.1-5b_sprint-selesai.png', 'Sprint yang telah diselesaikan.')

    D.h2(8, 'Papan Kanban')
    D.p('Papan Kanban menampilkan seluruh tugas sprint dalam kolom-kolom status '
        'sehingga kemajuan pekerjaan mudah dipantau.')
    D.steps([
        'Buka detail proyek, lalu klik tab **Board** (Papan) atau tombol **Open '
        'Kanban Board** (Buka Papan Kanban).',
        'Papan menampilkan empat kolom: **To Do** (Belum Dimulai), **In Progress** '
        '(Sedang Berjalan), **Review** (Ditinjau), dan **Done** (Selesai).',
        'Untuk mengubah status sebuah tugas, arahkan kursor ke kartu tugas lalu '
        'gunakan pilihan **Move to** (Pindahkan ke) dan pilih kolom tujuan. Kartu '
        'juga dapat diseret (drag) antarkolom.',
        'Klik kartu tugas untuk membuka halaman detail tugas.',
        'Klik **Add Backlog** (Tambah Backlog) untuk menarik item backlog sprint '
        'ini ke papan; pilih item dan tentukan **Penanggung Jawab** (Assignee).',
        'Klik **Back to Project** (Kembali ke Proyek) untuk kembali ke detail '
        'proyek.',
    ])
    D.fig_('4.1-4_board-kanban.png', 'Papan Kanban proyek.')

    D.h2(9, 'Peta Jalan (Roadmap)')
    D.p('Halaman **Roadmap** (Peta Jalan) menampilkan seluruh sprint proyek dalam '
        'bentuk linimasa sehingga rencana jangka panjang terlihat secara utuh.')
    D.steps([
        'Buka halaman detail proyek.',
        'Klik tombol **Roadmap** (Peta Jalan) di kanan atas, bersebelahan dengan '
        'tombol **Open Board**.',
        'Linimasa sprint proyek akan ditampilkan.',
    ])
    D.bullets([
        'Setiap batang pada linimasa mewakili satu sprint, lengkap dengan tanggal '
        'mulai, tanggal selesai, dan durasinya dalam hari.',
        'Garis merah bertanda **Today** menunjukkan posisi hari ini pada linimasa.',
        'Warna batang mengikuti status sprint sesuai keterangan di kanan atas: '
        '**Active** (Aktif), **Completed** (Selesai), dan **Planned** '
        '(Direncanakan).',
        'Klik **Back to Project** (Kembali ke Proyek) untuk kembali ke halaman '
        'detail proyek.',
        'Bila proyek belum memiliki sprint, halaman menampilkan keterangan '
        '"No sprints yet, Create a sprint to view the roadmap".',
    ])
    D.fig_('panduan-roadmap.png', 'Halaman Roadmap (Peta Jalan) proyek.')
    D.pagebreak()


def bab7_tugas(D):
    D.h1('Manajemen Tugas')
    D.p('Menu **Tasks** (Tugas) menampilkan seluruh tugas lintas proyek yang dapat '
        'Anda akses, sedangkan halaman detail tugas digunakan untuk mengerjakan, '
        'melaporkan kemajuan, dan berdiskusi.')

    D.h2(1, 'Melihat dan Menyaring Daftar Tugas')
    D.steps([
        'Klik menu **Tasks** pada sidebar.',
        'Subjudul halaman menampilkan rekap: jumlah seluruh tugas, tugas yang '
        'sedang berjalan, dan tugas yang terlambat.',
        'Kartu statistik menampilkan **Open Tasks** (Tugas Terbuka), **In '
        'Progress** (Sedang Berjalan), **Overdue** (Terlambat), dan **Completed** '
        '(Selesai).',
        'Gunakan tab penyaring: **All** (Semua), **Mine** (Saya), **Overdue** '
        '(Terlambat), **Due today** (Jatuh tempo hari ini), dan **Done** '
        '(Selesai).',
        'Gunakan kolom **Search tasks** (Cari tugas) untuk mencari berdasarkan '
        'judul tugas.',
        'Tabel menampilkan kolom TASK (Tugas), ASSIGNEE (Penanggung Jawab), '
        'PRIORITY (Prioritas), STATUS, PROGRESS (Progres), dan DUE (Jatuh Tempo).',
        'Klik baris tugas untuk membuka detailnya.',
    ])
    D.fig_('probe-tasks-list.png', 'Halaman daftar tugas.')

    D.h2(2, 'Halaman Detail Tugas')
    D.p('Halaman detail tugas memuat deskripsi pekerjaan, progres, komentar, serta '
        'panel informasi di sisi kanan.')
    D.bullets([
        '**Detail Tugas**: tipe, tanggal jatuh tempo, estimasi jam, jam aktual, '
        'dan tanggal pembuatan. Tugas yang melewati tenggat diberi penanda '
        '**Terlambat**.',
        '**Penanggung Jawab (Assignee)** dan **Penanggung Jawab Tambahan '
        '(Co-Assignee)**, daftar orang yang mengerjakan tugas.',
        '**Progres Pekerjaan**: indikator kemajuan dan pengubah status.',
        '**Komentar**: ruang diskusi antaranggota tim.',
        'Klik **Kembali ke Tugas** (Back to Tasks) untuk kembali ke daftar tugas.',
    ])
    D.fig_('3.7.1-1a_detail-task.png', 'Halaman detail tugas.')

    D.h2(3, 'Mengubah Status Tugas')
    D.steps([
        'Buka halaman detail tugas.',
        'Pada bagian **Progres Pekerjaan**, gunakan pilihan **Ubah status:**.',
        'Pilih status baru: **To Do** (Belum Dimulai), **In Progress** (Sedang '
        'Berjalan), **Review** (Ditinjau), atau **Done** (Selesai).',
        'Aplikasi menampilkan pesan "Status berhasil diperbarui!" dan indikator '
        'progres langsung menyesuaikan.',
    ])
    D.fig_('3.4.3-1a_task-status-awal.png', 'Tugas dengan status awal.')
    D.fig_('3.4.3-1b_status-sedang-berjalan.png', 'Status tugas diubah menjadi In Progress.')
    D.fig_('3.4.3-1c_status-selesai.png', 'Status tugas diubah menjadi Done.')

    D.h2(4, 'Menetapkan Penanggung Jawab')
    D.steps([
        'Buka halaman detail tugas.',
        'Pada panel **Penanggung Jawab**, klik tombol **Assign** (Tetapkan).',
        'Dialog **Tetapkan Tugas** menampilkan daftar anggota tim proyek.',
        'Pilih satu atau beberapa anggota yang akan mengerjakan tugas.',
        'Klik **Simpan (n)**. Aplikasi menampilkan pesan "Tugas berhasil '
        'ditetapkan!" dan nama penanggung jawab muncul pada panel.',
        'Anggota yang ditetapkan menerima notifikasi di dalam aplikasi maupun '
        'melalui Telegram.',
    ])
    D.fig_('3.7.1-1b_pilih-assignee.png', 'Dialog penetapan penanggung jawab tugas.')
    D.fig_('3.7.1-1c_task-ditetapkan.png', 'Tugas setelah penanggung jawab ditetapkan.')
    D.fig_('panduan-notifications.png',
           'Notifikasi penugasan yang diterima penanggung jawab di dalam aplikasi.')

    D.h2(5, 'Mencatat Waktu Kerja')
    D.steps([
        'Buka halaman detail tugas.',
        'Klik tombol **Catat Waktu** (Log Time).',
        'Isi **Jam Kerja**, jumlah jam yang dihabiskan.',
        'Isi **Deskripsi** pekerjaan yang dilakukan.',
        'Tentukan **Tanggal** pencatatan.',
        'Simpan. Aplikasi menampilkan pesan "Waktu berhasil dicatat!" dan nilai '
        '**Aktual** pada Detail Tugas bertambah.',
    ])
    D.note('Waktu yang dicatat menjadi dasar laporan **Pelacakan Waktu** '
           '(Time Tracking) dan perhitungan beban kerja anggota tim.')

    D.h2(6, 'Komentar dan Penyebutan (Mention)')
    D.steps([
        'Buka halaman detail tugas dan gulir ke bagian **Komentar**.',
        'Ketik komentar Anda pada kolom yang tersedia.',
        'Untuk menyebut rekan tim, ketik tanda **@** lalu awal nama orang '
        'tersebut. Daftar saran nama akan muncul otomatis; pilih salah satu.',
        'Tekan **Enter** untuk mengirim komentar, atau **Shift+Enter** untuk '
        'membuat baris baru.',
        'Komentar tersimpan dan langsung tampil pada daftar komentar. Pengguna '
        'yang disebut menerima notifikasi jenis **Sebutan (Mention)**.',
    ])
    D.fig_('3.4.3-2a_tulis-komentar.png', 'Menulis komentar pada tugas.')
    D.fig_('3.4.3-2b_komentar-tersimpan.png', 'Komentar tersimpan pada tugas.')
    D.fig_('3.4.3-3a_autocomplete-mention.png',
           'Daftar saran nama muncul setelah mengetik tanda @.')
    D.fig_('3.4.3-3c_mention-terkirim.png',
           'Komentar dengan penyebutan terkirim dan notifikasi diteruskan ke pengguna terkait.')
    D.pagebreak()


def bab8_beban_kerja(D):
    D.h1('Pemantauan Beban Kerja')
    D.p('Menu **Workload** (Beban Kerja) menampilkan kapasitas dan beban tiap '
        'anggota tim pada sebuah sprint, disertai grafik burndown dan velositas. '
        'Menu ini tersedia bagi peran Kepala Balai, Kepala Seksi, Project Manager, '
        'dan Scrum Master.')

    D.h2(1, 'Menampilkan Data Beban Kerja')
    D.steps([
        'Klik menu **Workload** pada sidebar.',
        'Pilih proyek pada tarik-turun **Select Project** (Pilih Proyek).',
        'Pilih sprint pada tarik-turun **Select Sprint** (Pilih Sprint). Sprint '
        'yang sedang berjalan diberi keterangan **(aktif)**.',
        'Data langsung dimuat setelah proyek dan sprint dipilih. Sebelum keduanya '
        'dipilih, halaman menampilkan pesan "Pilih proyek dan sprint".',
    ])
    D.fig_('3.4.4-1_beban-kerja-tim.png', 'Halaman beban kerja tim.')

    D.h2(2, 'Membaca Kartu Statistik')
    D.table(['Kartu', 'Arti'], [
        ['Average Utilization\n(Rata-rata Utilisasi)', 'Rata-rata persentase '
         'pemakaian kapasitas seluruh anggota tim pada sprint terpilih.'],
        ['Overloaded\n(Kelebihan Beban)', 'Jumlah anggota dengan utilisasi di atas '
         '100%.'],
        ['Available\n(Tersedia)', 'Jumlah anggota dengan utilisasi di bawah 40%, '
         'yaitu yang masih dapat menerima pekerjaan tambahan.'],
        ['Sprint Velocity\n(Velositas Sprint)', 'Jumlah story point yang '
         'diselesaikan pada sprint terpilih.'],
    ], widths=[2.0, 4.0])

    D.h2(3, 'Beban Kerja per Anggota dan Penyaringan')
    D.steps([
        'Gulir ke tabel **Workload per member** (Beban kerja per anggota). Tabel '
        'diurutkan berdasarkan besarnya beban.',
        'Kolom yang ditampilkan: MEMBER (Anggota), TASKS (Tugas), LOGGED '
        '(Tercatat), LOAD (Beban), dan CAPACITY (Kapasitas).',
        'Kolom **CAPACITY** memberi label kondisi: **Overloaded** (Kelebihan '
        'Beban), **Near Limit** (Mendekati Batas), **Healthy** (Sehat), atau '
        '**Available** (Tersedia).',
        'Untuk menelaah satu orang saja, gunakan tarik-turun **All Members** '
        '(Semua Anggota) dan pilih nama yang dituju. Tabel dan grafik akan '
        'menyesuaikan.',
    ])
    D.fig_('3.4.4-2a_beban-kerja-semua-anggota.png',
           'Beban kerja seluruh anggota tim pada sprint terpilih.')
    D.fig_('3.4.4-2b_filter-satu-anggota.png', 'Tampilan setelah disaring untuk satu anggota.')
    D.fig_('3.4.4-3_kapasitas-vs-aktual.png',
           'Perbandingan kapasitas terhadap beban aktual tiap anggota.')

    D.h2(4, 'Grafik Burndown dan Velositas')
    D.bullets([
        '**Burndown**: membandingkan sisa pekerjaan **Aktual** terhadap garis '
        '**Ideal** sepanjang sprint. Garis aktual yang berada di atas garis ideal '
        'menandakan pekerjaan berjalan lebih lambat dari rencana.',
        '**Velositas**: jumlah story point yang diselesaikan pada tiap sprint, '
        'berguna untuk memperkirakan kapasitas sprint berikutnya.',
        'Bila sprint belum memiliki data, aplikasi menampilkan keterangan "Belum '
        'ada data burndown" atau "Tidak ada data velositas".',
    ])
    D.fig_('panduan-workload-charts.png',
           'Grafik Burndown (Actual terhadap Ideal) dan Velocity pada halaman Beban Kerja.')

    D.h2(5, 'Mengekspor Data Beban Kerja')
    D.steps([
        'Pastikan proyek dan sprint sudah dipilih.',
        'Klik tombol **Export PDF** (Ekspor PDF) di kanan atas.',
        'Berkas PDF terunduh dan aplikasi menampilkan pesan "Laporan berhasil '
        'diunduh".',
    ])
    D.fig_('panduan-workload-charts.png',
           'Tombol Export PDF berada di kanan atas, bersebelahan dengan penyaring '
           'proyek, sprint, dan anggota.')
    D.note('Tombol ekspor baru aktif setelah proyek dan sprint dipilih. Tombol ini '
           'hanya tampil bagi pengguna yang memiliki privilege **Mengekspor '
           'laporan ke berkas**; peran Scrum Master dan Staf tidak memilikinya '
           'secara bawaan. Hubungi Administrator bila Anda memerlukannya.')
    D.pagebreak()


def bab9_laporan(D):
    D.h1('Laporan')
    D.p('Menu **Reports** (Laporan) menghasilkan laporan analitik proyek. '
        'Pratinjau di layar memakai tata letak yang sama persis dengan berkas PDF '
        'yang diekspor, sehingga hasil cetak dapat dipastikan sebelum diunduh. '
        'Menu ini tersedia bagi peran Kepala Balai, Kepala Seksi, dan Project '
        'Manager.')

    D.h2(1, 'Jenis Laporan')
    D.table(['Tab', 'Isi Laporan', 'Filter Wajib'], [
        ['Workload\n(Beban Kerja)', 'Distribusi tugas dan progres per anggota tim.',
         'Proyek'],
        ['Sprint', 'Rincian status tugas dan tingkat penyelesaian satu sprint.',
         'Proyek + Sprint'],
        ['Time Tracking\n(Pelacakan Waktu)', 'Daftar entri log waktu: tugas, '
         'sprint, jumlah jam, dan tanggal.', 'Proyek + Rentang tanggal'],
        ['Velocity\n(Kecepatan)', 'Perbandingan story point direncanakan terhadap '
         'yang diselesaikan tiap sprint.', 'Proyek'],
        ['Portfolio\n(Portofolio)', 'Rekap lintas proyek.', 'Proyek'],
    ], widths=[1.5, 3.2, 1.3])

    D.h2(2, 'Membuat Laporan')
    D.steps([
        'Klik menu **Reports** pada sidebar.',
        'Pilih tab jenis laporan yang dikehendaki.',
        'Isi filter yang ditandai **REQUIRED** (WAJIB): pilih proyek, dan bila '
        'diperlukan pilih sprint atau rentang tanggal. Selama filter wajib belum '
        'lengkap, aplikasi menampilkan petunjuk seperti "Pilih proyek untuk '
        'melanjutkan".',
        'Setelah filter lengkap, pratinjau laporan tampil dengan penanda '
        '**PRATINJAU LANGSUNG: SAMA PERSIS DENGAN ISI PDF** dan format halaman '
        '**A4 · POTRET**.',
    ])
    D.fig_('panduan-reports.png', 'Halaman laporan dengan pratinjau langsung.')


    D.h2(3, 'Mengekspor Laporan ke PDF')
    D.steps([
        'Pastikan pratinjau laporan sudah tampil sesuai kebutuhan.',
        'Klik tombol **Export PDF** (Ekspor PDF) di kanan atas.',
        'Tombol berubah menjadi **Exporting…** (Mengekspor…) selama proses '
        'berlangsung.',
        'Berkas PDF akan terunduh ke folder unduhan peramban Anda. Bila gagal, '
        'aplikasi menampilkan pesan "Ekspor gagal", coba ulangi beberapa saat '
        'kemudian.',
    ])
    D.fig_('panduan-reports.png',
           'Tombol Export PDF tersedia di kanan atas dan pada panel EXPORT di samping pratinjau.')
    D.pagebreak()


def bab10_change_request(D):
    D.h1('Manajemen Perubahan (Change Request)')
    D.p('Menu **Change Management** (Manajemen Perubahan) digunakan untuk '
        'mengajukan, meninjau, menyetujui, dan menandatangani permohonan perubahan '
        'atas sistem atau layanan. Alur lengkapnya: **Draf → Diajukan → ditinjau '
        'penilai secara berurutan → Disetujui atau Ditolak → ditandatangani '
        'secara elektronik → Diimplementasikan**.')

    D.h2(1, 'Melihat Daftar Permohonan Perubahan')
    D.steps([
        'Klik menu **Change Management** pada sidebar.',
        'Gunakan tab penyaring: **All** (Semua), **Awaiting me** (Menunggu saya), '
        '**In flight** (Sedang berjalan), **Submitted by me** (Diajukan oleh '
        'saya), dan **Closed** (Selesai).',
        'Setiap kartu CR menampilkan judul, status, prioritas, serta daftar '
        'penilai dan penandatangan beserta urutannya. Penilai yang belum bertindak '
        'diberi penanda **Menunggu**.',
        'Klik sebuah CR untuk melihat rinciannya.',
    ])
    D.fig_('3.5.1-1a_daftar-change-request.png', 'Halaman daftar permohonan perubahan.')

    D.h2(2, 'Mengajukan Permohonan Perubahan Baru')
    D.p('Formulir CR terbagi menjadi lima bagian. Isi seluruh bagian secermat '
        'mungkin karena akan menjadi dasar penilaian.')
    D.steps([
        'Pada halaman **Change Management**, klik tombol pembuatan CR.',
        '**Informasi Dasar**: isi **Judul** perubahan, pilih **Prioritas** '
        '(Rendah/Sedang/Tinggi/Kritis), pilih **Jenis Perubahan** '
        '(Normal/Standar/Darurat), dan tentukan **Tanggal Perubahan yang '
        'Direncanakan**.',
        '**Informasi Perubahan**: isi **Perubahan yang Diusulkan**, **Rincian '
        'Perubahan** (langkah demi langkah), **Latar Belakang / Alasan**, '
        '**Dependensi Layanan**, dan **Sistem Informasi Terdampak**.',
        '**Analisis Risiko**: isi **Analisis Risiko Perubahan**, **Langkah '
        'Mitigasi Risiko**, **Risiko jika Perubahan Tidak Dilakukan**, dan '
        '**Langkah Penanganan Kegagalan**.',
        '**Personel**: pilih **Penilai** (minimal satu orang; urutan peninjauan '
        'mengikuti urutan pemilihan) dan pilih **Penandatangan** (satu orang, '
        'yang akan menandatangani melalui e-Sign).',
        '**Lampiran Pendukung**: klik **Tambah Lampiran** untuk melampirkan '
        'berkas pendukung. Berkas diunggah setelah CR berhasil dibuat.',
        'Klik simpan. Aplikasi menampilkan pesan "CR berhasil dibuat" dan CR '
        'tersimpan dengan status **Draft** (Draf).',
    ])
    D.fig_('3.5.1-1b_form-ajukan-cr.png', 'Formulir pengajuan permohonan perubahan.')
    D.fig_('panduan-cr-form-personel.png',
           'Bagian Personel pada formulir CR: hanya Penilai dan Penandatangan, tanpa Pelaksana.')
    D.fig_('3.5.1-1c_cr-tersimpan.png', 'Permohonan perubahan tersimpan.')
    D.note('Bila penilai belum dipilih, aplikasi menampilkan pesan "Pilih minimal '
           '1 penilai". Bila penandatangan belum dipilih, muncul pesan "Pilih '
           'seorang penandatangan". CR tidak dapat disimpan sebelum keduanya '
           'terisi.')
    D.note('**Pelaksana tidak diisi oleh pengaju.** Pelaksana ditetapkan oleh '
           'penilai pada tahap peninjauan (lihat sub-bab 10.5).')

    D.h2(3, 'Mengirim CR untuk Ditinjau')
    D.p('CR berstatus **Draft** belum masuk ke alur persetujuan dan masih dapat '
        'diubah oleh pengaju.')
    D.steps([
        'Buka CR yang berstatus **Draft**.',
        'Periksa kembali seluruh isian dan lampiran.',
        'Klik tombol pengajuan (**Submit**). Status berubah menjadi **Submitted** '
        '(Diajukan).',
        'Penilai pertama pada urutan menerima notifikasi bahwa ada CR yang perlu '
        'ditinjau.',
    ])
    D.fig_('3.5.1-1d_cr-status-draft.png', 'Permohonan perubahan berstatus Draft.')
    D.fig_('3.5.1-1e_cr-setelah-submit.png', 'Status berubah menjadi Submitted setelah diajukan.')

    D.h2(4, 'Meninjau dan Menyetujui CR')
    D.p('Langkah berikut dilakukan oleh pengguna yang ditetapkan sebagai penilai.')
    D.steps([
        'Buka menu **Change Management** lalu pilih tab **Awaiting me** (Menunggu '
        'saya) untuk melihat CR yang memerlukan tindakan Anda.',
        'Klik CR yang dituju dan baca seluruh rinciannya, termasuk analisis risiko '
        'dan lampiran.',
        'Klik tombol **Approve** (Setujui).',
        'Isi catatan peninjauan bila diperlukan, lalu konfirmasikan.',
        'Status CR berubah menjadi **Approved** (Disetujui) apabila Anda adalah '
        'penilai terakhir; bila masih ada penilai berikutnya, CR diteruskan '
        'kepada penilai tersebut.',
    ])
    D.fig_('3.5.2-1a_cr-menunggu-persetujuan.png', 'Permohonan perubahan yang menunggu persetujuan.')
    D.fig_('3.5.2-1b_form-persetujuan.png', 'Formulir persetujuan permohonan perubahan.')
    D.fig_('3.5.2-1c_status-setelah-disetujui.png', 'Status permohonan setelah disetujui.')

    D.h2(5, 'Menetapkan Pelaksana (oleh Penilai)')
    D.p('Pelaksana permintaan perubahan ditetapkan oleh **penilai**, bukan oleh '
        'pengaju. Penetapan dilakukan selama CR berstatus **Submitted** '
        '(sedang ditinjau).')
    D.steps([
        'Buka CR yang menunggu tinjauan Anda, lalu perluas kartunya untuk '
        'melihat rincian.',
        'Pada bagian **Pelaksana**, klik tombol **Tetapkan pelaksana**.',
        'Centang satu atau beberapa pengguna yang akan melaksanakan perubahan.',
        'Klik **Simpan pelaksana**. Aplikasi menampilkan pesan "Pelaksana '
        'berhasil ditetapkan" dan nama pelaksana tampil pada bagian tersebut.',
        'Setiap pelaksana yang ditetapkan menerima notifikasi.',
    ])
    D.fig_('panduan-cr-panel-pelaksana.png',
           'Bagian Pelaksana pada detail CR, lengkap dengan keterangan penilai yang menetapkannya.')
    D.note('Pelaksana hanya dapat ditetapkan **satu kali**. Apabila Penilai 1 '
           'sudah mengisinya, Penilai 2 tidak dapat mengubah atau menimpanya; '
           'panel berubah menjadi daftar baca-saja beserta keterangan siapa yang '
           'menetapkan. Bila Penilai 1 belum mengisi, Penilai 2 masih dapat '
           'melakukannya.')

    D.h2(6, 'Menolak CR')
    D.steps([
        'Buka CR yang memerlukan tindakan Anda.',
        'Klik tombol **Reject** (Tolak).',
        'Isi **catatan penolakan**, kolom ini **wajib** diisi agar pengaju '
        'memahami alasan penolakan.',
        'Klik **Tolak CR**. Aplikasi menampilkan pesan "CR ditolak" dan status '
        'berubah menjadi **Rejected** (Ditolak).',
        'Pengaju menerima notifikasi penolakan beserta catatannya.',
    ])
    D.fig_('3.5.2-2b_form-penolakan.png', 'Formulir penolakan dengan catatan wajib.')
    D.fig_('3.5.2-2c_status-ditolak.png', 'Status permohonan setelah ditolak.')

    D.h2(7, 'Menandatangani CR secara Elektronik')
    D.p('Setelah seluruh penilai menyetujui, dokumen CR diteruskan kepada '
        'penandatangan yang telah ditetapkan.')
    D.steps([
        'Penandatangan membuka CR yang menunggu tanda tangan.',
        'Klik tombol tanda tangan. Dialog **Tandatangani Dokumen** menampilkan '
        'keterangan **Menandatangani sebagai:** beserta nama Anda.',
        'Masukkan **Kata Sandi e-Sign** (passphrase sertifikat elektronik Anda).',
        'Klik **Tandatangani**. Aplikasi menampilkan pesan "Dokumen berhasil '
        'ditandatangani!".',
    ])
    D.fig_('3.6.1-1a_cr-menunggu-tanda-tangan.png',
           'Permohonan perubahan yang menunggu tanda tangan elektronik.')
    D.note('Passphrase tidak pernah disimpan oleh sistem. Dokumen ditandatangani '
           'secara elektronik menggunakan sertifikat yang diterbitkan oleh BSrE.',
           label='Keamanan')

    D.h2(8, 'Riwayat dan Jejak Audit')
    D.p('Setiap CR menyimpan jejak audit yang mencatat seluruh tindakan beserta '
        'pelaku dan waktunya: **CR Dibuat**, **CR Diajukan**, **Ditinjau**, '
        '**Disetujui**, **Ditolak**, **Ditandatangani**, dan '
        '**Diimplementasikan**. Buka CR lalu gulir ke bagian riwayat untuk '
        'membacanya.')
    D.fig_('3.5.3-1_riwayat-audit-trail.png', 'Riwayat dan jejak audit permohonan perubahan.')

    D.h2(9, 'Menyaring Daftar CR')
    D.steps([
        'Pada halaman **Change Management**, gunakan tab status untuk menyaring '
        'permohonan berdasarkan tahapan alur kerjanya.',
        'Gunakan penyaring periode untuk membatasi daftar pada rentang waktu '
        'tertentu.',
        'Daftar langsung menyesuaikan dengan kombinasi penyaring yang dipilih.',
    ])
    D.fig_('3.5.4-1a_daftar-sebelum-filter.png', 'Daftar permohonan sebelum disaring.')
    D.fig_('3.5.4-1b_daftar-terfilter.png', 'Daftar permohonan setelah disaring.')
    D.pagebreak()
