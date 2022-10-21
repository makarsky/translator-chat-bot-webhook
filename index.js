const express = require('express');
const bodyParser = require('body-parser');
const Sentry = require('@sentry/node');
require('dotenv').config();

if (process.env.SENTRY_PUBLIC_KEY && process.env.SENTRY_PROJECT_ID) {
  Sentry.init({
    enabled: process.env.SENTRY_ENABLED === 'true',
    environment: process.env.ENVIRONMENT,
    release: process.env.GIT_TAG,
    dsn: `https://${process.env.SENTRY_PUBLIC_KEY}@o1116734.ingest.sentry.io/${process.env.SENTRY_PROJECT_ID}`,
    integrations: [new Sentry.Integrations.Http({ tracing: true })],
    tracesSampleRate: 1.0,
  });
}

const app = express();
const router = express.Router();

const api = require('./src/api');

const path = `${__dirname}/views/`;

router.use((req, res, next) => {
  next();
});

router.get('/', (req, res) => {
  res.sendFile(`${path}index.html`);
});

app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);
app.use(bodyParser.json());

app.use(express.static(path));
app.use('/', router);
app.use('/api/v1', api);

if (process.env.ENVIRONMENT === 'dev') {
  app.listen(process.env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Example app listening on port ${process.env.PORT}!`);
  });
}

module.exports = app;
