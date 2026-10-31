import type { MatchingChoice, PublicQuestion, QuestionOption, QuestionType, TeamId } from '../types/game.ts';

export interface AuthoritativeQuestion extends PublicQuestion {
  correctPG?: 'A' | 'B' | 'C' | 'D';
  correctPGK?: Array<'A' | 'B' | 'C' | 'D'>;
  correctMatch?: string;
  acceptedShortAnswers?: string[];
}

function buildOptions(a: string, b: string, c: string, d: string): QuestionOption[] {
  return [
    { key: 'A', label: a },
    { key: 'B', label: b },
    { key: 'C', label: c },
    { key: 'D', label: d },
  ];
}

function buildMatchingChoices(targets: string[]): MatchingChoice[] {
  return targets.map((text, idx) => ({
    id: `m_${idx + 1}`,
    keyLabel: String(idx + 1),
    text,
  }));
}

const TOPIC_1 = 'Konsep Dasar Data: Data Terstruktur vs. Tidak Terstruktur';
const TOPIC_2 = 'Pengidentifikasian dan Pemodelan Data Terstruktur';
const TOPIC_3 = 'Antarmuka dan Elemen Dasar Lembar Kerja Pengolah Data';
const TOPIC_4 = 'Pengolahan dan Pengorganisasian Data';
const TOPIC_5 = 'Praktik Analisis dan Pengolahan Data Sederhana';

const CAT_PG = 'A. Pilihan Ganda (PG)';
const CAT_PGK = 'B. Pilihan Ganda Kompleks (PGK)';
const CAT_MATCH = 'C. Menjodohkan';
const CAT_ISIAN = 'D. Isian Singkat';

const MATCH_POOL_T1 = buildMatchingChoices([
  'Data Terstruktur',
  'Data Tidak Terstruktur',
]);

const MATCH_POOL_T2 = buildMatchingChoices([
  'Kolom/Column',
  'Baris/Row',
  'Sel/Cell',
  'Atribut/Header',
  'Data Mentah',
]);

const MATCH_POOL_T3 = buildMatchingChoices([
  'Merge & Center',
  'Formula Bar',
  'Name Box',
  'Sheet / Worksheet',
  'Fill Handle',
]);

const MATCH_POOL_T4 = buildMatchingChoices([
  'Ascending',
  'Descending',
  'Filter',
  '/',
  '*',
]);

const MATCH_POOL_T5 = buildMatchingChoices([
  'Pemasukan',
  'Pengeluaran',
  'Saldo',
  'Accounting/Currency',
  'Human Error',
]);

interface RawSeed {
  topicIndex: number;
  topicTitle: string;
  categoryTitle: string;
  categoryNote?: string;
  numberInTopic: number;
  type: QuestionType;
  questionText: string;
  options?: QuestionOption[];
  matchingChoices?: MatchingChoice[];
  correctPG?: 'A' | 'B' | 'C' | 'D';
  correctPGK?: Array<'A' | 'B' | 'C' | 'D'>;
  correctMatch?: string;
  acceptedShortAnswers?: string[];
}

