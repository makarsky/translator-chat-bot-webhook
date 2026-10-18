const express = require('express');
const fs = require('fs');
const path = require('path');
const Sentry = require('@sentry/node');
require('dotenv').config();

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
const publicPath = path.join(__dirname, 'public');
const sourcePath = path.join(__dirname, 'views');
const indexPath = fs.existsSync(path.join(publicPath, 'index.html'))
  ? publicPath
  : sourcePath;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/api/v1', api);
app.use(express.static(publicPath));
app.use(express.static(sourcePath));
app.get('/', (req, res) => {
  res.sendFile(path.join(indexPath, 'index.html'));
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
  });
}

module.exports = app;
