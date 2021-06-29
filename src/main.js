const discord = require('discord.js');
const client = new discord.Client();

const mandatoryConfigItemNames = [
  'DISCORD_BOT_TOKEN',
  'TEAM_MEMBERS'
];
(function environmentVariablesCheck() {
  const lacksMandatoryItem = mandatoryConfigItemNames
  .filter(configName => (process.env[configName] === undefined))
  .filter(configName => {
    console.log(`Please set ${configName}. See README.md for the details.`);
    return true;
  }) // would be nice if we can peek in javascript
  .reduce(() => true, false);
  if (lacksMandatoryItem) {
    process.exit(0);
  }
})();

const parseTeamMembers = (configValue) => {
  return configValue.split(',')
  .map(memberConfig => {
    const tokens = memberConfig.split(':');
    return Object.freeze({
      name: tokens[0],
      discordId: tokens[1]
    });
  });
};

const members = parseTeamMembers(process.env.TEAM_MEMBERS);
const config = {
  DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
  TEAM_MEMBERS: members
};

const jackMaster = require('./jack-master.js');

client.on('ready', message => {
  console.log('bot is ready!');
  client.user.setPresence({activity: {name: 'SAVスプリント'}});
});

client.on('message', message => {
  if (!message.mentions.has(client.user, { ignoreEveryone: true, ignoreRoles: true })) {
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
    message.channel.send(theOne);
  } else if (message.content.includes('members')) {
    message.channel.send(members.map(m => m.name).join('\n'));
  } else {
    message.channel.send(
        'Available commands:\n' +
        '`order` Lists all team members in a random order\n' +
        '`meeting` Assigns team members to meeting roles\n' +
        '`random` Pick one member randomly\n' +
        '`members` Lists all team members\n'
    );
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
