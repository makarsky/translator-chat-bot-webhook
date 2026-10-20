import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const configDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootPath = path.resolve(configDirectory, 'views');
const outputPath = path.resolve(configDirectory, 'public');

export default defineConfig(async () => {
  const { default: tailwindcss } = await import('@tailwindcss/vite');

  return {
    root: rootPath,
    publicDir: false,
    server: {
      proxy: {
        '/api': 'http://localhost:3000',
      },
    },
    build: {
      outDir: outputPath,
      emptyOutDir: true,
    },
    plugins: [
      tailwindcss(),
      {
        name: 'copy-google-site-verification',
        closeBundle() {
          fs.copyFileSync(
            path.join(rootPath, 'google7ef08398935a0a68.html'),
            path.join(outputPath, 'google7ef08398935a0a68.html'),
          );
        },
      },
    ],
  };
});
