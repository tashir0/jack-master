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

      const lastPushedWithin1Year = r => {
        const now = new Date().getTime();
        const lastPushed = new Date(r.lastPushed).getTime();
        const deltaYear = (now - lastPushed) / (1000 * 60 * 60 * 24 * 365);
        return deltaYear < 1;
      };

      const activeRepositoryNames = repositories
      .filter(lastPushedWithin1Year)
      .map(r => r.name);

      const teamUserIds = members.map(m => m.backlogId);
      const pullRequests = [];
      for (repositoryName of activeRepositoryNames) {
        const repositoryPullRequests = await backlogProject.fetchOpenPullRequestsCreatedBy(repositoryName, teamUserIds);
        const requestsWithRepositoryName = repositoryPullRequests.map(
            pullRequest => ({...pullRequest, repositoryName}));
        pullRequests.push(...requestsWithRepositoryName)
      }

      for (pullRequest of pullRequests) {
        const comments = await backlogProject.fetchPullRequestComments(pullRequest.repositoryName, pullRequest.number);
        const notifiedToAllOthers = c => {};
        const commentNotifiedToAllOthers = comments.find(notifiedToAllOthers);
      }

      const openPullRequests = pullRequests.map(
          pullRequest => {
            const starPresenters = pullRequest.stars.map(star => members.find(m => m.backlogId === star.presenter.id));
            return {
              requestNumber: pullRequest.number,
              repositoryName: pullRequest.repositoryName,
              starPresenters
            };
          }
      );

      return openPullRequests;
    }
  };
};
