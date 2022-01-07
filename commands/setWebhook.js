const fetch = require('node-fetch');

const url = `https://api.telegram.org/bot${process.env.TOKEN}/setWebhook?url=${process.env.WEBAPP_URL}`;
fetch(url).then((response) => console.log(response));
