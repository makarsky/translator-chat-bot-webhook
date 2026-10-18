require('dotenv').config();

const ngrok = require('@ngrok/ngrok');

const authToken = process.env.NGROK_AUTH_TOKEN;
const domain = process.env.NGROK_DOMAIN;
const port = process.env.PORT || 3000;

if (!authToken) {
  console.error('NGROK_AUTH_TOKEN must be set in .env');
  process.exitCode = 1;
} else {
  let listener;
  let shutdownPromise;

  const shutdown = (signal) => {
    if (shutdownPromise) return shutdownPromise;

    shutdownPromise = (async () => {
      try {
        if (listener) await listener.close();
        process.exitCode = signal === 'SIGINT' ? 130 : 143;
      } catch (error) {
        console.error('Failed to close ngrok tunnel', error);
        process.exitCode = 1;
      } finally {
        process.stdin.pause();
      }
    })();

    return shutdownPromise;
  };

  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));

  ngrok
    .forward({
      addr: `localhost:${port}`,
      authtoken: authToken,
      domain: domain,
    })
    .then((openedListener) => {
      listener = openedListener;

      if (shutdownPromise) {
        return listener.close();
      }

      console.log(`ngrok HTTPS URL: ${listener.url()}`);
      process.stdin.resume();
    })
    .catch((error) => {
      console.error('Failed to start ngrok tunnel', error);
      process.exitCode = 1;
    });
}
