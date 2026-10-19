import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import * as Sentry from '@sentry/node';
import dotenv from 'dotenv';

dotenv.config();

if (process.env.SENTRY_PUBLIC_KEY && process.env.SENTRY_PROJECT_ID) {
  Sentry.init({
    enabled: process.env.SENTRY_ENABLED === 'true',
    environment: process.env.ENVIRONMENT,
    release: process.env.GIT_TAG,
    dsn: `https://${process.env.SENTRY_PUBLIC_KEY}@o1116734.ingest.sentry.io/${process.env.SENTRY_PROJECT_ID}`,
    integrations: [Sentry.httpIntegration()],
    tracesSampleRate: 1.0,
  });
}

const app = express();
const api = require('./src/api');
const publicPath = path.join(process.cwd(), 'public');
const sourcePath = path.join(process.cwd(), 'views');
const indexPath = fs.existsSync(path.join(publicPath, 'index.html'))
  ? publicPath
  : sourcePath;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/api/v1', api);
app.use(express.static(publicPath));
app.use(express.static(sourcePath));
app.get('/', (_req, res) => {
  res.sendFile(path.join(indexPath, 'index.html'));
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
  });
}

module.exports = app;