const RAW_QUESTIONS: RawSeed[] = [
  // =========================================================================
  // TOPIK 1: Konsep Dasar Data: Data Terstruktur vs. Tidak Terstruktur (1-20)
  // =========================================================================
  {
    topicIndex: 1,
    topicTitle: TOPIC_1,
    categoryTitle: CAT_PG,
    numberInTopic: 1,
    type: 'PG',
    questionText:
      '1. Saat Budi pergi ke minimarket, ia menerima struk belanja yang berisi nama barang, harga, dan jumlah beli. Struk ini merupakan data terstruktur karena...',
    options: buildOptions(
      'A. Tercetak di atas kertas thermal',
      'B. Memiliki format, kolom, dan baris yang jelas',
      'C. Dapat dibaca oleh semua orang',
      'D. Dihasilkan oleh mesin kasir',
    ),
    correctPG: 'B',
  },
  {
    topicIndex: 1,
    topicTitle: TOPIC_1,
    categoryTitle: CAT_PG,
    numberInTopic: 2,
    type: 'PG',
    questionText:
      '2. Manakah dari data berikut yang paling sulit dianalisis secara langsung oleh komputer tanpa pemrosesan khusus?',
    options: buildOptions(
      'A. Daftar hadir siswa dalam format Excel',
      'B. Rekaman suara wawancara narasumber',
      'C. Tabel nilai ujian tengah semester',
      'D. Jadwal kereta api di website resmi',
    ),
    correctPG: 'B',
  },
  {
    topicIndex: 1,
    topicTitle: TOPIC_1,
    categoryTitle: CAT_PG,
    numberInTopic: 3,
    type: 'PG',
    questionText:
      '3. Siti sedang merapikan kamarnya dan menemukan tumpukan foto liburan, buku harian, dan tabel jadwal pelajarannya. Di antara benda tersebut, yang termasuk data tidak terstruktur adalah...',
    options: buildOptions(
      'A. Tabel jadwal pelajaran',
      'B. Foto liburan dan buku harian',
      'C. Tabel jadwal pelajaran dan buku harian',
      'D. Hanya foto liburan',
    ),
    correctPG: 'B',
  },
  {
    topicIndex: 1,
    topicTitle: TOPIC_1,
    categoryTitle: CAT_PG,
    numberInTopic: 4,
    type: 'PG',
    questionText:
      '4. Mengapa data terstruktur lebih mudah dicari dan diurutkan dibandingkan data tidak terstruktur?',
    options: buildOptions(
      'A. Karena ukurannya selalu lebih kecil',
      'B. Karena elemennya diatur dalam format yang baku (seperti baris dan kolom)',
      'C. Karena hanya berisi angka saja',
      'D. Karena selalu disimpan dalam flashdisk',
    ),
    correctPG: 'B',
  },
  {
    topicIndex: 1,
    topicTitle: TOPIC_1,
    categoryTitle: CAT_PG,
    numberInTopic: 5,
    type: 'PG',
    questionText:
      '5. Sebuah rumah sakit menyimpan rekaman rontgen pasien dan tabel daftar nama pasien. Rekaman rontgen digolongkan sebagai data...',
    options: buildOptions(
      'A. Kuantitatif',
      'B. Terstruktur',
      'C. Tidak terstruktur',
      'D. Semantik',
    ),
    correctPG: 'C',
  },
  {
    topicIndex: 1,
    topicTitle: TOPIC_1,
    categoryTitle: CAT_PGK,
    categoryNote: '*(Pilih lebih dari satu jawaban yang benar)*',
    numberInTopic: 6,
    type: 'PGK',
    questionText:
      '6. Berikut ini yang merupakan contoh dari data terstruktur dalam kehidupan sehari-hari adalah...',
    options: buildOptions(
      'A. Tabel klasemen liga sepak bola',
      'B. Video vlog di YouTube',
      'C. Katalog harga barang di supermarket',
      'D. Rekaman suara penyanyi di konser',
    ),
    correctPGK: ['A', 'C'],
  },
  {
    topicIndex: 1,
    topicTitle: TOPIC_1,
    categoryTitle: CAT_PGK,
    categoryNote: '*(Pilih lebih dari satu jawaban yang benar)*',
    numberInTopic: 7,
    type: 'PGK',
    questionText:
      '7. Karakteristik utama dari data tidak terstruktur antara lain...',
    options: buildOptions(
      'A. Membutuhkan ruang penyimpanan yang biasanya lebih besar',
      'B. Memiliki pola baris dan kolom yang kaku',
      'C. Tidak memiliki format baku yang mudah dibaca langsung oleh database relasional',
      'D. Sangat mudah diurutkan berdasarkan abjad secara otomatis',
    ),
    correctPGK: ['A', 'C'],
  },
  {
    topicIndex: 1,
    topicTitle: TOPIC_1,
    categoryTitle: CAT_PGK,
    categoryNote: '*(Pilih lebih dari satu jawaban yang benar)*',
    numberInTopic: 8,
    type: 'PGK',
    questionText:
      '8. Jika kamu diminta mengubah data tidak terstruktur menjadi terstruktur, langkah yang paling logis adalah...',
    options: buildOptions(
      'A. Mengambil isi teks buku harian lalu memindahkannya ke tabel berisi tanggal, kejadian, dan emosi',
      'B. Mengubah file video menjadi format MP3',
      'C. Mencatat data dari struk belanja acak ke dalam tabel Excel (No, Nama Barang, Harga)',
      'D. Memfotokopi daftar belanja',
    ),
    correctPGK: ['A', 'C'],
  },
  {
    topicIndex: 1,
    topicTitle: TOPIC_1,
    categoryTitle: CAT_PGK,
    categoryNote: '*(Pilih lebih dari satu jawaban yang benar)*',
    numberInTopic: 9,
    type: 'PGK',
    questionText:
      '9. Mengapa perusahaan modern sangat membutuhkan analisis data tidak terstruktur (seperti komentar media sosial)?',
    options: buildOptions(
      'A. Untuk mengetahui opini dan tren pelanggan secara langsung',
      'B. Karena komentar media sosial selalu berisi data palsu',
      'C. Untuk melengkapi data terstruktur dari penjualan bulanan',
      'D. Karena data terstruktur sudah tidak digunakan lagi',
    ),
    correctPGK: ['A', 'C'],
  },
  {
    topicIndex: 1,
    topicTitle: TOPIC_1,
    categoryTitle: CAT_PGK,
    categoryNote: '*(Pilih lebih dari satu jawaban yang benar)*',
    numberInTopic: 10,
    type: 'PGK',
    questionText:
      '10. Pernyataan yang benar mengenai data dalam era digital adalah...',
    options: buildOptions(
      'A. Mayoritas data di internet saat ini adalah data tidak terstruktur (gambar, video, teks bebas)',
      'B. Data terstruktur lebih lambat diproses oleh rumus spreadsheet',
      'C. AI saat ini mampu mengenali pola pada data tidak terstruktur seperti wajah pada foto',
      'D. Data tidak terstruktur mustahil untuk disimpan di komputer',
    ),
    correctPGK: ['A', 'C'],
  },
  {
    topicIndex: 1,
    topicTitle: TOPIC_1,
    categoryTitle: CAT_MATCH,
    categoryNote: '*(Pasangkan pernyataan di sebelah kiri dengan jenis data di sebelah kanan!)*',
    numberInTopic: 11,
    type: 'MENJODOHKAN',
    questionText: '11. Daftar kontak telepon di HP (Nama, No HP, Email)',
    matchingChoices: MATCH_POOL_T1,
    correctMatch: 'Data Terstruktur',
  },
  {
    topicIndex: 1,
    topicTitle: TOPIC_1,
    categoryTitle: CAT_MATCH,
    categoryNote: '*(Pasangkan pernyataan di sebelah kiri dengan jenis data di sebelah kanan!)*',
    numberInTopic: 12,
    type: 'MENJODOHKAN',
    questionText: '12. Kumpulan rekaman CCTV di sekolah',
    matchingChoices: MATCH_POOL_T1,
    correctMatch: 'Data Tidak Terstruktur',
  },
  {
    topicIndex: 1,
    topicTitle: TOPIC_1,
    categoryTitle: CAT_MATCH,
    categoryNote: '*(Pasangkan pernyataan di sebelah kiri dengan jenis data di sebelah kanan!)*',
    numberInTopic: 13,
    type: 'MENJODOHKAN',
    questionText: '13. Pesan suara (voice note) di aplikasi chat',
    matchingChoices: MATCH_POOL_T1,
    correctMatch: 'Data Tidak Terstruktur',
  },
  {
    topicIndex: 1,
    topicTitle: TOPIC_1,
    categoryTitle: CAT_MATCH,
    categoryNote: '*(Pasangkan pernyataan di sebelah kiri dengan jenis data di sebelah kanan!)*',
    numberInTopic: 14,
    type: 'MENJODOHKAN',
    questionText: '14. Database siswa (NISN, Nama, Kelas)',
    matchingChoices: MATCH_POOL_T1,
    correctMatch: 'Data Terstruktur',
  },
  {
    topicIndex: 1,
    topicTitle: TOPIC_1,
    categoryTitle: CAT_MATCH,
    categoryNote: '*(Pasangkan pernyataan di sebelah kiri dengan jenis data di sebelah kanan!)*',
    numberInTopic: 15,
    type: 'MENJODOHKAN',
    questionText: '15. Kumpulan komentar netizen di Instagram',
    matchingChoices: MATCH_POOL_T1,
    correctMatch: 'Data Tidak Terstruktur',
  },
  {
    topicIndex: 1,
    topicTitle: TOPIC_1,
    categoryTitle: CAT_ISIAN,
    numberInTopic: 16,
    type: 'ISIAN',
    questionText:
      '16. Data yang tidak memiliki format baku, sulit diolah secara langsung menggunakan tabel biasa, dan contohnya berupa video atau gambar disebut data...',
    acceptedShortAnswers: [
      'tidak terstruktur',
      'data tidak terstruktur',
      'tak terstruktur',
      'data tak terstruktur',
      'unstructured',
      'unstructured data',
    ],
  },
  {
    topicIndex: 1,
    topicTitle: TOPIC_1,
    categoryTitle: CAT_ISIAN,
    numberInTopic: 17,
    type: 'ISIAN',
    questionText:
      '17. Struk belanja, jadwal pelajaran, dan daftar hadir yang memiliki baris dan kolom dikategorikan sebagai data...',
    acceptedShortAnswers: [
      'terstruktur',
      'data terstruktur',
      'structured',
      'structured data',
    ],
  },
  {
    topicIndex: 1,
    topicTitle: TOPIC_1,
    categoryTitle: CAT_ISIAN,
    numberInTopic: 18,
    type: 'ISIAN',
    questionText:
      '18. Proses mengatur dan mengelompokkan barang belanjaan dari keranjang acak menjadi daftar berbasis kategori (makanan, minuman, alat mandi) adalah contoh mengubah data tidak terstruktur menjadi...',
    acceptedShortAnswers: [
      'data terstruktur',
      'terstruktur',
      'tabel',
      'data tabel',
      'daftar terstruktur',
    ],
  },
  {
    topicIndex: 1,
    topicTitle: TOPIC_1,
    categoryTitle: CAT_ISIAN,
    numberInTopic: 19,
    type: 'ISIAN',
    questionText:
      '19. Fitur baris (row) dan kolom (column) adalah ciri khas dari penyimpanan data yang bersifat...',
    acceptedShortAnswers: [
      'terstruktur',
      'data terstruktur',
      'tabular',
    ],
  },
  {
    topicIndex: 1,
    topicTitle: TOPIC_1,
    categoryTitle: CAT_ISIAN,
    numberInTopic: 20,
    type: 'ISIAN',
    questionText:
      '20. Sebutkan satu contoh data tidak terstruktur yang sering kamu hasilkan saat menggunakan smartphone! (Contoh jawaban: *Foto/Video/Voice note*)',
    acceptedShortAnswers: [
      'foto',
      'video',
      'voice note',
      'voicenote',
      'pesan suara',
      'rekaman suara',
      'rekaman video',
      'audio',
      'gambar',
      'chat',
      'pesan chat',
      'komentar',
      'story',
      'selfie',
      'vlog',
      'foto/video/voice note',
      'foto/video',
    ],
  },

  // =========================================================================
  // TOPIK 2: Pengidentifikasian dan Pemodelan Data Terstruktur (21-40)
  // =========================================================================
  {
    topicIndex: 2,
    topicTitle: TOPIC_2,
    categoryTitle: CAT_PG,
    numberInTopic: 1,
    type: 'PG',
    questionText:
      "1. Diberikan teks: 'Andi berusia 13 tahun dengan hobi berenang. Budi berusia 14 tahun, hobinya membaca.' Jika diubah ke tabel, atribut (judul kolom) yang paling tepat adalah...",
    options: buildOptions(
      'A. Andi, Budi, Hobi',
      'B. Nama, Usia, Hobi',
      'C. 13 Tahun, 14 Tahun, Berenang',
      'D. Tabel 1, Tabel 2, Tabel 3',
    ),
    correctPG: 'B',
  },
  {
    topicIndex: 2,
    topicTitle: TOPIC_2,
    categoryTitle: CAT_PG,
    numberInTopic: 2,
    type: 'PG',
    questionText:
      '2. Dalam sebuah tabel, kumpulan data dari kiri ke kanan yang merepresentasikan satu entitas utuh (misalnya data lengkap satu siswa) disebut...',
    options: buildOptions(
      'A. Kolom',
      'B. Baris (Row)',
      'C. Judul',
      'D. Sel (Cell)',
    ),
    correctPG: 'B',
  },
  {
    topicIndex: 2,
    topicTitle: TOPIC_2,
    categoryTitle: CAT_PG,
    numberInTopic: 3,
    type: 'PG',
    questionText:
      "3. Saat memodelkan data mentah, fungsi utama menentukan 'Atribut' (judul kolom) di awal adalah...",
    options: buildOptions(
      'A. Agar tabel terlihat berwarna',
      'B. Mengkategorikan data agar konsisten dan mudah dicari',
      'C. Menambah jumlah data yang dimasukkan',
      'D. Mengubah teks menjadi angka',
    ),
    correctPG: 'B',
  },
  {
    topicIndex: 2,
    topicTitle: TOPIC_2,
    categoryTitle: CAT_PG,
    numberInTopic: 4,
    type: 'PG',
    questionText:
      "4. Rita membaca paragraf: 'Di kelas VII A, terdapat 15 siswa laki-laki dan 15 siswa perempuan. Di kelas VII B, ada 14 laki-laki dan 16 perempuan.' Berapa minimal kolom yang dibutuhkan untuk memodelkan data tersebut dengan efektif?",
    options: buildOptions(
      'A. 1 kolom',
      'B. 2 kolom',
      'C. 3 kolom (Kelas, Jml Laki-laki, Jml Perempuan)',
      'D. 5 kolom',
    ),
    correctPG: 'C',
  },
  {
    topicIndex: 2,
    topicTitle: TOPIC_2,
    categoryTitle: CAT_PG,
    numberInTopic: 5,
    type: 'PG',
    questionText:
      '5. Kesalahan umum saat mengubah data paragraf menjadi tabel adalah...',
    options: buildOptions(
      'A. Membuat judul kolom yang jelas',
      'B. Mencampur tipe data teks dan angka dalam satu sel padahal bisa dipisah',
      'C. Memisahkan nama depan dan nama belakang jika diperlukan',
      'D. Memastikan setiap baris mewakili satu objek/orang yang sama',
    ),
    correctPG: 'B',
  },
  {
    topicIndex: 2,
    topicTitle: TOPIC_2,
    categoryTitle: CAT_PGK,
    categoryNote: '*(Pilih lebih dari satu jawaban yang benar)*',
    numberInTopic: 6,
    type: 'PGK',
    questionText:
      '6. Manakah dari pernyataan berikut yang merupakan langkah tepat memodelkan data mentah menjadi tabel?',
    options: buildOptions(
      'A. Mengidentifikasi variabel unik seperti Nama dan Umur sebagai kolom',
      'B. Memasukkan seluruh paragraf panjang ke dalam satu kotak sel',
      'C. Memastikan satu baris hanya memuat informasi untuk satu entitas/individu',
      'D. Menghapus data penting agar tabel terlihat lebih kecil',
    ),
    correctPGK: ['A', 'C'],
  },
  {
    topicIndex: 2,
    topicTitle: TOPIC_2,
    categoryTitle: CAT_PGK,
    categoryNote: '*(Pilih lebih dari satu jawaban yang benar)*',
    numberInTopic: 7,
    type: 'PGK',
    questionText: '7. Komponen utama pembentuk struktur tabel adalah...',
    options: buildOptions(
      'A. Baris (Row)',
      'B. Kolom (Column)',
      'C. Gambar ilustrasi',
      'D. Header/Atribut',
    ),
    correctPGK: ['A', 'B', 'D'],
  },
  {
    topicIndex: 2,
    topicTitle: TOPIC_2,
    categoryTitle: CAT_PGK,
    categoryNote: '*(Pilih lebih dari satu jawaban yang benar)*',
    numberInTopic: 8,
    type: 'PGK',
    questionText:
      "8. Jika data mentah berupa: 'Kucing makan ikan, anjing makan daging, burung makan biji,' bentuk pemodelan tabel yang benar akan memiliki...",
    options: buildOptions(
      "A. Kolom 'Nama Hewan' dan 'Jenis Makanan'",
      "B. Baris berisi 'Kucing', 'Anjing', 'Burung'",
      'C. Satu kolom saja yang berisi seluruh kalimat',
      "D. Kolom 'Ikan', 'Daging', 'Biji' sebagai atribut utama",
    ),
    correctPGK: ['A', 'B'],
  },
  {
    topicIndex: 2,
    topicTitle: TOPIC_2,
    categoryTitle: CAT_PGK,
    categoryNote: '*(Pilih lebih dari satu jawaban yang benar)*',
    numberInTopic: 9,
    type: 'PGK',
    questionText: '9. Keuntungan mengubah data cerita menjadi data tabel adalah...',
    options: buildOptions(
      'A. Informasi lebih cepat dipindai (scanning) oleh mata',
      'B. Data lebih mudah dihitung menggunakan rumus',
      'C. Ukuran huruf otomatis menjadi lebih besar',
      'D. Memudahkan penyaringan (filtering) data tertentu',
    ),
    correctPGK: ['A', 'B', 'D'],
  },
  {
    topicIndex: 2,
    topicTitle: TOPIC_2,
    categoryTitle: CAT_PGK,
    categoryNote: '*(Pilih lebih dari satu jawaban yang benar)*',
    numberInTopic: 10,
    type: 'PGK',
    questionText:
      "10. Atribut data yang biasanya membutuhkan tipe data 'Angka' (Numerik) adalah...",
    options: buildOptions(
      'A. Nomor Induk Siswa (NIS)',
      'B. Harga Barang',
      'C. Alamat Rumah',
      'D. Jumlah Stok',
    ),
    correctPGK: ['B', 'D'],
  },
  {
    topicIndex: 2,
    topicTitle: TOPIC_2,
    categoryTitle: CAT_MATCH,
    categoryNote: '*(Pasangkan istilah dengan fungsinya)*',
    numberInTopic: 11,
    type: 'MENJODOHKAN',
    questionText: '11. Bagian tabel yang menurun dari atas ke bawah',
    matchingChoices: MATCH_POOL_T2,
    correctMatch: 'Kolom/Column',
  },
  {
    topicIndex: 2,
    topicTitle: TOPIC_2,
    categoryTitle: CAT_MATCH,
    categoryNote: '*(Pasangkan istilah dengan fungsinya)*',
    numberInTopic: 12,
    type: 'MENJODOHKAN',
    questionText: '12. Bagian tabel yang mendatar dari kiri ke kanan',
    matchingChoices: MATCH_POOL_T2,
    correctMatch: 'Baris/Row',
  },
  {
    topicIndex: 2,
    topicTitle: TOPIC_2,
    categoryTitle: CAT_MATCH,
    categoryNote: '*(Pasangkan istilah dengan fungsinya)*',
    numberInTopic: 13,
    type: 'MENJODOHKAN',
    questionText: '13. Titik pertemuan antara baris dan kolom',
    matchingChoices: MATCH_POOL_T2,
    correctMatch: 'Sel/Cell',
  },
  {
    topicIndex: 2,
    topicTitle: TOPIC_2,
    categoryTitle: CAT_MATCH,
    categoryNote: '*(Pasangkan istilah dengan fungsinya)*',
    numberInTopic: 14,
    type: 'MENJODOHKAN',
    questionText: '14. Judul dari sebuah kolom yang menjelaskan kategori data',
    matchingChoices: MATCH_POOL_T2,
    correctMatch: 'Atribut/Header',
  },
  {
    topicIndex: 2,
    topicTitle: TOPIC_2,
    categoryTitle: CAT_MATCH,
    categoryNote: '*(Pasangkan istilah dengan fungsinya)*',
    numberInTopic: 15,
    type: 'MENJODOHKAN',
    questionText: '15. Data belum terstruktur berupa teks cerita panjang',
    matchingChoices: MATCH_POOL_T2,
    correctMatch: 'Data Mentah',
  },
  {
    topicIndex: 2,
    topicTitle: TOPIC_2,
    categoryTitle: CAT_ISIAN,
    numberInTopic: 16,
    type: 'ISIAN',
    questionText:
      "16. 'Dina lahir di Jakarta, Riko lahir di Bandung.' Atribut kolom yang tepat untuk data kota tersebut adalah...",
    acceptedShortAnswers: [
      'tempat lahir',
      'kota lahir',
      'kota',
      'kota kelahiran',
      'tempat kelahiran',
      'asal kota',
      'kota asal',
    ],
  },
  {
    topicIndex: 2,
    topicTitle: TOPIC_2,
    categoryTitle: CAT_ISIAN,
    numberInTopic: 17,
    type: 'ISIAN',
    questionText:
      '17. Struktur yang terbentuk dari perpotongan garis vertikal dan horizontal untuk menyajikan data disebut...',
    acceptedShortAnswers: ['tabel', 'table'],
  },
  {
    topicIndex: 2,
    topicTitle: TOPIC_2,
    categoryTitle: CAT_ISIAN,
    numberInTopic: 18,
    type: 'ISIAN',
    questionText:
      '18. Kumpulan satu unit data lengkap secara horizontal (mendatar) dalam sebuah tabel disebut...',
    acceptedShortAnswers: ['baris', 'row', 'baris (row)', 'baris/row', 'record'],
  },
  {
    topicIndex: 2,
    topicTitle: TOPIC_2,
    categoryTitle: CAT_ISIAN,
    numberInTopic: 19,
    type: 'ISIAN',
    questionText:
      '19. Jika kamu memiliki data 3 orang teman lengkap dengan hobi dan warna favoritnya, maka jumlah baris (di luar judul kolom) yang kamu butuhkan adalah...',
    acceptedShortAnswers: ['3', '3 baris', 'tiga', 'tiga baris'],
  },
  {
    topicIndex: 2,
    topicTitle: TOPIC_2,
    categoryTitle: CAT_ISIAN,
    numberInTopic: 20,
    type: 'ISIAN',
    questionText:
      '20. Proses menyusun informasi acak menjadi format tabel teratur disebut... data.',
    acceptedShortAnswers: [
      'pemodelan',
      'pengorganisasian',
      'penstrukturan',
      'memodelkan',
      'mengorganisasikan',
      'pengelompokan',
    ],
  },

  // =========================================================================
  // TOPIK 3: Antarmuka dan Elemen Dasar Lembar Kerja Pengolah Data (41-60)
  // =========================================================================
  {
    topicIndex: 3,
    topicTitle: TOPIC_3,
    categoryTitle: CAT_PG,
    numberInTopic: 1,
    type: 'PG',
    questionText:
      "1. Alamat sel yang ditunjukkan dengan huruf 'C' dan angka '5' (C5) bermakna...",
    options: buildOptions(
      'A. Berada di Baris C, Kolom 5',
      'B. Berada di Kolom C, Baris 5',
      'C. Memiliki nilai angka 5 di sel C',
      'D. Berada di lembar kerja (sheet) ke-5',
    ),
    correctPG: 'B',
  },
  {
    topicIndex: 3,
    topicTitle: TOPIC_3,
    categoryTitle: CAT_PG,
    numberInTopic: 2,
    type: 'PG',
    questionText:
      '2. Kumpulan dari beberapa sel yang diblok atau dipilih secara bersamaan (misalnya A1 hingga B5) disebut...',
    options: buildOptions(
      'A. Range',
      'B. Formula',
      'C. Pointer',
      'D. Workbook',
    ),
    correctPG: 'A',
  },
  {
    topicIndex: 3,
    topicTitle: TOPIC_3,
    categoryTitle: CAT_PG,
    numberInTopic: 3,
    type: 'PG',
    questionText:
      "3. Saat mengetik hari 'Senin' di sel A1, lalu menarik (drag) titik kecil di sudut kanan bawah sel tersebut ke bawah, apa yang otomatis terjadi di spreadsheet?",
    options: buildOptions(
      'A. Sel akan terhapus',
      "B. Sel akan berlanjut mengisi 'Selasa, Rabu, Kamis...' (AutoFill)",
      'C. Sel akan memberikan peringatan error',
      'D. Lebar kolom menjadi lebih besar',
    ),
    correctPG: 'B',
  },
  {
    topicIndex: 3,
    topicTitle: TOPIC_3,
    categoryTitle: CAT_PG,
    numberInTopic: 4,
    type: 'PG',
    questionText:
      '4. Untuk mengatur agar teks yang panjang tidak melewati batas kolom dan otomatis turun ke baris baru dalam satu sel, fitur yang digunakan adalah...',
    options: buildOptions(
      'A. Merge & Center',
      'B. Wrap Text',
      'C. Conditional Formatting',
      'D. Format Painter',
    ),
    correctPG: 'B',
  },
  {
    topicIndex: 3,
    topicTitle: TOPIC_3,
    categoryTitle: CAT_PG,
    numberInTopic: 5,
    type: 'PG',
    questionText:
      "5. Jika judul tabel 'Jadwal Pelajaran' ingin diletakkan persis di tengah-tengah kolom A hingga F, fitur yang paling tepat digunakan adalah...",
    options: buildOptions(
      'A. Wrap Text',
      'B. Merge & Center',
      'C. Sort & Filter',
      'D. AutoSum',
    ),
    correctPG: 'B',
  },
  {
    topicIndex: 3,
    topicTitle: TOPIC_3,
    categoryTitle: CAT_PGK,
    categoryNote: '*(Pilih lebih dari satu jawaban yang benar)*',
    numberInTopic: 6,
    type: 'PGK',
    questionText:
      '6. Elemen antarmuka dasar yang pasti ditemukan saat membuka aplikasi Spreadsheet adalah...',
    options: buildOptions(
      'A. Name Box (Kotak Nama Sel)',
      'B. Formula Bar (Bilah Rumus)',
      'C. Slide Transition',
      'D. Kolom huruf dan Baris angka',
    ),
    correctPGK: ['A', 'B', 'D'],
  },
  {
    topicIndex: 3,
    topicTitle: TOPIC_3,
    categoryTitle: CAT_PGK,
    categoryNote: '*(Pilih lebih dari satu jawaban yang benar)*',
    numberInTopic: 7,
    type: 'PGK',
    questionText:
      '7. Tindakan yang termasuk dalam proses entri data dasar yang benar adalah...',
    options: buildOptions(
      'A. Mengetikkan teks langsung ke dalam sel aktif',
      "B. Menggunakan tombol 'Tab' untuk berpindah ke sel di sebelah kanan",
      "C. Menggunakan tombol 'Enter' untuk berpindah ke sel di bawahnya",
      'D. Menghapus seluruh sheet untuk mengganti satu huruf',
    ),
    correctPGK: ['A', 'B', 'C'],
  },
  {
    topicIndex: 3,
    topicTitle: TOPIC_3,
    categoryTitle: CAT_PGK,
    categoryNote: '*(Pilih lebih dari satu jawaban yang benar)*',
    numberInTopic: 8,
    type: 'PGK',
    questionText:
      '8. Manakah penulisan Range yang benar pada rumus spreadsheet?',
    options: buildOptions(
      'A. A1:C5',
      'B. B2-B10',
      'C. D4:D20',
      'D. A1;Z100',
    ),
    correctPGK: ['A', 'C'],
  },
  {
    topicIndex: 3,
    topicTitle: TOPIC_3,
    categoryTitle: CAT_PGK,
    categoryNote: '*(Pilih lebih dari satu jawaban yang benar)*',
    numberInTopic: 9,
    type: 'PGK',
    questionText:
      "9. Jika sebuah sel menampilkan deretan simbol '######', penyebab utamanya adalah...",
    options: buildOptions(
      'A. Komputer terkena virus',
      'B. Lebar kolom kurang besar untuk menampilkan isi angka/tanggal',
      'C. Format data diatur terlalu panjang melebihi kapasitas visual kolom',
      'D. File spreadsheet rusak',
    ),
    correctPGK: ['B', 'C'],
  },
  {
    topicIndex: 3,
    topicTitle: TOPIC_3,
    categoryTitle: CAT_PGK,
    categoryNote: '*(Pilih lebih dari satu jawaban yang benar)*',
    numberInTopic: 10,
    type: 'PGK',
    questionText:
      '10. Langkah yang benar untuk mengatur lebar kolom secara otomatis agar pas dengan isi teks terpanjang adalah...',
    options: buildOptions(
      'A. Klik ganda (double-click) pada garis batas antar header kolom',
      'B. Menarik batas kolom secara manual (click and drag)',
      'C. Menekan tombol Delete',
      "D. Menggunakan fitur 'AutoFit Column Width'",
    ),
    correctPGK: ['A', 'D'],
  },
  {
    topicIndex: 3,
    topicTitle: TOPIC_3,
    categoryTitle: CAT_MATCH,
    numberInTopic: 11,
    type: 'MENJODOHKAN',
    questionText: '11. Menggabungkan beberapa sel menjadi satu',
    matchingChoices: MATCH_POOL_T3,
    correctMatch: 'Merge & Center',
  },
  {
    topicIndex: 3,
    topicTitle: TOPIC_3,
    categoryTitle: CAT_MATCH,
    numberInTopic: 12,
    type: 'MENJODOHKAN',
    questionText: '12. Kolom tempat mengetik atau melihat isi/rumus sel secara utuh',
    matchingChoices: MATCH_POOL_T3,
    correctMatch: 'Formula Bar',
  },
  {
    topicIndex: 3,
    topicTitle: TOPIC_3,
    categoryTitle: CAT_MATCH,
    numberInTopic: 13,
    type: 'MENJODOHKAN',
    questionText: "13. Pengidentifikasi sel aktif saat ini, misalnya 'B3'",
    matchingChoices: MATCH_POOL_T3,
    correctMatch: 'Name Box',
  },
  {
    topicIndex: 3,
    topicTitle: TOPIC_3,
    categoryTitle: CAT_MATCH,
    numberInTopic: 14,
    type: 'MENJODOHKAN',
    questionText: '14. Lembar kerja di dalam satu file spreadsheet',
    matchingChoices: MATCH_POOL_T3,
    correctMatch: 'Sheet / Worksheet',
  },
  {
    topicIndex: 3,
    topicTitle: TOPIC_3,
    categoryTitle: CAT_MATCH,
    numberInTopic: 15,
    type: 'MENJODOHKAN',
    questionText: '15. Titik kecil di sudut kanan bawah sel untuk menyalin data berurutan',
    matchingChoices: MATCH_POOL_T3,
    correctMatch: 'Fill Handle',
  },
  {
    topicIndex: 3,
    topicTitle: TOPIC_3,
    categoryTitle: CAT_ISIAN,
    numberInTopic: 16,
    type: 'ISIAN',
    questionText:
      '16. Seluruh baris dalam spreadsheet diidentifikasi menggunakan... (angka/huruf).',
    acceptedShortAnswers: ['angka', 'nomor'],
  },
  {
    topicIndex: 3,
    topicTitle: TOPIC_3,
    categoryTitle: CAT_ISIAN,
    numberInTopic: 17,
    type: 'ISIAN',
    questionText:
      '17. Seluruh kolom dalam spreadsheet diidentifikasi menggunakan... (angka/huruf).',
    acceptedShortAnswers: ['huruf', 'abjad'],
  },
  {
    topicIndex: 3,
    topicTitle: TOPIC_3,
    categoryTitle: CAT_ISIAN,
    numberInTopic: 18,
    type: 'ISIAN',
    questionText:
      '18. Kumpulan sel dari B2 sampai D10 ditulis dalam notasi range sebagai...',
    acceptedShortAnswers: ['b2:d10'],
  },
  {
    topicIndex: 3,
    topicTitle: TOPIC_3,
    categoryTitle: CAT_ISIAN,
    numberInTopic: 19,
    type: 'ISIAN',
    questionText:
      '19. Fitur untuk membuat teks yang kepanjangan agar turun ke bawah dalam satu sel yang sama disebut...',
    acceptedShortAnswers: ['wrap text', 'wraptext', 'text wrapping'],
  },
  {
    topicIndex: 3,
    topicTitle: TOPIC_3,
    categoryTitle: CAT_ISIAN,
    numberInTopic: 20,
    type: 'ISIAN',
    questionText:
      '20. File dokumen utama di aplikasi spreadsheet sering juga disebut sebagai... (Workbook).',
    acceptedShortAnswers: ['workbook', 'buku kerja'],
  },

  // =========================================================================
  // TOPIK 4: Pengolahan dan Pengorganisasian Data (61-80)
  // =========================================================================
  {
    topicIndex: 4,
    topicTitle: TOPIC_4,
    categoryTitle: CAT_PG,
    numberInTopic: 1,
    type: 'PG',
    questionText:
      '1. Guru ingin melihat daftar siswa dari yang meraih nilai tertinggi ke terendah. Fitur yang harus digunakan pada kolom nilai adalah...',
    options: buildOptions(
      'A. Sort A to Z (Ascending)',
      'B. Sort Z to A (Descending)',
      'C. Filter',
      'D. Wrap Text',
    ),
    correctPG: 'B',
  },
  {
    topicIndex: 4,
    topicTitle: TOPIC_4,
    categoryTitle: CAT_PG,
    numberInTopic: 2,
    type: 'PG',
    questionText:
      "2. Sebuah tabel berisi data 100 siswa lengkap dengan kolom 'Status Kelulusan'. Jika kamu hanya ingin menampilkan baris data siswa yang 'Lulus' saja tanpa menghapus data lain, fitur yang digunakan adalah...",
    options: buildOptions(
      'A. Sorting',
      'B. Filtering',
      'C. Find and Replace',
      'D. Delete Row',
    ),
    correctPG: 'B',
  },
  {
    topicIndex: 4,
    topicTitle: TOPIC_4,
    categoryTitle: CAT_PG,
    numberInTopic: 3,
    type: 'PG',
    questionText:
      '3. Tanda yang WAJIB diketikkan pertama kali sebelum memulai penulisan formula atau rumus matematika di dalam sel spreadsheet adalah...',
    options: buildOptions('A. @', 'B. #', 'C. =', 'D. +'),
    correctPG: 'C',
  },
  {
    topicIndex: 4,
    topicTitle: TOPIC_4,
    categoryTitle: CAT_PG,
    numberInTopic: 4,
    type: 'PG',
    questionText:
      '4. Untuk menghitung selisih (pengurangan) antara sel A2 (Pemasukan) dan B2 (Pengeluaran), penulisan formula yang benar adalah...',
    options: buildOptions(
      'A. A2 - B2',
      'B. =A2-B2',
      'C. =MINUS(A2:B2)',
      'D. SUM(A2-B2)',
    ),
    correctPG: 'B',
  },
  {
    topicIndex: 4,
    topicTitle: TOPIC_4,
    categoryTitle: CAT_PG,
    numberInTopic: 5,
    type: 'PG',
    questionText:
      '5. Pada rumus `=5+3*2`, hasil yang akan ditampilkan oleh spreadsheet adalah...',
    options: buildOptions('A. 16', 'B. 11', 'C. 10', 'D. Error'),
    correctPG: 'B',
  },
  {
    topicIndex: 4,
    topicTitle: TOPIC_4,
    categoryTitle: CAT_PGK,
    categoryNote: '*(Pilih lebih dari satu jawaban yang benar)*',
    numberInTopic: 6,
    type: 'PGK',
    questionText:
      '6. Kegunaan utama dari fitur Filtering pada tabel data adalah...',
    options: buildOptions(
      'A. Mengurutkan nama sesuai abjad',
      'B. Menyembunyikan baris data yang tidak sesuai kriteria secara sementara',
      'C. Memudahkan analisis fokus pada kategori tertentu',
      'D. Menghapus data yang salah ketik',
    ),
    correctPGK: ['B', 'C'],
  },
  {
    topicIndex: 4,
    topicTitle: TOPIC_4,
    categoryTitle: CAT_PGK,
    categoryNote: '*(Pilih lebih dari satu jawaban yang benar)*',
    numberInTopic: 7,
    type: 'PGK',
    questionText:
      '7. Simbol operator aritmatika yang tepat pada spreadsheet adalah...',
    options: buildOptions(
      'A. Tanda bintang (*) untuk perkalian',
      'B. Garis miring (/) untuk pembagian',
      'C. Tanda silang (x) untuk perkalian',
      'D. Tanda plus (+) untuk penjumlahan',
    ),
    correctPGK: ['A', 'B', 'D'],
  },
  {
    topicIndex: 4,
    topicTitle: TOPIC_4,
    categoryTitle: CAT_PGK,
    categoryNote: '*(Pilih lebih dari satu jawaban yang benar)*',
    numberInTopic: 8,
    type: 'PGK',
    questionText:
      '8. Jika fitur Sort dilakukan pada beberapa kolom sekaligus (Custom Sort), maka...',
    options: buildOptions(
      'A. Data akan teracak rusak',
      'B. Pengurutan pertama berdasarkan kriteria utama (Level 1)',
      'C. Pengurutan kedua berfungsi jika ada data yang bernilai sama di kriteria utama',
      'D. Semua kolom menjadi rata tengah',
    ),
    correctPGK: ['B', 'C'],
  },
  {
    topicIndex: 4,
    topicTitle: TOPIC_4,
    categoryTitle: CAT_PGK,
    categoryNote: '*(Pilih lebih dari satu jawaban yang benar)*',
    numberInTopic: 9,
    type: 'PGK',
    questionText:
      '9. Kesalahan yang sering terjadi saat menggunakan formula dasar aritmatika adalah...',
    options: buildOptions(
      'A. Lupa mengawali dengan tanda sama dengan (=)',
      'B. Memilih alamat sel yang salah untuk dihitung',
      "C. Menggunakan tanda kurung '()' untuk mendahulukan operasi perhitungan",
      'D. Mengetikkan nilai huruf ke dalam operasi perhitungan matematika',
    ),
    correctPGK: ['A', 'B', 'D'],
  },
  {
    topicIndex: 4,
    topicTitle: TOPIC_4,
    categoryTitle: CAT_PGK,
    categoryNote: '*(Pilih lebih dari satu jawaban yang benar)*',
    numberInTopic: 10,
    type: 'PGK',
    questionText:
      '10. Ciri-ciri sel yang telah diaktifkan fitur Filter-nya adalah...',
    options: buildOptions(
      'A. Terdapat ikon panah kecil (drop-down) di sel judul kolom (header)',
      'B. Kolom akan berwarna otomatis',
      'C. Bisa digunakan untuk memilih nilai spesifik',
      'D. Semua data yang diketik berubah huruf kapital',
    ),
    correctPGK: ['A', 'C'],
  },
  {
    topicIndex: 4,
    topicTitle: TOPIC_4,
    categoryTitle: CAT_MATCH,
    numberInTopic: 11,
    type: 'MENJODOHKAN',
    questionText: '11. Pengurutan dari A ke Z atau nilai Terkecil ke Terbesar',
    matchingChoices: MATCH_POOL_T4,
    correctMatch: 'Ascending',
  },
  {
    topicIndex: 4,
    topicTitle: TOPIC_4,
    categoryTitle: CAT_MATCH,
    numberInTopic: 12,
    type: 'MENJODOHKAN',
    questionText: '12. Pengurutan dari Z ke A atau nilai Terbesar ke Terkecil',
    matchingChoices: MATCH_POOL_T4,
    correctMatch: 'Descending',
  },
  {
    topicIndex: 4,
    topicTitle: TOPIC_4,
    categoryTitle: CAT_MATCH,
    numberInTopic: 13,
    type: 'MENJODOHKAN',
    questionText: '13. Fitur untuk menyembunyikan data yang tidak memenuhi syarat',
    matchingChoices: MATCH_POOL_T4,
    correctMatch: 'Filter',
  },
  {
    topicIndex: 4,
    topicTitle: TOPIC_4,
    categoryTitle: CAT_MATCH,
    numberInTopic: 14,
    type: 'MENJODOHKAN',
    questionText: '14. Simbol operator pembagian dalam spreadsheet',
    matchingChoices: MATCH_POOL_T4,
    correctMatch: '/',
  },
  {
    topicIndex: 4,
    topicTitle: TOPIC_4,
    categoryTitle: CAT_MATCH,
    numberInTopic: 15,
    type: 'MENJODOHKAN',
    questionText: '15. Simbol operator perkalian dalam spreadsheet',
    matchingChoices: MATCH_POOL_T4,
    correctMatch: '*',
  },
  {
    topicIndex: 4,
    topicTitle: TOPIC_4,
    categoryTitle: CAT_ISIAN,
    numberInTopic: 16,
    type: 'ISIAN',
    questionText:
      '16. Untuk menghitung hasil kali antara sel C4 dan D4, maka rumus yang ditulis pada sel E4 adalah...',
    acceptedShortAnswers: ['=c4*d4', '=d4*c4', '=product(c4:d4)', '=product(c4;d4)', '=product(c4,d4)'],
  },
  {
    topicIndex: 4,
    topicTitle: TOPIC_4,
    categoryTitle: CAT_ISIAN,
    numberInTopic: 17,
    type: 'ISIAN',
    questionText:
      '17. Fitur yang mengurutkan daftar nama siswa sesuai dengan urutan abjad secara otomatis disebut...',
    acceptedShortAnswers: [
      'sort',
      'sorting',
      'ascending',
      'sort a to z',
      'sort a-z',
      'pengurutan',
    ],
  },
  {
    topicIndex: 4,
    topicTitle: TOPIC_4,
    categoryTitle: CAT_ISIAN,
    numberInTopic: 18,
    type: 'ISIAN',
    questionText:
      '18. Jika ingin menghitung total jumlah dari A1 ditambah B1, penulisan formulanya adalah...',
    acceptedShortAnswers: [
      '=a1+b1',
      '=b1+a1',
      '=sum(a1:b1)',
      '=sum(a1;b1)',
      '=sum(a1,b1)',
    ],
  },
  {
    topicIndex: 4,
    topicTitle: TOPIC_4,
    categoryTitle: CAT_ISIAN,
    numberInTopic: 19,
    type: 'ISIAN',
    questionText:
      '19. Fitur Drop-down list pada header tabel yang memunculkan checklist pilihan kriteria disebut fitur...',
    acceptedShortAnswers: ['filter', 'filtering'],
  },
  {
    topicIndex: 4,
    topicTitle: TOPIC_4,
    categoryTitle: CAT_ISIAN,
    numberInTopic: 20,
    type: 'ISIAN',
    questionText:
      '20. Aturan matematika hierarki operasi berlaku di spreadsheet, operasi yang didahulukan sebelum perkalian dan pembagian jika ditulis dalam tanda kurung adalah...',
    acceptedShortAnswers: [
      'tanda kurung',
      'kurung',
      'dalam kurung',
      'operasi di dalam tanda kurung',
      'operasi dalam tanda kurung',
      'penjumlahan dan pengurangan',
      'penjumlahan atau pengurangan',
      'penjumlahan',
      'pengurangan',
    ],
  },

  // =========================================================================
  // TOPIK 5: Praktik Analisis dan Pengolahan Data Sederhana (81-100)
  // =========================================================================
  {
    topicIndex: 5,
    topicTitle: TOPIC_5,
    categoryTitle: CAT_PG,
    numberInTopic: 1,
    type: 'PG',
    questionText:
      '1. Saat membuat tabel kas kelas, atribut kolom yang paling esensial untuk memantau arus uang adalah...',
    options: buildOptions(
      'A. Nama, Alamat, Hobi',
      'B. Tanggal, Keterangan, Pemasukan, Pengeluaran, Saldo',
      'C. Nomor, Nama Barang, Diskon',
      'D. Hari, Jam, Mata Pelajaran',
    ),
    correctPG: 'B',
  },
  {
    topicIndex: 5,
    topicTitle: TOPIC_5,
    categoryTitle: CAT_PG,
    numberInTopic: 2,
    type: 'PG',
    questionText: '2. Pada tabel kas kelas, Saldo Akhir didapatkan dari...',
    options: buildOptions(
      'A. Saldo Sebelumnya + Pemasukan - Pengeluaran',
      'B. Pemasukan x Pengeluaran',
      'C. Saldo Sebelumnya - Pemasukan + Pengeluaran',
      'D. Total Pemasukan dibagi Total Pengeluaran',
    ),
    correctPG: 'A',
  },
  {
    topicIndex: 5,
    topicTitle: TOPIC_5,
    categoryTitle: CAT_PG,
    numberInTopic: 3,
    type: 'PG',
    questionText:
      '3. Jika Saldo bulan ini menunjukkan angka negatif (misalnya -Rp50.000), analisis yang paling tepat adalah...',
    options: buildOptions(
      'A. Kas kelas sedang surplus/untung',
      'B. Pengeluaran kelas lebih besar daripada pemasukan',
      'C. Pemasukan sangat banyak',
      'D. Uang kas kelas hilang dicuri',
    ),
    correctPG: 'B',
  },
  {
    topicIndex: 5,
    topicTitle: TOPIC_5,
    categoryTitle: CAT_PG,
    numberInTopic: 4,
    type: 'PG',
    questionText:
      "4. Untuk memformat sel angka agar otomatis menampilkan simbol 'Rp' dan pemisah ribuan, fitur yang digunakan adalah...",
    options: buildOptions(
      'A. Format as Table',
      'B. Accounting / Currency Number Format',
      'C. Conditional Formatting',
      'D. Merge & Center',
    ),
    correctPG: 'B',
  },
  {
    topicIndex: 5,
    topicTitle: TOPIC_5,
    categoryTitle: CAT_PG,
    numberInTopic: 5,
    type: 'PG',
    questionText:
      '5. Mengapa pengelolaan kas kelas jauh lebih efektif jika dilakukan di spreadsheet dibandingkan di buku tulis biasa?',
    options: buildOptions(
      'A. Karena buku tulis harganya mahal',
      'B. Spreadsheet mengkalkulasi saldo secara otomatis saat ada data baru',
      'C. Buku tulis tidak memiliki fitur pewarnaan',
      'D. Spreadsheet tidak bisa diakses orang lain',
    ),
    correctPG: 'B',
  },
  {
    topicIndex: 5,
    topicTitle: TOPIC_5,
    categoryTitle: CAT_PGK,
    categoryNote: '*(Pilih lebih dari satu jawaban yang benar)*',
    numberInTopic: 6,
    type: 'PGK',
    questionText:
      "6. Dalam merancang tabel kas kelas, elemen yang termasuk 'Pemasukan' (Debit) adalah...",
    options: buildOptions(
      'A. Iuran mingguan siswa',
      'B. Pembelian sapu dan spidol',
      'C. Donasi dari wali kelas',
      'D. Denda siswa yang terlambat',
    ),
    correctPGK: ['A', 'C', 'D'],
  },
  {
    topicIndex: 5,
    topicTitle: TOPIC_5,
    categoryTitle: CAT_PGK,
    categoryNote: '*(Pilih lebih dari satu jawaban yang benar)*',
    numberInTopic: 7,
    type: 'PGK',
    questionText:
      '7. Jika sel E5 adalah Saldo saat ini, sel C6 adalah Pemasukan baru, dan sel D6 adalah Pengeluaran baru. Rumus yang tepat untuk mengisi Saldo di E6 adalah...',
    options: buildOptions(
      'A. =E5+C6-D6',
      'B. =SUM(E5;C6)-D6',
      'C. =E5-C6+D6',
      'D. =C6-D6',
    ),
    correctPGK: ['A', 'B'],
  },
  {
    topicIndex: 5,
    topicTitle: TOPIC_5,
    categoryTitle: CAT_PGK,
    categoryNote: '*(Pilih lebih dari satu jawaban yang benar)*',
    numberInTopic: 8,
    type: 'PGK',
    questionText:
      '8. Langkah analisis data sederhana yang bisa dilakukan setelah tabel kas kelas selesai dalam satu semester adalah...',
    options: buildOptions(
      'A. Memfilter bulan dengan pengeluaran terbesar',
      'B. Mengurutkan siapa saja yang paling sering telat bayar kas',
      'C. Menghitung rata-rata pengeluaran kelas per bulan',
      'D. Menghapus semua data yang angkanya kecil',
    ),
    correctPGK: ['A', 'B', 'C'],
  },
  {
    topicIndex: 5,
    topicTitle: TOPIC_5,
    categoryTitle: CAT_PGK,
    categoryNote: '*(Pilih lebih dari satu jawaban yang benar)*',
    numberInTopic: 9,
    type: 'PGK',
    questionText:
      "9. Pemformatan 'Accounting' pada spreadsheet memiliki keuntungan berupa...",
    options: buildOptions(
      'A. Menyejajarkan simbol mata uang (Rp) di sisi paling kiri sel dengan rapi',
      'B. Mengubah huruf abjad menjadi angka otomatis',
      'C. Memberikan tanda titik (.) atau koma (,) pemisah ribuan secara otomatis',
      'D. Menerjemahkan bahasa Indonesia ke bahasa Inggris',
    ),
    correctPGK: ['A', 'C'],
  },
  {
    topicIndex: 5,
    topicTitle: TOPIC_5,
    categoryTitle: CAT_PGK,
    categoryNote: '*(Pilih lebih dari satu jawaban yang benar)*',
    numberInTopic: 10,
    type: 'PGK',
    questionText:
      '10. Saat terjadi kesalahan input (misalnya belanja sapu Rp 15.000 tertulis Rp 150.000) pada sistem kas berbasis spreadsheet, maka hal yang terjadi adalah...',
    options: buildOptions(
      'A. Seluruh tabel akan terhapus otomatis karena error',
      'B. Saldo akhir akan langsung berubah secara otomatis',
      'C. Cukup merevisi angka Rp 150.000 menjadi 15.000 dan saldo otomatis terkoreksi',
      'D. Kita harus menghitung ulang manual menggunakan kalkulator dari baris pertama',
    ),
    correctPGK: ['B', 'C'],
  },
  {
    topicIndex: 5,
    topicTitle: TOPIC_5,
    categoryTitle: CAT_MATCH,
    numberInTopic: 11,
    type: 'MENJODOHKAN',
    questionText: '11. Uang yang masuk atau diterima ke dalam kas',
    matchingChoices: MATCH_POOL_T5,
    correctMatch: 'Pemasukan',
  },
  {
    topicIndex: 5,
    topicTitle: TOPIC_5,
    categoryTitle: CAT_MATCH,
    numberInTopic: 12,
    type: 'MENJODOHKAN',
    questionText: '12. Uang yang digunakan/dibayarkan keluar dari kas',
    matchingChoices: MATCH_POOL_T5,
    correctMatch: 'Pengeluaran',
  },
  {
    topicIndex: 5,
    topicTitle: TOPIC_5,
    categoryTitle: CAT_MATCH,
    numberInTopic: 13,
    type: 'MENJODOHKAN',
    questionText: '13. Sisa uang yang ada di kas pada waktu tertentu',
    matchingChoices: MATCH_POOL_T5,
    correctMatch: 'Saldo',
  },
  {
    topicIndex: 5,
    topicTitle: TOPIC_5,
    categoryTitle: CAT_MATCH,
    numberInTopic: 14,
    type: 'MENJODOHKAN',
    questionText: '14. Pemformatan khusus sel untuk data keuangan/uang',
    matchingChoices: MATCH_POOL_T5,
    correctMatch: 'Accounting/Currency',
  },
  {
    topicIndex: 5,
    topicTitle: TOPIC_5,
    categoryTitle: CAT_MATCH,
    numberInTopic: 15,
    type: 'MENJODOHKAN',
    questionText: '15. Kesalahan hitung yang disebabkan oleh manusia',
    matchingChoices: MATCH_POOL_T5,
    correctMatch: 'Human Error',
  },
  {
    topicIndex: 5,
    topicTitle: TOPIC_5,
    categoryTitle: CAT_ISIAN,
    numberInTopic: 16,
    type: 'ISIAN',
    questionText:
      '16. Rumus matematika dasar yang digunakan untuk mencari nilai Sisa Saldo (Saldo Awal, ditambah Pemasukan, dikurangi...) adalah...',
    acceptedShortAnswers: ['pengeluaran', 'total pengeluaran'],
  },
  {
    topicIndex: 5,
    topicTitle: TOPIC_5,
    categoryTitle: CAT_ISIAN,
    numberInTopic: 17,
    type: 'ISIAN',
    questionText:
      '17. Jika saldo awal bulan Rp 100.000, lalu ada pembelian alat kebersihan Rp 25.000, maka sisa saldonya adalah...',
    acceptedShortAnswers: [
      'rp 75.000',
      'rp75.000',
      '75.000',
      '75000',
      'rp 75000',
      'rp75000',
      'rp 75.000,00',
      '75 ribu',
    ],
  },
  {
    topicIndex: 5,
    topicTitle: TOPIC_5,
    categoryTitle: CAT_ISIAN,
    numberInTopic: 18,
    type: 'ISIAN',
    questionText:
      '18. Ikon format angka bergambar koin/tumpukan uang atau simbol mata uang pada spreadsheet berfungsi untuk mengubah teks angka menjadi format...',
    acceptedShortAnswers: [
      'accounting',
      'currency',
      'accounting/currency',
      'accounting / currency',
      'mata uang',
      'uang',
      'keuangan',
      'rupiah',
    ],
  },
  {
    topicIndex: 5,
    topicTitle: TOPIC_5,
    categoryTitle: CAT_ISIAN,
    numberInTopic: 19,
    type: 'ISIAN',
    questionText:
      '19. Jika ingin mengetahui total keseluruhan pemasukan dari baris pertama hingga terakhir, fungsi (rumus) yang paling cepat digunakan adalah...',
    acceptedShortAnswers: ['sum', '=sum', 'autosum', 'sum()'],
  },
  {
    topicIndex: 5,
    topicTitle: TOPIC_5,
    categoryTitle: CAT_ISIAN,
    numberInTopic: 20,
    type: 'ISIAN',
    questionText:
      '20. Aplikasi pengolah angka (Spreadsheet) sangat bermanfaat untuk pembuatan laporan keuangan karena sifat datanya yang dinamis, artinya jika satu sel diubah, maka sel saldo akan berubah secara...',
    acceptedShortAnswers: ['otomatis', 'langsung', 'dinamis'],
  },
];

