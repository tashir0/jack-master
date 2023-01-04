import {Client, Message, StringResolvable} from 'discord.js';
import {config, Member, Team} from "./config";
import {JackMaster, MeetingRoles, OpenPullRequest, ToDo} from "./jack-master";
import {createBacklogProject} from "./backlog";

const client = new Client();

client.on('ready', () => {
  console.log('bot is ready!');
  const user = client.user;
  if (!user) {
    throw new Error('Discord client is not logged in');
  }
  user.setPresence({activity: {name: config.projectName}});
});

client.on('error', (e) => {
  console.error(`${e.name}: ${e.message}`);
});

const backlogProject = createBacklogProject(
    config.backlogHostName,
    config.projectName,
    config.backlogApiKey
);

const masters = config.teams.map((team: Team) => JackMaster(team, backlogProject));

const formatPullRequests = (pullRequests: OpenPullRequest[]) => {
  // console.debug(JSON.stringify(pullRequests, null, '\t'));
  if (pullRequests.length === 0) {
    return {
      embed: {
        title: 'Open pull requests',
        description: 'No open pull request'
      }
    };
  }
  const groupedByTicket =  groupBy(pullRequests, (pr: OpenPullRequest) => (pr.ticketNumber ? String(pr.ticketNumber) : 'No ticket'));
  const starPresentersToCsv = (presenters: Member[]) => presenters.map(p => p.name).join(', ') || 'no one';
  const fields = Array.from(groupedByTicket.entries())
  .flatMap(([ ticketNumber, pullRequests ]) => {
    return pullRequests.map((pr: OpenPullRequest) => {
      const shortenedTitle = pr.title.length < 28 ? pr.title : `${pr.title.substring(0, 28)}...`; // To avoid line break
      const notification =  pr.lastNotifier ? `, last notified by ${pr.lastNotifier.name}` : ` not notified`;
      return {
        name: `${ticketNumber} ${shortenedTitle}`,
        value: `${pr.repositoryName} [PR#${pr.requestNumber}](${pr.url}) \nrequested by ${pr.createdUser.name}${notification}, star presented by ${starPresentersToCsv(pr.starPresenters)}`
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
};

const formatTodos = (todoMessages: readonly ToDo[]) => {
  if (todoMessages.length === 0) {
    return {
      embed: {
        title: 'TODO',
        description: 'No TODOs left'
      }
    };
  }
  return {
    embed : {
      fields: [{
        name: 'TODO',
        value: todoMessages.map(m => `[${m.content}](${m.url})`).join('\n')
      }]
    }
  }
};

type Command<R> = {
  execute: (master: JackMaster, message: Message) => R | Promise<R>,
  format: (result: R) => string | StringResolvable,
};

const orderCommand: Command<readonly Member[]> = {
  execute: master => master.order(),
  format: members => members
  .map((member, index) => `${index + 1}: ${member.name}`)
  .join('\n')
};

const meetingCommand: Command<MeetingRoles> = {
  execute: master => master.assignMeetingRoles(),
  format: roles => `ファシリテーター: ${roles.facilitator.name ?? 'n/a'}\n` +
      `タイム・キーパー: ${roles.timeKeeper.name ?? 'n/a'}\n` +
      `書記: ${roles.clerical.name ?? 'n/a'}`
};

const randomCommand: Command<Member> = {
  execute: master => master.pickOne(),
  format: member => member.name,
};

const membersCommand: Command<readonly Member[]> = {
  execute: master => master.members(),
  format: members => members.map(m => m.name).join('\n')
};

const starsCommand: Command<OpenPullRequest[]> = {
  execute: async master => (await master.getOpenPullRequests()),
  format: formatPullRequests
};

const pairCommand: Command<Member[][]> = {
  execute: master => master.pair(),
  format: (pairs) => pairs
  .map((pair, index) => {
    const pairNumber = index + 1;
    const pairedMembers = pair[0].name + (pair.length === 2 ? ` & ${pair[1].name}` : '')
    return `${pairNumber}: ${pairedMembers}`;
  })
  .join('\n')
};

const todoCommand: Command<readonly ToDo[]> = {
  execute: async (master, message) => (await master.listTodos(message)),
  format: formatTodos
};

const commandRegistry: Map<string, Command<any | Promise<any>>> = new Map()
  .set('order', orderCommand)
  .set('meeting', meetingCommand)
  .set('random', randomCommand)
  .set('members', membersCommand)
  .set('stars', starsCommand)
  .set('pair', pairCommand)
  .set('todo', todoCommand);

const groupBy = <T>(array: T[], getGroupKey: (element: T) => string): Map<string, T[]> => {
  return array.reduce((accumulator, currentValue) => {
    const groupKey = getGroupKey(currentValue);
    const group = accumulator.get(groupKey) || (accumulator.set(groupKey, []).get(groupKey)!);
    group.push(currentValue);
    return accumulator;
  }, new Map<string, T[]>());
};

const removeMention = (message: string) => message.replace(/^<[^>]+>\s/, '');

client.on('message', async message => {
  if (!message.mentions.has(client.user!, {ignoreEveryone: true, ignoreRoles: true})) {
    return;
  }

  console.log(message.content);
  const cleanContent = removeMention(message.content.trim());
  const firstWord = cleanContent.split(' ')[0];

  const command = commandRegistry.get(firstWord)!;
  if (command) {
    try {
      const masterOfRequester = masters.find((master: JackMaster) => master.isMasterOf(message.author.id))!;
      const result = await command.execute(masterOfRequester, message);
      const response = command.format(result);
      message.channel.send(response);
    } catch (e) {
      console.error(e);
      message.channel.send(`Sorry something wend wrong. Please contact administrator.`)
    }
  } else {
    message.channel.send(
        `Available commands:
        \`order\` Lists all team members in a random order
        \`meeting\` Assigns team members to meeting roles
        \`random\` Pick one member randomly
        \`members\` Lists all team members
        \`stars\` Lists open pull requests for own team
        \`pair\` Pair team members randomly
        \`todo\` Lists messages with \`TODO\` but without \`済\` stamp within the channel. Looks up latest 100 messages`);
  }
});

client.login(config.discordBotToken);
