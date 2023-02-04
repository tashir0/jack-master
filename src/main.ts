import {
  Client, EmbedField,
  GatewayIntentBits, IntentsBitField,
  Message, MessageCreateOptions,
  MessagePayload, Partials,
  TextChannel,
  ThreadChannel
} from 'discord.js';
import {config, Member, Team} from "./config";
import {JackMaster, MeetingRoles, OpenPullRequest, Task} from "./jack-master";
import {createBacklogProject} from "./backlog";

const intents = new IntentsBitField([
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.DirectMessages,
]);
const partials = [Partials.Channel]; // To receive DM. See https://discordjs.guide/additional-info/changes-in-v13.html#dm-channels
const client = new Client({intents, partials});

client.on('ready', () => {
  const user = client.user;
  if (!user) {
    throw new Error('Discord client is not logged in');
  }
  user.setPresence({activities: [{name: config.projectName}]});
  console.log('bot is ready!');
});

client.on('error', (e) => {
  console.log(`${e.name}: ${e.message}`);
});

const backlogProject = createBacklogProject(
    config.backlogHostName,
    config.projectName,
    config.backlogApiKey
);

const masters = config.teams.map((team: Team) => JackMaster(team, backlogProject));

const formatPullRequests = (pullRequests: OpenPullRequest[]): MessageCreateOptions => {
  // console.debug(JSON.stringify(pullRequests, null, '\t'));
  if (pullRequests.length === 0) {
    return {
      embeds: [{
        title: 'Open pull requests',
        description: 'No open pull request',
      }],
    };
  }
  const groupedByTicket = groupBy(pullRequests, (pr: OpenPullRequest) => (pr.ticketNumber ? String(pr.ticketNumber) : 'No ticket'));
  const starPresentersToCsv = (presenters: Member[]) => presenters.map(p => p.name).join(', ') || 'no one';
  const fields = Array.from(groupedByTicket.entries())
      .flatMap(([ticketNumber, pullRequests]) => {
        return pullRequests.map((pr: OpenPullRequest) => {
          const shortenedTitle = pr.title.length < 28 ? pr.title : `${pr.title.substring(0, 28)}...`; // To avoid line break
          const notification = pr.lastNotifier ? `, last notified by ${pr.lastNotifier.name}` : ` not notified`;
          return {
            name: `${ticketNumber} ${shortenedTitle}`,
            value: `${pr.repositoryName} [PR#${pr.requestNumber}](${pr.url}) \nrequested by ${pr.createdUser.name}${notification}, star presented by ${starPresentersToCsv(pr.starPresenters)}`
          };
        });
      });
  const result = {
    embeds: [{
      title: 'Open pull requests',
      fields,
    }],
  };
  // console.debug(JSON.stringify(result, null, '\t'));
  return result;
};

const formatTodos = (todos: readonly Task[]): MessageCreateOptions => {
  if (todos.length === 0) {
    return {
      embeds: [{
        title: 'ToDo',
        description: 'No ToDos left',
      }],
    };
  }
  return {
    embeds: [{
      fields: [{
        name: 'ToDo',
        value: todos
            .map((m, index) => `${index + 1}. [${m.content}](${m.url})`)
            .join('\n'),
      }]
    }],
  }
};

const formatTasks = (tasks: readonly Task[]): MessageCreateOptions => {
  const description = tasks.length === 0 ? 'No tasks found in this channel' : undefined;
  const fields = tasks.flatMap((t, index) => formatTaskToFields(t, index));
  return {
    embeds: [{
      title: 'Tasks',
      description,
      fields
    }],
  }
};

const formatTaskToFields = (task: Task, index: number, parentTaskNumber = ''): EmbedField[] => {
  const taskNumber = (parentTaskNumber ? parentTaskNumber + '-' : '') + (index + 1);

  const doneMarker = task.done ? ' (済)' : '';
  const shownContent = task.content.substring(0, 100) + (100 < task.content.length ? '...' : '');
  const messageLink = `[${task.done ? strike(shownContent) : shownContent}](${task.url})`;

  const subtaskFields = task.subtasks
      .flatMap((t, index) => formatTaskToFields(t, index, taskNumber));

  return [{
    name: taskNumber + '.' + doneMarker,
    value: messageLink,
    inline: false,
  }, ...subtaskFields];
};

type  Command<R> = {
  execute: (master: JackMaster, message: Message) => R | Promise<R>,
  format: (result: R) => string | MessageCreateOptions,
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

const todoCommand: Command<readonly Task[]> = {
  execute: async (master, message) => (await master.listTodos(message.channel as TextChannel | ThreadChannel)),
  format: formatTodos,
};

const taskCommand: Command<readonly Task[]> = {
  execute: async (master, message) => (await master.listTasks(message.channel as TextChannel | ThreadChannel)),
  format: formatTasks,
};

const commandRegistry: Map<string, Command<any>> = new Map()
    .set('order', orderCommand)
    .set('meeting', meetingCommand)
    .set('random', randomCommand)
    .set('members', membersCommand)
    .set('stars', starsCommand)
    .set('pair', pairCommand)
    .set('todos', todoCommand)
    .set('tasks', taskCommand);

const groupBy = <T>(array: T[], getGroupKey: (element: T) => string): Map<string, T[]> => {
  return array.reduce((accumulator, currentValue) => {
    const groupKey = getGroupKey(currentValue);
    const group = accumulator.get(groupKey) || (accumulator.set(groupKey, []).get(groupKey)!);
    group.push(currentValue);
    return accumulator;
  }, new Map<string, T[]>());
};

const removeMention = (message: string) => message.replace(/^<[^>]+>\s/, '');
const strike = (text: string) => `~~${text}~~`;

client.on('messageCreate', async message => {
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
        \`tasks\` Lists messages with \`TODO\` stamp within the channel. Looks up latest 500 messages
        \`todos\` Lists messages with \`TODO\` but without \`済\` stamp within the channel. Looks up latest 500 messages`);
  }
});

client.login(config.discordBotToken);