export const ALL_AUTHORITATIVE_QUESTIONS: AuthoritativeQuestion[] = RAW_QUESTIONS.map(
  (item, idx) => ({
    ...item,
    id: `q_${idx + 1}`,
    globalOrder: idx + 1,
  }),
);

export function sanitizeQuestion(q: AuthoritativeQuestion): PublicQuestion {
  return {
    id: q.id,
    globalOrder: q.globalOrder,
    topicIndex: q.topicIndex,
    topicTitle: q.topicTitle,
    categoryTitle: q.categoryTitle,
    categoryNote: q.categoryNote,
    numberInTopic: q.numberInTopic,
    type: q.type,
    questionText: q.questionText,
    options: q.options,
    matchingChoices: q.matchingChoices,
    pgkRequiredCount: q.type === 'PGK' ? (q.correctPGK?.length ?? 2) : undefined,
  };
}

function normalizeShortText(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/^['"`*]+|['"`*.!]+$/g, '');
}

export function validateAnswerAuthoritative(
  question: AuthoritativeQuestion,
  rawSubmitted: unknown,
): { isCorrect: boolean; normalizedDisplay: string } {
  if (question.type === 'PG') {
    const val = String(rawSubmitted ?? '').trim().toUpperCase();
    return {
      isCorrect: val === question.correctPG,
      normalizedDisplay: val || '-',
    };
  }

  if (question.type === 'PGK') {
    const arr = Array.isArray(rawSubmitted)
      ? rawSubmitted.map((x) => String(x).trim().toUpperCase())
      : String(rawSubmitted ?? '')
          .split(',')
          .map((x) => x.trim().toUpperCase())
          .filter(Boolean);
    const uniqueSorted = Array.from(new Set(arr)).sort();
    const expectedSorted = [...(question.correctPGK ?? [])].sort();
    const isCorrect =
      uniqueSorted.length === expectedSorted.length &&
      uniqueSorted.every((v, idx) => v === expectedSorted[idx]);
    return {
      isCorrect,
      normalizedDisplay: uniqueSorted.join(', ') || '-',
    };
  }

  if (question.type === 'MENJODOHKAN') {
    const submittedStr = String(rawSubmitted ?? '').trim();
    // Allow matching either by choice ID ("m_1") or exact text ("Data Terstruktur")
    const choiceById = question.matchingChoices?.find((c) => c.id === submittedStr);
    const chosenText = choiceById ? choiceById.text : submittedStr;
    const isCorrect =
      chosenText.trim().toLowerCase() === (question.correctMatch ?? '').trim().toLowerCase();
    return {
      isCorrect,
      normalizedDisplay: chosenText || '-',
    };
  }

  // ISIAN SINGKAT
  const rawStr = String(rawSubmitted ?? '').trim();
  const norm = normalizeShortText(rawStr);
  const compactNoSpaces = norm.replace(/\s+/g, '');

  const accepted = question.acceptedShortAnswers ?? [];
  const isCorrect = accepted.some((candidate) => {
    const cNorm = normalizeShortText(candidate);
    const cCompact = cNorm.replace(/\s+/g, '');
    return norm === cNorm || compactNoSpaces === cCompact;
  });

  return {
    isCorrect,
    normalizedDisplay: rawStr || '-',
  };
}

const CHEERS_CORRECT: Array<(teamLabel: string) => string> = [
  (t) => `Mantap, ${t}! Gas terus, jangan ki' mundur!`,
  () => `Ewako! Jawaban ta' benar!`,
  () => `Baji' sekali! Motor ta' makin laju!`,
  () => `Sipp! Satu langkah lebih dekat ke garis finis!`,
  () => `Keren! Otak ta' memang tajam!`,
  (t) => `Gasss poll, ${t}! Mantap mentong jawaban ta'!`,
  (t) => `Luar biasa, ${t}! Fokus ta' juara sekali!`,
  () => `Top markotop! Melaju lagi satu checkpoint, Ewako!`,
];

const CHEERS_WRONG: Array<(teamLabel: string) => string> = [
  () => `Tabe', belum tepat! Coba lebih teliti ki'!`,
  () => `Jangan menyerah, masih ada kesempatan!`,
  () => `Santai ki'! Fokus lagi, pasti bisa!`,
  () => `Belum baji', tapi semangat ta' tetap harus menyala!`,
  (t) => `Ayo, ${t}! Masih bisa mengejar!`,
  (t) => `Tenang ki', ${t}! Baca baik-baik soal berikutnya, pasti baji'!`,
  () => `Tetap semangat ki'! Jangan kendor konsentrasi ta'!`,
  (t) => `Sabar ki', ${t}! Balapan belum selesai, gas di soal berikutnya!`,
];

export function pickMakassarCheer(
  team: TeamId,
  isCorrect: boolean,
  seedIndex: number,
): string {
  const label = team === 'lamacca' ? 'LAMACCA' : 'TOACCA';
  const pool = isCorrect ? CHEERS_CORRECT : CHEERS_WRONG;
  const fn = pool[Math.abs(seedIndex) % pool.length];
  return fn(label);
}
