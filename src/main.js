// Response for Uptime Robot
const http = require('http');
http.createServer(function (request, response) {
  response.writeHead(200, {'Content-Type': 'text/plain'});
  response.end('Discord bot is active now \n');
})
.listen(3000);

// Discord bot implements
const discord = require('discord.js');
const client = new discord.Client();

client.on('ready', message => {
  console.log('bot is ready!');
  client.user.setPresence({activity: {name: 'SAVスプリント'}});
});

const handler = require('./handler.js');
client.on('message', message => {
  if (!message.mentions.has(client.user)) {
    return;
  }

  handler.message(message);
});

const checks = [
  ['DISCORD_BOT_TOKEN', 'please set ENV: DISCORD_BOT_TOKEN'],
  ['TEAM_MEMBERS',
    'no members in the team. please set ENV: TEAM_MEMBERS in CSV format']
];
(function environmentVariablesCheck() {
  const lacksAnyMandatoryVariable = checks
  .filter(([variableName, unsetMessage]) => (process.env[variableName] === undefined))
  .filter(([variableName, unsetMessage]) => {
    console.log(unsetMessage);
    return true;
  }) // whould be nice if we can peek in javascript
  .reduce(() => true, false);
  if (lacksAnyMandatoryVariable) {
    process.exit(0);
  }
})();

const env = require('./environment.js');
client.login(env.DISCORD_BOT_TOKEN);
