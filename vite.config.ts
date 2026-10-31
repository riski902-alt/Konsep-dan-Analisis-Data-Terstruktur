import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';

function githubPagesStandaloneSyncPlugin(): Plugin {
  return {
    name: 'github-pages-standalone-sync',
    transformIndexHtml(html) {
      return html.replace(
        '<!--VITE_PROCESSED_MARKER-->',
        '<script>window.__VITE_PROCESSED__=true;</script>',
      );
    },
    closeBundle() {
      const distAssetsDir = path.resolve(__dirname, 'dist', 'assets');
      const standaloneDir = path.resolve(__dirname, 'public', 'standalone');
      if (!fs.existsSync(distAssetsDir)) return;

      fs.mkdirSync(standaloneDir, {recursive: true});
      for (const fileName of fs.readdirSync(distAssetsDir)) {
        const srcFile = path.join(distAssetsDir, fileName);
        const destFile = path.join(standaloneDir, fileName);
        if (fs.statSync(srcFile).isFile()) {
          fs.copyFileSync(srcFile, destFile);
        }
      }

      const rootNoJekyll = path.resolve(__dirname, '.nojekyll');
      if (!fs.existsSync(rootNoJekyll)) {
        fs.writeFileSync(rootNoJekyll, '');
      }
    },
  };
}

export default defineConfig(({command}) => {
  return {
    base: command === 'build' ? './' : '/',
    plugins: [react(), tailwindcss(), githubPagesStandaloneSyncPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      rollupOptions: {
        output: {
          entryFileNames: 'assets/game.js',
          chunkFileNames: 'assets/[name].js',
          assetFileNames: 'assets/game.[ext]',
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
