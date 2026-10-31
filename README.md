# LAMACCA VS TOACCA — 3D Edu Racing Challenge

Game edukasi balap motor 3D interaktif dua pemain untuk siswa SMP dengan materi **Konsep dan Analisis Data Terstruktur** (5 Level Adrenaline · 100 Soal Lengkap: Pilihan Ganda, Pilihan Ganda Kompleks, Menjodohkan, dan Isian Singkat).

---

## Publikasi Otomatis ke GitHub Pages

Proyek ini sudah dilengkapi:
- **Standalone Browser Engine** (`src/engine/raceEngine.ts` + `src/services/raceClient.ts`) yang berjalan penuh di sisi browser tanpa membutuhkan server backend.
- **Konfigurasi Aset Relatif** (`base: './'` di `vite.config.ts`) dengan nama bundel *cache-busted* (`assets/game-[hash].js`) agar pembaruan langsung tampil tanpa tertahan *cache* browser.
- **Workflow GitHub Actions Otomatis** (`.github/workflows/deploy.yml`) yang langsung mengompilasi TypeScript, React 19, Tailwind CSS, dan Three.js ke GitHub Pages maupun branch `gh-pages` setiap kali kode di-*push* ke branch `main`.

### Cara Memastikan Tampil di GitHub Pages:
1. Lakukan **Save / Export ke GitHub** dari proyek ini.
2. Pada repositori GitHub Anda, pastikan menu **Settings → Pages → Source** diatur ke **GitHub Actions** (atau **Deploy from a branch → `gh-pages`**).
3. Tunggu ~30–45 detik hingga *workflow* **Deploy Game 3D ke GitHub Pages** di tab **Actions** bercentang hijau, lalu muat ulang (`Ctrl + Shift + R`) halaman `https://<username>.github.io/<nama-repo>/`.

---

## Menjalankan Secara Lokal

```bash
npm install
npm run dev
```

Untuk mengompilasi versi statis produksi (`dist/`):

```bash
npm run build
```
