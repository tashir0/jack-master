const discord = require('discord.js');
const client = new discord.Client();

client.on('ready', message => {
  console.log('bot is ready!');
  client.user.setPresence({activity: {name: 'SAVスプリント'}});
});

const config = require('./config.js');
const JackMaster = require('./jack-master.js');

const masters = config.TEAMS.map(team => team.members).map(JackMaster);

const commandResolver = {

  order: {
    executor: 'order',
    formatter: orderedMembers => orderedMembers
    .map((member, index) => `${index + 1}: ${member.name}`)
    .join('\n')
  },

  meeting: {
    executor: 'assignMeetingRoles',
    formatter: roles => `ファシリテーター: ${roles.facilitator.name ?? 'n/a'}\n` +
        `タイム・キーパー: ${roles.timeKeeper.name ?? 'n/a'}\n` +
        `書記: ${roles.clerical.name ?? 'n/a'}`
  },

  random: {
    executor: 'pickOne',
    formatter: theOne => theOne.name
  },

  members: {
    executor: 'members',
    formatter: members => members.map(m => m.name).join('\n')
  }
};

const removeMention = (message) => message.replace(/^<[^>]+>\s/, '');

client.on('message', message => {
  if (!message.mentions.has(client.user, {ignoreEveryone: true, ignoreRoles: true})) {
    return;
  }

  console.log(message.content);
  const cleanContent = removeMention(message.content.trim());
  const firstWord = cleanContent.split(' ')[0];

  const command = commandResolver[firstWord];
  if (command) {
    const masterOfRequester = masters.find(master => master.isMasterOf(message.author.id));
    const result = masterOfRequester[command.executor]();
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
