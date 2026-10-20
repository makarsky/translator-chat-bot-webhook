const path = require('path');
const fs = require('fs');
const { defineConfig } = require('vite');

const rootPath = path.resolve(__dirname, 'views');
const outputPath = path.resolve(__dirname, 'public');

module.exports = defineConfig(async () => {
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
