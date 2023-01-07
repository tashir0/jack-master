import {Message, MessageReaction, TextChannel, ThreadChannel} from "discord.js";
import {
  BacklogProject,
  Comment,
  GitRepository,
  OpenPullRequest as BacklogOpenPullRequest
} from "./backlog";
import {Member, Team} from "./config";

const randomIntOfMax = (max: number) => Math.floor(Math.random() * Math.floor(max));
const extractRandomly = (items: any[]) => items.splice(randomIntOfMax(items.length), 1)[0];

export type MeetingRoles = {
  readonly facilitator: Member,
  readonly timeKeeper: Member,
  readonly clerical: Member,
};

export type Task = {
  readonly id: string,
  readonly content: string,
  readonly url: string,
  readonly done: boolean,
  readonly subtasks: Task[],
};

export type JackMaster = {
  isMasterOf: (memberId: string) => boolean,
  members: () => readonly Member[],
  order: () => readonly Member[],
  assignMeetingRoles: () => MeetingRoles,
  pickOne: () => Member,
  getOpenPullRequests: () => Promise<OpenPullRequest[]>
  pair: () => Member[][],
  listTodos: (channel: TextChannel | ThreadChannel) => Promise<readonly Task[]>,
  listTasks: (channel: TextChannel | ThreadChannel) => Promise<readonly Task[]>,
};

