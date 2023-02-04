var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import fetch from "node-fetch";
import { logger } from "./config";
const sleep = (millisecs) => (new Promise((resolve) => global.setTimeout(resolve, millisecs)));
export const createBacklogProject = (hostName, projectName, apiKey) => {
    const apiBaseUrl = `https://${hostName}/api/v2`;
    const apiBaseProjectUrl = `${apiBaseUrl}/projects/${projectName}`;
    const pullRequestStatusOpen = '1';
    const arrayParams = (name, values) => values.map(value => `${name}[]=${value}`).join('&');
    const repositories = () => __awaiter(void 0, void 0, void 0, function* () {
        const backlogGitRepositories = yield fetchAsJson(`${apiBaseProjectUrl}/git/repositories?apiKey=${apiKey}`);
        return backlogGitRepositories.map(toRepository);
    });
    const fetchOpenPullRequestsCreatedBy = (repositoryName, createdUserIds) => __awaiter(void 0, void 0, void 0, function* () {
        const backlogPullRequests = yield fetchAsJson(`${apiBaseProjectUrl}/git/repositories/${repositoryName}/pullRequests?` +
            `apiKey=${apiKey}&` +
            `statusId[]=${pullRequestStatusOpen}&` +
            `${arrayParams('createdUserId', createdUserIds)}`);
        return backlogPullRequests.map(pr => {
            var _a;
            return ({
                title: pr.summary,
                number: pr.number,
                repositoryName,
                ticketNumber: (_a = pr.issue) === null || _a === void 0 ? void 0 : _a.issueKey,
                createdUser: pr.createdUser
            });
        });
    });
    const fetchPullRequestComments = (repositoryName, pullRequestId) => fetchAsJson(`${apiBaseProjectUrl}/git/repositories/${repositoryName}/pullRequests/${pullRequestId}/comments?apiKey=${apiKey}`);
    const listUsers = () => fetchAsJson(`${apiBaseUrl}/users?apiKey=${apiKey}`);
    const pullRequestUrl = (repositoryName, requestNumber) => `https://${hostName}/git/${projectName}/${repositoryName}/pullRequests/${requestNumber}`;
    const ticketUrl = (ticketNumber) => `https://${hostName}/view/${ticketNumber}`;
    return {
        repositories,
        fetchOpenPullRequestsCreatedBy,
        fetchPullRequestComments,
        listUsers,
        pullRequestUrl,
        ticketUrl,
    };
};
const fetchAsJson = (url) => __awaiter(void 0, void 0, void 0, function* () {
    // Backlog prohibits excessive access
    yield sleep(300);
    const response = yield fetch(url);
    const text = yield response.text();
    const json = JSON.parse(text);
    logger.debug(`${url}\n${JSON.stringify(json, null, "\t")}`);
    return json;
});
const toRepository = (backlogRepository) => ({
    name: backlogRepository.name,
    lastPush: backlogRepository.pushedAt
});
//# sourceMappingURL=backlog.js.map