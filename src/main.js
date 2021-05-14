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

const members = process.env.TEAM_MEMBERS.split(',');
Object.freeze(members);
const jackMaster = require('./jack-master.js');

client.on('ready', message => {
  console.log('bot is ready!');
  client.user.setPresence({activity: {name: 'SAVスプリント'}});
});

client.on('message', message => {
  if (!message.mentions.has(client.user)) {
    return;
  }
  if (message.content.includes('order')) {
    const orderedMembers = jackMaster.whosFirst(members);
    message.channel.send(orderedMembers);
  } else if (message.content.includes('meeting')) {
    const roles = jackMaster.whosFacilitator(members);
    message.channel.send(roles);
  } else if (message.content.includes('random')) {
    const theOne = jackMaster.pickOne(members);
    message.channel.send(roles);
  } else if (message.content.includes('members')) {
    message.channel.send(members.join('\n'));
  } else {
    message.reply(
        'Available commands:\n' +
        '`order`\n' +
        '`meeting`\n' +
        '`random`\n' +
        '`members`\n'
    );
  }
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

client.login(process.env.DISCORD_BOT_TOKEN);