export const JackMaster = (team: Team, backlogProject: BacklogProject): JackMaster => {

  const members = team.members;

  const findMemberByBacklogId = (id: number): Member | undefined => members.find(m => m.backlogId === String(id));

  const order = (): Member[] => {
    const tempMembers = members.concat();
    const orderedMembers = [];
    while (0 < tempMembers.length) {
      orderedMembers.push(extractRandomly(tempMembers));
    }
    return orderedMembers;
  };

  const listTodos = async (channel: TextChannel | ThreadChannel): Promise<readonly Task[]> => {
    const tasks = await listTasks(channel);
    return tasks.filter(t => !t.done);
  };

  const fetchLastestMessages = async (channel: TextChannel | ThreadChannel): Promise<Message[]> => {
    const idMessagePairs = await channel.messages.fetch({limit: 100});
    return [...idMessagePairs].map(([_, message]) => message);
  };

  const listTasks = async (channel: TextChannel | ThreadChannel): Promise<readonly Task[]> => {
    try {
      const taskMessages = (await fetchLastestMessages(channel))
          .filter(hasTodoReaction);
      const subtaskMessagesByParentId = new Map<string, Message[]>();
      const recordIfParentTaskExists = async (target: Message, current: Message, olderMessageIds: string[]) => {
        const parentId = current.reference?.messageId;
        if (!parentId) {
          return;
        }
        const parentIsTaskMessage = olderMessageIds.includes(parentId);
        if (parentIsTaskMessage) {
          const subtasks = subtaskMessagesByParentId.get(parentId) ?? new Array<Message>();
          subtaskMessagesByParentId.set(parentId, [...subtasks, target]);
          return
        }
        // If parent message is not a task (has no TO DO stamp), keep looking parent
        // recursively since it may be a subtask found through continuous conversation.
        const parentMessage = await current.fetchReference();
        recordIfParentTaskExists(target, parentMessage, olderMessageIds);
      };

      taskMessages.forEach((m, index, messages) => {
        const olderMessageIds = messages.slice(index + 1).map(m => m.id);
        recordIfParentTaskExists(m, m, olderMessageIds);
      });

      const subtaskIds = Array.from(subtaskMessagesByParentId.values())
          .flatMap(subtasks => subtasks)
          .map(m => m.id);
      const isTopLevelTask = (message: Message): boolean => !subtaskIds.includes(message.id);

      const messageToTask = (message: Message): Task => {
        const subtasks = subtaskMessagesByParentId.get(message.id)
            ?.map(messageToTask) ?? [];
        return {
          id: message.id,
          content: message.content,
          url: message.url,
          done: hasDoneReaction(message),
          subtasks,
        };
      };

      return taskMessages
          .filter(isTopLevelTask)
          .map(messageToTask);
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  return {

    isMasterOf: (memberId: string) =>
        members.some(member => member.discordId === memberId),

    members: () => Object.freeze(members),

    order,

    assignMeetingRoles: () => {
      const tempMembers = members.concat();
      const facilitator = extractRandomly(tempMembers);
      const timeKeeper = extractRandomly(tempMembers);
      const clerical = extractRandomly(tempMembers);
      return {facilitator, timeKeeper, clerical};
    },

    pickOne: () => {
      const tempMembers = members.concat();
      return extractRandomly(tempMembers);
    },

    getOpenPullRequests: async (): Promise<OpenPullRequest[]> => {
      const repositories: GitRepository[] = await backlogProject.repositories();

      const lastPushedWithin3Months = (r: GitRepository) => {
        const now = new Date().getTime();
        const lastPushedTime = new Date(r.lastPush).getTime();
        const threeMonthsInMillisecs = 1000 * 60 * 60 * 24 * 31 * 3;
        // console.debug(`last pushed: ${now} - ${lastPushedTime} -> ${deltaYear} years`);
        return (now - lastPushedTime) < threeMonthsInMillisecs;
      };

      const activeRepositoryNames = repositories
      .filter(lastPushedWithin3Months)
      .map(r => r.name);

      // console.debug('Active repository names: %s', activeRepositoryNames);

      const teamUserIds = members.map(m => m.backlogId);
      const pullRequests: BacklogOpenPullRequest[] = [];
      for (const repositoryName of activeRepositoryNames) {
        const repositoryPullRequests = await backlogProject.fetchOpenPullRequestsCreatedBy(repositoryName, teamUserIds);
        pullRequests.push(...repositoryPullRequests);
      }

      console.debug('Open pull requests: %s', pullRequests.map(p => p.number));

      const notifiedToAllOthers = (comment: Comment) => {
        const otherMemberIds = members
        .filter(m => m.backlogId !== String(comment.createdUser.id))
        .map(m => m.backlogId);
        const notifiedUserIds = comment.notifications.map(notification => String(notification.user.id));
        // console.debug('other members: %s, notified members: %s', otherMemberIds, notifiedUserIds);
        return otherMemberIds.every(otherMemberId => notifiedUserIds.includes(otherMemberId));
      };

      type StarInfo = {
        presenters: Member[],
        lastNotifier?: Member,
      };

      const pullRequestsWithStarInfo: [BacklogOpenPullRequest, StarInfo][] = [];
      for (const pullRequest of pullRequests) {
        const comments = await backlogProject.fetchPullRequestComments(pullRequest.repositoryName, pullRequest.number);
        const lastCommentNotifiedToAllOthers = comments.find(notifiedToAllOthers);
        if (lastCommentNotifiedToAllOthers === undefined) {
          console.warn('Pull request without team notification detected: %s PR#%s', pullRequest.repositoryName, pullRequest.number);
          pullRequestsWithStarInfo.push([ pullRequest, {presenters: [], lastNotifier: undefined}]);
        } else {
          const starPresenters = lastCommentNotifiedToAllOthers.stars
          .map(s => findMemberByBacklogId(s.presenter.id))
          .filter(isDefined); // star may be presented by someone not in the team
          const lastNotifier = findMemberByBacklogId(lastCommentNotifiedToAllOthers.createdUser.id)!;
          pullRequestsWithStarInfo.push([pullRequest, {presenters: starPresenters, lastNotifier}])
        }
      }

      const openPullRequests = pullRequestsWithStarInfo.map(
          ([pullRequest, starInfo]) => {
            return {
              ticketNumber: pullRequest.ticketNumber,
              ticketUrl: pullRequest.ticketNumber ? backlogProject.ticketUrl(pullRequest.ticketNumber) : undefined,
              createdUser: findMemberByBacklogId(pullRequest.createdUser.id)!,
              repositoryName: pullRequest.repositoryName,
              requestNumber: pullRequest.number,
              title: pullRequest.title,
              lastNotifier: starInfo.lastNotifier,
              starPresenters: starInfo.presenters,
              url: backlogProject.pullRequestUrl(pullRequest.repositoryName, pullRequest.number)
            };
          }
      );

      return openPullRequests;
    },

    pair: () => {
      const randomlyOrderedMembers = order();
      const pairs = [];
      for (let i = 0; i < randomlyOrderedMembers.length; i += 2) {
        const pair = randomlyOrderedMembers.slice(i, i + 2);
        pairs.push(pair);
      }
      return pairs;
    },

    listTodos,
    listTasks,
  };
};

export type OpenPullRequest = {
  ticketNumber?: number,
  ticketUrl?: string,
  createdUser: Member,
  repositoryName: string,
  requestNumber: number,
  title: string,
  lastNotifier?: Member,
  starPresenters: Member[],
  url: string
};

const isDefined = <T>(value: T | undefined): value is T => value !== undefined;

type ReactionChecker = (message: Message) => boolean;

const reactionCheckerFor = (id: string): ReactionChecker => (message: Message): boolean =>
    !!message.reactions?.cache.find((r: MessageReaction) => r.emoji.id === id);
const hasTodoReaction = reactionCheckerFor('908654943441936425');
const hasDoneReaction = reactionCheckerFor('905717622421729301');
