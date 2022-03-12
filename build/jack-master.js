"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JackMaster = void 0;
const randomIntOfMax = (max) => Math.floor(Math.random() * Math.floor(max));
const extractRandomly = (items) => items.splice(randomIntOfMax(items.length), 1)[0];
const JackMaster = (team, backlogProject) => {
    const members = team.members;
    const findMemberByBacklogId = (id) => members.find(m => m.backlogId === String(id));
    const order = () => {
        const tempMembers = members.concat();
        const orderedMembers = [];
        while (0 < tempMembers.length) {
            orderedMembers.push(extractRandomly(tempMembers));
        }
        return orderedMembers;
    };
    return {
        isMasterOf: (memberId) => members.some(member => member.discordId === memberId),
        members: () => Object.freeze(members),
        order,
        assignMeetingRoles: () => {
            const tempMembers = members.concat();
            const facilitator = extractRandomly(tempMembers);
            const timeKeeper = extractRandomly(tempMembers);
            const clerical = extractRandomly(tempMembers);
            return { facilitator, timeKeeper, clerical };
        },
        pickOne: () => {
            const tempMembers = members.concat();
            return extractRandomly(tempMembers);
        },
        getOpenPullRequests: () => __awaiter(void 0, void 0, void 0, function* () {
            const repositories = yield backlogProject.repositories();
            const lastPushedWithin3Months = (r) => {
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
            const pullRequests = [];
            for (const repositoryName of activeRepositoryNames) {
                const repositoryPullRequests = yield backlogProject.fetchOpenPullRequestsCreatedBy(repositoryName, teamUserIds);
                pullRequests.push(...repositoryPullRequests);
            }
            console.debug('Open pull requests: %s', pullRequests.map(p => p.number));
            const notifiedToAllOthers = (comment) => {
                const otherMemberIds = members
                    .filter(m => m.backlogId !== String(comment.createdUser.id))
                    .map(m => m.backlogId);
                const notifiedUserIds = comment.notifications.map(notification => String(notification.user.id));
                // console.debug('other members: %s, notified members: %s', otherMemberIds, notifiedUserIds);
                return otherMemberIds.every(otherMemberId => notifiedUserIds.includes(otherMemberId));
            };
            const pullRequestsWithStarInfo = [];
            for (const pullRequest of pullRequests) {
                const comments = yield backlogProject.fetchPullRequestComments(pullRequest.repositoryName, pullRequest.number);
                const lastCommentNotifiedToAllOthers = comments.find(notifiedToAllOthers);
                if (lastCommentNotifiedToAllOthers === undefined) {
                    console.warn('Pull request without team notification detected: %s PR#%s', pullRequest.repositoryName, pullRequest.number);
                    pullRequestsWithStarInfo.push([pullRequest, { presenters: [], lastNotifier: undefined }]);
                }
                else {
                    const starPresenters = lastCommentNotifiedToAllOthers.stars
                        .map(s => findMemberByBacklogId(s.presenter.id))
                        .filter(isDefined); // star may be presented by someone not in the team
                    const lastNotifier = findMemberByBacklogId(lastCommentNotifiedToAllOthers.createdUser.id);
                    pullRequestsWithStarInfo.push([pullRequest, { presenters: starPresenters, lastNotifier }]);
                }
            }
            const openPullRequests = pullRequestsWithStarInfo.map(([pullRequest, starInfo]) => {
                return {
                    ticketNumber: pullRequest.ticketNumber,
                    ticketUrl: pullRequest.ticketNumber ? backlogProject.ticketUrl(pullRequest.ticketNumber) : undefined,
                    createdUser: findMemberByBacklogId(pullRequest.createdUser.id),
                    repositoryName: pullRequest.repositoryName,
                    requestNumber: pullRequest.number,
                    title: pullRequest.title,
                    lastNotifier: starInfo.lastNotifier,
                    starPresenters: starInfo.presenters,
                    url: backlogProject.pullRequestUrl(pullRequest.repositoryName, pullRequest.number)
                };
            });
            return openPullRequests;
        }),
        pair: () => {
            const randomlyOrderedMembers = order();
            const pairs = [];
            for (let i = 0; i < randomlyOrderedMembers.length; i += 2) {
                const pair = randomlyOrderedMembers.slice(i, i + 2);
                pairs.push(pair);
            }
            return pairs;
        },
        listTodos: (message) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const messages = yield message.channel.messages.fetch({ limit: 100 });
                const messagesInPostedOrder = [...messages].reverse();
                const todoList = messagesInPostedOrder
                    .map(([_, message]) => message)
                    .filter(hasTodoReaction)
                    .filter(m => !hasDoneReaction(m))
                    .map(m => ({
                    content: m.content,
                    url: m.url
                }));
                return Object.freeze(todoList);
            }
            catch (e) {
                console.error(e);
                return Object.freeze([]);
            }
        })
    };
};
exports.JackMaster = JackMaster;
const isDefined = (value) => value !== undefined;
const reactionCheckerFor = (id) => (message) => { var _a; return !!((_a = message.reactions) === null || _a === void 0 ? void 0 : _a.cache.find((r) => r.emoji.id === id)); };
const hasTodoReaction = reactionCheckerFor('908654943441936425');
const hasDoneReaction = reactionCheckerFor('905717622421729301');