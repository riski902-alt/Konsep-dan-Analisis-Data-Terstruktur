import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {defineConfig, type Plugin} from 'vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

function githubPagesOutputPlugin(): Plugin {
  return {
    name: 'github-pages-output',
    transformIndexHtml(html) {
      return html.replace(
        '<!--VITE_PROCESSED_MARKER-->',
        '<script>window.__VITE_PROCESSED__=true;</script>',
      );
    },
    closeBundle() {
      const distDir = path.resolve(rootDir, 'dist');
      if (fs.existsSync(distDir)) {
        fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
      }
    },
  };
}

export default defineConfig(({command}) => {
  return {
    base: command === 'build' ? './' : '/',
    plugins: [react(), tailwindcss(), githubPagesOutputPlugin()],
    resolve: {
      alias: {
        '@': rootDir,
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        output: {
          entryFileNames: 'assets/game-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
