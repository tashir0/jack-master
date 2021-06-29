const discord = require('discord.js');
const client = new discord.Client();

const jackMaster = require('./jack-master.js');

client.on('ready', message => {
  console.log('bot is ready!');
  client.user.setPresence({activity: {name: 'SAVスプリント'}});
});

const config = require('./config.js');
const members = config.TEAM_MEMBERS;

client.on('message', message => {
  if (!message.mentions.has(client.user, { ignoreEveryone: true, ignoreRoles: true })) {
    return;
  }
  if (message.content.startsWith('order')) {
    const orderedMembers = jackMaster.whosFirst(members);
    message.channel.send(orderedMembers);
  } else if (message.content.startsWith('meeting')) {
    const roles = jackMaster.whosFacilitator(members);
    message.channel.send(roles);
  } else if (message.content.startsWith('random')) {
    const theOne = jackMaster.pickOne(members);
    message.channel.send(theOne);
  } else if (message.content.startsWith('members')) {
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

client.login(config.DISCORD_BOT_TOKEN);
