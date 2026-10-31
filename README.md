# LAMACCA VS TOACCA — 3D Edu Racing Challenge

Game edukasi balap motor 3D interaktif dua pemain untuk siswa SMP dengan materi **Konsep dan Analisis Data Terstruktur** (100 Soal Lengkap: Pilihan Ganda, Pilihan Ganda Kompleks, Menjodohkan, dan Isian Singkat).

---

## Cara Memainkan Langsung di GitHub Pages

Kode proyek ini sudah dilengkapi mesin permainan mandiri di sisi browser (*Standalone Client Engine*), jalur aset relatif (`base: './'`), serta *workflow* **GitHub Actions** otomatis.

Setelah melakukan **Export / Push ke GitHub**:

1. Buka repositori GitHub Anda (misalnya `Konsep-dan-Analisis-Data-Terstruktur`).
2. Klik menu **Settings** → pilih **Pages** di bilah kiri.
3. Pada bagian **Build and deployment → Source**, pilih salah satu:
   - **GitHub Actions** *(Direkomendasikan)*, **ATAU**
   - **Deploy from a branch** → pilih Branch **`gh-pages`** dan folder **`/ (root)`** lalu klik **Save**.
4. Tunggu ~45 detik hingga proses *Actions* selesai (centang hijau), lalu buka alamat:
   `https://<username-anda>.github.io/<nama-repo>/`

---

## Menjalankan Secara Lokal

```bash
npm install
npm run dev
```

Untuk membangun versi statis siap unggah (*build*):

```bash
npm run build
```
Hasil kompilasi statis tersedia di dalam folder `dist/`.
