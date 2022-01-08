const fetch = require('node-fetch');
const botCommands = require('../api/botCommands');

const botCommandsJson = JSON.stringify(
    botCommands.map((botCommand) => ({
        command: botCommand.regExp.toString().replace(/\W+/g, ''),
        description: botCommand.description,
    }))
);
const url = `https://api.telegram.org/bot${process.env.TOKEN}/setMyCommands?commands=${botCommandsJson}`

fetch(url).then((response) => console.log(response));
