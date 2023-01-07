var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Client, Intents } from 'discord.js';
import { config } from "./config";
import { JackMaster } from "./jack-master";
import { createBacklogProject } from "./backlog";
const intents = new Intents([
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGES
]);
const client = new Client({ intents });
client.on('ready', () => {
    console.log('bot is ready!');
    const user = client.user;
    if (!user) {
        throw new Error('Discord client is not logged in');
    }
    user.setPresence({ activities: [{ name: config.projectName }] });
});
client.on('error', (e) => {
    console.error(`${e.name}: ${e.message}`);
});
const backlogProject = createBacklogProject(config.backlogHostName, config.projectName, config.backlogApiKey);
const masters = config.teams.map((team) => JackMaster(team, backlogProject));
const formatPullRequests = (pullRequests) => {
    // console.debug(JSON.stringify(pullRequests, null, '\t'));
    if (pullRequests.length === 0) {
        return {
            embeds: [{
                    title: 'Open pull requests',
                    description: 'No open pull request',
                }],
        };
    }
    const groupedByTicket = groupBy(pullRequests, (pr) => (pr.ticketNumber ? String(pr.ticketNumber) : 'No ticket'));
    const starPresentersToCsv = (presenters) => presenters.map(p => p.name).join(', ') || 'no one';
    const fields = Array.from(groupedByTicket.entries())
        .flatMap(([ticketNumber, pullRequests]) => {
        return pullRequests.map((pr) => {
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
const formatTodos = (todos) => {
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
    };
};
const formatTasks = (tasks) => {
    const description = tasks.length === 0 ? 'No tasks found in this channel' : undefined;
    const fields = tasks.flatMap((t, index) => formatTaskToFields(t, index));
    return {
        embeds: [{
                title: 'Tasks',
                description,
                fields
            }],
    };
};
const formatTaskToFields = (task, index, parentTaskNumber = '') => {
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
const orderCommand = {
    execute: master => master.order(),
    format: members => members
        .map((member, index) => `${index + 1}: ${member.name}`)
        .join('\n')
};
const meetingCommand = {
    execute: master => master.assignMeetingRoles(),
    format: roles => {
        var _a, _b, _c;
        return `ファシリテーター: ${(_a = roles.facilitator.name) !== null && _a !== void 0 ? _a : 'n/a'}\n` +
            `タイム・キーパー: ${(_b = roles.timeKeeper.name) !== null && _b !== void 0 ? _b : 'n/a'}\n` +
            `書記: ${(_c = roles.clerical.name) !== null && _c !== void 0 ? _c : 'n/a'}`;
    }
};
const randomCommand = {
    execute: master => master.pickOne(),
    format: member => member.name,
};
const membersCommand = {
    execute: master => master.members(),
    format: members => members.map(m => m.name).join('\n')
};
const starsCommand = {
    execute: (master) => __awaiter(void 0, void 0, void 0, function* () { return (yield master.getOpenPullRequests()); }),
    format: formatPullRequests
};
const pairCommand = {
    execute: master => master.pair(),
    format: (pairs) => pairs
        .map((pair, index) => {
        const pairNumber = index + 1;
        const pairedMembers = pair[0].name + (pair.length === 2 ? ` & ${pair[1].name}` : '');
        return `${pairNumber}: ${pairedMembers}`;
    })
        .join('\n')
};
const todoCommand = {
    execute: (master, message) => __awaiter(void 0, void 0, void 0, function* () { return (yield master.listTodos(message.channel)); }),
    format: formatTodos,
};
const taskCommand = {
    execute: (master, message) => __awaiter(void 0, void 0, void 0, function* () { return (yield master.listTasks(message.channel)); }),
    format: formatTasks,
};
const commandRegistry = new Map()
    .set('order', orderCommand)
    .set('meeting', meetingCommand)
    .set('random', randomCommand)
    .set('members', membersCommand)
    .set('stars', starsCommand)
    .set('pair', pairCommand)
    .set('todos', todoCommand)
    .set('tasks', taskCommand);
const groupBy = (array, getGroupKey) => {
    return array.reduce((accumulator, currentValue) => {
        const groupKey = getGroupKey(currentValue);
        const group = accumulator.get(groupKey) || (accumulator.set(groupKey, []).get(groupKey));
        group.push(currentValue);
        return accumulator;
    }, new Map());
};
const removeMention = (message) => message.replace(/^<[^>]+>\s/, '');
const strike = (text) => `~~${text}~~`;
client.on('messageCreate', (message) => __awaiter(void 0, void 0, void 0, function* () {
    if (!message.mentions.has(client.user, { ignoreEveryone: true, ignoreRoles: true })) {
        return;
    }
    console.log(message.content);
    const cleanContent = removeMention(message.content.trim());
    const firstWord = cleanContent.split(' ')[0];
    const command = commandRegistry.get(firstWord);
    if (command) {
        try {
            const masterOfRequester = masters.find((master) => master.isMasterOf(message.author.id));
            const result = yield command.execute(masterOfRequester, message);
            const response = command.format(result);
            message.channel.send(response);
        }
        catch (e) {
            console.error(e);
            message.channel.send(`Sorry something wend wrong. Please contact administrator.`);
        }
    }
    else {
        message.channel.send(`Available commands:
        \`order\` Lists all team members in a random order
        \`meeting\` Assigns team members to meeting roles
        \`random\` Pick one member randomly
        \`members\` Lists all team members
        \`stars\` Lists open pull requests for own team
        \`pair\` Pair team members randomly
        \`tasks\` Lists messages with \`TODO\` stamp within the channel. Looks up latest 500 messages
        \`todos\` Lists messages with \`TODO\` but without \`済\` stamp within the channel. Looks up latest 500 messages`);
    }
}));
client.login(config.discordBotToken);
//# sourceMappingURL=main.js.map