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

const commandResolver = {

  order:  {
    executor: jackMaster.order,
    formatter: orderedMembers => orderedMembers
      .map((member, index) => `${index + 1}: ${member.name}`)
      .join('\n')
  },

  meeting: {
    executor: jackMaster.assignMeetingRoles,
    formatter: roles => `ファシリテーター: ${roles.facilitator.name ?? 'n/a'}\n` +
        `タイム・キーパー: ${roles.timeKeeper.name ?? 'n/a'}\n` +
        `書記: ${roles.clerical.name ?? 'n/a'}`
  },

  random: {
    executor: jackMaster.pickOne,
    formatter: theOne => theOne.name
  },

  members: {
    executor: jackMaster.members,
    formatter: members => members.map(m => m.name).join('\n')
  }
};


client.on('message', message => {
  if (!message.mentions.has(client.user, { ignoreEveryone: true, ignoreRoles: true })) {
    return;
  }

  console.log(message.content);
  const cleanContent = removeMention(message.content.trim());
  const firstWord = cleanContent.split(' ')[0];

  const command = commandResolver[firstWord];
  if (command) {
    const result = command.executor();
    const response = command.formatter(result);
    message.channel.send(response);
  } else {
    message.channel.send(
        'Available commands:\n' +
        '`order` Lists all team members in a random order\n' +
        '`meeting` Assigns team members to meeting roles\n' +
        '`random` Pick one member randomly\n' +
        '`members` Lists all team members\n');
  }
});

client.login(config.DISCORD_BOT_TOKEN);
