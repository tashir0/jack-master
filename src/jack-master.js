const randomIntOfMax = max => Math.floor(Math.random() * Math.floor(max));
const extractRandomly = items => items.splice(randomIntOfMax(items.length), 1)[0];

module.exports = (team, backlogProject) => {

  const members = team.members;

  return {

    isMasterOf: (memberId) =>
        members.some(member => member.discordId === memberId),

    members: () => Object.freeze(members),

    order: () => {
      const tempMembers = members.concat();
      const orderedMembers = [];
      while (0 < tempMembers.length) {
        orderedMembers.push(extractRandomly(tempMembers));
      }
      return orderedMembers;
    },

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

    getOpenPullRequests: async () => {
      const repositories = await backlogProject.repositories();

      const lastPushedWithin3Months = r => {
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
      for (repositoryName of activeRepositoryNames) {
        const repositoryPullRequests = await backlogProject.fetchOpenPullRequestsCreatedBy(repositoryName, teamUserIds);
        // TODO following mapping is to be moved to BacklogProject
        const requestsWithRepositoryName = repositoryPullRequests.map(
            pullRequest => ({
              number: pullRequest.number,
              repositoryName,
              ticketNumber: pullRequest.issue?.issueKey
            }));
        pullRequests.push(...requestsWithRepositoryName)
      }

      console.debug('Open pull requests: %s', pullRequests.map(p => p.number));

      const notifiedToAllOthers = comment => {
        const otherMemberIds = members.filter(m => m.backlogId !== String(comment.createdUser.id)).map(m => m.backlogId);
        const notifiedUserIds = comment.notifications.map(notification => String(notification.user.id));
        // console.debug('other members: %s, notified members: %s', otherMemberIds, notifiedUserIds);
        return otherMemberIds.every(otherMemberId => notifiedUserIds.includes(otherMemberId));
      };

      for (pullRequest of pullRequests) {
        const comments = await backlogProject.fetchPullRequestComments(pullRequest.repositoryName, pullRequest.number);
        const lastCommentNotifiedToAllOthers = comments.find(notifiedToAllOthers);
        if (lastCommentNotifiedToAllOthers === undefined) {
          console.warn('Pull request without team notification detected: %s', pullRequest.number);
          pullRequest.starPresenters = []
        } else {
          const starPresenters = lastCommentNotifiedToAllOthers.stars.map(s => members.find(m => m.backlogId === String(s.presenter.id)));
          pullRequest.starPresenters = starPresenters;
        }
      }

      const openPullRequests = pullRequests.map(
          pullRequest => {
            return {
              ticketNumber: pullRequest.ticketNumber,
              requestNumber: pullRequest.number,
              repositoryName: pullRequest.repositoryName,
              starPresenters: pullRequest.starPresenters,
              url: backlogProject.pullRequestUrl(pullRequest.repositoryName, pullRequest.number)
            };
          }
      );

      return openPullRequests;
    }
  };
};
