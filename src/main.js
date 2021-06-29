const discord = require('discord.js');
const client = new discord.Client();

client.on('ready', message => {
  console.log('bot is ready!');
  client.user.setPresence({activity: {name: 'SAVスプリント'}});
});

const config = require('./config.js');
const members = config.TEAM_MEMBERS;
const JackMaster = require('./jack-master.js');
const jackMaster = JackMaster(members)

const removeMention = (message) => message.replace(/^<[^>]+>\s/, '');

client.on('message', message => {
  console.log(message.content);
  if (!message.mentions.has(client.user, { ignoreEveryone: true, ignoreRoles: true })) {
    return;
  }
  const cleanContent = removeMention(message.content);
  if (cleanContent.startsWith('order')) {
    const orderedMembers = jackMaster.order();

    const response = orderedMembers
    .map((member, index) => `${index + 1}: ${member.name}`)
    .join('\n');

    message.channel.send(response);
  } else if (cleanContent.startsWith('meeting')) {
    const roles = jackMaster.assignMeetingRoles();

    const response = `ファシリテーター: ${roles.facilitator.name ?? 'n/a'}\nタイム・キーパー: ${roles.timeKeeper.name ?? 'n/a'}\n書記: ${roles.clerical.name ?? 'n/a'}`;

    message.channel.send(response);
  } else if (cleanContent.startsWith('random')) {
    const theOne = jackMaster.pickOne();
    message.channel.send(theOne.name);
  } else if (cleanContent.startsWith('members')) {
    const members = jackMaster.members();
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
