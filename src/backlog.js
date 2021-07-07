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

      listUsers: () => fetchAsJson(`${apiBaseUrl}/users?apiKey=${apiKey}`)
    }
  }
}

// TODO
// const config = require('./config.js');
//
// const LogLevel = Object.freeze({
//   OFF: 0,
//   ERROR: 1,
//   INFO: 2,
//   WARN: 3,
//   DEBUG: 4
// });
//
// const logger = (() => {
//   const nop = () => {};
//   const error = LogLevel.ERROR <= config.LOG_LEVEL ? console.error : nop;
//   const info = LogLevel.INFO <= config.LOG_LEVEL ? console.info : nop;
//   const warn = LogLevel.WARN <= config.LOG_LEVEL ? console.warn : nop;
//   const debug = LogLevel.DEBUG <= config.LOG_LEVEL ? console.debug : nop;
//   return {error, info, warn, debug};
// })();
