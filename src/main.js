const discord = require('discord.js');
const client = new discord.Client();

const jackMaster = require('./jack-master.js');

client.on('ready', message => {
  console.log('bot is ready!');
  client.user.setPresence({activity: {name: 'SAVスプリント'}});
});

const config = require('./config.js');
const members = config.TEAM_MEMBERS;

const removeMention = (message) => message.replace(/^<[^>]+>\s/, '');

client.on('message', message => {
  console.log(message.content);
  if (!message.mentions.has(client.user, { ignoreEveryone: true, ignoreRoles: true })) {
    return;
  }
  const cleanContent = removeMention(message.content);
  if (cleanContent.startsWith('order')) {
    const orderedMembers = jackMaster.order(members);
    message.channel.send(orderedMembers);
  } else if (cleanContent.startsWith('meeting')) {
    const roles = jackMaster.assignMeetingRoles(members);
    message.channel.send(roles);
  } else if (cleanContent.startsWith('random')) {
    const theOne = jackMaster.pickOne(members);
    message.channel.send(theOne);
  } else if (cleanContent.startsWith('members')) {
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
