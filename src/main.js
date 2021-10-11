const discord = require('discord.js');
const client = new discord.Client();

client.on('ready', message => {
  console.log('bot is ready!');
  client.user.setPresence({activity: {name: 'SAVスプリント'}});
});

const config = require('./config.js');
const JackMaster = require('./jack-master.js');

const Backlog = require('./backlog.js');
const backlogProject = Backlog.createProject(
    'atw-proj.backlog.jp',
    'SAV',
    config.BACKLOG_API_KEY
);

const masters = config.TEAMS.map(team => JackMaster(team, backlogProject));

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
  },

  stars: {
    executor: 'getOpenPullRequests',
    formatter: pullRequests => {
      // console.debug(JSON.stringify(pullRequests, null, '\t'));
      if (pullRequests.length === 0) {
        return {
          embed: {
            title: 'Open pull requests',
            description: 'No open pull request'
          }
        };
      }
      const groupedByTicket =  groupBy(pullRequests, pr => (pr.ticketNumber ?? 'No ticket'));
      const starPresentersToCsv = presenters => presenters.map(p => p.name).join(', ') || 'no one';
      const fields = Object.entries(groupedByTicket)
        .flatMap(group => {
          const [ ticketNumber, pullRequests ] = group;
          return pullRequests.map(pr => {
            const shortenedTitle = pr.title.length < 28 ? pr.title : `${pr.title.substring(0, 28)}...`; // To avoid line break
            const notification =  pr.lastNotifier ? `, last notifiedy by ${pr.lastNotifier.name}` : ` not notified`;
            return {
              name: `${ticketNumber} ${shortenedTitle}`,
              value: `${pr.repositoryName} [PR#${pr.requestNumber}](${pr.url}) requested by ${pr.createdUser.name}${notification}, star presented by ${starPresentersToCsv(pr.starPresenters)}`
            };
          });
        });
      const result = {
        embed: {
          title: 'Open pull requests',
          fields
        }
      };
      // console.debug(JSON.stringify(result, null, '\t'));
      return result;
    }
  }
};

const groupBy = (array, getGroupKey) => {
  return array.reduce((accumulator, currentValue) => {
    const groupKey = getGroupKey(currentValue);
    const  group = accumulator[groupKey] || (accumulator[groupKey] = []);
    group.push(currentValue);
    return accumulator;
  }, {});
};

const removeMention = (message) => message.replace(/^<[^>]+>\s/, '');

client.on('message', async message => {
  if (!message.mentions.has(client.user, {ignoreEveryone: true, ignoreRoles: true})) {
    return;
  }

  console.log(message.content);
  const cleanContent = removeMention(message.content.trim());
  const firstWord = cleanContent.split(' ')[0];

  const command = commandResolver[firstWord];
  if (command) {
    const masterOfRequester = masters.find(master => master.isMasterOf(message.author.id));
    const result = await masterOfRequester[command.executor]();
    const response = command.formatter(result);
    message.channel.send(response);
  } else {
    message.channel.send(
        'Available commands:\n' +
        '`order` Lists all team members in a random order\n' +
        '`meeting` Assigns team members to meeting roles\n' +
        '`random` Pick one member randomly\n' +
        '`members` Lists all team members\n' +
        '`stars` Lists open pull requests for own team\n');
  }
});

client.login(config.DISCORD_BOT_TOKEN);
