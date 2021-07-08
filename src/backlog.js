const fetch = require('node-fetch');

const sleep = (millisecs) =>
    (new Promise((resolve) => global.setTimeout(resolve, millisecs)));

module.exports = {
  createProject: (hostName, projectName, apiKey) => {

    const apiBaseUrl = `https://${hostName}/api/v2`;
    const apiBaseProjectUrl = `${apiBaseUrl}/projects/${projectName}`;

    const pullRequestStatusOpen = '1';

    const fetchAsJson = async (url) => {
      // Backlog prohibits excessive access
      await sleep(300);
      const response = await fetch(url);
      const text = await response.text();
      const json = JSON.parse(text);
      // console.debug(`${new Date()} ${url}\n${JSON.stringify(json, null, "\t")}`);
      return json;
    };
    const arrayParams = (name, values) => values.map(value => `${name}[]=${value}`).join('&');

    return {
      repositories: () => fetchAsJson(`${apiBaseProjectUrl}/git/repositories?apiKey=${apiKey}`)
      .then(repositories => repositories.map(repository => ({
        name: repository.name,
        lastPush: repository.pushedAt
      }))),

      fetchOpenPullRequestsCreatedBy: (repositoryName, createdUserIds) => fetchAsJson(
          `${apiBaseProjectUrl}/git/repositories/${repositoryName}/pullRequests?` +
          `apiKey=${apiKey}&` +
          `statusId[]=${pullRequestStatusOpen}&` +
          `${arrayParams('createdUserId', createdUserIds)}`),

      fetchPullRequestComments: (repositoryName, pullRequestId) => fetchAsJson(
          `${apiBaseProjectUrl}/git/repositories/${repositoryName}/pullRequests/${pullRequestId}/comments?apiKey=${apiKey}`),

      listUsers: () => fetchAsJson(`${apiBaseUrl}/users?apiKey=${apiKey}`),

      pullRequestUrl: (repositoryName, requestNumber) => `https://${hostName}/git/${projectName}/${repositoryName}/pullRequests/${requestNumber}`
    }
  }
}
